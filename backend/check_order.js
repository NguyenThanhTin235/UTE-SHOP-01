const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/uteshop_db').then(async () => {
  const Order = mongoose.connection.db.collection('orders');
  const Address = mongoose.connection.db.collection('addresses');
  
  const order = await Order.findOne({ order_code: 'ORD-2026-0173' });
  
  if (order && order.shipping_address_id) {
    // Da Nang coordinates
    await Address.updateOne(
      { _id: order.shipping_address_id },
      { $set: { latitude: 16.0544, longitude: 108.2022 } }
    );
    console.log("Address updated with coordinates.");
  }
  process.exit();
});
