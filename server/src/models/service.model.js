const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const Service = connect.define(
    'services',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Tên dịch vụ (VD: Bắp rang bơ lớn, Coca-Cola)',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Mô tả chi tiết',
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Giá (VNĐ)',
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'URL hình ảnh',
        },
        category: {
            type: DataTypes.ENUM('combo', 'food', 'drink'),
            allowNull: false,
            defaultValue: 'food',
            comment: 'Loại: combo, food (đồ ăn), drink (đồ uống)',
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
            allowNull: false,
        },
    },
    {
        freezeTableName: true,
        timestamps: true,
    },
);

module.exports = Service;
