const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const Campaign = require('./src/models/Campaign');
const User = require('./src/models/User');

async function testApi() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // get admin user token
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) return console.log('no admin');
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  // get a campaign
  const campaign = await Campaign.findOne();
  if (!campaign) return console.log('no campaign');
  
  console.log('original:', campaign.end_at);
  
  const payload = {
    name: campaign.name,
    start_at: campaign.start_at.toISOString(),
    end_at: new Date(Date.now() + 86400000).toISOString(),
    status: 'expired',
    type: 'discount',
    value: 10
  };
  
  try {
    const res = await axios.put(`http://localhost:5000/api/admin/promotions/campaigns/${campaign._id}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('response success:', res.data.success);
    
    const updated = await Campaign.findById(campaign._id);
    console.log('updated end_at:', updated.end_at);
    console.log('updated status:', updated.status);
    
  } catch(e) {
    console.error('error:', e.response ? e.response.data : e.message);
  }
  
  process.exit(0);
}

testApi();
