const mongoose = require('mongoose');
require('dotenv').config();

const OrderStatusHistory = require('./src/models/OrderStatusHistory');
const Order = require('./src/models/Order');
const Shop = require('./src/models/Shop');

async function shiftDates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Target shop ID from previous testing: 6a2d77a56aec5ae100c8e62c
        const shopId = '6a2d77a56aec5ae100c8e62c';
        
        // Find 2 completed orders for this shop
        const orders = await Order.find({ shop_id: shopId, status: 'completed' }).limit(3);
        
        if (orders.length === 0) {
            console.log('No completed orders found for this shop.');
            process.exit(0);
        }

        const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

        for (const order of orders) {
            console.log(`Shifting date for order ${order.order_code}...`);
            // Find completion history
            await OrderStatusHistory.updateMany(
                { order_id: order._id, status: { $in: ['completed', 'delivered'] } },
                { $set: { createdAt: eightDaysAgo, updatedAt: eightDaysAgo } },
                { strict: false } // Force update timestamps
            );
        }

        console.log('Successfully shifted dates. Run recalculate_all_wallets.js to update wallet balances.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

shiftDates();
