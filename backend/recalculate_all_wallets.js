const mongoose = require('mongoose');
require('dotenv').config();

const Shop = require('./src/models/Shop');
const Order = require('./src/models/Order');
const OrderStatusHistory = require('./src/models/OrderStatusHistory');
const WithdrawRequest = require('./src/models/WithdrawRequest');
const SellerWallet = require('./src/models/SellerWallet');

async function recalculateAllWallets() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const shops = await Shop.find();
        for (const shop of shops) {
            console.log(`Recalculating wallet for shop ${shop._id}...`);
            const orders = await Order.find({ shop_id: shop._id, status: 'completed' });
            const orderIds = orders.map(o => o._id);

            const histories = await OrderStatusHistory.find({
                order_id: { $in: orderIds },
                status: { $in: ['completed', 'delivered'] }
            });
            const historyMap = {};
            histories.forEach(h => {
                if (!historyMap[h.order_id] || h.createdAt > historyMap[h.order_id]) {
                    historyMap[h.order_id] = h.createdAt;
                }
            });

            let totalEarnings = 0;
            let pendingEarnings = 0;
            const escrowLimit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            for (const order of orders) {
                const platformFee = order.platform_fee_amount || 0;
                const gatewayFee = order.gateway_fee_amount || 0;
                const payout = order.subtotal_amount - platformFee - gatewayFee;

                totalEarnings += payout;

                const completedDate = historyMap[order._id] || order.updatedAt;
                if (completedDate > escrowLimit) {
                    pendingEarnings += payout;
                }
            }

            const withdrawals = await WithdrawRequest.find({ shop_id: shop._id });
            let totalWithdrawals = 0;
            for (const w of withdrawals) {
                if (w.status !== 'rejected') {
                    totalWithdrawals += w.amount;
                }
            }

            const totalBalance = totalEarnings - totalWithdrawals;
            const pendingBalance = pendingEarnings;
            const availableBalance = totalBalance - pendingBalance;

            let wallet = await SellerWallet.findOne({ shop_id: shop._id });
            if (!wallet) {
                wallet = new SellerWallet({
                    shop_id: shop._id,
                    total_balance: totalBalance,
                    pending_balance: pendingBalance,
                    available_balance: availableBalance
                });
            } else {
                wallet.total_balance = totalBalance;
                wallet.pending_balance = pendingBalance;
                wallet.available_balance = availableBalance;
            }

            await wallet.save();
            console.log(`Updated wallet for shop ${shop._id}. Total: ${totalBalance}, Pending: ${pendingBalance}, Available: ${availableBalance}`);
        }

        console.log('Recalculation completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Recalculation failed:', error);
        process.exit(1);
    }
}

recalculateAllWallets();
