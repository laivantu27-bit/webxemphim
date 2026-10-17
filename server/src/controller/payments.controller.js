const { AuthFailureError, BadRequestError } = require('../core/error.response');
const { OK, Created } = require('../core/success.response');

const Payments = require('../models/payments.model');
const Movie = require('../models/movie.model');
const Seats = require('../models/seat.model');
const User = require('../models/users.model');
const PreviewMovie = require('../models/previewMovie.model');
const Voucher = require('../models/voucher.model');

const crypto = require('crypto');
const axios = require('axios');
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const { connect } = require('../config/index');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

function generatePayID() {

    // Tạo ID thanh toán bao gồm cả giây để tránh trùng lặp
    const now = new Date();
    const timestamp = now.getTime();
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    return `PAY${timestamp}${seconds}${milliseconds}`;
}

const { calculateSeatsTotal } = require('../utils/seatPricing');
const { updateUserXPAndLevel } = require('../utils/xpHelper');

const BANK_CONFIG = {
    bankId: 'vietcombank',
    bankName: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)',
    accountNumber: '1336991507',
    accountName: 'LAI VAN TU',
    template: 'compact2',
};

class PaymentsController {
    async getBankConfig(req, res) {
        new OK({
            message: 'Lấy thông tin tài khoản ngân hàng thành công',
            metadata: BANK_CONFIG,
        }).send(res);
    }

    async createPayment(req, res) {
        const { id } = req.user;
        const { typePayment, idMovie, idSeat, time, date, services, voucherCode, discountAmount, branchId, branchName } = req.body;

        if (!idMovie || !idSeat) {
            throw new BadRequestError('idMovie and idSeat are required');
        }

        const findMovie = await Movie.findOne({ where: { id: idMovie } });
        if (!findMovie) {
            throw new BadRequestError('Movie not found');
        }

        // Calculate ticket total theo từng hàng ghế (ngồi đầu giá cao hơn ngồi sau)
        const seatCodes = Array.isArray(idSeat) ? idSeat : (typeof idSeat === 'string' ? idSeat.split(',').map((s) => s.trim()) : []);
        const ticketTotal = calculateSeatsTotal(findMovie.price, seatCodes);


        // Calculate snack/drink services total
        let serviceTotal = 0;
        if (Array.isArray(services)) {
            serviceTotal = services.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        }

        const subtotal = ticketTotal + serviceTotal;
        let appliedDiscount = discountAmount ? parseInt(discountAmount, 10) : 0;

        // Validate and apply voucher if provided
        if (voucherCode) {
            const voucher = await Voucher.findOne({ where: { code: voucherCode.trim().toUpperCase() } });
            if (voucher && voucher.status === 'active') {
                if (subtotal >= (voucher.minOrderValue || 0)) {
                    if (voucher.discountType === 'percent') {
                        const rawDiscount = Math.round((subtotal * voucher.discountValue) / 100);
                        appliedDiscount = voucher.maxDiscount > 0 ? Math.min(rawDiscount, voucher.maxDiscount) : rawDiscount;
                    } else {
                        appliedDiscount = Math.min(voucher.discountValue, subtotal);
                    }
                } else {
                    throw new BadRequestError(
                        `Đơn hàng chưa đạt mức tối thiểu ${(voucher.minOrderValue || 0).toLocaleString('vi-VN')} đ để dùng mã ${voucher.code}`
                    );
                }
            }
        }

        const totalPrice = Math.max(0, subtotal - appliedDiscount);
        const seatIdStr = Array.isArray(idSeat) ? idSeat.join(',') : idSeat;
        const payId = generatePayID();
        const formattedDate = dayjs(date).format('YYYY-MM-DD');

        // BƯỚC 1: KIỂM TRA CHỐNG TRÙNG GHẾ (Race Condition Check)
        // Nếu bất kỳ ghế nào đã bị người khác đặt (status = booked), từ chối ngay lập tức
        const alreadyBooked = await Seats.findAll({
            where: {
                movieId: idMovie,
                date: formattedDate,
                time: time,
                seat_code: { [Op.in]: seatCodes },
                status: 'booked',
            },
        });

        if (alreadyBooked.length > 0) {
            const conflictCodes = alreadyBooked.map((s) => s.seat_code).join(', ');
            throw new BadRequestError(
                `Rất tiếc! Ghế ${conflictCodes} vừa có khách khác đặt trước bạn. Vui lòng chọn ghế khác!`
            );
        }

        // 1. Direct / Cash / Test / VietQR / Banking payment method với Transaction & Row-level lock
        if (
            typePayment === 'direct' ||
            typePayment === 'cash' ||
            typePayment === 'test' ||
            typePayment === 'vietqr' ||
            typePayment === 'banking' ||
            typePayment === 'vietcombank' ||
            typePayment === 'vnpay'
        ) {
            const t = await connect.transaction();
            try {
                // Kiểm tra lại lần 2 có kèm Lock trong Transaction (ngăn 2 request chạy cùng mili-giây)
                const doubleCheck = await Seats.findAll({
                    where: {
                        movieId: idMovie,
                        date: formattedDate,
                        time: time,
                        seat_code: { [Op.in]: seatCodes },
                        status: 'booked',
                    },
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                });

                if (doubleCheck.length > 0) {
                    await t.rollback();
                    const conflictCodes = doubleCheck.map((s) => s.seat_code).join(', ');
                    throw new BadRequestError(
                        `Rất tiếc! Ghế ${conflictCodes} vừa được khách khác đặt trước bạn một tích tắc. Vui lòng chọn ghế khác!`
                    );
                }

                // Cập nhật hoặc ghi nhận ghế đã đặt
                for (const seat of seatCodes) {
                    const foundSeat = await Seats.findOne({
                        where: { movieId: idMovie, date: formattedDate, time: time, seat_code: seat },
                        transaction: t,
                    });

                    if (foundSeat) {
                        await foundSeat.update({ status: 'booked' }, { transaction: t });
                    } else {
                        await Seats.create(
                            {
                                status: 'booked',
                                time: time,
                                date: formattedDate,
                                row: seat.charAt(0),
                                number: parseInt(seat.slice(1), 10) || 1,
                                movieId: idMovie,
                                seat_code: seat,
                            },
                            { transaction: t },
                        );
                    }
                }

                const payment = await Payments.create(
                    {
                        id: payId,
                        movieId: idMovie,
                        userId: id,
                        cinemaBranchId: branchId || null,
                        branchName: branchName || 'CGV Cinema',
                        seatId: seatIdStr,
                        totalPrice: totalPrice,
                        time: time,
                        date: formattedDate,
                        paymentMethod: typePayment,
                        status: 'success',
                        services: services && services.length > 0 ? JSON.stringify(services) : null,
                        voucherCode: voucherCode ? voucherCode.trim().toUpperCase() : null,
                        discountAmount: appliedDiscount,
                    },
                    { transaction: t },
                );

                if (voucherCode) {
                    await Voucher.increment('usedCount', {
                        where: { code: voucherCode.trim().toUpperCase() },
                        transaction: t,
                    });
                }

                await t.commit();

                // Cộng điểm kinh nghiệm XP (100 XP / vé)
                try {
                    await updateUserXPAndLevel(
                        id,
                        seatCodes.length * 100,
                        `Mua ${seatCodes.length} vé xem phim "${findMovie.name}" (+${seatCodes.length * 100} XP)`
                    );
                } catch (e) {
                    console.error('Error awarding XP on payment:', e);
                }

                return new OK({ message: 'Đặt vé và thanh toán thành công', metadata: payment }).send(res);
            } catch (error) {
                await t.rollback();
                throw error;
            }
        }


        // Create pending payment for Momo/VNPay to preserve services and voucher
        await Payments.create({
            id: payId,
            movieId: idMovie,
            userId: id,
            cinemaBranchId: branchId || null,
            branchName: branchName || 'CGV Cinema',
            seatId: seatIdStr,
            totalPrice: totalPrice,
            time: time,
            date: dayjs(date).format('YYYY-MM-DD'),
            paymentMethod: typePayment,
            status: 'pending',
            services: services && services.length > 0 ? JSON.stringify(services) : null,
            voucherCode: voucherCode ? voucherCode.trim().toUpperCase() : null,
            discountAmount: appliedDiscount,
        });

        if (typePayment === 'momo') {
            var accessKey = 'F8BBA842ECF85';
            var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
            var orderInfo = `thanh toan ${id} + ${idMovie} + ${seatIdStr} + ${totalPrice} + ${time} + ${date} + ${payId}`;
            var partnerCode = 'MOMO';
            var redirectUrl = 'http://localhost/api/payments/check-payment-momo';
            var ipnUrl = 'http://localhost/api/payments/check-payment-momo';
            var requestType = 'payWithMethod';
            var amount = totalPrice;
            var orderId = partnerCode + new Date().getTime();
            var requestId = orderId;
            var extraData = '';
            var autoCapture = true;
            var lang = 'vi';

            var rawSignature =
                'accessKey=' +
                accessKey +
                '&amount=' +
                amount +
                '&extraData=' +
                extraData +
                '&ipnUrl=' +
                ipnUrl +
                '&orderId=' +
                orderId +
                '&orderInfo=' +
                orderInfo +
                '&partnerCode=' +
                partnerCode +
                '&redirectUrl=' +
                redirectUrl +
                '&requestId=' +
                requestId +
                '&requestType=' +
                requestType;

            const crypto = require('crypto');
            var signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            const requestBody = JSON.stringify({
                partnerCode: partnerCode,
                partnerName: 'Test',
                storeId: 'MomoTestStore',
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
                lang: lang,
                requestType: requestType,
                autoCapture: autoCapture,
                extraData: extraData,
                orderGroupId: '',
                signature: signature,
            });

            const https = require('https');
            const options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: '/v2/gateway/api/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody),
                },
            };

            const req2 = https.request(options, (res2) => {
                res2.setEncoding('utf8');
                res2.on('data', (body) => {
                    return res.status(200).json({ message: 'Thanh toán thành công', metadata: JSON.parse(body) });
                });
            });

            req2.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });
            req2.write(requestBody);
            req2.end();
        }

        if (typePayment === 'vnpay') {
            const vnpay = new VNPay({
                tmnCode: 'DH2F13SW',
                secureSecret: '7VJPG70RGPOWFO47VSBT29WPDYND0EJG',
                vnpayHost: 'https://sandbox.vnpayment.vn',
                testMode: true,
                hashAlgorithm: 'SHA512',
                loggerFn: ignoreLogger,
            });

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const vnpayResponse = vnpay.buildPaymentUrl({
                vnp_Amount: totalPrice,
                vnp_IpAddr: '127.0.0.1',
                vnp_TxnRef: `${id} + ${idMovie} + ${seatIdStr} + ${totalPrice} + ${time} + ${date} + ${payId}`,
                vnp_OrderInfo: `thanh toan ${id} + ${idMovie} + ${seatIdStr} + ${totalPrice} + ${time} + ${date} + ${payId}`,
                vnp_OrderType: ProductCode.Other,
                vnp_ReturnUrl: `http://localhost/api/payments/check-payment-vnpay`,
                vnp_Locale: VnpLocale.VN,
                vnp_CreateDate: dateFormat(new Date()),
                vnp_ExpireDate: dateFormat(tomorrow),
            });
            new OK({ message: 'Thanh toán thông báo', metadata: vnpayResponse }).send(res);
        }
    }

    async checkPaymentMomo(req, res) {
        const { orderInfo } = req.query;
        const parts = orderInfo.split(' + ');

        const idUser = parts[0].split(' ').pop();
        const idMovie = parts[1];
        const idSeat = parts[2];
        const totalPrice = parseInt(parts[3], 10);
        const time = parts[4];
        const date = parts[5];
        const payId = parts[6];

        const seats = idSeat.split(',');
        const formattedDate = dayjs(date).format('YYYY-MM-DD');
        for (const seat of seats) {
            const foundSeat = await Seats.findOne({
                where: { movieId: idMovie, date: formattedDate, time: time, seat_code: seat },
            });
            if (foundSeat) {
                await foundSeat.update({ status: 'booked' });
            } else {
                await Seats.create({
                    status: 'booked',
                    time: time,
                    date: formattedDate,
                    row: seat.charAt(0),
                    number: parseInt(seat.slice(1), 10) || 1,
                    movieId: idMovie,
                    seat_code: seat,
                });
            }
        }

        let payment = null;
        if (payId) {
            payment = await Payments.findOne({ where: { id: payId } });
        }

        if (payment) {
            payment.status = 'success';
            await payment.save();
            if (payment.voucherCode) {
                await Voucher.increment('usedCount', { where: { code: payment.voucherCode.toUpperCase() } });
            }
        } else {
            payment = await Payments.create({
                id: payId || generatePayID(),
                movieId: idMovie,
                userId: idUser,
                seatId: idSeat,
                totalPrice: totalPrice,
                time: time,
                date: formattedDate,
                paymentMethod: 'momo',
                status: 'success',
            });
        }

        // Tích điểm kinh nghiệm XP
        if (idUser) {
            try {
                await updateUserXPAndLevel(
                    idUser,
                    seats.length * 100,
                    `Thanh toán MoMo ${seats.length} vé xem phim (+${seats.length * 100} XP)`
                );
            } catch (e) {
                console.error('MoMo XP notice:', e);
            }
        }

        return res.redirect(`http://localhost/payment-success/${payment.id}`);
    }

    async checkPaymentVNPay(req, res) {
        const { vnp_TxnRef } = req.query;
        const parts = vnp_TxnRef.split(' + ');

        const idUser = parts[0].split(' ').pop();
        const idMovie = parts[1];
        const idSeat = parts[2];
        const totalPrice = parseInt(parts[3], 10);
        const time = parts[4];
        const date = parts[5];
        const payId = parts[6];

        const seats = idSeat.split(',');
        const formattedDate = dayjs(date).format('YYYY-MM-DD');
        for (const seat of seats) {
            const foundSeat = await Seats.findOne({
                where: { movieId: idMovie, date: formattedDate, time: time, seat_code: seat },
            });
            if (foundSeat) {
                await foundSeat.update({ status: 'booked' });
            } else {
                await Seats.create({
                    status: 'booked',
                    time: time,
                    date: formattedDate,
                    row: seat.charAt(0),
                    number: parseInt(seat.slice(1), 10) || 1,
                    movieId: idMovie,
                    seat_code: seat,
                });
            }
        }


        let payment = null;
        if (payId) {
            payment = await Payments.findOne({ where: { id: payId } });
        }

        if (payment) {
            payment.status = 'success';
            await payment.save();
            if (payment.voucherCode) {
                await Voucher.increment('usedCount', { where: { code: payment.voucherCode.toUpperCase() } });
            }
        } else {
            payment = await Payments.create({
                id: payId || generatePayID(),
                movieId: idMovie,
                userId: idUser,
                seatId: idSeat,
                totalPrice: totalPrice,
                time: time,
                date: date,
                paymentMethod: 'vnpay',
                status: 'success',
            });
        }

        // Tích điểm kinh nghiệm XP
        if (idUser) {
            try {
                await updateUserXPAndLevel(
                    idUser,
                    seats.length * 100,
                    `Thanh toán VNPay ${seats.length} vé xem phim (+${seats.length * 100} XP)`
                );
            } catch (e) {
                console.error('VNPay XP notice:', e);
            }
        }

        return res.redirect(`http://localhost/payment-success/${payment.id}`);
    }

    async getPaymentById(req, res) {
        const { id } = req.query;
        const payment = await Payments.findOne({ where: { id: id } });
        const findMovie = await Movie.findOne({ where: { id: payment.movieId } });

        const data = {
            ...payment.dataValues,
            movie: findMovie.dataValues,
        };
        new OK({ message: 'Thanh toán thông báo', metadata: data }).send(res);
    }

    async getPaymentByUserId(req, res) {
        const { id } = req.user;
        const payments = await Payments.findAll({ where: { userId: id }, order: [['createdAt', 'DESC']] });
        const data = await Promise.all(
            payments.map(async (payment) => {
                const findMovie = await Movie.findOne({ where: { id: payment.movieId } });
                const findPreviewMovie = await PreviewMovie.findOne({
                    where: { movieId: payment.movieId, userId: payment.userId },
                });
                return {
                    ...payment.dataValues,
                    movie: findMovie.dataValues,
                    previewMovie: findPreviewMovie?.dataValues,
                };
            }),
        );
        new OK({ message: 'Lấy danh sách thanh toán thành công', metadata: data }).send(res);
    }

    async getPaymentByAdmin(req, res) {
        const payments = await Payments.findAll({ order: [['createdAt', 'DESC']] });
        const data = await Promise.all(
            payments.map(async (payment) => {
                const findMovie = payment.movieId ? await Movie.findOne({ where: { id: payment.movieId } }) : null;
                const findUser = payment.userId ? await User.findOne({ where: { id: payment.userId } }) : null;
                return {
                    ...payment?.dataValues,
                    movie: findMovie?.dataValues || null,
                    user: findUser?.dataValues || null,
                };
            }),
        );
        new OK({ message: 'Lấy danh sách thanh toán thành công', metadata: data }).send(res);
    }

    async updatePaymentStatus(req, res) {
        const { id, status } = req.body;
        const payment = await Payments.findOne({ where: { id: id } });
        if (!payment) {
            throw new BadRequestError('Thanh toán không tồn tại');
        }
        payment.status = status;
        await payment.save();

        new OK({ message: 'Cập nhật trạng thái thanh toán thành công', metadata: payment }).send(res);
    }

    async cancelBooking(req, res) {
        const { idPayment } = req.body;
        const payment = await Payments.findOne({ where: { id: idPayment } });
        if (!payment) {
            throw new BadRequestError('Thanh toán không tồn tại');
        }
        payment.status = 'canceled';
        await payment.save();
        new OK({ message: 'Hủy đặt vé thành công', metadata: payment }).send(res);
    }

    async addServicesToPayment(req, res) {
        const { idPayment, newServices, additionalPrice } = req.body;
        const payment = await Payments.findOne({ where: { id: idPayment } });
        if (!payment) {
            throw new BadRequestError('Thanh toán không tồn tại');
        }

        let existingServices = [];
        try {
            if (payment.services) {
                existingServices = typeof payment.services === 'string' ? JSON.parse(payment.services) : payment.services;
            }
        } catch (e) {
            existingServices = [];
        }

        // Merge or append new services
        const merged = Array.isArray(existingServices) ? [...existingServices] : [];
        if (Array.isArray(newServices)) {
            for (const item of newServices) {
                const found = merged.find((s) => s.id === item.id);
                if (found) {
                    found.quantity += item.quantity;
                } else {
                    merged.push(item);
                }
            }
        }

        payment.services = JSON.stringify(merged);
        payment.totalPrice = (payment.totalPrice || 0) + (additionalPrice || 0);
        await payment.save();

        const findMovie = await Movie.findOne({ where: { id: payment.movieId } });
        const data = {
            ...payment.dataValues,
            movie: findMovie ? findMovie.dataValues : null,
        };

        new OK({ message: 'Thêm bắp nước vào vé thành công', metadata: data }).send(res);
    }
}

module.exports = new PaymentsController();
