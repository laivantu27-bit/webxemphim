const express = require('express');
const router = express.Router();
const ChatbotController = require('../controller/chatbot.controller');

// POST /chat - no auth required (public)
router.post('/chat', ChatbotController.chat);

module.exports = router;
