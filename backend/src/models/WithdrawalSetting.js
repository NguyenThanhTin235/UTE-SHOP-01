const mongoose = require('mongoose');

const withdrawalSettingSchema = new mongoose.Schema({
  min_withdrawal: { type: Number, required: true, default: 100000 },
  max_daily_withdrawal: { type: Number, required: true, default: 50000000 },
  payout_processing_time: { type: String, required: true, default: 'T+1' },
  effective_from: { type: Date, required: true, default: Date.now },
  effective_to: { type: Date },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('WithdrawalSetting', withdrawalSettingSchema);
