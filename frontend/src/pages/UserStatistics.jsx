import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import FABGroup from '../components/FABGroup';
import axios from 'axios';
import Chart from 'chart.js/auto';
// Removed recharts temporarily for debugging

const UserStatistics = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const chartCanvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    fetchStatistics();
  }, [startDate, endDate]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${(localStorage.getItem('token') || sessionStorage.getItem('token') || '') || ''}`,
        },
        params: {
          startDate,
          endDate
        }
      };
      const res = await axios.get('http://localhost:5000/api/users/statistics', config);
      if (res.data?.success) {
        setStatsData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading || !statsData?.hasShop || !chartCanvasRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartCanvasRef.current.getContext('2d');
    const chartData = statsData.data.revenueChartData || [];
    
    // Reverse the data to show oldest to newest left to right if needed, but the backend provides it oldest to newest already (Wait, backend says "for (let i = 29; i >= 0; i--)", so it's oldest to newest. Good.)
    const labels = chartData.map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    const revenues = chartData.map(d => d.revenue);

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 74, 198, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 74, 198, 0)');

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Expenditure',
          data: revenues,
          borderColor: '#004ac6',
          backgroundColor: gradient,
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#004ac6',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
            titleFont: { size: 13, family: 'Manrope' },
            bodyFont: { size: 14, family: 'Manrope', weight: 'bold' },
            displayColors: false,
            callbacks: {
              label: function(context) {
                return context.parsed.y.toLocaleString('vi-VN') + ' ₫';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9', drawBorder: false },
            ticks: {
              font: { family: 'Manrope', size: 11 },
              color: '#94a3b8',
              callback: function(value) {
                if (value === 0) return '0 ₫';
                return (value / 1000).toLocaleString('vi-VN') + 'k ₫';
              }
            }
          },
          x: {
            grid: { display: false, drawBorder: false },
            ticks: {
              font: { family: 'Manrope', size: 11, weight: 'bold' },
              color: '#64748b'
            }
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [loading, statsData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const avatarSrc = user?.avatarUrl ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=004ac6&color=fff`;

  return (
    <Layout>
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-12 flex flex-col md:flex-row gap-8 items-start">
        {/* SideNavBar */}
        <aside className="w-full md:w-72 flex flex-col gap-4 md:sticky md:top-24 flex-shrink-0">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#c3c6d7]/30 mb-2 text-left">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                <img src={avatarSrc} alt={user?.fullName || 'Avatar'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-[#131b2e] tracking-tight truncate">{user?.fullName || 'User'}</h3>
                <p className="text-sm text-[#434655]">{user?.tier || 'Standard Member'}</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 text-left">
            <Link to="/profile" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">person</span>
              <span>Personal Profile</span>
            </Link>
            <Link to="/order-history" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">local_mall</span>
              <span>Order History</span>
            </Link>
            <Link to="/reviews" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">star</span>
              <span>My Reviews</span>
            </Link>
            <Link to="/wishlist" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">favorite</span>
              <span>Wishlist</span>
            </Link>
            <Link to="/recently-viewed" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">history</span>
              <span>Recently Viewed</span>
            </Link>
            <Link to="/address-book" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">location_on</span>
              <span>Shipping Address</span>
            </Link>
            <Link to="/coins" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">monetization_on</span>
              <span>My Coins</span>
            </Link>
            <Link to="/user/statistics" className="flex items-center px-4 py-3 space-x-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
              <span>Statistics</span>
            </Link>
            <Link to="/messages" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">chat</span>
              <span>Messages</span>
            </Link>
            <Link to="/security" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">security</span>
              <span>Security Settings</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 w-full text-left">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-[#c3c6d7]/30 p-8 flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-xl shadow-sm border border-[#c3c6d7]/30 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-[#131b2e] mb-2 tracking-tight">Personal Shopping Statistics</h1>
                  <p className="text-[#434655]">Track your shopping history, spending, and favorite products.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <label className="text-xs text-[#737686] mb-1 font-bold">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 border border-[#c3c6d7] rounded-lg text-sm text-[#131b2e] focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-[#737686] mb-1 font-bold">End Date</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 border border-[#c3c6d7] rounded-lg text-sm text-[#131b2e] focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button 
                    onClick={fetchStatistics}
                    className="self-end px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-[#003899] transition-colors"
                  >
                    Filter
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#c3c6d7]/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                      <span className="material-symbols-outlined">payments</span>
                    </div>
                    <span className="text-sm font-bold text-[#434655] uppercase">Total Spent</span>
                  </div>
                  <div className="text-2xl font-black text-[#131b2e]">{formatCurrency(statsData.data.overview.totalSpent)}</div>
                  <p className="text-xs text-[#737686] mt-2">from delivered orders</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#c3c6d7]/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">monetization_on</span>
                    </div>
                    <span className="text-sm font-bold text-[#434655] uppercase">My Coins</span>
                  </div>
                  <div className="text-2xl font-black text-[#131b2e]">{statsData.data.overview.coinBalance.toLocaleString('vi-VN')} Coins</div>
                  <p className="text-xs text-[#737686] mt-2">available for discount</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#c3c6d7]/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                      <span className="material-symbols-outlined">pending_actions</span>
                    </div>
                    <span className="text-sm font-bold text-[#434655] uppercase">Pending Payments</span>
                  </div>
                  <div className="text-2xl font-black text-[#131b2e]">{formatCurrency(statsData.data.overview.pendingPayments)}</div>
                  <p className="text-xs text-[#737686] mt-2">processing / shipping</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#c3c6d7]/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                      <span className="material-symbols-outlined">receipt_long</span>
                    </div>
                    <span className="text-sm font-bold text-[#434655] uppercase">Total Orders</span>
                  </div>
                  <div className="text-2xl font-black text-[#131b2e]">{statsData.data.overview.totalOrdersCount}</div>
                  <p className="text-xs text-[#737686] mt-2">orders placed</p>
                </div>
              </div>

              {/* Chart & Top Products */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#c3c6d7]/30 p-6">
                  <h3 className="text-lg font-bold text-[#131b2e] mb-6">Expenditure Over Time (30 Days)</h3>
                  <div className="relative h-[300px] w-full">
                    <canvas ref={chartCanvasRef}></canvas>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-[#c3c6d7]/30 p-6">
                  <h3 className="text-lg font-bold text-[#131b2e] mb-6">Top 10 Purchased Products</h3>
                  {statsData.data.topProducts?.length === 0 ? (
                    <div className="text-sm text-[#737686] text-center py-10">No purchase data available.</div>
                  ) : (
                    <div className="space-y-4">
                      {statsData.data.topProducts?.map((product, index) => (
                        <div key={product._id} className="flex items-center gap-3">
                          <div className="w-6 h-6 flex-shrink-0 bg-[#f2f3ff] text-primary font-bold text-xs flex items-center justify-center rounded">
                            {index + 1}
                          </div>
                          <img src={product.media_url} alt={product.name} className="w-10 h-10 rounded object-cover flex-shrink-0 bg-slate-100" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#131b2e] truncate">{product.name}</p>
                            <p className="text-xs text-[#737686]">Bought: {product.totalBought}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="bg-white rounded-xl shadow-sm border border-[#c3c6d7]/30 overflow-hidden">
                <div className="p-6 border-b border-[#dae2fd]">
                  <h3 className="text-lg font-bold text-[#131b2e]">Recent Orders</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#faf8ff] text-xs uppercase tracking-wider text-[#434655] font-bold">
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Shop</th>
                        <th className="px-6 py-4">Order Date</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dae2fd]">
                      {statsData.data.recentOrders?.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-sm text-[#737686]">No orders found.</td>
                        </tr>
                      ) : (
                        statsData.data.recentOrders?.map(order => (
                          <tr key={order._id} className="hover:bg-[#f7f9ff] transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-primary">{order.order_code}</td>
                            <td className="px-6 py-4 text-sm text-[#131b2e]">{order.shop_name}</td>
                            <td className="px-6 py-4 text-sm text-[#434655]">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-sm font-bold text-[#131b2e]">{formatCurrency(order.total_final)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize
                                ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                                ${['pending', 'confirmed', 'shipped'].includes(order.status) ? 'bg-blue-100 text-blue-800' : ''}
                                ${['canceled', 'disputed', 'refunded'].includes(order.status) ? 'bg-red-100 text-red-800' : ''}
                              `}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </section>
      </div>
      <FABGroup />
    </Layout>
  );
};

export default UserStatistics;
