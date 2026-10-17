const express = require('express');
const router = express.Router();
const { authUser, authAdmin, asyncHandler } = require('../auth/checkAuth');
const cinemaBranchController = require('../controller/cinemaBranch.controller');

// Public routes
router.get('/all', asyncHandler(cinemaBranchController.getAllBranches));
router.get('/detail', asyncHandler(cinemaBranchController.getBranchById));

// Admin routes (cũng cho phép public seed lần đầu nếu cần)
router.post('/seed', asyncHandler(cinemaBranchController.seedBranches));
router.post('/create', authUser, authAdmin, asyncHandler(cinemaBranchController.createBranch));
router.post('/update', authUser, authAdmin, asyncHandler(cinemaBranchController.updateBranch));
router.delete('/delete', authUser, authAdmin, asyncHandler(cinemaBranchController.deleteBranch));

module.exports = router;

