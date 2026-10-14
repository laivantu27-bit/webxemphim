const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');

const roomController = require('../controller/room.controller');

router.post('/create', asyncHandler(roomController.createRoom));
router.get('/all', asyncHandler(roomController.getAllRooms));
router.get('/detail', asyncHandler(roomController.getRoomById));
router.post('/update', asyncHandler(roomController.updateRoom));
router.delete('/delete', asyncHandler(roomController.deleteRoom));

module.exports = router;
