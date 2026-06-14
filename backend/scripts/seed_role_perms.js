require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Role = require('../src/models/Role');
const Permission = require('../src/models/Permission');
const RolePermission = require('../src/models/RolePermission');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uteshop_db')
  .then(async () => {
    const roles = await Role.find().lean();
    const perms = await Permission.find().lean();
    
    const getRoleId = name => roles.find(r => r.name === name)?._id;
    const getPermIds = mod => perms.filter(p => p.module === mod).map(p => p._id);
    
    const managerId = getRoleId('MANAGER');
    const sellerId = getRoleId('SELLER');
    const customerId = getRoleId('CUSTOMER');
    
    if (!managerId || !sellerId || !customerId) {
        console.error("Missing roles");
        process.exit(1);
    }
    
    await RolePermission.deleteMany({ role_id: { $in: [managerId, sellerId, customerId] } });
    
    const toInsert = [];
    const addPerms = (roleId, mods) => {
      mods.forEach(mod => {
        const pIds = getPermIds(mod);
        pIds.forEach(pId => toInsert.push({ role_id: roleId, permission_id: pId }));
      });
    };
    
    addPerms(managerId, ['Product', 'Order', 'Finance', 'Report']);
    addPerms(sellerId, ['Shop', 'Product', 'Order', 'Finance']);
    addPerms(customerId, ['Order']);
    
    if (toInsert.length > 0) {
      await RolePermission.insertMany(toInsert);
    }
    console.log('Data seeded successfully');
    process.exit(0);
  })
  .catch(console.error);
