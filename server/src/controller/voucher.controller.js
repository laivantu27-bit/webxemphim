const { Op } = require('sequelize');
const Voucher = require('../models/voucher.model');
const { OK, Created } = require('../core/success.response');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class VoucherController {
    /**
     * Lấy tất cả voucher cho quản trị viên (Admin)
     */
    async getAllVouchers(req, res) {
        const vouchers = await Voucher.findAll({
            order: [['createdAt', 'DESC']],
        });
        return new OK({
            message: 'Lấy danh sách mã giảm giá thành công',
            metadata: vouchers,
        }).send(res);
    }

    /**
     * Lấy các voucher đang hoạt động cho khách hàng xem và áp dụng
     */
    async getActiveVouchers(req, res) {
        const now = new Date();
        const vouchers = await Voucher.findAll({
            where: {
                status: 'active',
                [Op.and]: [
                    {
                        [Op.or]: [
                            { endDate: null },
                            { endDate: { [Op.gte]: now } },
                        ],
                    },
                    {
                        [Op.or]: [
                            { startDate: null },
                            { startDate: { [Op.lte]: now } },
                        ],
                    },
                ],
            },
            order: [['minOrderValue', 'ASC']],
        });

        // Filter out those that exceeded quantity
        const available = vouchers.filter((v) => v.usedCount < v.quantity);

        return new OK({
            message: 'Lấy danh sách voucher khả dụng thành công',
            metadata: available,
        }).send(res);
    }

    /**
     * Kiểm tra và áp dụng mã giảm giá với số tiền đơn hàng
     * Body: { code: string, orderAmount: number }
     */
    async checkVoucher(req, res) {
        const { code, orderAmount } = req.body;

        if (!code) {
            throw new BadRequestError('Vui lòng nhập mã giảm giá');
        }

        const normalizedCode = code.trim().toUpperCase();
        const voucher = await Voucher.findOne({
            where: {
                code: normalizedCode,
            },
        });

        if (!voucher) {
            throw new NotFoundError(`Mã giảm giá "${normalizedCode}" không tồn tại`);
        }

        if (voucher.status !== 'active') {
            throw new BadRequestError(`Mã giảm giá "${normalizedCode}" hiện đang tạm ngừng sử dụng`);
        }

        const now = new Date();
        if (voucher.startDate && new Date(voucher.startDate) > now) {
            throw new BadRequestError(`Mã giảm giá "${normalizedCode}" chưa đến ngày áp dụng`);
        }

        if (voucher.endDate && new Date(voucher.endDate) < now) {
            throw new BadRequestError(`Mã giảm giá "${normalizedCode}" đã hết hạn sử dụng`);
        }

        if (voucher.usedCount >= voucher.quantity) {
            throw new BadRequestError(`Mã giảm giá "${normalizedCode}" đã hết lượt sử dụng`);
        }

        const amount = Number(orderAmount) || 0;

        // KIỂM TRA ĐIỀU KIỆN ĐƠN HÀNG TỐI THIỂU (minOrderValue)
        if (amount < voucher.minOrderValue) {
            throw new BadRequestError(
                `Mã "${voucher.code}" yêu cầu đơn hàng tối thiểu từ ${(voucher.minOrderValue || 0).toLocaleString(
                    'vi-VN',
                )} đ trở lên. Đơn hiện tại của bạn là ${amount.toLocaleString('vi-VN')} đ (còn thiếu ${(
                    voucher.minOrderValue - amount
                ).toLocaleString('vi-VN')} đ). Hãy mua thêm bắp nước hoặc vé để được giảm!`
            );
        }

        // TÍNH TOÁN SỐ TIỀN GIẢM
        let discountAmount = 0;
        if (voucher.discountType === 'percent') {
            const rawDiscount = Math.round((amount * voucher.discountValue) / 100);
            if (voucher.maxDiscount && voucher.maxDiscount > 0) {
                discountAmount = Math.min(rawDiscount, voucher.maxDiscount);
            } else {
                discountAmount = rawDiscount;
            }
        } else {
            // 'fixed' giảm tiền mặt
            discountAmount = Math.min(voucher.discountValue, amount);
        }

        const finalAmount = Math.max(0, amount - discountAmount);

        return new OK({
            message: `Áp dụng mã giảm giá "${voucher.code}" thành công!`,
            metadata: {
                valid: true,
                voucher,
                code: voucher.code,
                discountType: voucher.discountType,
                discountValue: voucher.discountValue,
                minOrderValue: voucher.minOrderValue,
                discountAmount,
                originalAmount: amount,
                finalAmount,
            },
        }).send(res);
    }

    /**
     * Tạo mã giảm giá mới (Admin)
     */
    async createVoucher(req, res) {
        const {
            code,
            description,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscount,
            quantity,
            startDate,
            endDate,
            status,
        } = req.body;

        if (!code || !discountValue) {
            throw new BadRequestError('Mã giảm giá và mức giảm là bắt buộc');
        }

        const normalizedCode = code.trim().toUpperCase();
        const existing = await Voucher.findOne({ where: { code: normalizedCode } });
        if (existing) {
            throw new BadRequestError(`Mã giảm giá "${normalizedCode}" đã tồn tại`);
        }

        const voucher = await Voucher.create({
            code: normalizedCode,
            description: description || '',
            discountType: discountType || 'fixed',
            discountValue: parseInt(discountValue, 10),
            minOrderValue: minOrderValue ? parseInt(minOrderValue, 10) : 0,
            maxDiscount: maxDiscount ? parseInt(maxDiscount, 10) : 0,
            quantity: quantity ? parseInt(quantity, 10) : 100,
            usedCount: 0,
            startDate: startDate || null,
            endDate: endDate || null,
            status: status || 'active',
        });

        return new Created({
            message: 'Tạo mã giảm giá thành công',
            metadata: voucher,
        }).send(res);
    }

    /**
     * Cập nhật mã giảm giá (Admin)
     */
    async updateVoucher(req, res) {
        const {
            id,
            code,
            description,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscount,
            quantity,
            startDate,
            endDate,
            status,
        } = req.body;

        if (!id) {
            throw new BadRequestError('ID mã giảm giá là bắt buộc');
        }

        const voucher = await Voucher.findOne({ where: { id } });
        if (!voucher) {
            throw new NotFoundError('Không tìm thấy mã giảm giá');
        }

        if (code) {
            const normalizedCode = code.trim().toUpperCase();
            if (normalizedCode !== voucher.code) {
                const existing = await Voucher.findOne({ where: { code: normalizedCode } });
                if (existing) {
                    throw new BadRequestError(`Mã "${normalizedCode}" đã tồn tại`);
                }
                voucher.code = normalizedCode;
            }
        }

        if (description !== undefined) voucher.description = description;
        if (discountType !== undefined) voucher.discountType = discountType;
        if (discountValue !== undefined) voucher.discountValue = parseInt(discountValue, 10);
        if (minOrderValue !== undefined) voucher.minOrderValue = parseInt(minOrderValue, 10);
        if (maxDiscount !== undefined) voucher.maxDiscount = parseInt(maxDiscount, 10);
        if (quantity !== undefined) voucher.quantity = parseInt(quantity, 10);
        if (startDate !== undefined) voucher.startDate = startDate || null;
        if (endDate !== undefined) voucher.endDate = endDate || null;
        if (status !== undefined) voucher.status = status;

        await voucher.save();

        return new OK({
            message: 'Cập nhật mã giảm giá thành công',
            metadata: voucher,
        }).send(res);
    }

    /**
     * Xóa mã giảm giá (Admin)
     */
    async deleteVoucher(req, res) {
        const { id } = req.body;
        if (!id) {
            throw new BadRequestError('ID mã giảm giá là bắt buộc');
        }

        const voucher = await Voucher.findOne({ where: { id } });
        if (!voucher) {
            throw new NotFoundError('Không tìm thấy mã giảm giá');
        }

        await voucher.destroy();

        return new OK({
            message: 'Xóa mã giảm giá thành công',
            metadata: voucher,
        }).send(res);
    }
}

module.exports = new VoucherController();

