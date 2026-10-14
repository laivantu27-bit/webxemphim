const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const voucherController = require('../controller/voucher.controller');

router.post('/create', asyncHandler(voucherController.createVoucher));
router.get('/all', asyncHandler(voucherController.getAllVouchers));
router.get('/active', asyncHandler(voucherController.getActiveVouchers));
router.post('/check', asyncHandler(voucherController.checkVoucher));
router.post('/update', asyncHandler(voucherController.updateVoucher));
router.delete('/delete', asyncHandler(voucherController.deleteVoucher));

module.exports = router;

