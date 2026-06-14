const mongoose = require('mongoose');

const themeSettingSchema = new mongoose.Schema({
  primary_color: { type: String, default: '#004ac6' },
  font_family: { type: String, default: 'Manrope (Standard)' },
  border_radius: { type: String, enum: ['sharp', 'rounded', 'pill'], default: 'rounded' },
  dark_mode_support: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ThemeSetting', themeSettingSchema);
