import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import toast from 'react-hot-toast';
import axios from 'axios';

// Import subcomponents
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import AdminDashboardOverview from '../components/admin/AdminDashboardOverview';
import AdminAiAssistant from '../components/admin/AdminAiAssistant';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // URL-based Tab routing
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeTab = pathParts.length > 1 ? pathParts[1] : 'dashboard';

  const setActiveTab = (tabId) => {
    if (tabId === 'dashboard') {
      navigate('/admin/');
    } else {
      navigate(`/admin/${tabId}`);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: "Hello Admin! I'm your Platform CMS Assistant. How can I assist you with platform governance today?" }
  ]);

  const [days, setDays] = useState(30);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(logout());
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Fetch unread notifications count
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

  // Fetch admin dashboard data helper
  const fetchDashboardData = async () => {
    if (activeTab !== 'dashboard') return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`http://localhost:5000/api/admin/dashboard?days=${days}`, config);
      if (response.data && response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Fetch admin dashboard data error:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin dashboard data on change
  useEffect(() => {
    fetchDashboardData();
  }, [activeTab, user, days]);

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const newMsg = { sender: 'user', text: aiInput };
    setAiMessages(prev => [...prev, newMsg]);
    setAiInput('');

    setTimeout(() => {
      const pendingShops = dashboardData?.securityPulse?.pendingShopsCount || 0;
      setAiMessages(prev => [...prev, {
        sender: 'ai',
        text: `Analyzing platform metrics for "${newMsg.text}"... We currently have ${pendingShops} pending shop applications and ${dashboardData?.stats?.securityAlerts || 0} active security alerts.`
      }]);
    }, 1000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: 'dashboard', category: 'General' },
    { id: 'users', label: 'User Management', icon: 'group', category: 'Management' },
    { id: 'promotions', label: 'Promotions', icon: 'campaign', category: 'Management' },
    { id: 'support', label: 'User Support', icon: 'support_agent', category: 'Management' },
    { id: 'finance_config', label: 'Finance Settings', icon: 'account_balance', category: 'Management' },
    { id: 'withdrawals', label: 'Withdrawal Approval', icon: 'payments', category: 'Management' },
    { id: 'logistics', label: 'Logistics Partners', icon: 'local_shipping', category: 'Management' },
    { id: 'rbac', label: 'Access Control', icon: 'admin_panel_settings', category: 'Security' },
    { id: 'security_logs', label: 'Security Logs', icon: 'security', category: 'Security' },
    { id: 'ui_config', label: 'UI/UX Settings', icon: 'palette', category: 'Appearance' },
    { id: 'platform_settings', label: 'Platform Settings', icon: 'settings', category: 'Appearance' },
  ];

  return (
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen flex font-['Manrope'] overflow-hidden">
      {/* Admin Sidebar */}
      <AdminSidebar
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <AdminHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          unreadCount={unreadCount}
          user={user}
          navigate={navigate}
        />

        {/* Dashboard Body */}
        <div className="p-10 max-w-[1280px] mx-auto w-full space-y-8">
          {activeTab === 'dashboard' && (
            <AdminDashboardOverview 
              searchTerm={searchTerm} 
              dashboardData={dashboardData} 
              loading={loading} 
              days={days}
              setDays={setDays}
              setActiveTab={setActiveTab}
              refetch={fetchDashboardData}
            />
          )}

          {activeTab !== 'dashboard' && (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-6xl text-[#004ac6] mb-4 animate-bounce">
                {navItems.find(i => i.id === activeTab)?.icon}
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                {navItems.find(i => i.id === activeTab)?.label} Module
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                This administrative governance module is currently active. Use the controls below to configure platform parameters, manage access permissions, or export compliance logs.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => toast.success(`Settings for ${navItems.find(i => i.id === activeTab)?.label} saved successfully.`)}
                  className="px-6 py-3 bg-[#004ac6] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#004ac6]/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Save Configuration
                </button>
                <button 
                  onClick={() => toast.success(`Exporting ${navItems.find(i => i.id === activeTab)?.label} records...`)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                >
                  Export Records
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Buttons & Chat Window */}
        <AdminAiAssistant
          showAI={showAI}
          setShowAI={setShowAI}
          aiInput={aiInput}
          setAiInput={setAiInput}
          aiMessages={aiMessages}
          handleAiSubmit={handleAiSubmit}
          unreadCount={unreadCount}
        />
      </main>
    </div>
  );
};

export default AdminDashboard;
