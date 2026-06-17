const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  name_vn: { type: String },
  slug: { type: String, required: true, unique: true },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  description: { type: String },
  icon: { type: String, default: 'category' },
  sort_order: { type: Number, default: 0 },
  is_visible: { type: Boolean, default: true },
  enable_commission: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
