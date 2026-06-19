const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slug: { type: String, required: true, unique: true },
  address: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  phone: { type: String },
  logo_url: { type: String },
  banner_url: { type: String },
  status: { type: String, enum: ['pending', 'active', 'inactive', 'suspended', 'rejected'], default: 'pending' },
  rejection_reason: { type: String },
  description: { type: String },
  followers: { type: Number, default: 0 },
  response_rate: { type: Number, default: 0 }, // Percentage
  joined_at: { type: Date, default: Date.now },
  response_time: { type: String, default: 'within hours' },
  product_count: { type: Number, default: 0 },
  email: { type: String },
  shipping_carriers: {
    ghtk: { type: Boolean, default: true },
    grab: { type: Boolean, default: false },
    jt: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
