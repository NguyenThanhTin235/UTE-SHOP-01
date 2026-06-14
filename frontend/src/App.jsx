import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Search from './pages/Search';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Notifications from './pages/Notifications';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import CancelOrder from './pages/CancelOrder';
import Reviews from './pages/Reviews';
import AddressBook from './pages/AddressBook';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import SecuritySettings from './pages/SecuritySettings';
import DashboardProfile from './pages/DashboardProfile';
import DashboardSecurity from './pages/DashboardSecurity';
import DashboardBankAccounts from './pages/DashboardBankAccounts';
import UserStatistics from './pages/UserStatistics';
import ShipperDashboard from './pages/ShipperDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import VNPayMock from './pages/VNPayMock';
import VNPayReturn from './pages/VNPayReturn';
import Coins from './pages/Coins';
import ShopDetail from './pages/ShopDetail';
import RecentlyViewed from './pages/RecentlyViewed';
import Promotions from './pages/Promotions';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';


import { Toaster, useToasterStore, toast } from 'react-hot-toast';
import { useEffect } from 'react';

import { useSelector } from 'react-redux';
import ThemeProvider, { usePlatform } from './components/ThemeProvider';

const MaintenanceGuard = ({ children }) => {
  const { isMaintenanceMode, maintenanceMessage, platformSettings } = usePlatform() || {};
  const { user } = useSelector((state) => state.auth);
  const storeName = platformSettings?.storeName || 'UTEShop';
  const logoUrl = platformSettings?.logoUrl;

  // Allow admin users to bypass maintenance mode
  if (isMaintenanceMode && (!user || user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8ff] px-4">
        <div className="text-center space-y-6 max-w-md">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} className="h-16 w-16 object-contain rounded-2xl mx-auto shadow-lg" />
          ) : (
            <span className="material-symbols-outlined text-6xl text-primary">construction</span>
          )}
          <h1 className="text-3xl font-extrabold text-[#131b2e] tracking-tight">{storeName}</h1>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#c3c6d7]/30">
            <span className="material-symbols-outlined text-4xl text-primary mb-4 block">engineering</span>
            <h2 className="text-xl font-bold text-[#131b2e] mb-3">Under Maintenance</h2>
            <p className="text-[#434655] leading-relaxed">{maintenanceMessage}</p>
          </div>
          <p className="text-sm text-[#434655]/60">We'll be back shortly. Thank you for your patience.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const RoleBasedRedirect = ({ user }) => {
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        window.location.href = '/admin/';
      } else if (user.role === 'manager') {
        window.location.href = '/manager/';
      } else if (user.role === 'seller' || user.role === 'vendor') {
        window.location.href = '/seller/';
      } else if (user.role === 'shipper') {
        window.location.href = '/shipper/';
      } else {
        window.location.href = '/';
      }
    }
  }, [user]);
  return null;
};

function App() {
  const { user } = useSelector((state) => state.auth);
  const { toasts } = useToasterStore();

  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= 1)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  return (
    <ThemeProvider>
      <MaintenanceGuard>
      <Router>
        <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
          duration: 3000,
          style: {
            maxWidth: '500px'
          }
        }} 
      />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/user/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/order-history" element={user ? <OrderHistory /> : <Navigate to="/login" />} />
        <Route path="/order-history/:orderId" element={user ? <OrderDetail /> : <Navigate to="/login" />} />
        <Route path="/order-history/:orderId/cancel" element={user ? <CancelOrder /> : <Navigate to="/login" />} />
        <Route path="/reviews" element={user ? <Reviews /> : <Navigate to="/login" />} />
        <Route path="/wishlist" element={user ? <Wishlist /> : <Navigate to="/login" />} />
        <Route path="/recently-viewed" element={user ? <RecentlyViewed /> : <Navigate to="/login" />} />
        <Route path="/address-book" element={user ? <AddressBook /> : <Navigate to="/login" />} />
        <Route path="/security" element={<ProtectedRoute><SecuritySettings /></ProtectedRoute>} />
        <Route path="/user/statistics" element={<ProtectedRoute><UserStatistics /></ProtectedRoute>} />
        <Route path="/coins" element={user ? <Coins /> : <Navigate to="/login" />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={user ? <Checkout /> : <Navigate to="/login" />} />
        <Route path="/order-success" element={user ? <OrderSuccess /> : <Navigate to="/login" />} />
        <Route path="/vnpay-mock" element={user ? <VNPayMock /> : <Navigate to="/login" />} />
        <Route path="/payment/vnpay/return" element={user ? <VNPayReturn /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/login" element={!user ? <Login /> : <RoleBasedRedirect user={user} />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/shop/:slug" element={<ShopDetail />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><DashboardProfile /></ProtectedRoute>} />
        <Route path="/admin/security" element={<ProtectedRoute allowedRoles={['admin']}><DashboardSecurity /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        
        <Route path="/manager/profile" element={<ProtectedRoute allowedRoles={['manager']}><DashboardProfile /></ProtectedRoute>} />
        <Route path="/manager/security" element={<ProtectedRoute allowedRoles={['manager']}><DashboardSecurity /></ProtectedRoute>} />
        <Route path="/manager/*" element={<ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
        
        <Route path="/seller/profile" element={<ProtectedRoute allowedRoles={['seller', 'vendor']}><DashboardProfile /></ProtectedRoute>} />
        <Route path="/seller/security" element={<ProtectedRoute allowedRoles={['seller', 'vendor']}><DashboardSecurity /></ProtectedRoute>} />
        <Route path="/seller/bank-accounts" element={<ProtectedRoute allowedRoles={['seller', 'vendor']}><DashboardBankAccounts /></ProtectedRoute>} />
        <Route path="/seller/*" element={<ProtectedRoute allowedRoles={['seller', 'vendor']}><SellerDashboard /></ProtectedRoute>} />

        <Route path="/shipper/profile" element={<ProtectedRoute allowedRoles={['shipper']}><DashboardProfile /></ProtectedRoute>} />
        <Route path="/shipper/security" element={<ProtectedRoute allowedRoles={['shipper']}><DashboardSecurity /></ProtectedRoute>} />
        <Route path="/shipper/*" element={<ProtectedRoute allowedRoles={['shipper']}><ShipperDashboard /></ProtectedRoute>} />

        <Route path="/" element={<Home />} />
      </Routes>
      </Router>
      </MaintenanceGuard>
    </ThemeProvider>
  );
}

export default App;

