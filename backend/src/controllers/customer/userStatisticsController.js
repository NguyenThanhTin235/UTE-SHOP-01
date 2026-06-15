const Order = require('../../models/Order');
const OrderItem = require('../../models/OrderItem');
const User = require('../../models/User');

class UserStatisticsController {
  async getStatistics(req, res, next) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      let query = { customer_id: userId };
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      // 1. Fetch all orders for the user as a CUSTOMER
      const orders = await Order.find(query).populate('shop_id', 'name');

      // 2. Calculate Total Spent (only delivered orders)
      const deliveredOrders = orders.filter(o => o.status === 'delivered');
      const totalSpent = deliveredOrders.reduce((sum, order) => sum + (order.total_final || 0), 0);

      // 3. Calculate Pending Payments (shipped, confirmed, pending)
      const pendingStatuses = ['pending', 'confirmed', 'shipped'];
      const pendingOrders = orders.filter(o => pendingStatuses.includes(o.status));
      const pendingPayments = pendingOrders.reduce((sum, order) => sum + (order.total_final || 0), 0);

      // 4. Get Coin Balance from User model
      const user = await User.findById(userId);
      const coinBalance = user ? (user.coin_balance || 0) : 0;

      // 5. Total Orders
      const totalOrdersCount = orders.length;

      // 6. Top 10 Purchased Products
      const orderIds = orders.map(o => o._id);
      const topProductsPipeline = [
        { $match: { order_id: { $in: orderIds } } },
        {
          $group: {
            _id: '$product_id',
            totalBought: { $sum: '$quantity' },
            spent: { $sum: { $multiply: ['$quantity', '$price_at_buy'] } }
          }
        },
        { $sort: { totalBought: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $unwind: '$productDetails' },
        {
          $project: {
            _id: 1,
            name: '$productDetails.name',
            slug: '$productDetails.slug',
            totalBought: 1,
            spent: 1
          }
        }
      ];
      
      const topProducts = await OrderItem.aggregate(topProductsPipeline);

      // Fetch images for top products
      const ProductMedia = require('../../models/ProductMedia');
      const topProductsWithMedia = await Promise.all(topProducts.map(async (p) => {
          const media = await ProductMedia.findOne({ product_id: p._id }).sort({ sort_order: 1 });
          return {
              ...p,
              media_url: media ? media.media_url : 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=400'
          };
      }));

      // 7. Expenditure Chart Data (Group by Day for the last 30 days)
      const chartDataMap = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        chartDataMap[dateStr] = 0;
      }

      deliveredOrders.forEach(o => {
        const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
        if (chartDataMap[dateStr] !== undefined) {
          chartDataMap[dateStr] += (o.total_final || 0);
        }
      });

      const expenditureChartData = Object.keys(chartDataMap).map(date => ({
        date,
        revenue: chartDataMap[date] // Kept name 'revenue' to avoid modifying frontend too much, but conceptually it's 'expenditure'
      }));

      // 8. Recent Orders list
      const recentOrdersList = orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(o => ({
          _id: o._id,
          order_code: o.order_code,
          status: o.status,
          total_final: o.total_final,
          shop_name: o.shop_id ? o.shop_id.name : 'Unknown Shop',
          createdAt: o.createdAt
        }));

      return res.status(200).json({
        success: true,
        hasShop: true, // Always true now so frontend doesn't block
        data: {
          overview: {
            totalSpent,
            pendingPayments,
            coinBalance,
            totalOrdersCount
          },
          revenueChartData: expenditureChartData,
          topProducts: topProductsWithMedia,
          recentOrders: recentOrdersList
        }
      });

    } catch (error) {
      console.error('Get User Statistics Error:', error);
      next(error);
    }
  }
}

module.exports = new UserStatisticsController();
