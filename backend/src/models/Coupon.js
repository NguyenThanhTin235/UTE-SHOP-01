const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['percent', 'fixed_amount', 'free_shipping', 'fixed_shipping'], required: true },
  value: { type: Number, default: 0 },
  max_discount: { type: Number },
  min_order_total: { type: Number },
  start_at: { type: Date },
  end_at: { type: Date },
  usage_limit: { type: Number, default: 1 },
  used_count: { type: Number, default: 0 },
  status: { type: String, enum: ['scheduled', 'active', 'inactive', 'expired'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
