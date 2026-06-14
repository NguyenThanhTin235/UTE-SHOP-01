require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const OrderStatusHistory = require('../src/models/OrderStatusHistory');

const seedStats = async () => {
  try {
    await connectDB();
    const email = 'shipper@gmail.com';
    const shipperUser = await User.findOne({ email });
    if (!shipperUser) {
      console.log('Shipper not found. Run add_shipper.js first.');
      process.exit(1);
    }

    // Clean up old seed data first
    await OrderStatusHistory.deleteMany({ note: 'Seed data', updated_by: shipperUser._id });

    // Generate random stats for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const numDelivered = Math.floor(Math.random() * 8) + 3; // 3 to 10
      const numFailed = Math.floor(Math.random() * 3); // 0 to 2

      for (let j = 0; j < numDelivered; j++) {
        await OrderStatusHistory.create({
          order_id: new mongoose.Types.ObjectId(), // Fake order ID
          status: 'delivered',
          note: 'Seed data',
          updated_by: shipperUser._id,
          createdAt: date,
          updatedAt: date
        });
      }

      for (let k = 0; k < numFailed; k++) {
        await OrderStatusHistory.create({
          order_id: new mongoose.Types.ObjectId(),
          status: 'failed',
          note: 'Seed data',
          updated_by: shipperUser._id,
          createdAt: date,
          updatedAt: date
        });
      }
    }

    console.log('Seeded shipper statistics successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding stats:', error);
    process.exit(1);
  }
};

seedStats();
