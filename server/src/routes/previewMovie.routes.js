const express = require('express');
const router = express.Router();

const { authUser, asyncHandler } = require('../auth/checkAuth');
const controllerPreviewMovie = require('../controller/previewMovie.controller');

router.post('/create', authUser, asyncHandler(controllerPreviewMovie.createPreviewMovie));
router.get('/pending', authUser, asyncHandler(controllerPreviewMovie.getPendingReviewMovies));
router.get('/by-movie', asyncHandler(controllerPreviewMovie.getReviewsByMovieId));

module.exports = router;
