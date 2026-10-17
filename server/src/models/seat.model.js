const { DataTypes } = require('sequelize');
const { connect } = require('../config/index');

const seat = connect.define(
    'seats',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        row: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        number: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        seat_code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'available',
            allowNull: false,
            comment: 'available, booked, maintenance, broken',
        },
        movieId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        time: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        date: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        freezeTableName: true,
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['movieId', 'date', 'time', 'seat_code'],
                name: 'unique_movie_date_time_seat',
            },
        ],
    },
);


module.exports = seat;
