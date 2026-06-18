import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/customer/Register';
import VerifyOTP from './pages/customer/VerifyOTP';
import Login from './pages/customer/Login';
import ForgotPassword from './pages/customer/ForgotPassword';
import ResetPassword from './pages/customer/ResetPassword';
import Profile from './pages/customer/Profile';
import Home from './pages/customer/Home';
import ProductDetail from './pages/customer/ProductDetail';
import Search from './pages/customer/Search';
import Cart from './pages/customer/Cart';
import Wishlist from './pages/customer/Wishlist';
import Notifications from './pages/customer/Notifications';
import OrderHistory from './pages/customer/OrderHistory';
import OrderDetail from './pages/customer/OrderDetail';
import CancelOrder from './pages/customer/CancelOrder';
import Reviews from './pages/customer/Reviews';
import AddressBook from './pages/customer/AddressBook';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import SellerDashboard from './pages/seller/SellerDashboard';
import SecuritySettings from './pages/customer/SecuritySettings';
import DashboardProfile from './pages/customer/DashboardProfile';
import DashboardSecurity from './pages/customer/DashboardSecurity';
import DashboardBankAccounts from './pages/customer/DashboardBankAccounts';
import UserStatistics from './pages/customer/UserStatistics';
import DashboardShipperInfo from './pages/customer/DashboardShipperInfo';
import RoleUpgrade from './pages/customer/RoleUpgrade';
import ShipperDashboard from './pages/shipper/ShipperDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Checkout from './pages/customer/Checkout';
import OrderSuccess from './pages/customer/OrderSuccess';
import VNPayMock from './pages/customer/VNPayMock';
import VNPayReturn from './pages/customer/VNPayReturn';
import Coins from './pages/customer/Coins';
import ShopDetail from './pages/customer/ShopDetail';
import RecentlyViewed from './pages/customer/RecentlyViewed';
import Promotions from './pages/customer/Promotions';
import Blog from './pages/customer/Blog';
import BlogDetail from './pages/customer/BlogDetail';
import Support from './pages/customer/Support';
import PolicyDetail from './pages/customer/PolicyDetail';


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

const originalSuccess = toast.success;
toast.success = (message, options) => {
  toast.dismiss();
  return originalSuccess(message, { ...options, id: 'global-toast' });
};

const originalError = toast.error;
toast.error = (message, options) => {
  toast.dismiss();
  return originalError(message, { ...options, id: 'global-toast' });
};

function App() {
  const { user } = useSelector((state) => state.auth);

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
        <Route path="/role-upgrade" element={<ProtectedRoute><RoleUpgrade /></ProtectedRoute>} />
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
        <Route path="/support" element={<Support />} />
        <Route path="/support/policy/:slug" element={<PolicyDetail />} />
        
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
        <Route path="/shipper/info" element={<ProtectedRoute allowedRoles={['shipper']}><DashboardShipperInfo /></ProtectedRoute>} />
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

