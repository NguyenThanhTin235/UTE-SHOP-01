const mongoose = require('mongoose');

const shipperProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  cccd_number: { type: String },
  cccd_front_url: { type: String },
  cccd_back_url: { type: String },
  vehicle_type: { type: String, enum: ['motorbike', 'bicycle', 'car', 'van'], default: 'motorbike' },
  vehicle_plate: { type: String },
  shipping_company: { type: String },
  operating_area: { type: String },
  emergency_contact: { type: String },
  emergency_contact_name: { type: String },
  bank_name: { type: String },
  bank_account_name: { type: String },
  bank_account_number: { type: String },
  status: { type: String, enum: ['pending', 'active', 'suspended', 'rejected'], default: 'pending' },
  rejection_reason: { type: String },
  history: [{
      action: { type: String },
      note: { type: String },
      date: { type: Date, default: Date.now }
  }],
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at: { type: Date },
  joined_date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ShipperProfile', shipperProfileSchema);
