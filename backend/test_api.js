const axios = require('axios');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/uteshop_db').then(async () => {
  const User = mongoose.connection.db.collection('users');
  const shipper = await User.findOne({ email: 'shipper1@gmail.com' }); // make sure this exists or find any shipper
  
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: shipper._id.toString(), role: shipper.role }, process.env.JWT_SECRET || 'secret');
  
  const Order = mongoose.connection.db.collection('orders');
  const order = await Order.findOne({ order_code: 'ORD-2026-0173' });
  
  try {
    const res = await axios.get(`http://localhost:5000/api/shipper/orders/${order._id.toString()}/detail`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(JSON.stringify(res.data.data.order, null, 2));
    console.log("SHIPPING ADDRESS:", JSON.stringify(res.data.data.shippingAddress, null, 2));
  } catch (err) {
    console.log(err.response ? err.response.data : err.message);
  }
  process.exit();
});
