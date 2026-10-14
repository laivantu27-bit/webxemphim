const { Op } = require('sequelize');
const dayjs = require('dayjs');
const Payments = require('../models/payments.model');
const Movie = require('../models/movie.model');
const Seats = require('../models/seat.model');
const Room = require('../models/room.model');
const Service = require('../models/service.model');
const User = require('../models/users.model');
const { OK, Created } = require('../core/success.response');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class StaffController {
    /**
     * 1. TRA CỨU VÉ BẰNG MÃ HOẶC QR CODE
     */
    async getTicketByCode(req, res) {
        const { code } = req.params;

        if (!code) {
            throw new BadRequestError('Vui lòng cung cấp mã vé hoặc quét QR');
        }

        const payment = await Payments.findOne({
            where: {
                [Op.or]: [
                    { id: code },
                    { customerPhone: code },
                ],
            },
        });

        if (!payment) {
            throw new NotFoundError('Không tìm thấy vé hợp lệ với mã: ' + code);
        }

        const movie = await Movie.findOne({ where: { id: payment.movieId } });
        let user = null;
        if (payment.userId) {
            user = await User.findOne({
                where: { id: payment.userId },
                attributes: ['id', 'fullName', 'email', 'phone'],
            });
        }

        // Parse services (snacks & drinks)
        let parsedServices = [];
        if (payment.services) {
            try {
                parsedServices = typeof payment.services === 'string'
                    ? JSON.parse(payment.services)
                    : payment.services;
            } catch (e) {
                parsedServices = [];
            }
        }

        // Room details
        const rooms = await Room.findAll({ where: { status: 'active' } });
        const roomName = rooms.length > 0 ? `${rooms[0].name} (${rooms[0].cinema})` : 'Phòng Chiếu 1';

        const ticketData = {
            id: payment.id,
            ticketCode: payment.id.substring(0, 8).toUpperCase(),
            movie: movie
                ? {
                      id: movie.id,
                      name: movie.name,
                      thumb_url: movie.thumb_url,
                      poster_url: movie.poster_url,
                      time: movie.time,
                      quality: movie.quality,
                      price: movie.price,
                  }
                : null,
            seats: payment.seatId ? payment.seatId.split(',').map((s) => s.trim()) : [],
            room: roomName,
            date: dayjs(payment.date).format('DD/MM/YYYY'),
            time: payment.time,
            totalPrice: payment.totalPrice,
            paymentMethod: payment.paymentMethod,
            status: payment.status,
            isCheckIn: !!payment.isCheckIn,
            checkInAt: payment.checkInAt ? dayjs(payment.checkInAt).format('HH:mm DD/MM/YYYY') : null,
            customerName: payment.customerName || (user ? user.fullName : 'Khách vãng lai'),
            customerPhone: payment.customerPhone || (user ? user.phone : 'Chưa cập nhật'),
            services: parsedServices,
            createdAt: dayjs(payment.createdAt).format('HH:mm DD/MM/YYYY'),
        };

        new OK({
            message: 'Tra cứu thông tin vé thành công',
            metadata: ticketData,
        }).send(res);
    }

    /**
     * 2. SOÁT VÉ (CHECK-IN)
     */
    async checkInTicket(req, res) {
        const { ticketId } = req.body;

        if (!ticketId) {
            throw new BadRequestError('Vui lòng cung cấp mã vé để soát vé');
        }

        const payment = await Payments.findOne({ where: { id: ticketId } });
        if (!payment) {
            throw new NotFoundError('Không tìm thấy vé trong hệ thống');
        }

        if (payment.status !== 'success') {
            throw new BadRequestError(`Không thể soát vé! Trạng thái vé hiện tại là: "${payment.status}" (Chưa thanh toán thành công).`);
        }

        if (payment.isCheckIn) {
            const timeStr = payment.checkInAt ? dayjs(payment.checkInAt).format('HH:mm:ss DD/MM/YYYY') : 'trước đó';
            return res.status(400).json({
                message: `CẢNH BÁO: Vé này ĐÃ ĐƯỢC SOÁT vào lúc ${timeStr}! Vui lòng kiểm tra lại để tránh vé giả mạo hoặc vào trùng lặp.`,
                isAlreadyCheckedIn: true,
                checkInAt: payment.checkInAt,
            });
        }

        // Cập nhật trạng thái check-in
        const now = new Date();
        await payment.update({
            isCheckIn: true,
            checkInAt: now,
            staffId: req.user?.id || payment.staffId || null,
        });

        const movie = await Movie.findOne({ where: { id: payment.movieId } });

        new OK({
            message: 'SOÁT VÉ THÀNH CÔNG! Chúc khách hàng xem phim vui vẻ.',
            metadata: {
                ticketId: payment.id,
                isCheckIn: true,
                checkInAt: dayjs(now).format('HH:mm:ss DD/MM/YYYY'),
                movieName: movie ? movie.name : 'N/A',
                seats: payment.seatId,
                customerName: payment.customerName,
            },
        }).send(res);
    }

    /**
     * 3. BÁN VÉ TẠI QUẦY (POS COUNTER)
     */
    async sellTicketAtCounter(req, res) {
        const {
            movieId,
            date,
            time,
            seatCodes,
            services = [],
            paymentMethod = 'cash',
            customerName = 'Khách tại quầy',
            customerPhone = '',
        } = req.body;

        if (!movieId || !date || !time || !seatCodes || !seatCodes.length) {
            throw new BadRequestError('Vui lòng chọn đầy đủ phim, ngày, suất chiếu và ghế');
        }

        const movie = await Movie.findOne({ where: { id: movieId } });
        if (!movie) {
            throw new NotFoundError('Phim không tồn tại');
        }

        const dateStr = dayjs(date).format('YYYY-MM-DD');

        // Kiểm tra xem các ghế đã có người đặt hoặc đang bảo trì chưa
        const existingSeats = await Seats.findAll({
            where: {
                movieId,
                date: dateStr,
                time,
                seat_code: { [Op.in]: seatCodes },
            },
        });

        const unavailable = existingSeats.filter(
            (s) => s.status === 'booked' || s.status === 'maintenance' || s.status === 'broken'
        );

        if (unavailable.length > 0) {
            const conflictCodes = unavailable.map((s) => `${s.seat_code} (${s.status === 'booked' ? 'Đã có người đặt' : 'Đang bảo trì'})`).join(', ');
            throw new BadRequestError(`Các ghế sau không khả dụng: ${conflictCodes}. Vui lòng chọn ghế khác!`);
        }

        // Tạo hoặc cập nhật ghế thành đã đặt
        for (const code of seatCodes) {
            const foundSeat = existingSeats.find((s) => s.seat_code === code);
            const row = code.charAt(0);
            const number = parseInt(code.substring(1), 10) || 1;

            if (foundSeat) {
                await foundSeat.update({ status: 'booked' });
            } else {
                await Seats.create({
                    row,
                    number,
                    seat_code: code,
                    status: 'booked',
                    movieId,
                    time,
                    date: dateStr,
                });
            }
        }

        // Tính tiền vé
        const ticketTotal = parseInt(movie.price || 0, 10) * seatCodes.length;

        // Tính tiền bắp nước nếu có
        let serviceTotal = 0;
        if (services && services.length > 0) {
            serviceTotal = services.reduce((sum, item) => sum + (parseInt(item.price || 0, 10) * (item.quantity || 1)), 0);
        }

        const totalPrice = ticketTotal + serviceTotal;

        // Tạo bản ghi thanh toán với trạng thái thành công ngay tại quầy
        const payment = await Payments.create({
            movieId,
            userId: req.user?.id || null,
            staffId: req.user?.id || null,
            seatId: seatCodes.join(', '),
            totalPrice,
            time,
            date: new Date(date),
            paymentMethod,
            status: 'success',
            isCheckIn: false,
            customerName,
            customerPhone,
            services: services.length > 0 ? JSON.stringify(services) : null,
        });

        new Created({
            message: 'Bán vé tại quầy thành công!',
            metadata: {
                payment,
                movie: {
                    id: movie.id,
                    name: movie.name,
                    price: movie.price,
                },
                seats: seatCodes,
                ticketTotal,
                serviceTotal,
                totalPrice,
            },
        }).send(res);
    }

    /**
     * 4. QUẢN LÝ PHÒNG VÀ GHẾ BẢO TRÌ
     */
    async getRooms(req, res) {
        const rooms = await Room.findAll({
            order: [['createdAt', 'ASC']],
        });
        new OK({
            message: 'Lấy danh sách phòng thành công',
            metadata: rooms,
        }).send(res);
    }

    async getSeatsByShowtime(req, res) {
        const { movieId, date, time } = req.query;

        if (!movieId || !date || !time) {
            throw new BadRequestError('Vui lòng cung cấp movieId, date, time');
        }

        const dateStr = dayjs(date).format('YYYY-MM-DD');
        const seats = await Seats.findAll({
            where: {
                movieId,
                date: dateStr,
                time,
            },
        });

        new OK({
            message: 'Lấy danh sách ghế thành công',
            metadata: seats,
        }).send(res);
    }

    async updateSeatMaintenance(req, res) {
        const { movieId, date, time, seatCodes, status } = req.body;

        if (!movieId || !date || !time || !seatCodes || !seatCodes.length) {
            throw new BadRequestError('Vui lòng cung cấp movieId, date, time, seatCodes');
        }

        const validStatuses = ['available', 'maintenance', 'broken'];
        const targetStatus = validStatuses.includes(status) ? status : 'maintenance';
        const dateStr = dayjs(date).format('YYYY-MM-DD');

        const updatedSeats = [];

        for (const code of seatCodes) {
            let seat = await Seats.findOne({
                where: {
                    movieId,
                    date: dateStr,
                    time,
                    seat_code: code,
                },
            });

            if (seat) {
                await seat.update({ status: targetStatus });
                updatedSeats.push(seat);
            } else {
                const row = code.charAt(0);
                const number = parseInt(code.substring(1), 10) || 1;
                seat = await Seats.create({
                    row,
                    number,
                    seat_code: code,
                    status: targetStatus,
                    movieId,
                    time,
                    date: dateStr,
                });
                updatedSeats.push(seat);
            }
        }

        new OK({
            message: targetStatus === 'available'
                ? `Đã hoàn tất bảo trì, mở lại ${updatedSeats.length} ghế đón khách`
                : `Đã đánh dấu ${updatedSeats.length} ghế vào trạng thái BẢO TRÌ/HỎNG`,
            metadata: updatedSeats,
        }).send(res);
    }

    /**
     * 5. BÁO CÁO CA LÀM VIỆC (SHIFT REPORT)
     */
    async getShiftReport(req, res) {
        const { date = new Date(), staffId } = req.query;

        const targetDate = dayjs(date).format('YYYY-MM-DD');
        const startOfDay = new Date(`${targetDate}T00:00:00.000Z`);
        const endOfDay = new Date(`${targetDate}T23:59:59.999Z`);

        const whereCondition = {
            createdAt: {
                [Op.between]: [startOfDay, endOfDay],
            },
            status: 'success',
        };

        if (staffId) {
            whereCondition.staffId = staffId;
        }

        const payments = await Payments.findAll({
            where: whereCondition,
            order: [['createdAt', 'DESC']],
        });

        // Thống kê doanh thu và số lượng
        let totalRevenue = 0;
        let totalTicketCount = 0;
        let totalSnackRevenue = 0;
        let cashRevenue = 0;
        let bankingRevenue = 0;
        let momoRevenue = 0;
        let vnpayRevenue = 0;
        let checkedInCount = 0;

        const detailedList = [];

        for (const p of payments) {
            totalRevenue += p.totalPrice || 0;

            const seatsArray = p.seatId ? p.seatId.split(',').filter(Boolean) : [];
            totalTicketCount += seatsArray.length;

            if (p.isCheckIn) checkedInCount++;

            // Phân loại doanh thu theo phương thức
            const method = (p.paymentMethod || '').toLowerCase();
            if (method === 'cash' || method === 'direct') cashRevenue += p.totalPrice || 0;
            else if (method === 'banking') bankingRevenue += p.totalPrice || 0;
            else if (method === 'momo') momoRevenue += p.totalPrice || 0;
            else if (method === 'vnpay') vnpayRevenue += p.totalPrice || 0;
            else cashRevenue += p.totalPrice || 0;

            // Tính tiền bắp nước
            let itemSnackSum = 0;
            if (p.services) {
                try {
                    const parsed = typeof p.services === 'string' ? JSON.parse(p.services) : p.services;
                    if (Array.isArray(parsed)) {
                        itemSnackSum = parsed.reduce((sum, item) => sum + (parseInt(item.price || 0, 10) * (item.quantity || 1)), 0);
                        totalSnackRevenue += itemSnackSum;
                    }
                } catch (e) {}
            }

            const movie = await Movie.findOne({ where: { id: p.movieId }, attributes: ['name'] });

            detailedList.push({
                id: p.id,
                time: dayjs(p.createdAt).format('HH:mm:ss'),
                movieName: movie ? movie.name : 'N/A',
                seats: p.seatId,
                totalPrice: p.totalPrice,
                paymentMethod: p.paymentMethod,
                isCheckIn: p.isCheckIn,
                customerName: p.customerName || 'Khách vãng lai',
            });
        }

        const ticketRevenue = totalRevenue - totalSnackRevenue;

        new OK({
            message: 'Lấy báo cáo ca làm việc thành công',
            metadata: {
                reportDate: dayjs(targetDate).format('DD/MM/YYYY'),
                totalRevenue,
                ticketRevenue,
                totalSnackRevenue,
                totalTicketCount,
                checkedInCount,
                paymentBreakdown: {
                    cash: cashRevenue,
                    banking: bankingRevenue,
                    momo: momoRevenue,
                    vnpay: vnpayRevenue,
                },
                transactionCount: payments.length,
                transactions: detailedList,
            },
        }).send(res);
    }

    /**
     * 6. LỊCH SỬ GIAO DỊCH (TRANSACTION HISTORY)
     */
    async getTransactions(req, res) {
        const {
            page = 1,
            limit = 20,
            search = '',
            status = '',
            paymentMethod = '',
            isCheckIn = '',
            date = '',
        } = req.query;

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const whereClause = {};

        if (status) {
            whereClause.status = status;
        }

        if (paymentMethod) {
            whereClause.paymentMethod = paymentMethod;
        }

        if (isCheckIn !== '') {
            whereClause.isCheckIn = isCheckIn === 'true';
        }

        if (date) {
            const targetDate = dayjs(date).format('YYYY-MM-DD');
            const startOfDay = new Date(`${targetDate}T00:00:00.000Z`);
            const endOfDay = new Date(`${targetDate}T23:59:59.999Z`);
            whereClause.createdAt = { [Op.between]: [startOfDay, endOfDay] };
        }

        if (search) {
            whereClause[Op.or] = [
                { customerName: { [Op.iLike]: `%${search}%` } },
                { customerPhone: { [Op.iLike]: `%${search}%` } },
                { seatId: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { count, rows } = await Payments.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit, 10),
            offset,
        });

        const list = await Promise.all(
            rows.map(async (p) => {
                const movie = await Movie.findOne({ where: { id: p.movieId } });
                return {
                    id: p.id,
                    ticketCode: p.id.substring(0, 8).toUpperCase(),
                    movieName: movie ? movie.name : 'N/A',
                    moviePoster: movie ? movie.poster_url || movie.thumb_url : '',
                    seats: p.seatId,
                    showDate: dayjs(p.date).format('DD/MM/YYYY'),
                    showTime: p.time,
                    totalPrice: p.totalPrice,
                    paymentMethod: p.paymentMethod,
                    status: p.status,
                    isCheckIn: p.isCheckIn,
                    checkInAt: p.checkInAt ? dayjs(p.checkInAt).format('HH:mm DD/MM/YYYY') : null,
                    customerName: p.customerName || 'Khách vãng lai',
                    customerPhone: p.customerPhone || '',
                    createdAt: dayjs(p.createdAt).format('HH:mm DD/MM/YYYY'),
                };
            })
        );

        new OK({
            message: 'Lấy lịch sử giao dịch thành công',
            metadata: {
                total: count,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages: Math.ceil(count / parseInt(limit, 10)),
                transactions: list,
            },
        }).send(res);
    }

    /**
     * 7. HỦY GIAO DỊCH / TRẢ VÉ TẠI QUẦY
     */
    async cancelTransaction(req, res) {
        const { paymentId, reason = 'Khách yêu cầu hủy vé' } = req.body;

        if (!paymentId) {
            throw new BadRequestError('Vui lòng cung cấp mã giao dịch cần hủy');
        }

        const payment = await Payments.findOne({ where: { id: paymentId } });
        if (!payment) {
            throw new NotFoundError('Không tìm thấy giao dịch');
        }

        if (payment.isCheckIn) {
            throw new BadRequestError('Không thể hủy vé đã được soát vào rạp!');
        }

        // Trả lại ghế thành available
        if (payment.seatId) {
            const seats = payment.seatId.split(',').map((s) => s.trim());
            const dateStr = dayjs(payment.date).format('YYYY-MM-DD');

            await Seats.update(
                { status: 'available' },
                {
                    where: {
                        movieId: payment.movieId,
                        date: dateStr,
                        time: payment.time,
                        seat_code: { [Op.in]: seats },
                    },
                }
            );
        }

        await payment.update({
            status: 'canceled',
        });

        new OK({
            message: `Hủy giao dịch thành công. Đã hoàn lại ${payment.seatId} ghế vào hệ thống. Lý do: ${reason}`,
            metadata: payment,
        }).send(res);
    }
}

module.exports = new StaffController();
