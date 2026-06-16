const SupportTicket = require('../../models/SupportTicket');

// Get all support tickets with pagination and filtering
exports.getTickets = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    let query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { ticket_id: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await SupportTicket.find(query)
      .populate('user_id', 'full_name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      data: tickets,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error in getTickets:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tickets' });
  }
};

// Update ticket status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.status = status;
    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Error in updateTicketStatus:', error);
    res.status(500).json({ success: false, message: 'Server error updating ticket' });
  }
};

// Delete ticket
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    await SupportTicket.findByIdAndDelete(id);
    res.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error in deleteTicket:', error);
    res.status(500).json({ success: false, message: 'Server error deleting ticket' });
  }
};
