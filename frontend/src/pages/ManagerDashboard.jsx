import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import toast from 'react-hot-toast';
import axios from 'axios';
import ShopApprovalTab from '../components/manager/ShopApprovalTab';
import ManagerShopDetail from '../components/manager/ManagerShopDetail';
import ProductApprovalTab from '../components/manager/ProductApprovalTab';
import ManagerProductDetail from '../components/manager/ManagerProductDetail';
import ViolationsTab from '../components/manager/ViolationsTab';
import ManagerViolationDetail from '../components/manager/ManagerViolationDetail';
import ManagerSidebar from '../components/manager/ManagerSidebar';
import ManagerHeader from '../components/manager/ManagerHeader';
import ManagerAiAssistant from '../components/manager/ManagerAiAssistant';
// ─── Helpers ──────────────────────────────────────────────────────────────────
const API = 'http://localhost:5000/api';

function getAuthHeader() {
  const token =
    localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
}

function getActivityIcon(action = '') {
  const a = action.toLowerCase();
  if (a.includes('approve') || a.includes('active')) return { icon: 'check_circle', color: '#16a34a' };
  if (a.includes('reject') || a.includes('block') || a.includes('suspend')) return { icon: 'block', color: '#dc2626' };
  if (a.includes('login') || a.includes('security') || a.includes('alert')) return { icon: 'shield', color: '#f59e0b' };
  if (a.includes('create') || a.includes('add')) return { icon: 'add_circle', color: '#004ac6' };
  return { icon: 'info', color: '#004ac6' };
}

function getActivityLabel(log) {
  const a = (log.action || '').toLowerCase();
  const entity = log.entityType || '';
  if (a.includes('approve') && entity.toLowerCase() === 'shop') return { title: 'Shop Approved', desc: `"${log.metadata?.name || 'A shop'}" has been verified.` };
  if (a.includes('reject') && entity.toLowerCase() === 'shop') return { title: 'Shop Rejected', desc: `"${log.metadata?.name || 'A shop'}" was rejected.` };
  if (a.includes('approve') && entity.toLowerCase() === 'product') return { title: 'Product Approved', desc: `"${log.metadata?.name || 'A product'}" passed review.` };
  if (a.includes('reject') && entity.toLowerCase() === 'product') return { title: 'Product Rejected', desc: `"${log.metadata?.name || 'A product'}" violates policy.` };
  return { title: log.action || 'System Event', desc: log.metadata?.note || `Entity: ${entity}` };
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-100 rounded-2xl ${className}`} />
);

// ─── Main Component ────────────────────────────────────────────────────────────
const ManagerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract tab from URL (e.g. /manager/shop_approval -> shop_approval)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeTab = pathParts.length > 1 ? pathParts[1] : 'dashboard';

  // Navigate to update URL instead of just local state
  const setActiveTab = (tabId) => {
    if (tabId === 'dashboard') {
      navigate('/manager/');
    } else {
      navigate(`/manager/${tabId}`);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Search tasks, shops, or products...';
      case 'shop_approval':
        return 'Search applications, MST...';
      case 'product_approval':
        return 'Search products, sellers, categories...';
      case 'violations':
        return 'Search reports, shop IDs...';
      default:
        return 'Search tasks, shops, or products...';
    }
  };
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: "Hello Manager! I'm your Operations Assistant. How can I help you streamline store approvals and violations today?" },
  ]);
  const aiEndRef = useRef(null);

  const [headerData, setHeaderData] = useState(null);

  useEffect(() => {
    setHeaderData(null);
  }, [activeTab]);

  // Dashboard data state
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState(null);

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(logout());
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/manager/dashboard`, {
          headers: getAuthHeader(),
        });
        if (data.success) {
          setDashData(data.data);
        }
      } catch (err) {
        console.error('Manager dashboard fetch error:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Fetch unread notifications
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await axios.get(`${API}/notifications`, {
          headers: getAuthHeader(),
        });
        if (data?.success) {
          const unread = (data.data || []).filter((n) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch { /* silent */ }
    };
    fetchUnread();
  }, [user]);

  // Auto-scroll AI chat
  useEffect(() => {
    if (showAI) aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, showAI]);

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const userMsg = { sender: 'user', text: aiInput };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput('');
    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Reviewing operational queues for "${userMsg.text}"... ${dashData?.stats?.pendingShops ?? 0} pending shop registrations require your attention.`,
        },
      ]);
    }, 900);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: 'dashboard', category: 'General' },
    { id: 'shop_approval', label: 'Shop Approval', icon: 'storefront', category: 'Approvals' },
    { id: 'product_approval', label: 'Product Approval', icon: 'inventory_2', category: 'Approvals' },
    { id: 'violations', label: 'Violations', icon: 'report_problem', category: 'Safety & Monitoring' },
    { id: 'statistics', label: 'Statistics', icon: 'bar_chart', category: 'Safety & Monitoring' },
  ];

  // Derived stats
  const stats = dashData?.stats || {};
  const trends = dashData?.approvalTrends || [];
  const pendingTasks = dashData?.pendingTasks || [];
  const recentActivity = dashData?.recentActivity || [];

  const maxTrend = Math.max(...trends.map((t) => t.count), 1);
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short' });

  // ─── Stat Cards config ───────────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Pending Shops',
      value: stats.pendingShops ?? '—',
      icon: 'storefront',
      bg: 'bg-blue-50',
      color: 'text-[#004ac6]',
      border: 'hover:border-[#004ac6]/40',
    },
    {
      label: 'Pending Products',
      value: stats.pendingProducts ?? '—',
      icon: 'inventory_2',
      bg: 'bg-orange-50',
      color: 'text-[#f59e0b]',
      border: 'hover:border-[#f59e0b]/40',
    },
    {
      label: 'Active Reports',
      value: stats.activeReports ?? '—',
      icon: 'report',
      bg: 'bg-red-50',
      color: 'text-[#dc2626]',
      border: 'hover:border-[#dc2626]/40',
    },
    {
      label: 'Resolved Today',
      value: stats.resolvedToday ?? '—',
      icon: 'check_circle',
      bg: 'bg-green-50',
      color: 'text-[#16a34a]',
      border: 'hover:border-[#16a34a]/40',
    },
  ];

  return (
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen flex font-['Manrope'] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <ManagerSidebar 
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        handleLogout={handleLogout}
      />

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#F8FAFC]">

        {/* Header */}
        <ManagerHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          headerData={headerData}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          getSearchPlaceholder={getSearchPlaceholder}
          unreadCount={unreadCount}
          user={user}
          navigate={navigate}
        />

        {/* ── Dashboard Tab ─────────────────────────────────────────────────── */}
        <div className="p-10 max-w-[1280px] mx-auto w-full space-y-10">
          {activeTab === 'dashboard' && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading
                  ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-44" />)
                  : statCards.map((card) => (
                      <div
                        key={card.label}
                        className={`bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm transition-all cursor-default ${card.border}`}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-3xl">{card.icon}</span>
                          </div>
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          {card.label}
                        </p>
                        <h3 className="text-3xl font-black text-slate-900">
                          {String(card.value).padStart(2, '0')}
                        </h3>
                      </div>
                    ))}
              </div>

              {/* Approval Trends Chart */}
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="mb-10">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Approval Trends</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Operational throughput over last 7 days
                  </p>
                </div>

                {loading ? (
                  <Skeleton className="h-80" />
                ) : (
                  <>
                    <div className="h-80 flex items-end gap-3 border-b border-slate-100 pb-2">
                      {trends.map((day) => {
                        const pct = maxTrend > 0 ? Math.max((day.count / maxTrend) * 100, 4) : 4;
                        const isToday = day.dayLabel === todayLabel;
                        return (
                          <div
                            key={day.date}
                            className={`flex-1 rounded-2xl transition-all relative group cursor-pointer ${
                              isToday
                                ? 'bg-[#004ac6] shadow-lg shadow-blue-100 hover:brightness-110'
                                : 'bg-[#004ac6]/10 hover:bg-[#004ac6]/30'
                            }`}
                            style={{ height: `${pct}%` }}
                          >
                            <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {day.count} actions
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-4 px-1">
                      {trends.map((day) => {
                        const isToday = day.dayLabel === todayLabel;
                        return (
                          <span
                            key={day.date}
                            className={`text-[10px] font-black uppercase tracking-widest ${
                              isToday ? 'text-[#004ac6]' : 'text-slate-400'
                            }`}
                          >
                            {day.dayLabel}{isToday ? ' ★' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Pending Tasks + Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* Pending Tasks */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Pending Tasks</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        High priority requests
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('shop_approval')}
                      className="text-[#004ac6] text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-4 overflow-y-auto h-[250px] pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                    {loading
                      ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)
                      : pendingTasks.length === 0
                      ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">check_circle</span>
                            <p className="text-sm font-bold text-slate-400">All caught up! No pending tasks.</p>
                          </div>
                        )
                      : pendingTasks.map((task) => {
                          const isShop = task.type === 'shop';
                          return (
                            <div
                              key={task.id}
                              onClick={() => {
                                if (task.type === 'shop') setActiveTab(`shop_detail/${task.id}`);
                                else if (task.type === 'product') setActiveTab(`product_detail/${task.id}`);
                                else if (task.type === 'violation') setActiveTab(`violation_detail/${task.id}`);
                              }}
                              className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#004ac6]/30 hover:bg-blue-50/30 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  task.type === 'shop' ? 'bg-blue-100 text-[#004ac6]' : 
                                  task.type === 'violation' ? 'bg-red-100 text-[#dc2626]' : 
                                  'bg-orange-100 text-[#f59e0b]'
                                }`}>
                                  <span className="material-symbols-outlined text-xl">{task.icon}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 line-clamp-1">{task.title}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{task.subtitle}</p>
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-slate-300 group-hover:text-[#004ac6] transition-colors shrink-0">
                                chevron_right
                              </span>
                            </div>
                          );
                        })}
                  </div>
                </div>

                {/* System Activity */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">System Activity</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Recent operation logs
                      </p>
                    </div>
                    <span className="w-2 h-2 bg-[#16a34a] rounded-full animate-pulse" />
                  </div>

                  <div className="space-y-7 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100 overflow-y-auto h-[250px] pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                    {loading
                      ? Array(3).fill(0).map((_, i) => (
                          <div key={i} className="relative pl-12 flex gap-3">
                            <Skeleton className="w-10 h-10 rounded-full absolute left-0 top-0" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-2/3" />
                              <Skeleton className="h-3 w-full" />
                            </div>
                          </div>
                        ))
                      : recentActivity.length === 0
                      ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">history</span>
                            <p className="text-sm font-bold text-slate-400">No recent activity found.</p>
                          </div>
                        )
                      : recentActivity.map((log) => {
                          const { icon, color } = getActivityIcon(log.action);
                          const { title, desc } = getActivityLabel(log);
                          return (
                            <div key={log.id} className="relative pl-12">
                              <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white border-4 border-[#F8FAFC] shadow-sm flex items-center justify-center z-10">
                                <span className="material-symbols-outlined text-lg" style={{ color }}>{icon}</span>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{title}</p>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{desc}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                                  {log.timeAgo} • By {log.actorName}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Shop Approval Tab */}
          {activeTab === 'shop_approval' && <ShopApprovalTab />}

          {/* Product Approval Tab */}
          {activeTab === 'product_approval' && <ProductApprovalTab />}

          {/* Violations Tab */}
          {activeTab === 'violations' && <ViolationsTab />}

          {/* Shop Detail Tab */}
          {activeTab === 'shop_detail' && <ManagerShopDetail shopId={pathParts[2]} />}

          {/* Product Detail Tab */}
          {activeTab === 'product_detail' && <ManagerProductDetail productId={pathParts[2]} />}

          {/* Violation Detail Tab */}
          {activeTab === 'violation_detail' && <ManagerViolationDetail violationId={pathParts[2]} setHeaderData={setHeaderData} />}

          {/* Other tabs placeholder */}
          {activeTab !== 'dashboard' && activeTab !== 'shop_approval' && activeTab !== 'shop_detail' && activeTab !== 'product_approval' && activeTab !== 'product_detail' && activeTab !== 'violations' && activeTab !== 'violation_detail' && (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-6xl text-[#004ac6] mb-4 animate-bounce">
                {navItems.find((i) => i.id === activeTab)?.icon}
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                {navItems.find((i) => i.id === activeTab)?.label}
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                This section is coming soon. All items will be organized by submission timestamp and priority score.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => toast.success(`Batch approving items in ${navItems.find((i) => i.id === activeTab)?.label}...`)}
                  className="px-6 py-3 bg-[#004ac6] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#004ac6]/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Batch Approve All
                </button>
                <button
                  onClick={() => toast.success(`Exporting audit log...`)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                >
                  Export Audit Log
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── FAB: AI Assistant ────────────────────────────────────────────── */}
        <ManagerAiAssistant
          showAI={showAI}
          setShowAI={setShowAI}
          aiInput={aiInput}
          setAiInput={setAiInput}
          aiMessages={aiMessages}
          handleAiSubmit={handleAiSubmit}
          unreadCount={unreadCount}
          aiEndRef={aiEndRef}
        />
      </main>
    </div>
  );
};

export default ManagerDashboard;
