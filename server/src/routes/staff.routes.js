const express = require('express');
const router = express.Router();
const staffController = require('../controller/staff.controller');
const { asyncHandler } = require('../auth/checkAuth');

// 1. Quét QR & Soát vé
router.get('/ticket/:code', asyncHandler(staffController.getTicketByCode));
router.post('/check-in', asyncHandler(staffController.checkInTicket));

// 2. Bán vé tại quầy
router.post('/sell-ticket', asyncHandler(staffController.sellTicketAtCounter));

// 3. Quản lý phòng & ghế bảo trì
router.get('/rooms', asyncHandler(staffController.getRooms));
router.post('/room-branch', asyncHandler(staffController.updateRoomBranch));
router.get('/seats', asyncHandler(staffController.getSeatsByShowtime));
router.post('/seat-maintenance', asyncHandler(staffController.updateSeatMaintenance));

// 4. Báo cáo ca làm việc
router.get('/shift-report', asyncHandler(staffController.getShiftReport));

// 5. Lịch sử giao dịch & Hủy vé
router.get('/transactions', asyncHandler(staffController.getTransactions));
router.post('/cancel-transaction', asyncHandler(staffController.cancelTransaction));

module.exports = router;
