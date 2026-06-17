const SupportTicket = require('../../models/SupportTicket');
const { toCamelCase } = require('../../utils/formatter');

// Create a new support ticket
exports.createTicket = async (req, res, next) => {
  try {
    const { subject, description, category, priority } = req.body;
    
    // Auto-generate ticket ID, e.g., #TK-12345
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const ticketId = `#TK-${randomNum}`;

    const newTicket = new SupportTicket({
      ticket_id: ticketId,
      user_id: req.user.id,
      subject,
      description,
      category: category || 'Other',
      priority: priority || 'medium',
      status: 'pending'
    });

    await newTicket.save();

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Support ticket created successfully',
      data: toCamelCase(newTicket.toObject()),
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    next(error);
  }
};

// Get a ticket by ticket_id (for status check)
exports.getTicketByCode = async (req, res, next) => {
  try {
    const { ticket_id } = req.params;

    // Check by exact string or with/without #
    let searchId = ticket_id;
    if (!searchId.startsWith('#')) {
      searchId = `#${searchId}`;
    }

    const ticket = await SupportTicket.findOne({ ticket_id: searchId }).populate('user_id', 'full_name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Ticket not found. Please check your Ticket ID.',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      });
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Ticket found',
      data: toCamelCase(ticket.toObject()),
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    next(error);
  }
};

// Get all tickets for logged-in user
exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ user_id: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'User tickets fetched successfully',
      data: toCamelCase(tickets),
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    next(error);
  }
};
