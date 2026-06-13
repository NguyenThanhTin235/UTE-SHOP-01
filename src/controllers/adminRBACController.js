const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');
const UserRole = require('../models/UserRole');
const response = require('../utils/response');

exports.getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().lean();
    
    // Get user counts for each role
    const roleStats = [];
    for (const role of roles) {
      const userCount = await UserRole.countDocuments({ role_id: role._id });
      roleStats.push({
        _id: role._id,
        name: role.name,
        description: role.description,
        userCount,
        status: ['ADMIN', 'MANAGER'].includes(role.name.toUpperCase()) ? 'system' : 'active'
      });
    }

    return response.success(res, {
      data: roleStats,
      message: 'Roles fetched successfully'
    });
  } catch (error) {
    console.error('Error in getRoles:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to fetch roles'
    });
  }
};

exports.getPermissions = async (req, res, next) => {
  try {
    // 1. Fetch all roles
    const roles = await Role.find().sort({ createdAt: 1 }).lean();
    
    // 2. Fetch all permissions, grouped by module
    // The UI specifically wants: Users, Shops, Products, Orders, Wallet, Reports, Settings
    // But we'll just fetch what we have and let the UI map it.
    const permissions = await Permission.find().lean();
    
    // 3. Fetch current mapping
    const rolePermissions = await RolePermission.find().lean();
    
    // We can format it so frontend easily consumes it
    const matrix = roles.map(role => {
      const rolePerms = rolePermissions.filter(rp => rp.role_id.toString() === role._id.toString());
      const assignedPermIds = rolePerms.map(rp => rp.permission_id.toString());
      
      const permissionsMap = {};
      permissions.forEach(p => {
        permissionsMap[p._id.toString()] = assignedPermIds.includes(p._id.toString());
      });

      return {
        role_id: role._id,
        role_name: role.name,
        permissions: permissionsMap
      };
    });

    return response.success(res, {
      data: {
        roles,
        permissions,
        matrix
      },
      message: 'Permission matrix fetched successfully'
    });
  } catch (error) {
    console.error('Error in getPermissions:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to fetch permissions'
    });
  }
};

exports.updatePermissions = async (req, res, next) => {
  try {
    const { updates } = req.body;
    // updates should be an array of: { role_id, permission_id, checked }

    if (!Array.isArray(updates)) {
      return response.error(res, {
        statusCode: 400,
        message: 'Invalid updates format'
      });
    }

    for (const update of updates) {
      const { role_id, permission_id, checked } = update;
      if (!role_id || !permission_id) continue;

      if (checked) {
        await RolePermission.updateOne(
          { role_id, permission_id },
          { role_id, permission_id },
          { upsert: true }
        );
      } else {
        await RolePermission.deleteOne({ role_id, permission_id });
      }
    }

    return response.success(res, {
      message: 'Permission matrix updated successfully'
    });
  } catch (error) {
    console.error('Error in updatePermissions:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to update permissions'
    });
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return response.error(res, { statusCode: 404, message: 'Role not found' });
    }

    if (name) role.name = name;
    if (description !== undefined) role.description = description;

    await role.save();

    return response.success(res, {
      data: role,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error in updateRole:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to update role'
    });
  }
};

exports.createRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return response.error(res, { statusCode: 400, message: 'Role name is required' });
    }

    const existingRole = await Role.findOne({ name: name.toUpperCase() });
    if (existingRole) {
      return response.error(res, { statusCode: 400, message: 'Role already exists' });
    }

    const role = await Role.create({
      name: name.toUpperCase(),
      description: description || ''
    });

    return response.success(res, {
      data: role,
      message: 'Role created successfully',
      statusCode: 201
    });
  } catch (error) {
    console.error('Error in createRole:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to create role'
    });
  }
};

exports.deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    if (!role) {
      return response.error(res, { statusCode: 404, message: 'Role not found' });
    }

    const systemRoles = ['ADMIN', 'MANAGER', 'SELLER', 'CUSTOMER'];
    if (systemRoles.includes(role.name.toUpperCase()) || role.status === 'system') {
      return response.error(res, { statusCode: 403, message: 'Cannot delete system roles' });
    }

    // Delete associated permissions
    const RolePermission = require('../models/RolePermission');
    await RolePermission.deleteMany({ role_id: role._id });

    // Delete role
    await role.deleteOne();

    return response.success(res, {
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteRole:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to delete role'
    });
  }
};
