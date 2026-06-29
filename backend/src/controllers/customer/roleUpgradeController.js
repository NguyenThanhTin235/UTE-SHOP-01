const SellerProfile = require('../../models/SellerProfile');
const ShipperProfile = require('../../models/ShipperProfile');

exports.registerSeller = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            gst_number,
            bank_name,
            bank_account_name,
            bank_account_number,
            pickup_address
        } = req.body;

        let identity_card_url = null;
        let business_license_url = null;

        if (req.files && req.files['identity_card']) {
            identity_card_url = req.files['identity_card'][0].path;
        }
        if (req.files && req.files['business_license']) {
            business_license_url = req.files['business_license'][0].path;
        }

        let profile = await SellerProfile.findOne({ user_id: userId });

        // Check if Shipper is already active
        const shipperProfile = await ShipperProfile.findOne({ user_id: userId });
        if (shipperProfile && shipperProfile.status === 'active') {
            return res.status(400).json({ success: false, message: 'You are already a Shipper. You cannot register as a Seller.' });
        }

        if (profile) {
            if (profile.status === 'pending') {
                return res.status(400).json({ success: false, message: 'Your request is pending approval.' });
            }
            if (profile.status === 'active') {
                return res.status(400).json({ success: false, message: 'You are already a Seller.' });
            }
            if (profile.status === 'suspended') {
                return res.status(400).json({ success: false, message: 'Your Seller account is suspended.' });
            }
            
            // Nếu rejected, cập nhật lại và đổi status thành pending
            profile.gst_number = gst_number || profile.gst_number;
            profile.bank_name = bank_name || profile.bank_name;
            profile.bank_account_name = bank_account_name || profile.bank_account_name;
            profile.bank_account_number = bank_account_number || profile.bank_account_number;
            profile.pickup_address = pickup_address || profile.pickup_address;
            if (identity_card_url) profile.identity_card_url = identity_card_url;
            if (business_license_url) profile.business_license_url = business_license_url;
            
            profile.status = 'pending';
            profile.rejection_reason = undefined;
            
            if (!profile.history) profile.history = [];
            profile.history.push({
                action: 'resubmitted',
                note: 'Request Resubmitted & Pending Approval',
                date: new Date()
            });
            
            await profile.save();
            return res.status(200).json({ success: true, message: 'Successfully updated Seller registration request.', data: profile });
        }

        if (!identity_card_url || !business_license_url) {
            return res.status(400).json({ success: false, message: 'Please provide Identity Card and Business License.' });
        }

        profile = new SellerProfile({
            user_id: userId,
            gst_number,
            bank_name,
            bank_account_name,
            bank_account_number,
            pickup_address,
            identity_card_url,
            business_license_url,
            status: 'pending',
            history: [{
                action: 'created',
                note: 'Request Created',
                date: new Date()
            }]
        });

        await profile.save();

        res.status(201).json({ success: true, message: 'Successfully submitted Seller registration request.', data: profile });
    } catch (error) {
        console.error('Error in registerSeller:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.registerShipper = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            cccd_number,
            vehicle_type,
            vehicle_plate,
            shipping_company,
            operating_area,
            emergency_contact,
            emergency_contact_name,
            bank_name,
            bank_account_name,
            bank_account_number
        } = req.body;

        let cccd_front_url = null;
        let cccd_back_url = null;

        if (req.files && req.files['cccd_front']) {
            cccd_front_url = req.files['cccd_front'][0].path;
        }
        if (req.files && req.files['cccd_back']) {
            cccd_back_url = req.files['cccd_back'][0].path;
        }

        let profile = await ShipperProfile.findOne({ user_id: userId });

        // Check if Seller is already active
        const sellerProfile = await SellerProfile.findOne({ user_id: userId });
        if (sellerProfile && sellerProfile.status === 'active') {
            return res.status(400).json({ success: false, message: 'You are already a Seller. You cannot register as a Shipper.' });
        }

        if (profile) {
            if (profile.status === 'pending') {
                return res.status(400).json({ success: false, message: 'Your request is pending approval.' });
            }
            if (profile.status === 'active') {
                return res.status(400).json({ success: false, message: 'You are already a Shipper.' });
            }
            if (profile.status === 'suspended') {
                return res.status(400).json({ success: false, message: 'Your Shipper account is suspended.' });
            }
            
            profile.cccd_number = cccd_number || profile.cccd_number;
            profile.vehicle_type = vehicle_type || profile.vehicle_type;
            profile.vehicle_plate = vehicle_plate || profile.vehicle_plate;
            profile.shipping_company = shipping_company || profile.shipping_company;
            profile.operating_area = operating_area || profile.operating_area;
            profile.emergency_contact = emergency_contact || profile.emergency_contact;
            profile.emergency_contact_name = emergency_contact_name || profile.emergency_contact_name;
            profile.bank_name = bank_name || profile.bank_name;
            profile.bank_account_name = bank_account_name || profile.bank_account_name;
            profile.bank_account_number = bank_account_number || profile.bank_account_number;
            if (cccd_front_url) profile.cccd_front_url = cccd_front_url;
            if (cccd_back_url) profile.cccd_back_url = cccd_back_url;
            
            profile.status = 'pending';
            profile.rejection_reason = undefined;

            if (!profile.history) profile.history = [];
            profile.history.push({
                action: 'resubmitted',
                note: 'Request Resubmitted & Pending Approval',
                date: new Date()
            });
            
            await profile.save();
            return res.status(200).json({ success: true, message: 'Successfully updated Shipper registration request.', data: profile });
        }

        if (!cccd_front_url || !cccd_back_url) {
            return res.status(400).json({ success: false, message: 'Please provide front and back images of your Identity Card.' });
        }

        profile = new ShipperProfile({
            user_id: userId,
            cccd_number,
            vehicle_type,
            vehicle_plate,
            shipping_company,
            operating_area,
            emergency_contact,
            emergency_contact_name,
            bank_name,
            bank_account_name,
            bank_account_number,
            cccd_front_url,
            cccd_back_url,
            status: 'pending',
            history: [{
                action: 'created',
                note: 'Request Created',
                date: new Date()
            }]
        });

        await profile.save();

        res.status(201).json({ success: true, message: 'Successfully submitted Shipper registration request.', data: profile });
    } catch (error) {
        console.error('Error in registerShipper:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.getUpgradeStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const sellerProfile = await SellerProfile.findOne({ user_id: userId });
        const shipperProfile = await ShipperProfile.findOne({ user_id: userId });

        res.status(200).json({
            success: true,
            data: {
                seller: sellerProfile || null,
                shipper: shipperProfile || null
            }
        });
    } catch (error) {
        console.error('Error in getUpgradeStatus:', error);
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};
