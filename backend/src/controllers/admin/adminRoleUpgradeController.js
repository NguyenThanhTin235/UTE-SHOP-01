const SellerProfile = require('../../models/SellerProfile');
const ShipperProfile = require('../../models/ShipperProfile');
const UserRole = require('../../models/UserRole');
const Role = require('../../models/Role');
const User = require('../../models/User');

exports.getPendingRequests = async (req, res) => {
    try {
        const sellerRequests = await SellerProfile.find()
            .populate('user_id', 'full_name email phone avatar_url')
            .sort({ createdAt: -1 });
            
        const shipperRequests = await ShipperProfile.find()
            .populate('user_id', 'full_name email phone avatar_url')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                sellers: sellerRequests,
                shippers: shipperRequests
            }
        });
    } catch (error) {
        console.error('Error in getPendingRequests:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.approveRequest = async (req, res) => {
    try {
        const { type, id } = req.params;
        const adminId = req.user.userId;

        let profile;
        let roleName;

        if (type === 'seller') {
            profile = await SellerProfile.findById(id);
            roleName = 'SELLER';
        } else if (type === 'shipper') {
            profile = await ShipperProfile.findById(id);
            roleName = 'SHIPPER';
        } else {
            return res.status(400).json({ success: false, message: 'Invalid request type.' });
        }

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Request not found.' });
        }

        if (profile.status === 'active') {
            return res.status(400).json({ success: false, message: 'This request has already been approved.' });
        }

        profile.status = 'active';
        profile.approved_by = adminId;
        profile.approved_at = new Date();
        
        if (!profile.history) profile.history = [];
        profile.history.push({
            action: 'approved',
            note: 'Request Approved',
            date: new Date()
        });

        await profile.save();

        // Add Role to UserRole
        const role = await Role.findOne({ name: roleName });
        if (role) {
            // Check if user already has this role
            const existingUserRole = await UserRole.findOne({ user_id: profile.user_id, role_id: role._id });
            if (!existingUserRole) {
                await UserRole.create({ user_id: profile.user_id, role_id: role._id });
            }
        }

        res.status(200).json({ success: true, message: `Successfully approved ${type} request.`, data: profile });
    } catch (error) {
        console.error('Error in approveRequest:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.rejectRequest = async (req, res) => {
    try {
        const { type, id } = req.params;
        const { rejection_reason } = req.body;

        if (!rejection_reason) {
            return res.status(400).json({ success: false, message: 'Please provide a rejection reason.' });
        }

        let profile;

        if (type === 'seller') {
            profile = await SellerProfile.findById(id);
        } else if (type === 'shipper') {
            profile = await ShipperProfile.findById(id);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid request type.' });
        }

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Request not found.' });
        }

        if (profile.status === 'active') {
            return res.status(400).json({ success: false, message: 'This request has already been approved and cannot be rejected.' });
        }

        profile.status = 'rejected';
        profile.rejection_reason = rejection_reason;
        
        if (!profile.history) {
            profile.history = [];
        }
        profile.history.push({
            action: 'rejected',
            note: `Request Rejected. Reason: ${rejection_reason}`,
            date: new Date()
        });

        await profile.save();

        res.status(200).json({ success: true, message: `Successfully rejected ${type} request.`, data: profile });
    } catch (error) {
        console.error('Error in rejectRequest:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
