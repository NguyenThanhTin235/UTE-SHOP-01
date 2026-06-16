const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./src/models/Order');

async function shiftDatesNative() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const shopId = '6a2d77a56aec5ae100c8e62c';
        const orders = await Order.find({ shop_id: shopId, status: 'completed' }).limit(3);
        
        const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

        const db = mongoose.connection.db;
        const historiesCollection = db.collection('orderstatushistories');

        for (const order of orders) {
            console.log(`Shifting date for order ${order.order_code}...`);
            await historiesCollection.updateMany(
                { order_id: order._id, status: { $in: ['completed', 'delivered'] } },
                { $set: { createdAt: eightDaysAgo, updatedAt: eightDaysAgo } }
            );
        }

        console.log('Successfully shifted dates natively.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

shiftDatesNative();
