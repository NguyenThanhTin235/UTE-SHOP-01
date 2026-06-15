const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticket_id: { type: String, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Orders & Shipping', 'Returns & Refunds', 'Payments & Wallets', 'Account & Security', 'Other'],
    default: 'Other'
  },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'resolved', 'closed'], 
    default: 'pending' 
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
