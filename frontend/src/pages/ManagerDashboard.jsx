import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import toast from 'react-hot-toast';
import axios from 'axios';

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

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: "Hello Manager! I'm your Operations Assistant. How can I help you streamline store approvals and violations today?" },
  ]);
  const aiEndRef = useRef(null);

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
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 z-50 shadow-sm">
        {/* Brand */}
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#004ac6] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">
              UM
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-lg leading-tight tracking-tighter">Manager</h2>
              <p className="text-[10px] text-[#004ac6] font-black uppercase tracking-widest">Operations Hub</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => {
            const showCategory = index === 0 || navItems[index - 1].category !== item.category;
            return (
              <React.Fragment key={item.id}>
                {showCategory && (
                  <div className="pt-5 pb-2 px-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {item.category}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-sm font-medium group cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-[#E8EFFF] text-[#004ac6] font-bold shadow-sm'
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

        {/* System Health */}
        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Operational Health</span>
              <span className="w-2 h-2 bg-[#16a34a] rounded-full animate-pulse" />
            </div>
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#16a34a]" style={{ width: '98%' }} />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Uptime: 99.9% | Pending: {(stats.pendingShops ?? 0) + (stats.pendingProducts ?? 0)}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-[#dc2626] hover:bg-red-100 transition-all rounded-xl text-sm font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Exit Manager</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#F8FAFC]">

        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[#004ac6] text-2xl">engineering</span>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">Operations Intelligence</h1>
            <div className="ml-8 hidden md:flex items-center bg-[#F1F5F9] rounded-2xl px-4 py-2.5 w-96 group focus-within:ring-2 focus-within:ring-[#004ac6]/20 transition-all border border-slate-200/60">
              <span className="material-symbols-outlined text-slate-400 text-xl group-focus-within:text-[#004ac6]">search</span>
              <input
                type="text"
                placeholder="Search tasks, shops, or products..."
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 font-medium ml-2 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/notifications')}
              className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl transition-all relative cursor-pointer border border-slate-100"
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#dc2626] text-[10px] text-white flex items-center justify-center rounded-full font-bold shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-3 bg-[#F1F5F9] pl-1 pr-4 py-1 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all group">
              <div className="w-8 h-8 rounded-full bg-[#004ac6] flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-200">
                {user?.fullName?.slice(0, 2).toUpperCase() || 'NB'}
              </div>
              <span className="text-sm font-bold text-slate-700">{user?.fullName || 'Operations Manager'}</span>
              <span className="material-symbols-outlined text-slate-400 text-lg group-hover:translate-y-0.5 transition-transform">expand_more</span>
            </div>
          </div>
        </header>

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

                  <div className="space-y-4 flex-1">
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
                              onClick={() => setActiveTab(isShop ? 'shop_approval' : 'product_approval')}
                              className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#004ac6]/30 hover:bg-blue-50/30 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isShop ? 'bg-blue-100 text-[#004ac6]' : 'bg-orange-100 text-[#f59e0b]'}`}>
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

                  <div className="space-y-7 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100 flex-1 overflow-y-auto max-h-96">
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

          {/* Other tabs placeholder */}
          {activeTab !== 'dashboard' && (
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
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
          <button
            onClick={() => setShowAI(!showAI)}
            className="w-16 h-16 bg-[#004ac6] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all group relative border border-white/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-3xl">smart_toy</span>
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-white text-[#dc2626] font-black flex items-center justify-center rounded-full border-2 border-[#dc2626] shadow-lg text-[11px]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              AI Assistant
            </span>
          </button>
        </div>

        {/* ── AI Chat Window ───────────────────────────────────────────────── */}
        {showAI && (
          <div className="fixed bottom-28 right-8 w-96 h-[560px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col z-[60] overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-[#004ac6] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Manager AI Assistant</h3>
                  <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Operations Expert</p>
                </div>
              </div>
              <button
                onClick={() => setShowAI(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 flex flex-col">
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
              <div ref={aiEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <form onSubmit={handleAiSubmit} className="flex gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200/60">
                <input
                  type="text"
                  placeholder="Ask AI anything..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium px-2 outline-none"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-10 h-10 bg-[#004ac6] text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all cursor-pointer shadow-md shadow-[#004ac6]/20"
                >
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

export default ManagerDashboard;
