const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema({
  // Platform Identity
  store_name: { 
    type: String, 
    default: 'UTEShop',
    trim: true
  },
  logo_url: { 
    type: String, 
    default: '' 
  },
  favicon_url: { 
    type: String, 
    default: '' 
  },

  // Contact Info
  contact_email: { 
    type: String, 
    default: 'support@uteshop.com',
    trim: true
  },
  contact_phone: { 
    type: String, 
    default: '1900 1234',
    trim: true
  },
  contact_address: { 
    type: String, 
    default: 'Ho Chi Minh City, Vietnam',
    trim: true
  },

  // Maintenance Mode
  is_maintenance_mode: { 
    type: Boolean, 
    default: false 
  },
  maintenance_message: { 
    type: String, 
    default: 'We are currently under maintenance. Please check back later.',
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PlatformSetting', platformSettingSchema);
