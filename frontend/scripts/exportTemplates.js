import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = path.resolve(__dirname, '../../template');

const pagesToScrape = [
  // Shipper
  { name: 'shipper_dashboard.html', path: '/shipper/dashboard', role: 'shipper' },
  { name: 'shipper_orders.html', path: '/shipper/orders', role: 'shipper' },
  { name: 'shipper_order_detail.html', path: '/shipper/order-detail/test-order-id', role: 'shipper' }, // Assuming it handles invalid ID gracefully
  { name: 'shipper_statistics.html', path: '/shipper/statistics', role: 'shipper' },
  
  // Customer
  { name: 'customer_shop_detail.html', path: '/shop/uteshop', role: 'customer' },
  { name: 'order_success.html', path: '/order-success', role: 'customer' },
  { name: 'my_reviews.html', path: '/reviews', role: 'customer' },
  { name: 'recently_viewed.html', path: '/recently-viewed', role: 'customer' },
  { name: 'role_upgrade.html', path: '/role-upgrade', role: 'customer' },
  { name: 'user_statistics.html', path: '/user/statistics', role: 'customer' },
  { name: 'policy_detail.html', path: '/support/policy/terms', role: 'customer' },
  { name: 'bank_accounts.html', path: '/seller/bank-accounts', role: 'seller' },
  { name: 'shipper_info.html', path: '/shipper/info', role: 'shipper' }
];

const TEMPLATE_HEAD = `<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>UTEShop Template</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-container-lowest": "#ffffff",
                        "on-primary-fixed-variant": "#003ea8",
                        "error": "#ba1a1a",
                        "on-secondary": "#ffffff",
                        "surface-tint": "#0053db",
                        "error-container": "#ffdad6",
                        "on-primary-container": "#eeefff",
                        "primary": "#004ac6",
                        "tertiary": "#515659",
                        "surface-bright": "#faf8ff",
                        "on-tertiary-container": "#edf1f5",
                        "inverse-primary": "#b4c5ff",
                        "on-primary": "#ffffff",
                        "on-surface": "#131b2e",
                        "surface-container-low": "#f2f3ff",
                        "tertiary-fixed": "#dfe3e7",
                        "on-tertiary-fixed": "#171c1f",
                        "on-background": "#131b2e",
                        "on-error": "#ffffff",
                        "on-error-container": "#93000a",
                        "tertiary-fixed-dim": "#c3c7cb",
                        "surface": "#faf8ff",
                        "secondary-fixed": "#d3e4fe",
                        "on-primary-fixed": "#00174b",
                        "on-secondary-fixed-variant": "#38485d",
                        "on-surface-variant": "#434655",
                        "surface-variant": "#dae2fd",
                        "outline-variant": "#c3c6d7",
                        "on-tertiary": "#ffffff",
                        "on-secondary-container": "#54647a",
                        "primary-container": "#2563eb",
                        "on-secondary-fixed": "#0b1c30",
                        "secondary-fixed-dim": "#b7c8e1",
                        "outline": "#737686",
                        "inverse-surface": "#283044",
                        "surface-dim": "#d2d9f4",
                        "surface-container-highest": "#dae2fd",
                        "secondary": "#505f76",
                        "surface-container": "#eaedff",
                        "primary-fixed-dim": "#b4c5ff",
                        "background": "#faf8ff",
                        "inverse-on-surface": "#eef0ff",
                        "surface-container-high": "#e2e7ff",
                        "primary-fixed": "#dbe1ff",
                        "tertiary-container": "#696e71",
                        "secondary-container": "#d0e1fb",
                        "on-tertiary-fixed-variant": "#43474b"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "fontFamily": {
                        "headline-lg": ["Manrope"],
                        "body-lg": ["Manrope"],
                        "body-sm": ["Manrope"],
                        "label-md": ["Manrope"],
                        "display": ["Manrope"],
                        "label-caps": ["Manrope"],
                        "headline-md": ["Manrope"]
                    }
                }
            }
        }
    </script>
    <style>
        body { background-color: #faf8ff; font-family: 'Manrope', sans-serif; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .shadow-soft { box-shadow: 0px 4px 20px rgba(15, 23, 42, 0.05); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
    </style>
</head>
<body class="text-on-surface">
`;

const TEMPLATE_TAIL = `\n</body>\n</html>`;

async function run() {
  console.log('Starting Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const item of pagesToScrape) {
    console.log(`Processing ${item.name} at ${item.path}...`);
    
    // Log API requests
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('>> API Request:', request.url());
      }
    });
    
    // Inject auth
    await page.goto(BASE_URL); // Go to base URL first to set localStorage
    await page.evaluate((role) => {
      const mockUser = {
        _id: 'mock-id-123',
        id: 'mock-id-123',
        name: 'Mock User',
        email: 'mock@example.com',
        role: role,
        roles: ['customer', role]
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', 'mock-token-abc');
      sessionStorage.setItem('user', JSON.stringify(mockUser));
      sessionStorage.setItem('token', 'mock-token-abc');
    }, item.role);

    // MOCK API RESPONSES
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      
      // MOCK SHIPPER DASHBOARD
      if (url.includes('/api/shipper/dashboard')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              stats: { totalAssigned: 120, inTransit: 15, delivered: 98, failed: 7, todayDelivered: 12 },
              recentOrders: [
                { _id: 'ORD001', orderCode: 'ORD-001', customer_id: { full_name: 'Nguyễn Văn A', phone: '0901234567' }, shop_id: { address: '123 Võ Văn Ngân' }, status: 'shipping' },
                { _id: 'ORD002', orderCode: 'ORD-002', customer_id: { full_name: 'Lê Thị B', phone: '0987654321' }, shop_id: { address: '456 Lê Văn Việt' }, status: 'completed' }
              ]
            }
          })
        });
      }

      // MOCK SHIPPER ORDERS
      if (url.includes('/api/shipper/orders') && !url.includes('orders/test-order-id')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              orders: [
                { _id: 'ORD1', orderCode: 'ORD-1001', status: 'shipping', customerId: { fullName: 'Trần C', phone: '0909090909' }, shopId: { address: '1 Võ Văn Ngân, Thủ Đức' } },
                { _id: 'ORD2', orderCode: 'ORD-1002', status: 'completed', customerId: { fullName: 'Lê D', phone: '0808080808' }, shopId: { address: '2 Lê Văn Việt, Q9' } },
                { _id: 'ORD3', orderCode: 'ORD-1003', status: 'ready_to_ship', customerId: { fullName: 'Phạm E', phone: '0707070707' }, shopId: { address: '3 Kha Vạn Cân, Thủ Đức' } }
              ],
              pagination: { totalPages: 1, currentPage: 1 }
            }
          })
        });
      }

      // MOCK SHIPPER ORDER DETAIL
      if (url.includes('/api/shipper/orders/test-order-id/detail')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              order: {
                _id: 'test-order-id',
                orderCode: 'ORD-TEST-123',
                status: 'shipping',
                totalAmount: 500000,
                paymentMethod: 'COD',
                paymentStatus: 'pending',
                isPaid: false,
                createdAt: '2023-10-10T10:00:00Z',
                shippingFee: 20000,
                subtotalAmount: 480000,
                totalFinal: 500000,
                couponDiscount: 0,
                coinDiscount: 0,
                customerId: { fullName: 'Nguyễn Khách Hàng', phone: '0912345678', email: 'khach@email.com' },
                shopId: { name: 'UTE Apple Store', address: '1 Võ Văn Ngân, Thủ Đức', phone: '0987654321', latitude: 10.850145, longitude: 106.771661 }
              },
              shippingAddress: { 
                recipientName: 'Nguyễn Khách Hàng',
                recipientPhone: '0912345678',
                address: '123 Đường D1, Phường 25, Bình Thạnh', 
                city: 'Hồ Chí Minh',
                streetAddress: '123 Đường D1, Phường 25',
                latitude: 10.801648,
                longitude: 106.711815
              },
              orderItems: [
                { 
                  _id: 'item1',
                  product: { name: 'iPhone 15 Pro Max' }, 
                  imageUrl: 'https://placehold.co/100x100',
                  variant: { attributes: { color: 'Titanium' } }, 
                  quantity: 1, 
                  priceAtBuy: 30000000 
                }
              ],
              statusHistory: [
                { status: 'pending', createdAt: '2023-10-10T10:00:00Z' },
                { status: 'confirmed', createdAt: '2023-10-10T11:00:00Z' },
                { status: 'ready_to_ship', createdAt: '2023-10-10T12:00:00Z' },
                { status: 'shipping', createdAt: '2023-10-10T13:00:00Z' }
              ]
            }
          })
        });
      }

      // MOCK SHIPPER STATISTICS
      if (url.includes('/api/shipper/statistics')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              deliveryStats: { total: 100, completed: 85, failed: 5, inTransit: 10, successRate: 85 },
              earningsStats: { total: 5000000, pending: 1000000, available: 4000000 },
              chartData: [
                { date: 'Mon', completed: 10, delivered: 10, failed: 1, earnings: 150000 },
                { date: 'Tue', completed: 15, delivered: 15, failed: 0, earnings: 225000 },
                { date: 'Wed', completed: 12, delivered: 12, failed: 2, earnings: 180000 },
                { date: 'Thu', completed: 20, delivered: 20, failed: 0, earnings: 300000 },
                { date: 'Fri', completed: 18, delivered: 18, failed: 1, earnings: 270000 }
              ],
              recentTransactions: [
                { id: 'TX1', amount: 150000, type: 'delivery_fee', createdAt: '2023-10-10T15:00:00Z', status: 'completed' },
                { id: 'TX2', amount: 225000, type: 'delivery_fee', createdAt: '2023-10-11T16:00:00Z', status: 'completed' }
              ]
            }
          })
        });
      }

      // MOCK SHOP DETAIL
      if (url.includes('/api/public/shop/uteshop/products')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              products: [
                { _id: 'P1', name: 'Laptop Dell XPS 15', minPrice: 25000000, images: [{url: 'https://placehold.co/300x300'}], rating: 4.9, sold: 50 },
                { _id: 'P2', name: 'Chuột Logitech G102', minPrice: 450000, images: [{url: 'https://placehold.co/300x300'}], rating: 4.7, sold: 300 }
              ],
              pagination: { totalPages: 1 }
            }
          })
        });
      } else if (url.includes('/api/public/shop/uteshop')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              shop: { name: 'UTE Store Official', description: 'Cửa hàng chính hãng sinh viên UTE', rating: 4.8, reviewCount: 150, followers: 1200, joinedAt: '2022-01-01', logo: 'https://placehold.co/200x200' },
              allProducts: [
                { _id: 'P1', name: 'Laptop Dell XPS 15', minPrice: 25000000, sellingPrice: 24000000, mrpPrice: 25000000, media: ['https://placehold.co/300x300'], rating: 4.9, soldCount: 50 },
                { _id: 'P2', name: 'Chuột Logitech G102', minPrice: 450000, sellingPrice: 400000, mrpPrice: 450000, media: ['https://placehold.co/300x300'], rating: 4.7, soldCount: 300 }
              ],
              bestSellers: [
                { _id: 'P1', name: 'Laptop Dell XPS 15', minPrice: 25000000, sellingPrice: 24000000, mrpPrice: 25000000, media: ['https://placehold.co/300x300'], rating: 4.9, soldCount: 50 }
              ],
              deepDiscounts: [
                { _id: 'P2', name: 'Chuột Logitech G102', minPrice: 450000, sellingPrice: 400000, mrpPrice: 450000, media: ['https://placehold.co/300x300'], rating: 4.7, soldCount: 300 }
              ]
            }
          })
        });
      }

      // MOCK REVIEWS
      if (url.includes('/api/customer/reviews') || url.includes('/api/profile/reviews')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              reviews: [
                { _id: 'R1', rating: 5, comment: 'Sản phẩm tuyệt vời, giao hàng nhanh!', product: { name: 'iPhone 15', images: [{url: 'https://placehold.co/100x100'}] }, createdAt: '2023-10-01' },
                { _id: 'R2', rating: 4, comment: 'Đóng gói cẩn thận, hơi móp góc vỏ', product: { name: 'Macbook Air', images: [{url: 'https://placehold.co/100x100'}] }, createdAt: '2023-10-05' }
              ],
              pagination: { totalPages: 1 }
            }
          })
        });
      }

      // MOCK RECENTLY VIEWED
      if (url.includes('/api/customer/recently-viewed') || url.includes('/api/profile/recently-viewed')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              products: [
                { _id: 'P1', name: 'Tai nghe Sony WH-1000XM5', minPrice: 6500000, images: [{url: 'https://placehold.co/300x300'}], shop: { name: 'Sony Official' } },
                { _id: 'P2', name: 'Bàn phím cơ Keychron K8', minPrice: 2000000, images: [{url: 'https://placehold.co/300x300'}], shop: { name: 'Keychron VN' } }
              ]
            }
          })
        });
      }

      // MOCK USER STATISTICS
      if (url.includes('/api/customer/statistics') || url.includes('/api/profile/statistics')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              totalOrders: 25,
              totalSpent: 15500000,
              savedAmount: 500000,
              ordersByStatus: [
                { name: 'Completed', value: 20 },
                { name: 'Shipping', value: 3 },
                { name: 'Cancelled', value: 2 }
              ],
              spendingHistory: [
                { month: 'Jan', amount: 1500000 },
                { month: 'Feb', amount: 3000000 },
                { month: 'Mar', amount: 0 },
                { month: 'Apr', amount: 11000000 }
              ]
            }
          })
        });
      }

      // MOCK POLICY
      if (url.includes('/api/public/policy/terms') || url.includes('/api/static/terms') || url.includes('/api/public/static/terms')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              title: 'Terms of Service',
              content: '<p>Welcome to UTEShop. These terms and conditions outline the rules and regulations for the use of UTEShop Website.</p><h2>1. Terms</h2><p>By accessing this website we assume you accept these terms and conditions.</p><h2>2. License</h2><p>Unless otherwise stated, UTEShop and/or its licensors own the intellectual property rights for all material on UTEShop.</p>',
              updatedAt: '2023-01-01'
            }
          })
        });
      }

      // MOCK BANK ACCOUNTS
      if (url.includes('/api/seller/wallet/bank-accounts')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { _id: 'BA1', bankName: 'Vietcombank', accountName: 'NGUYEN VAN A', accountNumber: '0123456789', branch: 'Chi nhánh HCM', isDefault: true },
              { _id: 'BA2', bankName: 'MB Bank', accountName: 'NGUYEN VAN A', accountNumber: '9876543210', branch: 'Chi nhánh Thủ Đức', isDefault: false }
            ]
          })
        });
      }

      // MOCK SHIPPER PROFILE
      if (url.includes('/api/shipper/profile')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              fullName: 'Trần Văn Shipper',
              phone: '0999999999',
              vehicleDetails: { type: 'Motorbike', licensePlate: '59X1-123.45', brand: 'Honda' },
              area: 'Thủ Đức, TP.HCM',
              isActive: true
            }
          })
        });
      }

      // MOCK ROLE UPGRADE
      if (url.includes('/api/profile/role-upgrade') || url.includes('/api/customer/role-upgrade-status') || url.includes('/api/users/role-upgrades/status')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              hasPendingRequest: false,
              currentRole: 'customer'
            }
          })
        });
      }

      // MOCK CART & NOTIFICATIONS TO PREVENT 401 LOGOUT
      if (url.includes('/api/cart')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        });
      }
      if (url.includes('/api/users/notifications/unread-count') || url.includes('/api/notifications/unread-count')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, count: 2 })
        });
      }
      if (url.includes('/api/chat/unread-count')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, count: 0 })
        });
      }

      // MOCK REVIEWS FOR CUSTOMER
      if (url.includes('/api/reviews')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 'rev1', rating: 5, comment: 'Excellent product!', createdAt: '2023-10-12T10:00:00Z', updatedAt: '2023-10-12T10:00:00Z', coinEarned: 100, product: { name: 'MacBook Air M2', slug: 'macbook-air-m2', imageUrl: 'https://placehold.co/100x100', shop: { name: 'Apple Authorized' } }, orderItem: { quantity: 1, priceAtBuy: 25000000 } }
            ],
            pagination: { total: 1, totalPages: 1 }
          })
        });
      }

      // MOCK RECENTLY VIEWED
      if (url.includes('/api/users/recently-viewed')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 'rv1', product: { _id: 'prod1', name: 'AirPods Pro', slug: 'airpods-pro', minPrice: 4000000, sellingPrice: 3800000, media: ['https://placehold.co/300x300'], rating: 4.8, soldCount: 120 } }
            ],
            pagination: { total: 1, totalPages: 1 }
          })
        });
      }

      // MOCK USER STATISTICS
      if (url.includes('/api/users/statistics')) {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              overview: { totalSpent: 15000000, totalOrders: 5, totalSaved: 500000 },
              spendingByCategory: [{ category: 'Electronics', amount: 15000000 }],
              spendingByMonth: [{ month: 'Oct', amount: 15000000 }]
            }
          })
        });
      }

      // Generic fallback for any other APIs
      return route.continue();
    });

    // Navigate to actual path
    await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'networkidle' });
    
    // Wait for a short time to let animations/renders settle
    await page.waitForTimeout(2000);

    // Extract innerHTML of root to exclude Vite scripts
    const rootHtml = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML : document.body.innerHTML;
    });

    const finalHtml = `${TEMPLATE_HEAD}\n${rootHtml}\n${TEMPLATE_TAIL}`;
    const destPath = path.join(OUTPUT_DIR, item.name);
    
    fs.writeFileSync(destPath, finalHtml, 'utf8');
    console.log(`✅ Saved ${item.name}`);
  }

  await browser.close();
  console.log('Done.');
}

run().catch(console.error);
