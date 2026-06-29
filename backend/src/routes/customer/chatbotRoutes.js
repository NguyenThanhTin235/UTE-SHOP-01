const express = require('express');
const router = express.Router();
const chatbotController = require('../../controllers/customer/chatbotController');

// Define optionalAuth manually since we might not have it imported
const optionalAuth = (req, res, next) => {
    // If you have a middleware for optional token verification, use it here.
    // For now, we will just proceed without enforcing token.
    next();
};

router.post('/message', optionalAuth, chatbotController.sendMessage);
router.get('/history', optionalAuth, chatbotController.getHistory);
router.delete('/history', optionalAuth, chatbotController.clearHistory);

module.exports = router;
