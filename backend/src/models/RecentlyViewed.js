const mongoose = require('mongoose');

const recentlyViewedSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }
}, { timestamps: true });

// Ensure uniqueness per user and product
recentlyViewedSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

module.exports = mongoose.model('RecentlyViewed', recentlyViewedSchema);
