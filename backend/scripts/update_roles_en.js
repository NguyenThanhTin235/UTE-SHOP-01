require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Role = require('../src/models/Role');
const connectDB = require('../src/config/db');

const updateRoles = async () => {
  try {
    await connectDB();
    
    console.log('Updating role descriptions to English...');

    await Role.updateOne({ name: 'ADMIN' }, { description: 'Platform Admin / Root access to all system configurations and security.' });
    await Role.updateOne({ name: 'MANAGER' }, { description: 'Operational management, moderation, and support oversight.' });
    await Role.updateOne({ name: 'SELLER' }, { description: 'Merchant access to store management, products, and wallet.' });
    await Role.updateOne({ name: 'CUSTOMER' }, { description: 'Standard consumer access to browse, buy, and review.' });

    console.log('Role descriptions updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating roles:', error);
    process.exit(1);
  }
};

updateRoles();
