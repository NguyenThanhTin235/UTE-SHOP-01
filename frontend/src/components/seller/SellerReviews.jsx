import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const StarDisplay = ({ rating, size = 'sm' }) => {
  const s = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map(star => (
        <span 
          key={star} 
          className="material-symbols-outlined select-none"
          style={{ 
            fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0",
            fontSize: size === 'sm' ? '18px' : '22px'
          }}
        >
          star
        </span>
      ))}
    </div>
  );
};

const SellerReviews = () => {
  const { user } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Category dropdown states
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Stats states
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    satisfactionRate: 0,
    starCounts: { 5: 0, 4: 0, 3: 0, 1_2: 0 }
  });

  // Filter & Search states
  const [reviews, setReviews] = useState([]);
  const [shopCategories, setShopCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  
  const [filterTab, setFilterTab] = useState(searchParams.get('tab') || 'all'); // 'all', 'unreplied', 'media', 'critical'
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest'); // 'newest', 'highest', 'lowest'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 5
  });

  // Sync to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (currentPage !== 1) params.set('page', currentPage);
    else params.delete('page');
    if (filterTab !== 'all') params.set('tab', filterTab);
    else params.delete('tab');
    if (selectedCategory) params.set('category', selectedCategory);
    else params.delete('category');
    if (sortBy !== 'newest') params.set('sort', sortBy);
    else params.delete('sort');
    if (searchTerm) params.set('search', searchTerm);
    else params.delete('search');
    
    setSearchParams(params, { replace: true });
  }, [currentPage, filterTab, selectedCategory, sortBy, searchTerm]);

  // Reply states
  const [replies, setReplies] = useState({}); // { reviewId: string }
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [submittingReplyId, setSubmittingReplyId] = useState(null);



  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      
      // Map frontend filter tabs to backend query params
      let ratingParam = '';
      let repliedParam = '';
      let hasMediaParam = '';

      if (filterTab === 'unreplied') {
        repliedParam = 'false';
      } else if (filterTab === 'media') {
        hasMediaParam = 'true';
      } else if (filterTab === 'critical') {
        ratingParam = 'critical';
      }

      const res = await axios.get('http://localhost:5000/api/seller/reviews', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 5,
          rating: ratingParam,
          categoryId: selectedCategory,
          replied: repliedParam,
          hasMedia: hasMediaParam,
          sort: sortBy,
          search: searchTerm
        }
      });

      if (res.data.success) {
        setReviews(res.data.data);
        setStats(res.data.stats);
        setShopCategories(res.data.shopCategories || []);
        setPagination(res.data.meta);
        
        // Pre-fill existing replies
        const existingReplies = {};
        res.data.data.forEach(r => {
          if (r.reply_comment) {
            existingReplies[r._id] = r.reply_comment;
          }
        });
        setReplies(existingReplies);
      }
    } catch (error) {
      console.error('Failed to fetch seller reviews:', error);
      toast.error('Failed to load reviews list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentPage, filterTab, selectedCategory, sortBy, searchTerm]);

  const handleReplyChange = (reviewId, text) => {
    setReplies(prev => ({
      ...prev,
      [reviewId]: text
    }));
  };

  const handleReplySubmit = async (reviewId) => {
    const comment = replies[reviewId]?.trim();
    if (!comment && !window.confirm('Are you sure you want to delete this response?')) {
      return;
    }

    setSubmittingReplyId(reviewId);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const res = await axios.post(`http://localhost:5000/api/seller/reviews/${reviewId}/reply`, 
        { reply_comment: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(comment ? 'Response submitted successfully!' : 'Response deleted successfully!');
        setEditingReplyId(null);
        fetchReviews();
      }
    } catch (error) {
      console.error('Error submitting review reply:', error);
      toast.error(error.response?.data?.message || 'Something went wrong when submitting reply.');
    } finally {
      setSubmittingReplyId(null);
    }
  };



  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  // Calculate statistics percentages for progress bars
  const totalStats = stats.totalReviews || 0;
  const getPercent = (count) => {
    return totalStats > 0 ? Math.round((count / totalStats) * 100) : 0;
  };

  const getUnrepliedCount = () => {
    return reviews.filter(r => !r.reply_comment).length;
  };

  return (
    <div className="p-10 max-w-[1200px] mx-auto w-full space-y-8">
      {/* Summary Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Total Satisfaction Card */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col items-center justify-center text-center">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#434655] mb-2">Total Satisfaction</h4>
          <span className="text-5xl font-black text-[#131b2e]">{stats.satisfactionRate}<span className="text-2xl">%</span></span>
          <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            {stats.averageRating} / 5.0 Average
          </p>
        </div>

        {/* Stars distribution card */}
        <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <span className="text-xs font-black text-[#434655] w-16 text-right">5 Stars</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${getPercent(stats.starCounts[5])}%` }}></div>
              </div>
              <span className="text-xs font-bold text-[#131b2e] w-12">{stats.starCounts[5]} ({getPercent(stats.starCounts[5])}%)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-black text-[#434655] w-16 text-right">4 Stars</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${getPercent(stats.starCounts[4])}%` }}></div>
              </div>
              <span className="text-xs font-bold text-[#131b2e] w-12">{stats.starCounts[4]} ({getPercent(stats.starCounts[4])}%)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-black text-[#434655] w-16 text-right">3 Stars</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${getPercent(stats.starCounts[3])}%` }}></div>
              </div>
              <span className="text-xs font-bold text-[#131b2e] w-12">{stats.starCounts[3]} ({getPercent(stats.starCounts[3])}%)</span>
            </div>
            <div className="flex items-center gap-4 text-red-600">
              <span className="text-xs font-black w-16 text-right">1-2 Stars</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${getPercent(stats.starCounts['1_2'])}%` }}></div>
              </div>
              <span className="text-xs font-bold w-12">{stats.starCounts['1_2']} ({getPercent(stats.starCounts['1_2'])}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters block */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] text-left">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-2xl overflow-x-auto max-w-full custom-scrollbar flex-shrink-0">
            <button 
              onClick={() => { setFilterTab('all'); setCurrentPage(1); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filterTab === 'all' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/10' 
                  : 'text-[#434655] hover:bg-slate-50'
              }`}
            >
              All Reviews
            </button>
            
            <button 
              onClick={() => { setFilterTab('unreplied'); setCurrentPage(1); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${
                filterTab === 'unreplied' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/10' 
                  : 'text-[#434655] hover:bg-slate-50'
              }`}
            >
              Unreplied
              {getUnrepliedCount() > 0 && (
                <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                  {getUnrepliedCount()}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => { setFilterTab('media'); setCurrentPage(1); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filterTab === 'media' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/10' 
                  : 'text-[#434655] hover:bg-slate-50'
              }`}
            >
              With Media
            </button>
            
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-[350px] group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
            <input
              type="text"
              placeholder="Search by customer, comment, product..."
              className="w-full pl-11 pr-4 py-3 bg-[#f2f3ff]/40 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 transition-all outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>

        <div className="h-px bg-slate-100 my-1"></div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-[#434655]">
          {/* Category selection */}
          <div className="flex items-center gap-2 relative" ref={categoryDropdownRef}>
            <span>Category:</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="bg-white border border-slate-200 rounded-xl text-xs font-bold py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[220px] flex items-center justify-between cursor-pointer select-none"
              >
                <span className="truncate max-w-[180px]">
                  {shopCategories.find(c => c._id === selectedCategory)?.indentName || 'All Categories'}
                </span>
                <span className="material-symbols-outlined text-sm text-[#434655] transition-transform duration-200" style={{ transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  keyboard_arrow_down
                </span>
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-full min-w-[220px] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 max-h-60 overflow-y-auto custom-scrollbar select-none text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('');
                      setCurrentPage(1);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors text-xs font-bold ${
                      selectedCategory === '' ? 'text-primary bg-primary/5' : 'text-[#434655]'
                    }`}
                  >
                    All Categories
                  </button>
                  {shopCategories.map(cat => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat._id);
                        setCurrentPage(1);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors text-xs font-bold whitespace-pre-wrap ${
                        selectedCategory === cat._id ? 'text-primary bg-primary/5' : 'text-[#434655]'
                      }`}
                    >
                      {cat.indentName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2 lg:ml-auto">
            <span>Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-slate-200 rounded-xl text-xs font-bold py-2.5 px-4 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-6 text-left">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-[#434655] font-black">Loading reviews...</p>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map(rev => {
            const hasExistingReply = rev.reply_comment && editingReplyId !== rev._id;
            const buyerInitial = rev.user_id?.fullName ? rev.user_id.fullName.substring(0, 2).toUpperCase() : 'KH';
            const defaultProductImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
            
            return (
              <div 
                key={rev._id} 
                className={`bg-white rounded-[2rem] border shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-8 group transition-all duration-300 ${
                  rev.rating <= 2 ? 'border-red-100 hover:border-red-200' : 'border-slate-200 hover:border-primary/30'
                }`}
              >
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left info column: Buyer & Product */}
                  <div className="w-full md:w-64 space-y-4 flex-shrink-0">
                    {/* Buyer card */}
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        {rev.user_id?.avatarUrl ? (
                          <img 
                            src={rev.user_id.avatarUrl.startsWith('http') ? rev.user_id.avatarUrl : `http://localhost:5000${rev.user_id.avatarUrl}`}
                            alt="avatar" 
                            className="size-full object-cover rounded-full" 
                          />
                        ) : (
                          buyerInitial
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-[#131b2e] leading-tight truncate max-w-[150px]">
                          {rev.user_id?.fullName || 'Customer'}
                        </h5>
                        <p className="text-[10px] text-green-600 font-black uppercase tracking-wider flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          Verified Buyer
                        </p>
                      </div>
                    </div>

                    {/* Mini Product card */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <img 
                        src={rev.product_id?.image ? (rev.product_id.image.startsWith('http') ? rev.product_id.image : `http://localhost:5000${rev.product_id.image}`) : defaultProductImage} 
                        className="size-12 rounded-lg object-cover border border-slate-200" 
                        alt="Product"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-[#131b2e] truncate hover:text-primary transition-colors cursor-pointer">
                          {rev.product_id?.name || 'Product'}
                        </p>
                        <p className="text-[9px] text-[#434655] font-medium mt-0.5">
                          Price: {rev.order_item_id?.price_at_buy?.toLocaleString()}₫
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right main column: Star rating, comment, media, and replies */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={rev.rating} />
                        <span className="text-xs font-bold text-[#434655]">
                          {['', 'Poor', 'Unsatisfied', 'Fair', 'Satisfied', 'Excellent'][rev.rating] || ''}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {rev.rating <= 2 && (
                          <span className="px-2.5 py-0.5 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded-full border border-red-100 tracking-wider">
                            Needs Attention
                          </span>
                        )}
                        <span className="text-[10px] text-[#434655] font-bold">
                          {new Date(rev.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm font-bold text-[#131b2e] leading-relaxed italic">
                      "{rev.comment || 'No detailed review comment.'}"
                    </p>

                    {/* Review Images */}
                    {rev.media && rev.media.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {rev.media.map((med, idx) => (
                          <a key={med.id || idx} href={med.url} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={med.url} 
                              className="size-20 rounded-xl object-cover border border-slate-100 hover:scale-105 transition-transform cursor-pointer" 
                              alt="review-media" 
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Response display & editor */}
                    <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                      {hasExistingReply ? (
                        /* Display Existing Seller Response */
                        <div className="bg-[#E8EFFF]/30 rounded-2xl p-4 border border-primary/10 relative group-hover:border-primary/20 transition-all">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                              Your Response
                            </span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setEditingReplyId(rev._id)}
                                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[12px]">edit</span>
                                Edit
                              </button>
                              <button 
                                onClick={() => {
                                  handleReplyChange(rev._id, '');
                                  handleReplySubmit(rev._id);
                                }}
                                className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[12px]">delete</span>
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-[#434655] leading-relaxed whitespace-pre-line">
                            {rev.reply_comment}
                          </p>
                          {rev.reply_createdAt && (
                            <p className="text-[8px] text-slate-400 mt-2 font-medium">
                              Replied at: {new Date(rev.reply_createdAt).toLocaleString('en-US')}
                            </p>
                          )}
                        </div>
                      ) : (
                        /* Textarea Editor Box to reply */
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary">
                              {editingReplyId === rev._id ? 'Edit Response' : 'Your Response'}
                            </label>

                          </div>
                          <div className="relative">
                            <textarea 
                              placeholder={`Enter reply to ${rev.user_id?.fullName || 'customer'}...`}
                              value={replies[rev._id] || ''}
                              onChange={(e) => handleReplyChange(rev._id, e.target.value)}
                              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 pb-12 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[90px] transition-all resize-none"
                            />
                            <div className="absolute bottom-3 right-3 flex gap-2">
                              {editingReplyId === rev._id && (
                                <button 
                                  onClick={() => {
                                    setEditingReplyId(null);
                                    handleReplyChange(rev._id, rev.reply_comment || '');
                                  }}
                                  className="bg-white border border-slate-200 text-[#434655] px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                                >
                                  Cancel
                                </button>
                              )}
                              <button 
                                onClick={() => handleReplySubmit(rev._id)}
                                disabled={submittingReplyId === rev._id}
                                className="bg-primary text-white px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer shadow-md shadow-primary/10"
                              >
                                {submittingReplyId === rev._id ? 'Sending...' : 'Submit Reply'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty state */
          <div className="py-24 text-center border-2 border-dashed border-[#c3c6d7]/60 rounded-3xl bg-[#F8FAFC] space-y-4">
            <span className="material-symbols-outlined text-[#c3c6d7] text-6xl">star_half</span>
            <p className="text-base text-[#434655] font-bold">No reviews found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Pagination component */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 bg-transparent">
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
                    ? 'bg-primary text-white shadow-md shadow-primary/10'
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
  );
};

export default SellerReviews;
