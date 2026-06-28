const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

router.get('/', chatbotController.getChatbotResponse);

module.exports = router;
