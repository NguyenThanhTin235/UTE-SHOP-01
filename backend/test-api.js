require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Order = require('./src/models/Order');
require('./src/config/db')();
const jwt = require('jsonwebtoken');

async function test() {
  try {
    const order = await Order.findOne({ shipper_id: { $ne: null } });
    if (!order) { console.log('No order assigned'); process.exit(0); }
    
    const shipper = await User.findById(order.shipper_id);
    const token = jwt.sign({ id: shipper._id, userId: shipper._id, role: shipper.role }, process.env.JWT_SECRET || 'secret');
    
    const res = await axios.get(`http://localhost:5000/api/shipper/orders/${order._id}/detail`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
  process.exit(0);
}
test();
