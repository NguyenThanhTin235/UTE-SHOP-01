const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slug: { type: String, required: true, unique: true },
  address: { type: String },
  phone: { type: String },
  logo_url: { type: String },
  banner_url: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
