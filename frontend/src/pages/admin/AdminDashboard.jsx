import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../redux/authSlice';
import toast from 'react-hot-toast';
import axios from 'axios';

// Import subcomponents
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminDashboardOverview from '../../components/admin/AdminDashboardOverview';
import AdminAiAssistant from '../../components/admin/AdminAiAssistant';
import UserManagementTab from '../../components/admin/UserManagementTab';
import PromotionsTab from '../../components/admin/PromotionsTab';
import CampaignEditor from '../../components/admin/CampaignEditor';
import CouponEditor from '../../components/admin/CouponEditor';
import FinanceSettingsTab from '../../components/admin/FinanceSettingsTab';
import WithdrawalApprovalTab from '../../components/admin/WithdrawalApprovalTab';
import LogisticsPartnersTab from '../../components/admin/LogisticsPartnersTab';
import SecurityLogsTab from '../../components/admin/SecurityLogsTab';
import UIConfigTab from '../../components/admin/UIConfigTab';
import RBACTab from '../../components/admin/RBACTab';
import BlogManagementTab from '../../components/admin/BlogManagementTab';
import BlogEditor from '../../components/admin/BlogEditor';
import PlatformSettingsTab from '../../components/admin/PlatformSettingsTab';
import UserSupportTab from '../../components/admin/UserSupportTab';
import RoleUpgradesTab from '../../components/admin/RoleUpgradesTab';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // URL-based Tab routing
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeTab = pathParts.length > 1 ? pathParts[1] : 'dashboard';
  const isEditorPage = 
    (activeTab === 'promotions' && pathParts.length > 2 && (pathParts[2] === 'coupon' || pathParts[2] === 'campaign')) ||
    (activeTab === 'blog' && pathParts.length > 2 && (pathParts[2] === 'create' || pathParts[2] === 'edit'));

  const setActiveTab = (tabId) => {
    if (tabId === 'dashboard') {
      navigate('/admin/');
    } else {
      navigate(`/admin/${tabId}`);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [applyChangesHandler, setApplyChangesHandler] = useState(null);
  const [applyingState, setApplyingState] = useState(false);
  const [addPartnerTrigger, setAddPartnerTrigger] = useState(null);
  const [addRoleTrigger, setAddRoleTrigger] = useState(null);
  const [activePlatformTab, setActivePlatformTab] = useState('general');
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
    { id: 'role_upgrades', label: 'Role Upgrades', icon: 'verified_user', category: 'Management' },
    { id: 'promotions', label: 'Promotions', icon: 'campaign', category: 'Management' },
    { id: 'support', label: 'User Support', icon: 'support_agent', category: 'Management' },
    { id: 'finance_config', label: 'Finance Settings', icon: 'account_balance', category: 'Management' },
    { id: 'withdrawals', label: 'Withdrawal Approval', icon: 'payments', category: 'Management' },
    { id: 'logistics', label: 'Logistics Partners', icon: 'local_shipping', category: 'Management' },
    { id: 'rbac', label: 'Access Control', icon: 'admin_panel_settings', category: 'Security' },
    { id: 'security_logs', label: 'Security Logs', icon: 'security', category: 'Security' },
    { id: 'blog', label: 'Blog Management', icon: 'article', category: 'Content' },
    { id: 'ui_config', label: 'UI/UX Settings', icon: 'palette', category: 'Appearance' },
    { id: 'platform_settings', label: 'Platform Settings', icon: 'settings', category: 'Appearance' },
  ];

  return (
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen flex font-sans overflow-hidden">
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
        {!isEditorPage && (
          <AdminHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            unreadCount={unreadCount}
            user={user}
            navigate={navigate}
            showApplyButton={!!applyChangesHandler}
            onApplyChanges={applyChangesHandler}
            applying={applyingState}
            addPartnerTrigger={addPartnerTrigger}
            addRoleTrigger={addRoleTrigger}
            addPostTrigger={activeTab === 'blog' ? () => navigate('/admin/blog/create') : null}
            activeTab={activeTab}
            activePlatformTab={activePlatformTab}
            setActivePlatformTab={setActivePlatformTab}
          />
        )}

        {/* Dashboard Body */}
        {isEditorPage ? (
          activeTab === 'promotions' ? (
            <>
              {pathParts.length > 2 && pathParts[2] === 'coupon' && (
                <CouponEditor mode={pathParts[3] || 'create'} />
              )}
              {pathParts.length > 2 && pathParts[2] === 'campaign' && (
                <CampaignEditor mode={pathParts[3] || 'create'} />
              )}
            </>
          ) : activeTab === 'blog' ? (
            <BlogEditor mode={pathParts[2] || 'create'} postId={pathParts[3]} />
          ) : null
        ) : activeTab === 'platform_settings' ? (
          <PlatformSettingsTab activeInnerTab={activePlatformTab} />
        ) : (
          <div className="p-[10px] max-w-[1280px] mx-auto w-full space-y-8">
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

            {activeTab === 'users' && (
              <UserManagementTab searchTerm={searchTerm} />
            )}

            {activeTab === 'promotions' && (
              <>
                {pathParts.length === 2 && <PromotionsTab searchTerm={searchTerm} />}
              </>
            )}

            {activeTab === 'support' && (
              <UserSupportTab searchTerm={searchTerm} />
            )}

            {activeTab === 'role_upgrades' && (
              <RoleUpgradesTab searchTerm={searchTerm} />
            )}

            {activeTab === 'finance_config' && (
              <FinanceSettingsTab 
                searchTerm={searchTerm} 
                setApplyChangesHandler={setApplyChangesHandler}
                setApplyingState={setApplyingState}
              />
            )}

            {activeTab === 'withdrawals' && (
              <WithdrawalApprovalTab searchTerm={searchTerm} />
            )}

            {activeTab === 'logistics' && (
              <LogisticsPartnersTab searchTerm={searchTerm} setAddPartnerTrigger={setAddPartnerTrigger} />
            )}
            {activeTab === 'security_logs' && (
              <SecurityLogsTab searchTerm={searchTerm} />
            )}
            {activeTab === 'ui_config' && (
              <UIConfigTab 
                setApplyChangesHandler={setApplyChangesHandler}
                setApplyingState={setApplyingState}
              />
            )}
            {activeTab === 'rbac' && (
              <RBACTab searchTerm={searchTerm} setAddRoleTrigger={setAddRoleTrigger} />
            )}
            {activeTab === 'blog' && (
              <BlogManagementTab searchTerm={searchTerm} navigate={navigate} />
            )}

            {activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'promotions' && activeTab !== 'support' && activeTab !== 'finance_config' && activeTab !== 'withdrawals' && activeTab !== 'logistics' && activeTab !== 'security_logs' && activeTab !== 'ui_config' && activeTab !== 'rbac' && activeTab !== 'blog' && activeTab !== 'platform_settings' && activeTab !== 'role_upgrades' && (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-6xl text-primary mb-4 animate-bounce">
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
                  className="px-6 py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
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
      )}

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
