const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const User = connect.define(
    'users',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isAdmin: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '0',
        },

        role: {
            type: DataTypes.ENUM('customer', 'staff', 'admin'),
            allowNull: false,
            defaultValue: 'customer',
        },

        typeLogin: {
            type: DataTypes.ENUM('google', 'email'),
            allowNull: false,
        },

        xpPoints: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Điểm kinh nghiệm tích lũy khi mua vé / đánh giá phim',
        },

        level: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Bronze',
            comment: 'Cấp bậc thành viên: Bronze, Silver, Gold, Diamond',
        },

        studentVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Trạng thái xác minh học sinh / sinh viên để nhận giảm giá',
        },

        studentSchool: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Tên trường học sinh / sinh viên',
        },

        studentIdImage: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Ảnh chụp thẻ học sinh / sinh viên',
        },

        rewardsHistory: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Lịch sử đổi quà từ điểm XP (JSON)',
        },
    },
    {
        freezeTableName: true, // 👈 Giữ nguyên tên bảng là 'users'
        timestamps: true,
    },
);

module.exports = User;
