import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import ThemeProvider, { usePlatform } from './components/ThemeProvider';

// --- Static Imports for Critical Components ---
import ProtectedRoute from './components/ProtectedRoute';

// --- Lazy Loaded Pages ---
const Register = lazy(() => import('./pages/customer/Register'));
const VerifyOTP = lazy(() => import('./pages/customer/VerifyOTP'));
const Login = lazy(() => import('./pages/customer/Login'));
const ForgotPassword = lazy(() => import('./pages/customer/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/customer/ResetPassword'));
const Profile = lazy(() => import('./pages/customer/Profile'));
const Home = lazy(() => import('./pages/customer/Home'));
const ProductDetail = lazy(() => import('./pages/customer/ProductDetail'));
const Search = lazy(() => import('./pages/customer/Search'));
const Cart = lazy(() => import('./pages/customer/Cart'));
const Wishlist = lazy(() => import('./pages/customer/Wishlist'));
const Notifications = lazy(() => import('./pages/customer/Notifications'));
const OrderHistory = lazy(() => import('./pages/customer/OrderHistory'));
const OrderDetail = lazy(() => import('./pages/customer/OrderDetail'));
const CancelOrder = lazy(() => import('./pages/customer/CancelOrder'));
const Reviews = lazy(() => import('./pages/customer/Reviews'));
const AddressBook = lazy(() => import('./pages/customer/AddressBook'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const SellerDashboard = lazy(() => import('./pages/seller/SellerDashboard'));
const SecuritySettings = lazy(() => import('./pages/customer/SecuritySettings'));
const DashboardProfile = lazy(() => import('./pages/customer/DashboardProfile'));
const DashboardSecurity = lazy(() => import('./pages/customer/DashboardSecurity'));
const DashboardBankAccounts = lazy(() => import('./pages/customer/DashboardBankAccounts'));
const UserStatistics = lazy(() => import('./pages/customer/UserStatistics'));
const DashboardShipperInfo = lazy(() => import('./pages/customer/DashboardShipperInfo'));
const RoleUpgrade = lazy(() => import('./pages/customer/RoleUpgrade'));
const ShipperDashboard = lazy(() => import('./pages/shipper/ShipperDashboard'));
const Checkout = lazy(() => import('./pages/customer/Checkout'));
const OrderSuccess = lazy(() => import('./pages/customer/OrderSuccess'));
const VNPayMock = lazy(() => import('./pages/customer/VNPayMock'));
const VNPayReturn = lazy(() => import('./pages/customer/VNPayReturn'));
const Coins = lazy(() => import('./pages/customer/Coins'));
const ShopDetail = lazy(() => import('./pages/customer/ShopDetail'));
const RecentlyViewed = lazy(() => import('./pages/customer/RecentlyViewed'));
const Promotions = lazy(() => import('./pages/customer/Promotions'));
const Blog = lazy(() => import('./pages/customer/Blog'));
const BlogDetail = lazy(() => import('./pages/customer/BlogDetail'));
const Support = lazy(() => import('./pages/customer/Support'));
const PolicyDetail = lazy(() => import('./pages/customer/PolicyDetail'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

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
              style: { maxWidth: '500px' }
            }} 
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile" element={<Navigate to="/user/profile" replace />} />
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
          </Suspense>
        </Router>
      </MaintenanceGuard>
    </ThemeProvider>
  );
}

export default App;
