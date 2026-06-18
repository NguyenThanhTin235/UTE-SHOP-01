require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const axios = require('axios');
const User = require('./src/models/User');
require('./src/config/db')();
const jwt = require('jsonwebtoken');

async function test() {
  try {
    const shipper = await User.findOne({ email: 'shipper1@uteshop.vn' });
    if (!shipper) { console.log('Shipper not found'); process.exit(0); }
    
    const token = jwt.sign({ id: shipper._id, userId: shipper._id, role: 'shipper' }, process.env.JWT_SECRET || 'secret');
    
    const res = await axios.get(`http://localhost:5000/api/shipper/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Success:", JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.error("Error:", e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message);
  }
  process.exit(0);
}
test();
