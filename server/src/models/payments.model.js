const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const payments = connect.define(
    'payments',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        movieId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'movies',
                key: 'id',
            },
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        staffId: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'Staff who sold the ticket at counter',
        },
        cinemaBranchId: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'Chi nhánh rạp nơi chiếu phim hoặc quầy vé',
        },
        branchName: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Tên chi nhánh rạp CGV',
        },
        seatId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        totalPrice: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        time: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'momo, vnpay, cash, banking, direct',
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
            comment: 'pending, success, failed, canceled',
        },
        services: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        isCheckIn: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        checkInAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        customerName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        customerPhone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        voucherCode: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Mã giảm giá áp dụng (nếu có)',
        },
        discountAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: 'Số tiền giảm giá (VNĐ)',
        },
    },
    {
        freezeTableName: true,
    },
);

module.exports = payments;
