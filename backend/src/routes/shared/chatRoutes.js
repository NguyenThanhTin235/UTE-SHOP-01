const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/shared/chatController');
const { verifyToken } = require('../../middleware/authMiddleware');

// Initialize admin chat (find or create)
router.post('/admin/init', verifyToken, chatController.initAdminChat);

// Initialize shop chat (find or create)
router.post('/shop/init', verifyToken, chatController.initShopChat);

// Get all conversations for a user
router.get('/conversations', verifyToken, chatController.getConversations);

// Get messages for a specific conversation
router.get('/conversations/:id/messages', verifyToken, chatController.getMessages);

// Send a new message
router.post('/messages', verifyToken, chatController.sendMessage);

// Get all admin conversations
router.get('/admin/all-conversations', verifyToken, chatController.getAllAdminConversations);

// Get all shop conversations
router.get('/shop/all-conversations', verifyToken, chatController.getAllShopConversations);

// Get unread count
router.get('/unread-count', verifyToken, chatController.getUnreadCount);

// Mark as read
router.put('/conversations/:id/read', verifyToken, chatController.markAsRead);

module.exports = router;
