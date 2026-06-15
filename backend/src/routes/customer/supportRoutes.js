const express = require('express');
const router = express.Router();
const supportController = require('../../controllers/customer/supportController');
const { verifyToken } = require('../../middleware/authMiddleware');

// Create a new support ticket
router.post('/', verifyToken, supportController.createTicket);

// Get all tickets for logged-in user
router.get('/my-tickets', verifyToken, supportController.getMyTickets);

// Get a ticket by ticket_id
// We might want to allow this without token if the user only has the ticket ID,
// but for security it's better to verifyToken. Let's make it public for now 
// to match the "enter ticket ID to check status" UI, which doesn't explicitly require login.
router.get('/:ticket_id', supportController.getTicketByCode);

module.exports = router;
