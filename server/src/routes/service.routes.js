const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const serviceController = require('../controller/service.controller');

router.post('/create', asyncHandler(serviceController.createService));
router.get('/all', asyncHandler(serviceController.getAllServices));
router.get('/active', asyncHandler(serviceController.getActiveServices));
router.post('/update', asyncHandler(serviceController.updateService));
router.delete('/delete', asyncHandler(serviceController.deleteService));

module.exports = router;
