const mongoose = require('mongoose');

const shippingPartnerSchema = new mongoose.Schema({
     name: { type: String, required: true },
     code: { type: String, required: true, unique: true },
     avatar_url: { type: String },
     shipping_fee: { type: Number, default: 0 },
     is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ShippingPartner', shippingPartnerSchema);
