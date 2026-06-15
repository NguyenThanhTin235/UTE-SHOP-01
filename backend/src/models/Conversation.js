const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
     type: { type: String, enum: ['shop', 'admin'], default: 'shop' },
     customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: false },
     order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
