import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { logout } from '../../redux/authSlice';
import axios from 'axios';

import SellerProducts from '../../components/seller/SellerProducts';
import SellerAddProduct from '../../components/seller/SellerAddProduct';
import SellerOrders from '../../components/seller/SellerOrders';
import SellerOrderDetail from '../../components/seller/SellerOrderDetail';
import SellerCancellations from '../../components/seller/SellerCancellations';
import SellerAnalytics from '../../components/seller/SellerAnalytics';
import SellerSettings from '../../components/seller/SellerSettings';
import SellerWallet from '../../components/seller/SellerWallet';
import SellerReviews from '../../components/seller/SellerReviews';
import SellerMessages from '../../components/seller/SellerMessages';

import SellerSidebar from '../../components/seller/SellerSidebar';
import SellerHeader from '../../components/seller/SellerHeader';
import SellerDashboardOverview from '../../components/seller/SellerDashboardOverview';

const SellerOrderDetailWrapper = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  return <SellerOrderDetail orderId={orderId} onBack={() => navigate('/seller/orders')} />;
};

const SellerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [walletBalance, setWalletBalance] = useState(0);
  const [shopStatus, setShopStatus] = useState('loading');
  const [shopReason, setShopReason] = useState('');

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      if (!token) return;
      const res = await axios.get('http://localhost:5000/api/seller/wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setWalletBalance(res.data.data.total_balance ?? 0);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance for sidebar:', error);
    }
  };

  const fetchShopStatus = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      if (!token) return;
      const res = await axios.get('http://localhost:5000/api/seller/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        if (!res.data.data) {
          setShopStatus('not_created');
        } else {
          setShopStatus(res.data.data.status || 'pending');
          setShopReason(res.data.data.rejection_reason || '');
        }
      }
    } catch (error) {
      console.error('Failed to fetch shop status:', error);
      setShopStatus('error');
    }
  };

  useEffect(() => {
    if (user) {
      fetchShopStatus();
    }
  }, [user]);

  const getTabFromUrl = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 1) {
      if (pathParts[1] === 'orders' && pathParts.length > 2) {
        return 'order-detail';
      }
      return pathParts[1];
    }
    return 'dashboard';
  };
  const activeTab = getTabFromUrl();

  const setActiveTab = (tab) => {
    navigate(`/seller/${tab}`);
  };

  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length === 1 && pathParts[0] === 'seller') {
      navigate('/seller/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Gate access to other tabs if shop is not active
  useEffect(() => {
    if (shopStatus !== 'loading' && shopStatus !== 'active' && activeTab !== 'settings') {
      navigate('/seller/settings', { replace: true });
    }
  }, [shopStatus, activeTab, navigate]);

  const [selectedOrderId, setSelectedOrderId] = useState(() => {
    return sessionStorage.getItem('sellerSelectedOrderId') || null;
  });

  useEffect(() => {
    if (selectedOrderId) {
      sessionStorage.setItem('sellerSelectedOrderId', selectedOrderId);
    } else {
      sessionStorage.removeItem('sellerSelectedOrderId');
    }
  }, [selectedOrderId]);

  const [currentOrder, setCurrentOrder] = useState({ code: '', status: '' });
  useEffect(() => {
    const handleSetOrderCode = (e) => setCurrentOrder(e.detail);
    window.addEventListener('set-order-code', handleSetOrderCode);
    return () => window.removeEventListener('set-order-code', handleSetOrderCode);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
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

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard': return { title: 'Dashboard Overview', icon: 'dashboard' };
      case 'products': return { title: 'Products Management', icon: 'inventory_2' };
      case 'add-product': return {
        title: location.state?.editProduct ? 'Edit Product' : 'Add New Product',
        icon: location.state?.editProduct ? 'edit' : 'add_circle'
      };
      case 'orders': return { title: 'Orders Management', icon: 'shopping_cart' };
      case 'order-detail': return { title: `Order Details #${location.pathname.split('/').pop()}`, icon: 'receipt_long' };
      case 'cancellations': return { title: 'Cancellations', icon: 'cancel' };
      case 'analytics': return { title: 'Business Analytics', icon: 'analytics' };
      case 'reviews': return { title: 'Reviews Management', icon: 'star' };
      case 'messages': return { title: 'Messages', icon: 'chat_bubble' };
      case 'wallet': return { title: 'Financial Management', icon: 'account_balance' };
      case 'settings': return { title: 'Shop Settings', icon: 'settings' };
      default: return { title: 'Seller Center', icon: 'dashboard_customize' };
    }
  };

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    }
  }, [user, location.pathname]);

  return (
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen flex font-sans overflow-hidden">
      <SellerSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
        handleLogout={handleLogout}
        walletBalance={walletBalance}
        shopStatus={shopStatus}
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#F8FAFC]">
        <SellerHeader
          activeTab={activeTab}
          headerInfo={getHeaderInfo()}
          currentOrder={currentOrder}
          user={user}
          navigate={navigate}
        />

        {shopStatus === 'loading' ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : shopStatus !== 'active' && activeTab !== 'settings' ? (
           <div className="p-10 max-w-[1280px] mx-auto w-full space-y-8 flex-1">
             <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center">
               <span className="material-symbols-outlined text-6xl text-orange-500 mb-4">
                 storefront
               </span>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                 Shop Configuration Required
               </h2>
               <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                 You must configure your shop profile and have it approved by the manager before you can access this feature.
               </p>
               <button
                 onClick={() => navigate('/seller/settings')}
                 className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-blue-200"
               >
                 Go to Settings
               </button>
             </div>
           </div>
        ) : (
          <Routes>
            <Route path="dashboard" element={
              <SellerDashboardOverview setActiveTab={setActiveTab} setSelectedOrderId={setSelectedOrderId} />
            } />
            <Route path="products" element={<SellerProducts setActiveTab={setActiveTab} />} />
            <Route path="add-product" element={<SellerAddProduct setActiveTab={setActiveTab} />} />
            <Route path="orders" element={<SellerOrders onViewDetails={(id) => navigate(`/seller/orders/${id}`)} />} />
            <Route path="orders/:orderId" element={<SellerOrderDetailWrapper />} />
            <Route path="cancellations" element={<SellerCancellations setActiveTab={setActiveTab} onViewDetails={(id) => navigate(`/seller/orders/${id}`)} />} />
            <Route path="analytics" element={<SellerAnalytics setActiveTab={setActiveTab} />} />
            <Route path="wallet" element={<SellerWallet />} />
            <Route path="reviews" element={<SellerReviews />} />
            <Route path="settings" element={<SellerSettings setActiveTab={setActiveTab} />} />
            <Route path="messages" element={<div className="p-10 max-w-[1280px] mx-auto w-full"><SellerMessages /></div>} />

            <Route path="*" element={
              <div className="p-10 max-w-[1280px] mx-auto w-full space-y-8">
                <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-6xl text-primary mb-4 animate-bounce">
                    {navItems.find(i => i.id === activeTab)?.icon || 'dashboard'}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                    {navItems.find(i => i.id === activeTab)?.label || 'Page'} Management
                  </h2>
                  <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                    Manage your store {navItems.find(i => i.id === activeTab)?.label?.toLowerCase() || 'features'} efficiently. Use the tools below to add new listings, update stock levels, or handle customer requests.
                  </p>
                </div>
              </div>
            } />
          </Routes>
        )}

        {/* Floating Action Buttons / Chat Windows */}
      </main>
    </div>
  );
};

export default SellerDashboard;
