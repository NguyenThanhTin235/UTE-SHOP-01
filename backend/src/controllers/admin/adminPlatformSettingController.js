const PlatformSetting = require('../../models/PlatformSetting');
const { toCamelCase } = require('../../utils/formatter');

// Fetch the single Platform Settings document
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSetting.findOne();
    
    // If no settings document exists, create a default one
    if (!settings) {
      settings = await PlatformSetting.create({});
    }

    res.status(200).json({
      success: true,
      code: 200,
      data: toCamelCase(settings)
    });
  } catch (error) {
    next(error);
  }
};

// Update Platform Settings
exports.updateSettings = async (req, res, next) => {
  try {
    const {
      store_name,
      logo_url,
      favicon_url,
      contact_email,
      contact_phone,
      contact_address,
      is_maintenance_mode,
      maintenance_message
    } = req.body;

    let settings = await PlatformSetting.findOne();

    if (!settings) {
      settings = new PlatformSetting();
    }

    // Update fields if provided
    if (store_name !== undefined) settings.store_name = store_name;
    if (logo_url !== undefined) settings.logo_url = logo_url;
    if (favicon_url !== undefined) settings.favicon_url = favicon_url;
    if (contact_email !== undefined) settings.contact_email = contact_email;
    if (contact_phone !== undefined) settings.contact_phone = contact_phone;
    if (contact_address !== undefined) settings.contact_address = contact_address;
    if (is_maintenance_mode !== undefined) settings.is_maintenance_mode = is_maintenance_mode;
    if (maintenance_message !== undefined) settings.maintenance_message = maintenance_message;

    await settings.save();

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Platform settings updated successfully',
      data: toCamelCase(settings)
    });
  } catch (error) {
    next(error);
  }
};

// Upload an image (Logo or Favicon)
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, code: 400, message: 'No image provided' });
    }

    // req.file.path contains the Cloudinary URL since we use Cloudinary storage engine
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Image uploaded successfully',
      data: {
        url: req.file.path
      }
    });
  } catch (error) {
    next(error);
  }
};
