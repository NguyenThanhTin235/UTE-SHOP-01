const mongoose = require('mongoose');

const sellerBankAccountSchema = new mongoose.Schema({
    shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    bank_name: { type: String, required: true },
    account_name: { type: String, required: true },
    account_number: { type: String, required: true },
    is_default: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('SellerBankAccount', sellerBankAccountSchema);
