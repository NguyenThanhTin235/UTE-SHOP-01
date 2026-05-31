import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import FABGroup from '../components/FABGroup';
import { logout } from '../redux/authSlice';

const StarDisplay = ({ rating, size = 'sm' }) => {
  const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg key={star} className={`${s} ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
};

const Reviews = () => {
  const { user } = useSelector((state) => state.auth);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 5
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [shopId, setShopId] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [availableShops, setAvailableShops] = useState([]);

  // Modals
  const [reviewModal, setReviewModal] = useState(null); // { id, ... }
  const [existingMedia, setExistingMedia] = useState([]);
  const [deleteMediaIds, setDeleteMediaIds] = useState([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]); // File[]
  const [reviewPreviews, setReviewPreviews] = useState([]); // string[]
  const [submittingReview, setSubmittingReview] = useState(false);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const response = await axios.get('http://localhost:5000/api/reviews', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 5,
          search: searchTerm,
          shopId: shopId,
          rating: ratingFilter
        }
      });
      if (response.data?.success) {
        setReviews(response.data.data || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
        if (response.data.filterOptions?.shops) {
          setAvailableShops(response.data.filterOptions.shops);
        }
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      toast.error('Failed to load reviews.');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentPage, searchTerm, shopId, ratingFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleDelete = async (reviewId) => {
    setDeletingId(reviewId);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const res = await axios.delete(`http://localhost:5000/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        toast.success('Review deleted successfully');
        fetchReviews();
      } else {
        toast.error(res.data?.message || 'Failed to delete review');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(logout());
    navigate('/login');
  };

  // Modal Open/Close handlers
  const openReviewModal = (rev) => {
    setReviewRating(rev.rating);
    setReviewComment(rev.comment || '');
    setExistingMedia(rev.media || []);
    setReviewImages([]);
    setReviewPreviews([]);
    setDeleteMediaIds([]);
    setReviewModal({
      id: rev.id,
      orderItemId: rev.orderItem?.id,
      isReviewed: true,
      existingReview: {
        id: rev.id,
        rating: rev.rating,
        comment: rev.comment,
        media: rev.media,
        coinEarned: rev.coinEarned
      },
      product: rev.product,
      quantity: rev.orderItem?.quantity || 1
    });
  };

  const closeReviewModal = () => {
    setReviewModal(null);
    setReviewImages([]);
    setReviewPreviews([]);
    setExistingMedia([]);
    setDeleteMediaIds([]);
  };

  const removeExistingMedia = (mediaId) => {
    setDeleteMediaIds(prev => [...prev, mediaId]);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const activeExistingCount = existingMedia.filter(m => !deleteMediaIds.includes(m.id)).length;
    const remaining = 5 - activeExistingCount - reviewImages.length;
    const selected = files.slice(0, remaining);
    setReviewImages(prev => [...prev, ...selected]);
    selected.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setReviewPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removePreview = (idx) => {
    setReviewImages(prev => prev.filter((_, i) => i !== idx));
    setReviewPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitReview = async () => {
    if (!reviewRating) { toast.error('Please select a star rating'); return; }
    if (!reviewModal) return;
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const formData = new FormData();
      formData.append('order_item_id', reviewModal.orderItemId);
      formData.append('rating', reviewRating);
      formData.append('comment', reviewComment);
      reviewImages.forEach(img => formData.append('images', img));

      if (deleteMediaIds.length > 0) {
        deleteMediaIds.forEach(id => formData.append('delete_media_ids', id));
      }

      const res = await axios.put(
        `http://localhost:5000/api/reviews/${reviewModal.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      if (res.data?.success) {
        toast.success('Review updated successfully!');
        closeReviewModal();
        fetchReviews();
      } else {
        toast.error(res.data?.message || 'Failed to update review');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong, please try again');
    } finally {
      setSubmittingReview(false);
    }
  };

  const ratingLabel = (r) => ['', 'Poor', 'Unsatisfied', 'Fair', 'Satisfied', 'Excellent'][r] || '';

  const avatarSrc = user?.avatarUrl 
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`) 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=004ac6&color=fff`;

  return (
    <Layout>
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-10 py-4 flex flex-col md:flex-row gap-8 items-start">
        {/* SideNavBar (Đồng bộ với Profile) */}
        <aside className="w-full md:w-72 flex flex-col gap-4 md:sticky md:top-24 flex-shrink-0">
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
            <Link to="/reviews" className="flex items-center px-4 py-3 space-x-3 bg-[#004ac6] text-white font-bold rounded-xl shadow-lg shadow-[#004ac6]/20 transition-all">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span>My Reviews</span>
            </Link>
            <Link to="/wishlist" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-[#004ac6] transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">favorite</span>
              <span>Wishlist</span>
            </Link>
            <Link to="/recently-viewed" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-[#004ac6] transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">history</span>
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

          <div className="mt-6 pt-4 border-t border-[#c3c6d7]/50 text-left">
            <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 space-x-3 text-[#b3261e] hover:bg-[#b3261e]/10 transition-all font-medium rounded-xl cursor-pointer">
              <span className="material-symbols-outlined">logout</span>
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 w-full text-left max-w-4xl space-y-6">
          {/* Search & Filter Bar */}
          <div className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-white rounded-3xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-[#c3c6d7]/30">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-[350px] group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004ac6] transition-colors">search</span>
              <input
                type="text"
                placeholder="Search by product name..."
                className="w-full pl-11 pr-4 py-3 bg-[#f2f3ff]/40 border-none rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#004ac6]/10 placeholder:text-gray-400 transition-all outline-none"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </form>
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Shop Filter */}
              <select
                value={shopId}
                onChange={(e) => { setShopId(e.target.value); setCurrentPage(1); }}
                className="px-4 py-3 bg-[#f2f3ff]/40 border-none rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#004ac6]/10 transition-all cursor-pointer w-full md:w-44"
              >
                <option value="">All Shops</option>
                {availableShops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {/* Rating Filter */}
              <select
                value={ratingFilter}
                onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-3 bg-[#f2f3ff]/40 border-none rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#004ac6]/10 transition-all cursor-pointer w-full md:w-36"
              >
                <option value="">All Ratings</option>
                {[5, 4, 3, 2, 1].map(star => (
                  <option key={star} value={star}>{star} Stars</option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Card Container */}
          <div className="bg-white rounded-3xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-[#c3c6d7]/30 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[#c3c6d7]/20 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-extrabold text-[#131b2e] text-lg tracking-tight">Reviews List</h2>
              {!loading && pagination.total > 0 && (
                <span className="bg-[#004ac6]/10 text-[#004ac6] font-bold text-xs px-3 py-1.5 rounded-full">
                  {pagination.total} reviews
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004ac6]"></div>
              </div>
            ) : reviews.length === 0 ? (
              /* Empty State */
              <div className="p-12 md:p-16 text-center max-w-xl mx-auto my-8 space-y-6">
                <div className="w-20 h-20 bg-[#004ac6]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="material-symbols-outlined text-[#004ac6] text-[40px]">rate_review</span>
                </div>
                <h3 className="text-xl font-bold text-[#131b2e]">No reviews found</h3>
                <p className="text-[#434655] text-sm leading-relaxed max-w-md mx-auto">
                  No reviews match your filters. Start shopping and share your experiences to earn reward coins!
                </p>
                <div className="pt-4">
                  <Link
                    to="/order-history"
                    className="inline-flex items-center gap-2 bg-[#004ac6] text-white px-6 py-3.5 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#004ac6]/20 active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined">shopping_bag</span>
                    View Orders
                  </Link>
                </div>
              </div>
            ) : (
              /* Reviews List */
              <div className="divide-y divide-[#c3c6d7]/20">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-6 hover:bg-[#fafbfe]/30 transition-colors">
                    {/* Product & Shop Info */}
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={rev.product?.imageUrl || 'https://placehold.co/56x56/f2f3ff/004ac6?text=SP'}
                        alt={rev.product?.name}
                        className="w-14 h-14 rounded-xl object-cover border border-[#c3c6d7]/20 flex-shrink-0"
                      />
                      <div className="flex-grow min-w-0">
                        {rev.product?.slug ? (
                          <Link to={`/product/${rev.product.slug}`} className="font-bold text-sm text-[#131b2e] hover:text-[#004ac6] transition-colors truncate block">
                            {rev.product.name}
                          </Link>
                        ) : (
                          <p className="font-bold text-sm text-[#131b2e] truncate">{rev.product?.name || 'Product'}</p>
                        )}
                        <p className="text-[11px] text-[#737686] font-medium mt-0.5 flex items-center gap-1.5">
                          {rev.product?.shop?.name && (
                            <span className="text-[#004ac6] font-bold">Shop: {rev.product.shop.name}</span>
                          )}
                          {rev.orderItem && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span>Qty: {rev.orderItem.quantity} · {rev.orderItem.priceAtBuy?.toLocaleString()}₫</span>
                            </>
                          )}
                        </p>
                      </div>
                      {rev.coinEarned > 0 && (
                        <div className="flex-shrink-0 flex items-center gap-1.5 bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-xl">
                          <span className="text-base">🪙</span>
                          <span className="text-xs font-extrabold text-amber-700">+{rev.coinEarned} coins</span>
                        </div>
                      )}
                    </div>

                    {/* Rating + Comment */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={rev.rating} />
                        <span className="text-xs font-bold text-[#434655]">{ratingLabel(rev.rating)}</span>
                      </div>
                      {rev.comment && (
                        <p className="text-sm text-[#434655] leading-relaxed break-words">{rev.comment}</p>
                      )}
                    </div>

                    {/* Review Images */}
                    {rev.media && rev.media.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {rev.media.map((m, i) => (
                          <a key={i} href={m.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={m.url}
                              alt={`review-img-${i}`}
                              className="w-16 h-16 rounded-xl object-cover border border-[#c3c6d7]/20 hover:opacity-90 hover:scale-105 transition-all cursor-pointer"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#c3c6d7]/10">
                      <p className="text-[11px] text-[#737686] font-medium">
                        {new Date(rev.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        {rev.updatedAt !== rev.createdAt && ' · edited'}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => openReviewModal(rev)}
                          className="text-[11px] font-bold text-amber-600 hover:underline"
                        >
                          Edit
                        </button>
                        <span className="text-[#c3c6d7]">·</span>
                        <button
                          onClick={() => setDeleteConfirmId(rev.id)}
                          disabled={deletingId === rev.id}
                          className="text-[11px] font-bold text-rose-500 hover:text-rose-700 transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <div className="p-6 border-t border-[#c3c6d7]/20 flex items-center justify-between bg-slate-50/50">
                <p className="text-xs font-bold text-[#434655]">
                  Showing {reviews.length} of {pagination.total} reviews
                </p>
                <nav className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#c3c6d7]/40 hover:bg-[#f2f3ff] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>

                  {Array.from({ length: pagination.totalPages }, (_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        currentPage === index + 1
                          ? 'bg-[#004ac6] text-white shadow-md shadow-[#004ac6]/10'
                          : 'hover:bg-[#f2f3ff] text-[#434655] bg-white border border-[#c3c6d7]/30'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === pagination.totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#c3c6d7]/40 hover:bg-[#f2f3ff] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ─── Review Modal (Edit Mode) ─── */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: 'rgba(19,27,46,0.6)', backdropFilter: 'blur(4px)'}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#c3c6d7]/20">
              <h3 className="font-extrabold text-lg text-[#131b2e]">Edit Review</h3>
              <button onClick={closeReviewModal} className="w-8 h-8 rounded-full bg-[#f2f3ff] flex items-center justify-center hover:bg-[#c3c6d7]/30 transition-colors">
                <span className="material-symbols-outlined text-[18px] text-[#434655]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div className="flex items-center gap-3 p-4 bg-[#f2f3ff]/40 rounded-2xl">
                <img src={reviewModal.product?.imageUrl || 'https://placehold.co/56x56/f2f3ff/004ac6?text=SP'}
                  alt={reviewModal.product?.name}
                  className="w-14 h-14 rounded-xl object-cover border border-[#c3c6d7]/20"
                />
                <div>
                  <p className="font-bold text-sm text-[#131b2e] line-clamp-1">{reviewModal.product?.name}</p>
                  <p className="text-xs text-[#737686] font-medium">Qty: {reviewModal.quantity}</p>
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <p className="text-xs font-bold text-[#131b2e] mb-3 uppercase tracking-wider">Product Quality</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <svg className={`w-9 h-9 transition-colors ${
                        star <= (reviewHover || reviewRating) ? 'text-amber-400' : 'text-gray-200'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </button>
                  ))}
                  <span className="ml-2 self-center text-sm font-bold text-[#131b2e]">
                    {ratingLabel(reviewHover || reviewRating)}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <p className="text-xs font-bold text-[#131b2e] mb-2 uppercase tracking-wider">Review Comment</p>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience about this product..."
                  maxLength={500}
                  rows={4}
                  className="w-full border border-[#c3c6d7]/40 rounded-2xl p-4 text-sm text-[#131b2e] placeholder-[#b0b3c1] focus:outline-none focus:border-[#004ac6]/50 focus:ring-2 focus:ring-[#004ac6]/10 resize-none transition-all"
                />
                <p className="text-[10px] text-right text-[#737686] mt-1">{reviewComment.length}/500</p>
              </div>

              {/* Upload Images */}
              <div>
                <p className="text-xs font-bold text-[#131b2e] mb-2 uppercase tracking-wider">Attached Images (Max 5)</p>
                <div className="flex flex-wrap gap-2">
                  {/* Existing Images */}
                  {existingMedia.filter(m => !deleteMediaIds.includes(m.id)).map((m) => (
                    <div key={m.id} className="relative w-16 h-16">
                      <img src={m.url} alt="existing-media" className="w-16 h-16 rounded-xl object-cover border border-[#c3c6d7]/30" />
                      <button
                        type="button"
                        onClick={() => removeExistingMedia(m.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-rose-600 transition-colors"
                      >✕</button>
                    </div>
                  ))}

                  {/* New Previews */}
                  {reviewPreviews.map((src, i) => (
                    <div key={i} className="relative w-16 h-16">
                      <img src={src} alt={`preview-${i}`} className="w-16 h-16 rounded-xl object-cover border border-[#c3c6d7]/30" />
                      <button
                        type="button"
                        onClick={() => removePreview(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-rose-600 transition-colors"
                      >✕</button>
                    </div>
                  ))}

                  {/* Add Image Button */}
                  {((existingMedia.length - deleteMediaIds.length) + reviewImages.length) < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-[#c3c6d7]/60 flex flex-col items-center justify-center hover:border-[#004ac6]/40 hover:bg-[#f2f3ff]/60 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[#737686] text-[22px]">add_photo_alternate</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeReviewModal}
                  className="flex-1 py-3 rounded-xl border border-[#c3c6d7]/40 text-[#434655] font-bold text-sm hover:bg-[#f2f3ff] transition-all"
                >Cancel</button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || !reviewRating}
                  className="flex-1 py-3 rounded-xl bg-[#004ac6] text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-[#004ac6]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingReview ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>&nbsp;Saving...</>
                  ) : (
                    <>Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: 'rgba(19,27,46,0.6)', backdropFilter: 'blur(4px)'}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-2 text-rose-500">
                <span className="material-symbols-outlined text-[36px]">delete_forever</span>
              </div>
              <h3 className="text-lg font-extrabold text-[#131b2e]">Delete Review</h3>
              <p className="text-sm text-[#434655] leading-relaxed">
                Are you sure you want to delete this review? The earned coins will be revoked from your balance.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 rounded-xl border border-[#c3c6d7]/40 text-[#434655] font-bold text-sm hover:bg-[#f2f3ff] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={deletingId === deleteConfirmId}
                  className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {deletingId === deleteConfirmId ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>&nbsp;Deleting...</>
                  ) : (
                    <>Delete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FABGroup />
    </Layout>
  );
};

export default Reviews;
