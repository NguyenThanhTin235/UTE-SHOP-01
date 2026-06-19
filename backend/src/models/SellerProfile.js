const mongoose = require('mongoose');

const sellerProfileSchema = new mongoose.Schema({
     user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     gst_number: { type: String },
     bank_name: { type: String },
     bank_account_name: { type: String },
     bank_account_number: { type: String },
     pickup_address: { type: String },
     latitude: { type: Number },
     longitude: { type: Number },
     identity_card_url: { type: String },
     business_license_url: { type: String },
     status: { type: String, enum: ['pending', 'active', 'rejected', 'suspended'], default: 'pending' },
     rejection_reason: { type: String },
     history: [{
         action: { type: String },
         note: { type: String },
         date: { type: Date, default: Date.now }
     }],
     approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
     approved_at: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);
