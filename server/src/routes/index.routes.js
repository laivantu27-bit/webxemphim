const usersRoutes = require('./users.routes');
const movieRoutes = require('./movie.routes');
const categoryRoutes = require('./category.routes');
const paymentsRoutes = require('./payments.routes');
const previewMovieRoutes = require('./previewMovie.routes');
const roomRoutes = require('./room.routes');
const serviceRoutes = require('./service.routes');
const chatbotRoutes = require('./chatbot.routes');
const staffRoutes = require('./staff.routes');
const voucherRoutes = require('./voucher.routes');
const cinemaBranchRoutes = require('./cinemaBranch.routes');

function routes(app) {
    app.use('/api/users', usersRoutes);
    app.use('/api/movie', movieRoutes);
    app.use('/api/category', categoryRoutes);
    app.use('/api/payments', paymentsRoutes);
    app.use('/api/preview-movie', previewMovieRoutes);
    app.use('/api/room', roomRoutes);
    app.use('/api/service', serviceRoutes);
    app.use('/api/chatbot', chatbotRoutes);
    app.use('/api/staff', staffRoutes);
    app.use('/api/voucher', voucherRoutes);
    app.use('/api/cinema-branch', cinemaBranchRoutes);
}

module.exports = routes;
