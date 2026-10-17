const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const CinemaBranch = connect.define(
    'cinemaBranches',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Tên cụm rạp, ví dụ: CGV Vincom Center Bà Triệu',
        },
        brand: {
            type: DataTypes.STRING,
            defaultValue: 'CGV',
            comment: 'Thương hiệu rạp: CGV, Lotte, BHD, Galaxy...',
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Địa chỉ chi tiết',
        },
        province: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Tỉnh / Thành phố: Hà Nội, TP.HCM, Đà Nẵng...',
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Quận / Huyện',
        },
        lat: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: 'Tọa độ vĩ độ (Latitude) để tính khoảng cách và định vị',
        },
        lng: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: 'Tọa độ kinh độ (Longitude) để tính khoảng cách và định vị',
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        totalRooms: {
            type: DataTypes.INTEGER,
            defaultValue: 6,
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        openHours: {
            type: DataTypes.STRING,
            defaultValue: '08:00 - 23:30',
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'active',
            comment: 'active, maintenance, closed',
        },
    },
    {
        freezeTableName: true,
        timestamps: true,
    },
);

module.exports = CinemaBranch;

