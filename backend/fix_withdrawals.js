const mongoose = require('mongoose');
require('dotenv').config();
const WithdrawRequest = require('./src/models/WithdrawRequest');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    await WithdrawRequest.deleteMany({ _id: { $in: ['6a2d77e17772aeb459a4cccb', '6a2ed04ac773e624a25b912f'] } });
    console.log('Deleted bad withdrawals');
    process.exit(0);
});
