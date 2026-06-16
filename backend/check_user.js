require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({}).sort({ updatedAt: -1 }).limit(5).lean();
  console.log(users.map(u => ({
    email: u.email,
    status: u.status,
    failed_attempts: u.failed_login_attempts,
    lockout_until: u.lockout_until
  })));
  process.exit(0);
}
check();
