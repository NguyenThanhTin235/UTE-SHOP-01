const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

async function testGet() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // get admin user token
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) return console.log('no admin');
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  try {
    const res = await axios.get(`http://localhost:5000/api/admin/promotions/campaigns?limit=100&status=all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Campaigns count:', res.data.data.length);
    if(res.data.data.length > 0) {
      console.log('First campaign status:', res.data.data[0].status);
      console.log('First campaign dates:', res.data.data[0].startAt, res.data.data[0].endAt);
    }
  } catch(e) {
    console.error('error:', e.response ? e.response.data : e.message);
  }
  
  process.exit(0);
}

testGet();
