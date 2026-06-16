const determinePromotionStatus = (start_at, end_at, current_status) => {
  if (current_status === 'inactive') return 'inactive'; // Bị tắt thủ công
  const now = new Date();
  if (start_at && now < new Date(start_at)) return 'scheduled';
  if (end_at && now > new Date(end_at)) return 'expired';
  return 'active';
};

const start_at = new Date(Date.now() - 100000);
const end_at = new Date(Date.now() + 100000);

console.log(determinePromotionStatus(start_at, end_at, 'expired'));
