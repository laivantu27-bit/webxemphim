const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const Room = connect.define(
    'rooms',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Tên phòng chiếu (VD: Phòng 1, Phòng VIP)',
        },
        cinema: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Rạp trực thuộc (VD: CGV Vincom, Lotte Cinema)',
        },
        totalRows: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Số hàng ghế',
        },
        seatsPerRow: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Số ghế mỗi hàng',
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '2D',
            comment: 'Loại phòng (2D, 3D, IMAX, 4DX)',
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
            allowNull: false,
            comment: 'Trạng thái phòng chiếu',
        },
    },
    {
        freezeTableName: true,
        timestamps: true,
    },
);

module.exports = Room;
