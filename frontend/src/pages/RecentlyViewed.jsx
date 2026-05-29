import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { logout } from '../redux/authSlice';

const RecentlyViewed = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 8
  });

  const fetchRecentlyViewed = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token') || ''}`,
        },
        params: {
          page: currentPage,
          limit: 8
        }
      };
      const response = await axios.get('http://localhost:5000/api/users/recently-viewed', config);
      if (response.data && response.data.success) {
        setItems(response.data.data || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Fetch recently viewed error:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchRecentlyViewed();
  }, [user, navigate, currentPage]);

  const handleRemoveItem = async (productId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token') || ''}`,
        },
      };
      const response = await axios.delete(`http://localhost:5000/api/users/recently-viewed/${productId}`, config);
      if (response.data && response.data.success) {
        toast.success('Removed from recently viewed');
        fetchRecentlyViewed();
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear your entire recently viewed history?')) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token') || ''}`,
        },
      };
      const response = await axios.delete('http://localhost:5000/api/users/recently-viewed', config);
      if (response.data && response.data.success) {
        toast.success('Recently viewed history cleared');
        setCurrentPage(1);
        setItems([]);
        setPagination({ total: 0, totalPages: 1, limit: 8 });
      }
    } catch (error) {
      toast.error('Failed to clear history');
    }
  };

  const handleAddToCart = async (item) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(
        'http://localhost:5000/api/cart/add',
        {
          productId: item.productId,
          variantId: null,
          quantity: 1
        },
        config
      );
      if (response.data && response.data.success) {
        toast.success('Product added to cart successfully!');
        window.dispatchEvent(new Event('cartUpdate'));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product to cart');
    }
  };

  const onLogout = (e) => {
    e.preventDefault();
    dispatch(logout());
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const avatarSrc = user?.avatarUrl 
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`) 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=004ac6&color=fff`;

  return (
    <Layout>
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-12 flex flex-col md:flex-row gap-8 items-start font-['Manrope']">
        {/* SideNavBar */}
        <aside className="w-full md:w-72 flex flex-col gap-4 md:sticky md:top-24 flex-shrink-0">
          {/* User Info Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#c3c6d7]/30 mb-2 text-left">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#004ac6] flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                <img src={avatarSrc} alt={user?.fullName || 'Avatar'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-[#131b2e] tracking-tight truncate">{user?.fullName || 'User'}</h3>
                <p className="text-sm text-[#434655]">{user?.tier || 'Standard Member'}</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 text-left">
            <Link to="/user/profile" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-[#004ac6] transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">person</span>
              <span>Personal Profile</span>
            </Link>
            <Link to="/order-history" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-[#004ac6] transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">shopping_bag</span>
              <span>Order History</span>
            </Link>
            <Link to="/reviews" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-[#004ac6] transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">star</span>
              <span>My Reviews</span>
            </Link>
            <Link to="/wishlist" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-[#004ac6] transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">favorite</span>
              <span>Wishlist</span>
            </Link>
            {/* Active Item: Recently Viewed */}
            <Link to="/recently-viewed" className="flex items-center px-4 py-3 space-x-3 bg-[#004ac6] text-white font-bold rounded-xl shadow-lg shadow-[#004ac6]/20 transition-all">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
              <span>Recently Viewed</span>
            </Link>
            <Link to="/address-book" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-[#004ac6] transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">location_on</span>
              <span>Shipping Address</span>
            </Link>
            <Link to="/coins" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-[#004ac6] transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">monetization_on</span>
              <span>My Coins</span>
            </Link>
            <Link to="/messages" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-[#004ac6] transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">chat</span>
              <span>Messages</span>
            </Link>
            <Link to="/security" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-[#004ac6] transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">security</span>
              <span>Security Settings</span>
            </Link>
          </nav>

          <div className="mt-6 pt-4 border-t border-[#c3c6d7]/30 text-left">
            <button onClick={onLogout} className="w-full flex items-center px-4 py-3 space-x-3 text-[#ba1a1a] hover:bg-[#ffdad6]/20 transition-all font-bold rounded-xl cursor-pointer">
              <span className="material-symbols-outlined">logout</span>
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 w-full">
          {/* Header Section */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#131b2e] tracking-tight mb-1">Recently Viewed</h1>
              <p className="text-base text-[#434655]">
                {loading ? 'Loading history...' : `You have viewed ${pagination.total} products recently.`}
              </p>
            </div>

            {/* Clear All Button */}
            {!loading && items.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="px-5 py-2.5 bg-[#ffdad6] hover:bg-[#ffb4ab] border border-rose-200 rounded-xl flex items-center gap-2 text-[#ba1a1a] transition-all font-extrabold text-sm shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                <span>Clear All</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004ac6]"></div>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl p-12 md:p-16 border border-[#c3c6d7]/30 shadow-sm text-center max-w-2xl mx-auto my-8 space-y-6">
              <div className="w-24 h-24 bg-[#004ac6]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-[#004ac6] text-[48px]">history</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#131b2e]">No Viewed Products</h2>
              <p className="text-[#434655] text-base leading-relaxed max-w-md mx-auto">
                You haven't viewed any products recently. Start browsing the store catalogs to find items you love!
              </p>
              <div className="pt-4">
                <Link 
                  to="/search" 
                  className="inline-flex items-center gap-2 bg-[#004ac6] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-[#004ac6]/20 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined">explore</span>
                  Explore Catalog
                </Link>
              </div>
            </div>
          ) : (
            /* Grid of Viewed Products */
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-left">
                {items.map((p) => (
                  <div key={p.id} className="group bg-white rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] overflow-hidden border border-transparent hover:border-[#004ac6]/30 hover:shadow-xl transition-all duration-500 flex flex-col h-full relative">
                    {/* Delete Item Button */}
                    <div className="absolute top-3 right-3 z-10">
                      <button 
                        onClick={() => handleRemoveItem(p.productId)}
                        className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-rose-500 shadow-sm hover:bg-rose-50 hover:scale-110 transition-all cursor-pointer"
                        title="Remove from history"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>

                    <Link to={`/product/${p.slug}`} className="aspect-square relative overflow-hidden bg-[#faf8ff] block">
                      <img 
                        src={p.media?.[0] || 'https://via.placeholder.com/400x500'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt={p.name} 
                      />
                    </Link>

                    <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-[#505f76] uppercase tracking-wider mb-1">{p.categoryName || 'General'}</p>
                        <Link to={`/product/${p.slug}`}>
                          <h3 className="font-bold text-sm leading-5 text-[#131b2e] line-clamp-2 h-10 overflow-hidden group-hover:text-[#004ac6] transition-colors">{p.name}</h3>
                        </Link>
                        {p.mrpPrice > p.sellingPrice ? (
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span className="text-base font-extrabold text-[#004ac6]">{p.sellingPrice?.toLocaleString()}₫</span>
                            <span className="text-xs text-[#505f76] line-through">{p.mrpPrice?.toLocaleString()}₫</span>
                          </div>
                        ) : (
                          <p className="text-base font-extrabold text-[#004ac6] mt-1">{p.sellingPrice?.toLocaleString()}₫</p>
                        )}
                        <span className="text-[10px] text-gray-400 font-semibold mt-2 block">
                          Viewed {new Date(p.viewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <button 
                        onClick={() => handleAddToCart(p)}
                        className="w-full py-2.5 bg-[#004ac6] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#2563eb] active:scale-[0.98] transition-all shadow-md shadow-[#004ac6]/20 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                    className="w-10 h-10 rounded-xl border border-[#c3c6d7] flex items-center justify-center hover:bg-[#f2f3ff] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button 
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all ${currentPage === p ? 'bg-[#004ac6] text-white shadow-md' : 'border border-[#c3c6d7] hover:bg-[#f2f3ff]'}`}
                    >
                      {p}
                    </button>
                  ))}

                  <button 
                    disabled={currentPage === pagination.totalPages}
                    onClick={() => setCurrentPage(c => Math.min(pagination.totalPages, c + 1))}
                    className="w-10 h-10 rounded-xl border border-[#c3c6d7] flex items-center justify-center hover:bg-[#f2f3ff] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default RecentlyViewed;
