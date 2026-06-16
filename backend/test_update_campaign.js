const mongoose = require('mongoose');
require('dotenv').config();
const Campaign = require('./src/models/Campaign');
const { determinePromotionStatus } = require('./src/controllers/admin/adminPromotionController');

async function testUpdate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');
  
  // Find an expired campaign (or create one)
  let campaign = await Campaign.findOne({ status: 'active' }); // Just grab any
  if (!campaign) return console.log('No campaign found');
  
  console.log('Original end_at:', campaign.end_at);
  
  // Extend date
  const newEndAt = new Date(Date.now() + 86400000); // +1 day
  campaign.end_at = newEndAt;
  
  // Simulate controller logic
  const determineStatus = (start_at, end_at, current_status) => {
    if (current_status === 'inactive') return 'inactive'; 
    const now = new Date();
    if (start_at && now < new Date(start_at)) return 'scheduled';
    if (end_at && now > new Date(end_at)) return 'expired';
    return 'active';
  };
  
  campaign.status = determineStatus(campaign.start_at, campaign.end_at, campaign.status);
  await campaign.save();
  
  console.log('Updated end_at:', campaign.end_at);
  console.log('Updated status:', campaign.status);
  
  process.exit(0);
}

testUpdate().catch(console.error);
