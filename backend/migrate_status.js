const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./src/models/Order');
const OrderStatusHistory = require('./src/models/OrderStatusHistory');
// Assuming models are properly defined, we'll just connect and run updateMany.

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update Orders collection
        const resOrdersShipped = await Order.updateMany(
            { status: 'shipped' },
            { $set: { status: 'shipping' } }
        );
        console.log(`Updated ${resOrdersShipped.modifiedCount} orders from shipped to shipping`);

        const resOrdersDelivered = await Order.updateMany(
            { status: 'delivered' },
            { $set: { status: 'completed' } }
        );
        console.log(`Updated ${resOrdersDelivered.modifiedCount} orders from delivered to completed`);

        // Update OrderStatusHistory collection
        const resHistoryShipped = await OrderStatusHistory.updateMany(
            { status: 'shipped' },
            { $set: { status: 'shipping' } }
        );
        console.log(`Updated ${resHistoryShipped.modifiedCount} history records from shipped to shipping`);

        const resHistoryDelivered = await OrderStatusHistory.updateMany(
            { status: 'delivered' },
            { $set: { status: 'completed' } }
        );
        console.log(`Updated ${resHistoryDelivered.modifiedCount} history records from delivered to completed`);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
