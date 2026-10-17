const User = require('./users.model');
const ApiKey = require('./apiKey.model');
const Otp = require('./otp.model');
const Category = require('./category.model');
const Movie = require('./movie.model');
const Seat = require('./seat.model');
const Payments = require('./payments.model');
const PreviewMovie = require('./previewMovie.model');
const Room = require('./room.model');
const Service = require('./service.model');
const Voucher = require('./voucher.model');
const CinemaBranch = require('./cinemaBranch.model');

const sync = async () => {
    // Sync all models with the database
    await User.sync({ alter: true }); // alter để tự thêm column role, xp, level mới

    await ApiKey.sync();
    await Otp.sync();
    await Category.sync();
    await Movie.sync({ alter: true });
    await Seat.sync();

    await Payments.sync({ alter: true });
    await PreviewMovie.sync({ alter: true });
    await Room.sync();
    try {
        const { connect } = require('../config/index');
        await connect.query('ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "cinemaBranchId" UUID;');
    } catch (e) {
        // column might exist
    }
    await Service.sync();
    await Voucher.sync();
    await CinemaBranch.sync({ alter: true });
};

module.exports = sync;
