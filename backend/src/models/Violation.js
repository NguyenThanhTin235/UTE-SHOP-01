const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  evidence_urls: [{ type: String }],
  severity: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  reportedByCount: { type: Number, default: 1 },
  reporterInfo: { type: String },
  type: { type: String, enum: ['shop_report', 'chat_abusive', 'product_flag', 'general'], default: 'general' },
  actionTaken: { type: String, enum: ['none', 'locked_shop', 'hidden_products', 'warning_issued', 'chat_suspended', 'dismissed'], default: 'none' }
}, { timestamps: true });

module.exports = mongoose.model('Violation', violationSchema);
