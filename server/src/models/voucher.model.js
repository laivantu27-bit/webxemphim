const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const Voucher = connect.define(
    'vouchers',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Mã giảm giá (VD: GIAM20K, COMBO50)',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Mô tả chi tiết khuyến mãi',
        },
        discountType: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'fixed',
            comment: 'fixed (giảm tiền mặt) hoặc percent (giảm %)',
        },
        discountValue: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Giá trị giảm (VD: 20000 VNĐ hoặc 10%)',
        },
        minOrderValue: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Đơn hàng tối thiểu để được giảm giá (khi mua bao nhiêu tiền trở lên)',
        },
        maxDiscount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: 'Số tiền giảm tối đa nếu discountType là percent',
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 100,
            comment: 'Số lượng mã phát hành',
        },
        usedCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Số lần đã sử dụng',
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Ngày bắt đầu áp dụng',
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Ngày hết hạn áp dụng',
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'active',
            comment: 'active (đang hoạt động), inactive (tạm dừng)',
        },
    },
    {
        freezeTableName: true,
        timestamps: true,
    },
);

module.exports = Voucher;

