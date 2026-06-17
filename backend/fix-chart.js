require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const Order = require('./src/models/Order');
const OrderStatusHistory = require('./src/models/OrderStatusHistory');

const fixChartData = async () => {
  try {
    await connectDB();
    console.log('Connected to DB');

    // Delete existing OrderStatusHistory that we are going to recreate to avoid duplicates if run multiple times
    // Actually, let's just delete all and recreate for all completed/failed orders
    await OrderStatusHistory.deleteMany({ note: 'Bulk seeded history' });

    const orders = await Order.find({ status: { $in: ['completed', 'failed'] } });
    console.log(`Found ${orders.length} completed/failed orders`);

    const histories = [];
    
    // Create random dates in the last 7 days
    for (const order of orders) {
      if (!order.shipper_id) continue;

      // Random days ago between 0 and 6
      const randomDaysAgo = Math.floor(Math.random() * 7);
      const date = new Date();
      date.setDate(date.getDate() - randomDaysAgo);
      date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

      histories.push({
        order_id: order._id,
        status: order.status,
        note: 'Bulk seeded history',
        updated_by: order.shipper_id,
        createdAt: date,
        updatedAt: date
      });
    }

    if (histories.length > 0) {
      await OrderStatusHistory.insertMany(histories);
      console.log(`✅ Created ${histories.length} OrderStatusHistory records spanning the last 7 days`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixChartData();
