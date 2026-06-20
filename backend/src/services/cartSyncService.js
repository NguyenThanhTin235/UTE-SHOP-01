const cron = require('node-cron');
const redis = require('../config/redis');
const CartItem = require('../models/CartItem');

/**
 * Service to synchronize Cart data from Redis back to MongoDB.
 * It scans all keys matching `cart:*:items` and updates the CartItem documents.
 */
class CartSyncService {
  constructor() {
    this.isSyncing = false;
  }

  start() {
    // Chạy mỗi 5 phút
    cron.schedule('*/5 * * * *', async () => {
      await this.syncRedisToMongo();
    });
    console.log('🔄 CartSyncService initialized. Cronjob scheduled every 5 minutes.');
  }

  async syncRedisToMongo() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    
    try {
      // console.log('[CartSync] Bắt đầu đồng bộ Redis -> MongoDB...');
      const stream = redis.scanStream({
        match: 'cart:*:items',
        count: 100
      });

      stream.on('data', async (resultKeys) => {
        // Tạm dừng stream để xử lý mẻ key hiện tại
        stream.pause();
        
        for (const key of resultKeys) {
          try {
            const items = await redis.hgetall(key);
            for (const [cartItemId, dataStr] of Object.entries(items)) {
              if (dataStr) {
                const data = JSON.parse(dataStr);
                // Update MongoDB
                await CartItem.updateOne(
                  { _id: cartItemId },
                  { 
                    $set: { 
                      quantity: data.q, 
                      note: data.n,
                      ...(data.v && { variant_id: data.v }) 
                    } 
                  }
                );
              }
            }
          } catch (err) {
            console.error(`[CartSync] Lỗi khi đồng bộ key ${key}:`, err);
          }
        }
        
        // Tiếp tục stream
        stream.resume();
      });

      stream.on('end', () => {
        // console.log('[CartSync] Đã hoàn thành đồng bộ Redis -> MongoDB.');
        this.isSyncing = false;
      });

      stream.on('error', (err) => {
        console.error('[CartSync] Lỗi stream scan:', err);
        this.isSyncing = false;
      });
      
    } catch (error) {
      console.error('[CartSync] Lỗi hệ thống khi đồng bộ:', error);
      this.isSyncing = false;
    }
  }
}

module.exports = new CartSyncService();
