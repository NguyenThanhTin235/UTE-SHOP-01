import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import toast from 'react-hot-toast';
import axios from 'axios';
import Chart from 'chart.js/auto';
import SellerProducts from '../components/seller/SellerProducts';
import SellerAddProduct from '../components/seller/SellerAddProduct';
import SellerOrders from '../components/seller/SellerOrders';
import SellerOrderDetail from '../components/seller/SellerOrderDetail';
import SellerCancellations from '../components/seller/SellerCancellations';
import SellerAnalytics from '../components/seller/SellerAnalytics';
import SellerSettings from '../components/seller/SellerSettings';
const SellerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: "Hello Seller! I'm your UTEShop AI Assistant. How can I help you optimize your store sales and product listings today?" }
  ]);

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const dashboardCanvasRef = useRef(null);
  const dashboardChartInstance = useRef(null);

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      // 1. Fetch 7 days analytics data
      const analyticsRes = await axios.get('http://localhost:5000/api/seller/analytics?range=last7days', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 2. Fetch recent orders
      const ordersRes = await axios.get('http://localhost:5000/api/seller/orders?page=1&limit=5', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 3. Fetch products to count out of stock
      const productsRes = await axios.get('http://localhost:5000/api/seller/products?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });

      let outOfStockCount = 0;
      if (productsRes.data.success) {
        outOfStockCount = productsRes.data.data.filter(p => p.totalStock === 0 || p.currentStatus === 'Out of Stock').length;
      }

      if (analyticsRes.data.success && ordersRes.data.success) {
        const analytics = analyticsRes.data.data;
        const orders = ordersRes.data.data;
        const summary = ordersRes.data.summary || { Pending: 0 };

        setDashboardData({
          kpis: analytics.kpis,
          chart: analytics.charts.performance,
          recentOrders: orders.slice(0, 3), // Lấy 3 đơn hàng gần nhất
          summary: summary,
          outOfStockCount: outOfStockCount,
          topSelling: analytics.products.slice(0, 2) // Lấy 2 sản phẩm bán chạy nhất
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Unable to sync Dashboard data');
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'dashboard' && dashboardData && dashboardCanvasRef.current) {
      if (dashboardChartInstance.current) {
        dashboardChartInstance.current.destroy();
      }

      const ctx = dashboardCanvasRef.current.getContext('2d');

      dashboardChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dashboardData.chart.labels,
          datasets: [{
            label: 'Daily Revenue',
            data: dashboardData.chart.current,
            backgroundColor: dashboardData.chart.labels.map((label, idx) => {
              if (idx === dashboardData.chart.labels.length - 1) {
                return '#004ac6'; // Cột ngày hôm nay màu đậm nổi bật
              }
              if (idx === dashboardData.chart.labels.length - 2) {
                return 'rgba(0, 74, 198, 0.6)'; // Cột ngày hôm qua màu vừa
              }
              return 'rgba(0, 74, 198, 0.2)'; // Các cột ngày trước màu nhạt
            }),
            hoverBackgroundColor: '#004ac6',
            borderRadius: 8,
            borderSkipped: 'bottom',
            barPercentage: 0.6,
            categoryPercentage: 0.7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              grid: { color: '#f1f5f9' },
              ticks: {
                font: { family: 'Manrope', size: 10, weight: 'bold' },
                color: '#64748b',
                callback: (value) => (value / 1e6).toFixed(1) + 'M ₫'
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                font: { family: 'Manrope', size: 10, weight: 'bold' },
                color: '#64748b'
              }
            }
          }
        }
      });
    }

    return () => {
      if (dashboardChartInstance.current) {
        dashboardChartInstance.current.destroy();
      }
    };
  }, [activeTab, dashboardData]);

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(logout());
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const newMsg = { sender: 'user', text: aiInput };
    setAiMessages(prev => [...prev, newMsg]);
    setAiInput('');

    setTimeout(() => {
      setAiMessages(prev => [...prev, {
        sender: 'ai',
        text: `Analyzing store inventory for "${newMsg.text}"... Your top selling product "Wireless Scholar Mouse" has 152 units sold.`
      }]);
    }, 1000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', category: 'Main' },
    { id: 'products', label: 'Products', icon: 'inventory_2', category: 'Main' },
    { id: 'orders', label: 'Orders', icon: 'shopping_cart', category: 'Main' },
    { id: 'cancellations', label: 'Cancellations', icon: 'cancel', category: 'Main' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics', category: 'Main' },
    { id: 'reviews', label: 'Reviews', icon: 'star', category: 'Main' },
    { id: 'messages', label: 'Messages', icon: 'chat_bubble', category: 'Main' },
    { id: 'settings', label: 'Settings', icon: 'settings', category: 'Settings' },
  ];

  return (
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen flex font-['Manrope'] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 z-50 shadow-sm">
        {/* Seller Identity */}
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#004ac6] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
              US
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">Seller Center</h2>
              <p className="text-xs text-slate-500 font-medium">Premium Merchant</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item, index) => {
            const showCategory = index === 0 || navItems[index - 1].category !== item.category;
            return (
              <React.Fragment key={item.id}>
                {showCategory && item.category === 'Settings' && (
                  <div className="pt-6 pb-2 px-4 border-t border-slate-100 mt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System</p>
                  </div>
                )}
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-sm font-medium group cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-[#E8EFFF] text-[#004ac6] font-bold shadow-sm shadow-blue-100'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform"
                    style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Revenue Card */}
        <div className="px-6 py-4 mt-auto border-t border-slate-100">
          <div className="bg-[#004ac6] rounded-[24px] p-5 text-white relative overflow-hidden shadow-lg shadow-blue-200/50">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <span className="material-symbols-outlined text-4xl">account_balance_wallet</span>
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Total Balance</p>
              <h3 className="text-lg font-black mb-4 flex items-baseline gap-1">
                45,820,000 <span className="text-[10px] font-medium opacity-80">₫</span>
              </h3>
              <button 
                onClick={() => toast.success('Accessing Seller Wallet...')} 
                className="flex items-center justify-center w-full bg-white text-[#004ac6] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
              >
                Access Wallet
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-[#b3261e] hover:bg-red-100 transition-all rounded-xl text-sm font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Exit Seller Center</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#F8FAFC]">
        {activeTab === 'dashboard' && (
          <>
            {/* Header */}
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#004ac6] text-2xl">dashboard_customize</span>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>

                <div className="ml-8 hidden md:flex items-center bg-[#F1F5F9] rounded-2xl px-4 py-2.5 w-80 group focus-within:ring-2 focus-within:ring-blue-100 transition-all border border-slate-200/60">
                  <span className="material-symbols-outlined text-slate-400 text-xl group-focus-within:text-[#004ac6]">search</span>
                  <input
                    type="text"
                    placeholder="Search analytics..."
                    className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 placeholder:font-medium ml-2 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-8 w-px bg-slate-200 mx-2"></div>

                <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl transition-all relative cursor-pointer border border-slate-100">
                  <span className="material-symbols-outlined text-2xl">notifications</span>
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center gap-3 bg-[#F1F5F9] pl-1 pr-4 py-1 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all group">
                  <div className="w-8 h-8 rounded-full bg-[#004ac6] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-200">
                    {user?.fullName?.charAt(0).toUpperCase() || 'J'}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{user?.fullName || 'John Doe'}</span>
                  <span className="material-symbols-outlined text-slate-400 text-lg group-hover:translate-y-0.5 transition-transform">expand_more</span>
                </div>
              </div>
            </header>

            {dashboardLoading || !dashboardData ? (
              <div className="p-10 max-w-[1280px] mx-auto w-full space-y-8 animate-pulse">
                {/* Bento Grid Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
                      <div className="flex justify-between items-start">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                        <div className="w-14 h-5 bg-slate-100 rounded-full"></div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                        <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart Skeleton */}
                <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm h-[400px] flex flex-col gap-6">
                  <div className="space-y-2">
                    <div className="h-6 bg-slate-100 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                  </div>
                  <div className="flex-1 bg-slate-50/50 rounded-xl"></div>
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-[320px] flex flex-col gap-4">
                    <div className="h-5 bg-slate-100 rounded w-1/5"></div>
                    <div className="flex-1 bg-slate-50/50 rounded-xl"></div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-[320px] flex flex-col gap-4">
                    <div className="h-5 bg-slate-100 rounded w-1/3"></div>
                    <div className="flex-1 bg-slate-50/50 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 max-w-[1280px] mx-auto w-full space-y-8">
                {/* Bento Grid Stats (4 cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: Revenue (7 Days) */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-[#004ac6] transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-[#004ac6]">payments</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          dashboardData.kpis?.revenue?.growth >= 0 
                            ? 'text-[#2e7d32] bg-[#2e7d32]/10' 
                            : 'text-[#b3261e] bg-[#b3261e]/10'
                        }`}>
                          {dashboardData.kpis?.revenue?.growth >= 0 ? '+' : ''}{dashboardData.kpis?.revenue?.growth}%
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm font-medium">Revenue (7 Days)</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {dashboardData.kpis?.revenue?.value?.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-500">₫</span>
                      </h3>
                    </div>
                  </div>

                  {/* Card 2: Pending Orders */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-[#004ac6] transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-slate-600">local_shipping</span>
                        <span className="text-xs font-bold text-[#004ac6] bg-blue-50 px-2 py-1 rounded-full">Pending</span>
                      </div>
                      <p className="text-slate-500 text-sm font-medium">Pending Orders</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {dashboardData.summary?.Pending || 0} <span className="text-sm font-normal text-slate-500">Orders</span>
                      </h3>
                    </div>
                  </div>

                  {/* Card 3: Out of Stock */}
                  <div className={`bg-white p-6 rounded-2xl shadow-sm border flex flex-col justify-between transition-all ${
                    dashboardData.outOfStockCount > 0 
                      ? 'border-red-100 hover:border-[#b3261e]' 
                      : 'border-slate-200 hover:border-[#2e7d32]'
                  }`}>
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`material-symbols-outlined ${dashboardData.outOfStockCount > 0 ? 'text-[#b3261e]' : 'text-slate-600'}`}>inventory</span>
                        {dashboardData.outOfStockCount > 0 ? (
                          <span className="text-xs font-bold text-[#b3261e] bg-[#b3261e]/10 px-2 py-1 rounded-full animate-pulse">Restock Needed</span>
                        ) : (
                          <span className="text-xs font-bold text-[#2e7d32] bg-[#2e7d32]/10 px-2 py-1 rounded-full">In Stock</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-sm font-medium">Out of Stock</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {dashboardData.outOfStockCount || 0} <span className="text-sm font-normal text-slate-500">Products</span>
                      </h3>
                    </div>
                  </div>

                  {/* Card 4: Store Conversion Rate */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-[#2e7d32] transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-[#2e7d32]">analytics</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          dashboardData.kpis?.conversion?.growth >= 0 
                            ? 'text-[#2e7d32] bg-[#2e7d32]/10' 
                            : 'text-[#b3261e] bg-[#b3261e]/10'
                        }`}>
                          {dashboardData.kpis?.conversion?.growth >= 0 ? '+' : ''}{dashboardData.kpis?.conversion?.growth}%
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm font-medium">Store Conversion Rate</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {dashboardData.kpis?.conversion?.value}% <span className="text-sm font-normal text-slate-500">Rate</span>
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Revenue Analytics Section */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Revenue Trends</h2>
                      <p className="text-slate-500 text-sm font-medium mt-1">Performance comparison across different time periods</p>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                      <button onClick={() => setActiveTab('analytics')} className="px-5 py-1.5 text-sm font-bold bg-white text-[#004ac6] rounded-lg shadow-sm cursor-pointer hover:bg-slate-50 transition-all">
                        Detailed Analytics
                      </button>
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col justify-end">
                    <div className="relative h-[280px] w-full">
                      <canvas ref={dashboardCanvasRef}></canvas>
                    </div>
                  </div>
                </section>

                {/* Detailed Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Orders Table */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Recent Orders</h3>
                      <button onClick={() => setActiveTab('orders')} className="text-[#004ac6] text-xs font-bold hover:underline cursor-pointer">View All</button>
                    </div>
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-tighter border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dashboardData.recentOrders && dashboardData.recentOrders.length > 0 ? (
                            dashboardData.recentOrders.map((order) => (
                              <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                                <td 
                                  onClick={() => {
                                    setSelectedOrderId(order._id);
                                    setActiveTab('order-detail');
                                  }} 
                                  className="px-6 py-4 text-xs font-mono font-bold text-[#004ac6] hover:underline cursor-pointer"
                                >
                                  {order.order_code}
                                </td>
                                <td className="px-6 py-4 text-xs font-medium">
                                  {order.customer_id?.full_name || 'Anonymous Customer'}
                                </td>
                                <td className="px-6 py-4 text-xs font-bold">
                                  {order.total_final?.toLocaleString('vi-VN')}₫
                                </td>
                                <td className="px-6 py-4">
                                  {order.status === 'delivered' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-green-50 text-[#2e7d32] text-[10px] font-bold border border-green-100">Completed</span>
                                  ) : order.status === 'canceled' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#b3261e] text-[10px] font-bold border border-red-100">Cancelled</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#004ac6] text-[10px] font-bold border border-blue-100">Processing</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center py-8 text-slate-400 text-xs font-medium">
                                No orders found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-auto p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Showing recent orders of the shop
                      </span>
                      <button 
                        onClick={() => setActiveTab('orders')} 
                        className="text-[11px] text-[#004ac6] font-bold hover:underline cursor-pointer"
                      >
                        Go to Order Management →
                      </button>
                    </div>
                  </div>

                  {/* Store Performance & Top Selling */}
                  <div className="space-y-8 flex flex-col justify-between">
                    {/* Store Performance */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-6">Store Performance</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <span className="text-xs text-slate-500 font-medium">Fulfillment Rate</span>
                          <span className="text-sm font-bold text-[#004ac6]">98%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#004ac6]" style={{ width: '98%' }}></div>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-xs text-slate-500 font-medium">Response Time</span>
                          <span className="text-sm font-bold text-[#2e7d32]">&lt; 5 mins</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2e7d32]" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Top Selling */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-between">
                      <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-4">Top Selling</h3>
                      <div className="space-y-4 flex-1 flex flex-col justify-center">
                        {dashboardData.topSelling && dashboardData.topSelling.length > 0 ? (
                          dashboardData.topSelling.map((prod, idx) => (
                            <div key={prod.id || idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200/60 shrink-0">
                                <img src={prod.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"} alt={prod.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium">{prod.orders} units sold</p>
                              </div>
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                                idx === 0 
                                  ? 'text-[#004ac6] bg-blue-50 border-blue-100' 
                                  : 'text-slate-600 bg-slate-100 border-slate-200'
                              }`}>
                                #{idx + 1}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 text-center py-4 font-medium">No top selling data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Growth Insights & Marketing Tips */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-blue-100">
                        <span className="material-symbols-outlined text-[#004ac6]">auto_graph</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Growth Insight</h4>
                        <p className="text-xs text-slate-600 leading-tight mt-0.5 font-medium">
                          Your store's revenue over the last 7 days has shown strong growth. Keep optimizing your products!
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('analytics')} className="px-5 py-2.5 bg-[#004ac6] text-white text-xs font-bold rounded-xl shadow-md shadow-[#004ac6]/20 hover:brightness-110 transition-all shrink-0 cursor-pointer">
                      View Report
                    </button>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-slate-200/60">
                        <span className="material-symbols-outlined text-slate-600">campaign</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Marketing Tip</h4>
                        <p className="text-xs text-slate-600 leading-tight mt-0.5 font-medium">Create flash sale campaigns to generate a sudden surge in traffic.</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('products')} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all shrink-0 cursor-pointer shadow-sm">
                      Manage Products
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'products' && (
          <SellerProducts setActiveTab={setActiveTab} />
        )}
        
        {activeTab === 'addProduct' && (
          <SellerAddProduct setActiveTab={setActiveTab} />
        )}

        {activeTab === 'orders' && (
          <SellerOrders onViewDetails={(id) => {
            setSelectedOrderId(id);
            setActiveTab('order-detail');
          }} />
        )}

        {activeTab === 'order-detail' && selectedOrderId && (
          <SellerOrderDetail orderId={selectedOrderId} onBack={() => setActiveTab('orders')} />
        )}

        {activeTab === 'cancellations' && (
          <SellerCancellations setActiveTab={setActiveTab} />
        )}

        {activeTab === 'analytics' && (
          <SellerAnalytics setActiveTab={setActiveTab} />
        )}

        {activeTab === 'settings' && (
          <SellerSettings setActiveTab={setActiveTab} />
        )}

        {activeTab !== 'dashboard' && activeTab !== 'products' && activeTab !== 'addProduct' && activeTab !== 'orders' && activeTab !== 'order-detail' && activeTab !== 'cancellations' && activeTab !== 'analytics' && activeTab !== 'settings' && (
            <div className="p-10 max-w-[1280px] mx-auto w-full space-y-8">
              <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-6xl text-[#004ac6] mb-4 animate-bounce">
                  {navItems.find(i => i.id === activeTab)?.icon}
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                  {navItems.find(i => i.id === activeTab)?.label} Management
                </h2>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                  Manage your store {navItems.find(i => i.id === activeTab)?.label.toLowerCase()} efficiently. Use the tools below to add new listings, update stock levels, or handle customer requests.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => toast.success(`Creating new item in ${navItems.find(i => i.id === activeTab)?.label}...`)}
                    className="px-6 py-3 bg-[#004ac6] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#004ac6]/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    Create New {navItems.find(i => i.id === activeTab)?.label}
                  </button>
                  <button 
                    onClick={() => toast.success(`Exporting ${navItems.find(i => i.id === activeTab)?.label} data...`)}
                    className="px-6 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                  >
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Floating Action Buttons */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
          <button
            onClick={() => setShowAI(!showAI)}
            className="w-16 h-16 bg-[#004ac6] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all group relative border border-white/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-3xl">smart_toy</span>
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-white text-[#b3261e] font-black flex items-center justify-center rounded-full border-2 border-[#b3261e] shadow-lg text-[12px]">1</div>
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-[#131b2e] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">AI Assistant</span>
          </button>
        </div>

        {/* AI Chat Window */}
        {showAI && (
          <div className="fixed bottom-28 right-8 w-96 h-[550px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col z-[60] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="p-6 bg-[#004ac6] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">AI Assistant</h3>
                  <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Always Online</p>
                </div>
              </div>
              <button onClick={() => setShowAI(false)} className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/50 flex flex-col">
              {aiMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-[#004ac6]/10 text-[#004ac6]'}`}>
                    <span className="material-symbols-outlined text-sm">{msg.sender === 'user' ? 'person' : 'smart_toy'}</span>
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed max-w-[80%] ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <form onSubmit={handleAiSubmit} className="flex gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200/60">
                <input
                  type="text"
                  placeholder="Ask AI anything..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium px-2 outline-none"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                />
                <button type="submit" className="w-10 h-10 bg-[#004ac6] text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all cursor-pointer shadow-md shadow-[#004ac6]/20">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SellerDashboard;
