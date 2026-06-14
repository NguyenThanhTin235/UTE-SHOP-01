require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const UserRole = require('../src/models/UserRole');

const addShipper = async () => {
  try {
    await connectDB();

    const shipperRoleName = 'SHIPPER';
    let shipperRole = await Role.findOne({ name: shipperRoleName });
    if (!shipperRole) {
      shipperRole = await Role.create({ name: shipperRoleName, description: 'Nhân viên giao hàng' });
      console.log('Created SHIPPER role.');
    }

    const email = 'shipper@gmail.com';
    let shipperUser = await User.findOne({ email });
    if (!shipperUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      shipperUser = await User.create({
        full_name: 'UTE Shipper',
        email,
        password: hashedPassword,
        status: 'active',
        phone: '0987654321'
      });
      console.log('Created shipper user.');
    } else {
      console.log('Shipper user already exists.');
    }

    let userRole = await UserRole.findOne({ user_id: shipperUser._id, role_id: shipperRole._id });
    if (!userRole) {
      await UserRole.create({ user_id: shipperUser._id, role_id: shipperRole._id });
      console.log('Assigned SHIPPER role to user.');
    } else {
      console.log('Shipper role already assigned to user.');
    }

    console.log('Shipper account successfully added/verified.');
    console.log(`Email: ${email}`);
    console.log(`Password: password123`);

    process.exit(0);
  } catch (error) {
    console.error('Error adding shipper:', error);
    process.exit(1);
  }
};

addShipper();
