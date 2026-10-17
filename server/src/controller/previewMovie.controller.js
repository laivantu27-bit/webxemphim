const { AuthFailureError, BadRequestError } = require('../core/error.response');
const { OK, Created } = require('../core/success.response');
const modelPreviewMovie = require('../models/previewMovie.model');
const Payments = require('../models/payments.model');
const Movie = require('../models/movie.model');
const User = require('../models/users.model');
const { updateUserXPAndLevel } = require('../utils/xpHelper');
const { Op } = require('sequelize');

class PreviewMovieController {
    /**
     * Tạo hoặc cập nhật đánh giá phim và cộng điểm XP
     */
    async createPreviewMovie(req, res) {
        const { id } = req.user;
        const { movieId, rating, comment } = req.body;

        if (!movieId || !rating) {
            throw new BadRequestError('Vui lòng chọn số sao đánh giá (1-5 sao)');
        }

        const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10)));

        // Kiểm tra xem đã từng đánh giá phim này chưa
        let review = await modelPreviewMovie.findOne({
            where: { userId: id, movieId },
        });

        let isNew = false;
        if (review) {
            review.rating = numericRating;
            review.comment = comment || review.comment;
            await review.save();
        } else {
            review = await modelPreviewMovie.create({
                userId: id,
                movieId,
                rating: numericRating,
                comment: comment || '',
            });
            isNew = true;
        }

        // Tích điểm kinh nghiệm: 50 XP cho mỗi đánh giá mới
        let xpResult = null;
        if (isNew) {
            const movie = await Movie.findByPk(movieId);
            const movieName = movie?.name || 'phim';
            xpResult = await updateUserXPAndLevel(id, 50, `Đánh giá 5 sao cho phim "${movieName}" (+50 XP)`);
        }

        new OK({
            message: isNew
                ? 'Đánh giá phim thành công! Bạn nhận được +50 điểm kinh nghiệm (XP) 🌟'
                : 'Cập nhật đánh giá phim thành công',
            metadata: {
                review,
                xpAwarded: isNew ? 50 : 0,
                userXP: xpResult,
            },
        }).send(res);
    }

    /**
     * Lấy danh sách các phim người dùng đã xem nhưng CHƯA đánh giá để gửi thông báo nhắc nhở
     */
    async getPendingReviewMovies(req, res) {
        const { id } = req.user;

        // Tìm tất cả các vé xem phim thành công của user
        const payments = await Payments.findAll({
            where: {
                userId: id,
                status: 'success',
            },
            attributes: ['movieId', 'date', 'time'],
            order: [['date', 'DESC']],
        });

        if (payments.length === 0) {
            return new OK({ message: 'Không có phim cần đánh giá', metadata: [] }).send(res);
        }

        // Lấy danh sách các movieId duy nhất đã xem
        const watchedMovieIds = [...new Set(payments.map((p) => p.movieId))];

        // Tìm các phim người dùng đã từng đánh giá
        const reviewed = await modelPreviewMovie.findAll({
            where: {
                userId: id,
                movieId: { [Op.in]: watchedMovieIds },
            },
            attributes: ['movieId'],
        });
        const reviewedIds = new Set(reviewed.map((r) => r.movieId));

        // Lọc các phim chưa đánh giá
        const unreviewedIds = watchedMovieIds.filter((mId) => !reviewedIds.has(mId));

        if (unreviewedIds.length === 0) {
            return new OK({ message: 'Đã đánh giá hết', metadata: [] }).send(res);
        }

        const unreviewedMovies = await Movie.findAll({
            where: { id: { [Op.in]: unreviewedIds } },
            attributes: ['id', 'name', 'poster_url', 'thumb_url', 'director', 'year'],
        });

        new OK({
            message: 'Danh sách phim chờ đánh giá',
            metadata: unreviewedMovies,
        }).send(res);
    }

    /**
     * Lấy danh sách đánh giá của 1 phim
     */
    async getReviewsByMovieId(req, res) {
        const { movieId } = req.query;
        if (!movieId) throw new BadRequestError('movieId is required');

        const reviews = await modelPreviewMovie.findAll({
            where: { movieId },
            order: [['createdAt', 'DESC']],
        });

        const data = await Promise.all(
            reviews.map(async (r) => {
                const user = await User.findByPk(r.userId, {
                    attributes: ['id', 'fullName', 'avatar', 'level'],
                });
                return {
                    ...r.dataValues,
                    user: user ? user.dataValues : { fullName: 'Khán giả ẩn danh' },
                };
            }),
        );

        new OK({ message: 'Lấy đánh giá phim thành công', metadata: data }).send(res);
    }
}

module.exports = new PreviewMovieController();
