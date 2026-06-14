import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { logout } from '../redux/authSlice';

import ShipperSidebar from '../components/shipper/ShipperSidebar';
import ShipperHeader from '../components/shipper/ShipperHeader';
import ShipperDashboardOverview from '../components/shipper/ShipperDashboardOverview';
import ShipperOrders from '../components/shipper/ShipperOrders';
import ShipperStatistics from '../components/shipper/ShipperStatistics';
import ShipperOrderDetail from '../components/shipper/ShipperOrderDetail';

const ShipperDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromUrl = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 1) {
      return pathParts[1];
    }
    return 'dashboard';
  };
  const activeTab = getTabFromUrl();

  const setActiveTab = (tab) => {
    navigate(`/shipper/${tab}`);
  };

  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length === 1 && pathParts[0] === 'shipper') {
      navigate('/shipper/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', category: 'Main' },
    { id: 'orders', label: 'Assigned Orders', icon: 'local_shipping', category: 'Main' },
    { id: 'statistics', label: 'Statistics', icon: 'analytics', category: 'Main' }
  ];

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard': return { title: 'Shipper Dashboard', icon: 'dashboard' };
      case 'orders': return { title: 'Delivery Orders', icon: 'local_shipping' };
      case 'statistics': return { title: 'Delivery Statistics', icon: 'analytics' };
      default: return { title: 'Shipper Center', icon: 'dashboard_customize' };
    }
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen flex font-['Manrope'] overflow-hidden">
      <ShipperSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        navItems={navItems} 
        handleLogout={handleLogout} 
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#F8FAFC]">
        <ShipperHeader 
          activeTab={activeTab} 
          headerInfo={getHeaderInfo()} 
          user={user} 
          navigate={navigate} 
        />

        <Routes>
          <Route path="dashboard" element={<ShipperDashboardOverview setActiveTab={setActiveTab} />} />
          <Route path="orders" element={<ShipperOrders />} />
          <Route path="orders/:status" element={<ShipperOrders />} />
          <Route path="order-detail/:id" element={<ShipperOrderDetail />} />
          <Route path="statistics" element={<ShipperStatistics />} />
          <Route path="statistics/:timeframe" element={<ShipperStatistics />} />
          
          <Route path="*" element={
            <div className="p-10 max-w-[1280px] mx-auto w-full space-y-8">
              <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-6xl text-[#004ac6] mb-4 animate-bounce">
                  {navItems.find(i => i.id === activeTab)?.icon || 'dashboard'}
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                  {navItems.find(i => i.id === activeTab)?.label || 'Page'}
                </h2>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                  Manage your deliveries efficiently.
                </p>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default ShipperDashboard;
