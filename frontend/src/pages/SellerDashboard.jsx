import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import toast from 'react-hot-toast';
import axios from 'axios';

const SellerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: "Hello Seller! I'm your UTEShop AI Assistant. How can I help you optimize your store sales and product listings today?" }
  ]);

  const [cancellations, setCancellations] = useState([]);
  const [cancellationsLoading, setCancellationsLoading] = useState(false);
  const [selectedCancellation, setSelectedCancellation] = useState(null);

  // Orders Management States
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('all');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalTarget, setStatusModalTarget] = useState({ orderId: '', newStatus: '' });
  const [statusModalNote, setStatusModalNote] = useState('');

  const fetchSellerOrders = async () => {
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(
        `http://localhost:5000/api/orders/seller/orders?status=${ordersStatusFilter}&page=${ordersPage}&limit=5`,
        config
      );
      if (response.data && response.data.success) {
        setOrders(response.data.data || []);
        setOrdersTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Fetch seller orders error:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchSellerOrders();
    }
  }, [activeTab, ordersStatusFilter, ordersPage]);

  const handleUpdateOrderStatus = async () => {
    const { orderId, newStatus } = statusModalTarget;
    if (!orderId || !newStatus) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.put(
        `http://localhost:5000/api/orders/seller/orders/${orderId}/status`,
        { status: newStatus, note: statusModalNote },
        config
      );
      if (response.data && response.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        setShowStatusModal(false);
        setStatusModalNote('');
        fetchSellerOrders();
      } else {
        toast.error(response.data?.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Update order status error:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const fetchCancellations = async () => {
    setCancellationsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get('http://localhost:5000/api/orders/seller/cancellations', config);
      if (response.data && response.data.success) {
        setCancellations(response.data.data || []);
      } else {
        setCancellations([]);
      }
    } catch (error) {
      console.error('Fetch cancellations error:', error);
      setCancellations([]);
    } finally {
      setCancellationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'cancellations') {
      fetchCancellations();
    }
  }, [activeTab]);

  const handleApproveCancellation = async (orderId) => {
    const confirmApprove = window.confirm('Are you sure you want to APPROVE this order cancellation request? This will cancel the order and refund any coins/vouchers/inventory.');
    if (!confirmApprove) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(`http://localhost:5000/api/orders/seller/cancellations/${orderId}/approve`, {}, config);
      if (response.data && response.data.success) {
        toast.success('Order cancellation request approved successfully');
        fetchCancellations();
        setSelectedCancellation(null);
      }
    } catch (error) {
      console.error('Approve cancellation error:', error);
      toast.error(error.response?.data?.message || 'Failed to approve cancellation request');
    }
  };

  const handleRejectCancellation = async (orderId) => {
    const confirmReject = window.confirm('Are you sure you want to REJECT this order cancellation request? This will revert the order to its previous status.');
    if (!confirmReject) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(`http://localhost:5000/api/orders/seller/cancellations/${orderId}/reject`, {}, config);
      if (response.data && response.data.success) {
        toast.success('Order cancellation request rejected successfully');
        fetchCancellations();
        setSelectedCancellation(null);
      }
    } catch (error) {
      console.error('Reject cancellation error:', error);
      toast.error(error.response?.data?.message || 'Failed to reject cancellation request');
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(logout());
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const response = await axios.get('http://localhost:5000/api/notifications', config);
        if (response.data && response.data.success) {
          const data = response.data.data || [];
          const unread = data.filter(n => !n.is_read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Fetch unread notifications error:', error);
      }
    };

    fetchUnreadCount();
  }, [user]);

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
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[#004ac6] text-2xl">
              {navItems.find(i => i.id === activeTab)?.icon || 'dashboard_customize'}
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {navItems.find(i => i.id === activeTab)?.label} {activeTab === 'dashboard' ? 'Overview' : 'Management'}
            </h1>

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

            <button 
              onClick={() => navigate('/notifications')}
              className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl transition-all relative cursor-pointer border border-slate-100"
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#ba1a1a] text-[10px] text-white flex items-center justify-center rounded-full font-bold shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-3 bg-[#F1F5F9] pl-1 pr-4 py-1 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all group">
              <div className="w-8 h-8 rounded-full bg-[#004ac6] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-200">
                JD
              </div>
              <span className="text-sm font-bold text-slate-700">{user?.fullName || 'John Doe'}</span>
              <span className="material-symbols-outlined text-slate-400 text-lg group-hover:translate-y-0.5 transition-transform">expand_more</span>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-10 max-w-[1280px] mx-auto w-full space-y-8">
          {activeTab === 'dashboard' && (
            <>
              {/* Bento Grid Stats (4 cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Today's Revenue */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-[#004ac6] transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="material-symbols-outlined text-[#004ac6]">payments</span>
                      <span className="text-xs font-bold text-[#2e7d32] bg-[#2e7d32]/10 px-2 py-1 rounded-full">+12.5%</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Today's Revenue</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">12,450,000 <span className="text-sm font-normal text-slate-500">VND</span></h3>
                  </div>
                </div>

                {/* Card 2: New Orders */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-[#004ac6] transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="material-symbols-outlined text-slate-600">local_shipping</span>
                      <span className="text-xs font-bold text-[#2e7d32] bg-[#2e7d32]/10 px-2 py-1 rounded-full">+5.2%</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">New Orders</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">42 <span className="text-sm font-normal text-slate-500">Orders</span></h3>
                  </div>
                </div>

                {/* Card 3: Out of Stock Items */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-[#b3261e] transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="material-symbols-outlined text-[#b3261e]">inventory</span>
                      <span className="text-xs font-bold text-[#b3261e] bg-[#b3261e]/10 px-2 py-1 rounded-full">-3.1%</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Out of Stock</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">3 <span className="text-sm font-normal text-slate-500">Products</span></h3>
                  </div>
                </div>

                {/* Card 4: Chat Response Rate */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-[#2e7d32] transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="material-symbols-outlined text-[#2e7d32]">forum</span>
                      <span className="text-xs font-bold text-[#2e7d32] bg-[#2e7d32]/10 px-2 py-1 rounded-full">+0.8%</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Chat Response Rate</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">98.5 <span className="text-sm font-normal text-slate-500">%</span></h3>
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
                    <button className="px-5 py-1.5 text-sm font-bold bg-white text-[#004ac6] rounded-lg shadow-sm">Daily</button>
                    <button className="px-5 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">Weekly</button>
                    <button className="px-5 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">Monthly</button>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col justify-end">
                  <div className="relative h-[280px] w-full flex items-end justify-between gap-6 px-4 border-b border-slate-100 pb-2">
                    <div className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">4.2M ₫</div>
                      <div className="w-full bg-[#004ac6]/20 rounded-t-lg transition-all group-hover:bg-[#004ac6]" style={{ height: '40%' }}></div>
                      <span className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mon</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">6.5M ₫</div>
                      <div className="w-full bg-[#004ac6]/20 rounded-t-lg transition-all group-hover:bg-[#004ac6]" style={{ height: '60%' }}></div>
                      <span className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tue</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">5.1M ₫</div>
                      <div className="w-full bg-[#004ac6]/20 rounded-t-lg transition-all group-hover:bg-[#004ac6]" style={{ height: '50%' }}></div>
                      <span className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wed</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">9.8M ₫</div>
                      <div className="w-full bg-[#004ac6]/60 rounded-t-lg transition-all group-hover:bg-[#004ac6]" style={{ height: '85%' }}></div>
                      <span className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thu</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">12.45M ₫</div>
                      <div className="w-full bg-[#004ac6] rounded-t-lg transition-all shadow-md shadow-blue-100" style={{ height: '75%' }}></div>
                      <span className="mt-4 text-[10px] font-bold text-[#004ac6] uppercase tracking-widest">Today</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">3.5M ₫</div>
                      <div className="w-full bg-[#004ac6]/20 rounded-t-lg transition-all group-hover:bg-[#004ac6]" style={{ height: '35%' }}></div>
                      <span className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sat</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">3.0M ₫</div>
                      <div className="w-full bg-[#004ac6]/20 rounded-t-lg transition-all group-hover:bg-[#004ac6]" style={{ height: '30%' }}></div>
                      <span className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sun</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Detailed Stats Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Recent Orders</h3>
                    <button onClick={() => toast.success('Viewing all recent orders')} className="text-[#004ac6] text-xs font-bold hover:underline cursor-pointer">View All</button>
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
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono font-bold text-[#004ac6]">#ORD-9921</td>
                          <td className="px-6 py-4 text-xs font-medium">Alex Johnson</td>
                          <td className="px-6 py-4 text-xs font-bold">1,250,000₫</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#004ac6] text-[10px] font-bold border border-blue-100">Processing</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono font-bold text-[#004ac6]">#ORD-9920</td>
                          <td className="px-6 py-4 text-xs font-medium">Maria Garcia</td>
                          <td className="px-6 py-4 text-xs font-bold">450,000₫</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full bg-green-50 text-[#2e7d32] text-[10px] font-bold border border-green-100">Completed</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono font-bold text-[#004ac6]">#ORD-9919</td>
                          <td className="px-6 py-4 text-xs font-medium">Kevin Smith</td>
                          <td className="px-6 py-4 text-xs font-bold">2,100,000₫</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#b3261e] text-[10px] font-bold border border-red-100">Cancelled</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-auto p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="text-[11px] text-slate-500 font-medium">Showing <span className="text-slate-900 font-bold">1-3</span> of <span className="text-slate-900 font-bold">42</span> orders</span>
                    <div className="flex items-center gap-1">
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white transition-all cursor-not-allowed opacity-50">
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#004ac6] text-white text-xs font-bold shadow-sm">1</button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-white text-xs font-bold transition-all cursor-pointer">2</button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-white text-xs font-bold transition-all cursor-pointer">3</button>
                      <span className="px-1 text-slate-400">...</span>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>
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
                      <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200/60 shrink-0">
                          <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100" alt="Product" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">Wireless Scholar Mouse</p>
                          <p className="text-[10px] text-slate-500 font-medium">152 units sold</p>
                        </div>
                        <span className="text-xs font-bold text-[#004ac6] bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">#1</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200/60 shrink-0">
                          <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100" alt="Product" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">Academic Sport Sneakers</p>
                          <p className="text-[10px] text-slate-500 font-medium">89 units sold</p>
                        </div>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">#2</span>
                      </div>
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
                      <p className="text-xs text-slate-600 leading-tight mt-0.5 font-medium">Your revenue is up 12% compared to last Thursday. Keep it up!</p>
                    </div>
                  </div>
                  <button onClick={() => toast.success('Loading full growth report...')} className="px-5 py-2.5 bg-[#004ac6] text-white text-xs font-bold rounded-xl shadow-md shadow-[#004ac6]/20 hover:brightness-110 transition-all shrink-0 cursor-pointer">View Full Report</button>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-slate-200/60">
                      <span className="material-symbols-outlined text-slate-600">campaign</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Marketing Tip</h4>
                      <p className="text-xs text-slate-600 leading-tight mt-0.5 font-medium">Flash sales usually boost weekend traffic by 30%. Plan ahead.</p>
                    </div>
                  </div>
                  <button onClick={() => toast.success('Opening promo creation tool...')} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all shrink-0 cursor-pointer shadow-sm">Create Promo</button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'cancellations' && (
            <div className="space-y-6">
              {/* Header card / summary */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Cancellation Requests</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Review and manage buyer cancellation requests for your products</p>
                </div>
                <button
                  onClick={fetchCancellations}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Refresh
                </button>
              </div>

              {cancellationsLoading ? (
                <div className="bg-white rounded-3xl p-20 border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 text-sm font-medium mt-4">Loading cancellation requests...</p>
                </div>
              ) : cancellations.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl">done_all</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Pending Cancellations</h3>
                  <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-6">
                    All clear! There are currently no pending order cancellation requests requiring your review.
                  </p>
                  <button
                    onClick={fetchCancellations}
                    className="px-6 py-2.5 bg-[#004ac6] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Check Again
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-300">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-tighter border-b border-slate-100 bg-slate-50/50">
                          <th className="px-6 py-4">Order Code</th>
                          <th className="px-6 py-4">Customer</th>
                          <th className="px-6 py-4">Requested At</th>
                          <th className="px-6 py-4">Refund Amount</th>
                          <th className="px-6 py-4">Reason</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cancellations.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td 
                              className="px-6 py-4 text-xs font-mono font-bold text-[#004ac6] hover:underline cursor-pointer"
                              onClick={() => setSelectedCancellation(item)}
                            >
                              #{item.orderCode}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs font-bold text-slate-900">{item.customerId?.fullName || 'N/A'}</div>
                              <div className="text-[10px] text-slate-500 font-medium">{item.customerId?.email || ''}</div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                              {item.cancellation?.createdAt ? new Date(item.cancellation.createdAt).toLocaleString('en-US') : new Date(item.updatedAt).toLocaleString('en-US')}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-950">
                              {(item.totalFinal || item.totalPrice || 0).toLocaleString('vi-VN')}₫
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 font-medium max-w-[200px] truncate" title={item.cancellation?.reason || 'No reason provided'}>
                              {item.cancellation?.reason || 'No reason provided'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setSelectedCancellation(item)}
                                  className="p-2 bg-blue-50 text-[#004ac6] hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                  title="View Details"
                                >
                                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                                </button>
                                <button
                                  onClick={() => handleApproveCancellation(item.id)}
                                  className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                  title="Approve Cancellation"
                                >
                                  <span className="material-symbols-outlined text-[20px]">check</span>
                                </button>
                                <button
                                  onClick={() => handleRejectCancellation(item.id)}
                                  className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                  title="Reject Cancellation"
                                >
                                  <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Cancellation Detail Modal */}
              {selectedCancellation && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 overflow-y-auto animate-in fade-in duration-200">
                  <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in scale-in duration-300">
                    
                    {/* Modal Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined">cancel</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">Cancellation Details</h3>
                          <p className="text-xs text-slate-500 font-medium">Order #{selectedCancellation.orderCode}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedCancellation(null)} 
                        className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-slate-500">close</span>
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                      {/* Cancellation Reason Info */}
                      <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5">
                        <h4 className="text-xs font-black text-red-800 uppercase tracking-widest mb-2">Customer Request Reason</h4>
                        <p className="text-slate-800 text-sm font-medium italic">
                          "{selectedCancellation.cancellation?.reason || 'No reason specified'}"
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-3">
                          Requested at: {selectedCancellation.cancellation?.createdAt ? new Date(selectedCancellation.cancellation.createdAt).toLocaleString('en-US') : new Date(selectedCancellation.updatedAt).toLocaleString('en-US')}
                        </p>
                      </div>

                      {/* Customer Information */}
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Customer Information</h4>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Full Name</span>
                            <span className="font-bold text-slate-900">{selectedCancellation.customerId?.fullName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Email</span>
                            <span className="font-bold text-slate-900">{selectedCancellation.customerId?.email || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Payment Status</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              selectedCancellation.paymentStatus === 'success' || selectedCancellation.paymentStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : selectedCancellation.paymentStatus === 'refunded'
                                ? 'bg-slate-50 text-slate-600 border-slate-200'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {selectedCancellation.paymentStatus?.toUpperCase() || 'PENDING'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Order Items</h4>
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                          {selectedCancellation.items?.map((item) => (
                            <div key={item.id} className="p-4 flex gap-4 bg-white hover:bg-slate-50/50 transition-colors">
                              <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden border border-slate-200/60 shrink-0">
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-xs font-bold text-slate-900 leading-tight">{item.name}</p>
                                <p className="text-[10px] text-slate-500 font-semibold mt-1">Variant: {item.variantName}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-[11px] text-slate-500 font-medium">{item.quantity} x {item.price?.toLocaleString('vi-VN')}₫</span>
                                  <span className="text-xs font-bold text-slate-900">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial Breakdown */}
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Financial Details</h4>
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Subtotal</span>
                            <span className="font-medium text-slate-900">
                              {(selectedCancellation.subtotalAmount || 0).toLocaleString('vi-VN')}₫
                            </span>
                          </div>
                          {(selectedCancellation.coinDiscount || 0) > 0 && (
                            <div className="flex justify-between items-center text-sm text-amber-600">
                              <span className="font-medium">Coins Applied</span>
                              <span className="font-medium">-{selectedCancellation.coinDiscount.toLocaleString('vi-VN')}₫</span>
                            </div>
                          )}
                          {(selectedCancellation.couponDiscount || 0) > 0 && (
                            <div className="flex justify-between items-center text-sm text-[#004ac6]">
                              <span className="font-medium">Voucher Discount</span>
                              <span className="font-medium">-{selectedCancellation.couponDiscount.toLocaleString('vi-VN')}₫</span>
                            </div>
                          )}
                          {(selectedCancellation.shippingFee || 0) > 0 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 font-medium">Shipping Fee</span>
                              <span className="font-medium text-slate-900">+{selectedCancellation.shippingFee.toLocaleString('vi-VN')}₫</span>
                            </div>
                          )}
                          <div className="h-px bg-slate-200 my-2"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-black text-slate-900">Total Refund Amount</span>
                            <span className="text-lg font-black text-[#ba1a1a]">
                              {(selectedCancellation.totalFinal || selectedCancellation.totalPrice || 0).toLocaleString('vi-VN')}₫
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
                      <button
                        onClick={() => {
                          handleApproveCancellation(selectedCancellation.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        Approve Cancellation
                      </button>
                      <button
                        onClick={() => {
                          handleRejectCancellation(selectedCancellation.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                        Reject Request
                      </button>
                      <button
                        onClick={() => setSelectedCancellation(null)}
                        className="px-6 py-3 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Orders Management</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Monitor payments, fulfill orders, and track client delivery statuses</p>
                </div>
                <button
                  onClick={fetchSellerOrders}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Refresh
                </button>
              </div>

              {/* Status Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200/60 scrollbar-none">
                {[
                  { id: 'all', label: 'All Orders' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'confirmed', label: 'Confirmed' },
                  { id: 'shipped', label: 'Shipped' },
                  { id: 'delivered', label: 'Delivered' },
                  { id: 'disputed', label: 'Disputed' },
                  { id: 'refunded', label: 'Refunded' },
                  { id: 'canceled', label: 'Canceled' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setOrdersStatusFilter(tab.id);
                      setOrdersPage(1);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      ordersStatusFilter === tab.id
                        ? 'bg-[#E8EFFF] text-[#004ac6] border border-[#004ac6]/10'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Orders List / Table */}
              {ordersLoading ? (
                <div className="bg-white rounded-3xl p-20 border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 text-sm font-medium mt-4">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl">inbox</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Orders Found</h3>
                  <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-6">
                    There are currently no orders under the selected status filter.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-300">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-tighter border-b border-slate-100 bg-slate-50/50">
                          <th className="px-6 py-4">Order Code</th>
                          <th className="px-6 py-4">Customer</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Payment</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.map((order) => {
                          let payBg = 'bg-amber-50 text-amber-700 border-amber-100';
                          if (order.paymentStatus === 'success' || order.paymentStatus === 'paid') {
                            payBg = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                          } else if (order.paymentStatus === 'failed') {
                            payBg = 'bg-rose-50 text-rose-700 border-rose-100';
                          } else if (order.paymentStatus === 'refunded') {
                            payBg = 'bg-slate-50 text-slate-600 border-slate-200';
                          }

                          let fulfillBg = 'bg-slate-50 text-slate-600 border-slate-200';
                          if (order.status === 'pending') {
                            fulfillBg = 'bg-amber-50 text-amber-700 border-amber-100';
                          } else if (order.status === 'confirmed') {
                            fulfillBg = 'bg-blue-50 text-blue-700 border-blue-100';
                          } else if (order.status === 'shipped') {
                            fulfillBg = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                          } else if (order.status === 'delivered') {
                            fulfillBg = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                          } else if (order.status === 'disputed') {
                            fulfillBg = 'bg-purple-50 text-purple-700 border-purple-100';
                          } else if (order.status === 'refunded') {
                            fulfillBg = 'bg-slate-50 text-slate-500 border-slate-200';
                          } else if (order.status === 'canceled') {
                            fulfillBg = 'bg-rose-50 text-rose-700 border-rose-100';
                          } else if (order.status === 'cancel_pending') {
                            fulfillBg = 'bg-orange-50 text-orange-700 border-orange-100';
                          }

                          return (
                            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                              <td 
                                className="px-6 py-4 text-xs font-mono font-bold text-[#004ac6] hover:underline cursor-pointer"
                                onClick={() => setSelectedOrder(order)}
                              >
                                #{order.orderCode}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs font-bold text-slate-900">{order.customerId?.fullName || 'Guest'}</div>
                                <div className="text-[10px] text-slate-500 font-medium">{order.customerId?.email || ''}</div>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                                {new Date(order.createdAt).toLocaleString('en-US')}
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-950">
                                {order.totalFinal.toLocaleString('vi-VN')}₫
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${payBg}`}>
                                  {order.paymentStatus?.toUpperCase() || 'PENDING'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${fulfillBg}`}>
                                  {order.status?.toUpperCase() || 'PENDING'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="p-2 bg-blue-50 text-[#004ac6] hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                    title="View Details"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                  </button>
                                  
                                  {order.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setStatusModalTarget({ orderId: order.id, newStatus: 'confirmed' });
                                          setShowStatusModal(true);
                                        }}
                                        className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                        title="Confirm Order"
                                      >
                                        <span className="material-symbols-outlined text-[20px]">check</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setStatusModalTarget({ orderId: order.id, newStatus: 'canceled' });
                                          setShowStatusModal(true);
                                        }}
                                        className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                        title="Cancel Order"
                                      >
                                        <span className="material-symbols-outlined text-[20px]">cancel</span>
                                      </button>
                                    </>
                                  )}
                                  
                                  {order.status === 'confirmed' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setStatusModalTarget({ orderId: order.id, newStatus: 'shipped' });
                                          setShowStatusModal(true);
                                        }}
                                        className="p-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                        title="Ship Order"
                                      >
                                        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setStatusModalTarget({ orderId: order.id, newStatus: 'canceled' });
                                          setShowStatusModal(true);
                                        }}
                                        className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                        title="Cancel Order"
                                      >
                                        <span className="material-symbols-outlined text-[20px]">cancel</span>
                                      </button>
                                    </>
                                  )}

                                  {order.status === 'shipped' && (
                                    <button
                                      onClick={() => {
                                        setStatusModalTarget({ orderId: order.id, newStatus: 'delivered' });
                                        setShowStatusModal(true);
                                      }}
                                      className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                      title="Mark Delivered"
                                    >
                                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                    </button>
                                  )}

                                  {order.status === 'delivered' && (
                                    <button
                                      onClick={() => {
                                        setStatusModalTarget({ orderId: order.id, newStatus: 'refunded' });
                                        setShowStatusModal(true);
                                      }}
                                      className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                      title="Refund Order"
                                    >
                                      <span className="material-symbols-outlined text-[20px]">payments</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Page <span className="text-slate-900 font-bold">{ordersPage}</span> of <span className="text-slate-900 font-bold">{ordersTotalPages}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setOrdersPage(prev => Math.max(prev - 1, 1))}
                        disabled={ordersPage === 1}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition-all ${ordersPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-700">{ordersPage}</span>
                      <button
                        onClick={() => setOrdersPage(prev => Math.min(prev + 1, ordersTotalPages))}
                        disabled={ordersPage === ordersTotalPages}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition-all ${ordersPage === ordersTotalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Detail Modal */}
              {selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 overflow-y-auto animate-in fade-in duration-200">
                  <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in scale-in duration-300">
                    
                    {/* Modal Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-[#004ac6] rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined">shopping_cart</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">Order Details</h3>
                          <p className="text-xs text-slate-500 font-medium">Order #{selectedOrder.orderCode}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedOrder(null)} 
                        className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-slate-500">close</span>
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                      {/* Customer Info */}
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Customer Info</h4>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Full Name</span>
                            <span className="font-bold text-slate-900">{selectedOrder.customerId?.fullName || 'Guest'}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Email</span>
                            <span className="font-bold text-slate-900">{selectedOrder.customerId?.email || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Fulfillment Status</span>
                            <span className="font-bold uppercase text-[#004ac6]">{selectedOrder.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Items</h4>
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                          {selectedOrder.items?.map((item) => (
                            <div key={item.id} className="p-4 flex gap-4 bg-white hover:bg-slate-50/50 transition-colors">
                              <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden border border-slate-200/60 shrink-0">
                                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-xs font-bold text-slate-900 leading-tight">{item.productName}</p>
                                <p className="text-[10px] text-slate-500 font-semibold mt-1">Variant: {item.variantName}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-[11px] text-slate-500 font-medium">{item.quantity} x {item.priceAtBuy?.toLocaleString('vi-VN')}₫</span>
                                  <span className="text-xs font-bold text-slate-900">{(item.priceAtBuy * item.quantity).toLocaleString('vi-VN')}₫</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financials */}
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Financials</h4>
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Subtotal</span>
                            <span className="font-medium text-slate-900">
                              {(selectedOrder.subtotalAmount || 0).toLocaleString('vi-VN')}₫
                            </span>
                          </div>
                          {(selectedOrder.coinDiscount || 0) > 0 && (
                            <div className="flex justify-between items-center text-sm text-amber-600">
                              <span className="font-medium">Coins Applied</span>
                              <span className="font-medium">-{selectedOrder.coinDiscount.toLocaleString('vi-VN')}₫</span>
                            </div>
                          )}
                          {(selectedOrder.couponDiscount || 0) > 0 && (
                            <div className="flex justify-between items-center text-sm text-[#004ac6]">
                              <span className="font-medium">Voucher Discount</span>
                              <span className="font-medium">-{selectedOrder.couponDiscount.toLocaleString('vi-VN')}₫</span>
                            </div>
                          )}
                          {(selectedOrder.shippingFee || 0) > 0 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 font-medium">Shipping Fee</span>
                              <span className="font-medium text-slate-900">+{selectedOrder.shippingFee.toLocaleString('vi-VN')}₫</span>
                            </div>
                          )}
                          <div className="h-px bg-slate-200 my-2"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-black text-slate-900">Total Final</span>
                            <span className="text-lg font-black text-[#004ac6]">
                              {(selectedOrder.totalFinal || 0).toLocaleString('vi-VN')}₫
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Actions */}
                      <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Status Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedOrder.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setStatusModalTarget({ orderId: selectedOrder.id, newStatus: 'confirmed' });
                                  setShowStatusModal(true);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                              >
                                Confirm Order
                              </button>
                              <button
                                onClick={() => {
                                  setStatusModalTarget({ orderId: selectedOrder.id, newStatus: 'canceled' });
                                  setShowStatusModal(true);
                                }}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            </>
                          )}
                          {selectedOrder.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => {
                                  setStatusModalTarget({ orderId: selectedOrder.id, newStatus: 'shipped' });
                                  setShowStatusModal(true);
                                }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                              >
                                Ship Order
                              </button>
                              <button
                                onClick={() => {
                                  setStatusModalTarget({ orderId: selectedOrder.id, newStatus: 'canceled' });
                                  setShowStatusModal(true);
                                }}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            </>
                          )}
                          {selectedOrder.status === 'shipped' && (
                            <button
                              onClick={() => {
                                  setStatusModalTarget({ orderId: selectedOrder.id, newStatus: 'delivered' });
                                  setShowStatusModal(true);
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                            >
                              Deliver Order
                            </button>
                          )}
                          {selectedOrder.status === 'delivered' && (
                            <>
                              <button
                                onClick={() => {
                                    setStatusModalTarget({ orderId: selectedOrder.id, newStatus: 'refunded' });
                                    setShowStatusModal(true);
                                }}
                                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                              >
                                Refund Order
                              </button>
                              <button
                                onClick={() => {
                                    setStatusModalTarget({ orderId: selectedOrder.id, newStatus: 'disputed' });
                                    setShowStatusModal(true);
                                }}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                              >
                                Dispute Order
                              </button>
                            </>
                          )}
                          {!['pending', 'confirmed', 'shipped', 'delivered'].includes(selectedOrder.status) && (
                            <p className="text-xs text-slate-500 font-medium italic">No further status updates are permitted for this order status.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="px-6 py-3 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Status Update Note Modal */}
              {showStatusModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 overflow-y-auto animate-in fade-in duration-200">
                  <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col animate-in scale-in duration-300">
                    
                    {/* Modal Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined">edit_square</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">Update Order Status</h3>
                          <p className="text-xs text-slate-500 font-medium">Transitioning status to <span className="font-bold uppercase text-[#004ac6]">{statusModalTarget.newStatus}</span></p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setShowStatusModal(false);
                          setStatusModalNote('');
                        }} 
                        className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-slate-500">close</span>
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-4">
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        Please provide an optional note for this status change. This note will be recorded in the order status history logs.
                      </p>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Internal note</label>
                        <textarea
                          placeholder="Provide a note for this status transition (optional)..."
                          value={statusModalNote}
                          onChange={(e) => setStatusModalNote(e.target.value)}
                          className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none resize-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
                      <button
                        onClick={handleUpdateOrderStatus}
                        className="flex-1 px-6 py-3 bg-[#004ac6] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Confirm Transition
                      </button>
                      <button
                        onClick={() => {
                          setShowStatusModal(false);
                          setStatusModalNote('');
                        }}
                        className="px-6 py-3 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'cancellations' && activeTab !== 'orders' && (
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
          )}
        </div>

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
