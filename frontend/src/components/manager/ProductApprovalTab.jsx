import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ActionReasonModal from './ActionReasonModal';

const API = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
}

const ProductApprovalTab = ({ searchTerm = '' }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [rowsDropdownOpen, setRowsDropdownOpen] = useState(false);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, productId: null });
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setRowsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filterStatus = searchParams.get('tab') || 'pending';
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 10;

  useEffect(() => {
    if (!searchParams.has('tab') || !searchParams.has('page') || !searchParams.has('limit')) {
      const newParams = new URLSearchParams(searchParams);
      if (!newParams.has('tab')) newParams.set('tab', 'pending');
      if (!newParams.has('page')) newParams.set('page', '1');
      if (!newParams.has('limit')) newParams.set('limit', '10');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setFilterStatus = (newTab) => {
    setSearchParams({ tab: newTab, page: 1, limit });
  };

  const setPage = (newPage) => {
    setSearchParams({ tab: filterStatus, page: newPage, limit });
  };

  const setLimit = (newLimit) => {
    setSearchParams({ tab: filterStatus, page: 1, limit: newLimit });
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/manager/products/${filterStatus}?page=${page}&limit=${limit}`, {
        headers: getAuthHeader(),
      });
      if (data.success) {
        setProducts(data.data || []);
        setMeta(data.meta || null);
      }
    } catch (err) {
      console.error('Fetch pending products error:', err);
      toast.error('Failed to load pending products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filterStatus, page, limit]);

  const handleApprove = async (id) => {
    try {
      const { data } = await axios.post(`${API}/manager/products/${id}/approve`, {}, {
        headers: getAuthHeader(),
      });
      if (data.success) {
        toast.success('Product approved successfully');
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Approve product error:', err);
      toast.error('Failed to approve product');
    }
  };

  const handleRejectClick = (id) => {
    setRejectModal({ isOpen: true, productId: id });
  };

  const handleRejectConfirm = async (reason) => {
    setRejectModal({ isOpen: false, productId: null });
    try {
      const { data } = await axios.post(`${API}/manager/products/${rejectModal.productId}/reject`, { reason }, {
        headers: getAuthHeader(),
      });
      if (data.success) {
        toast.success('Product rejected successfully');
        setProducts(products.filter(p => p.id !== rejectModal.productId));
      }
    } catch (err) {
      console.error('Reject product error:', err);
      toast.error('Failed to reject product');
    }
  };

  return (
    <>
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Queue for Review</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Audit new product listings and edits</p>
          </div>
          <div className="flex gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${filterStatus === 'pending' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-4 py-2 text-xs font-bold transition-all rounded-lg ${filterStatus === 'approved' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                Approved
              </button>
              <button
                onClick={() => setFilterStatus('rejected')}
                className={`px-4 py-2 text-xs font-bold transition-all rounded-lg ${filterStatus === 'rejected' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                Rejected
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Info</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center text-slate-400">Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center text-slate-400">No pending products found.</td>
                </tr>
              ) : (
                products.filter(p => !searchTerm || 
                  p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  p.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  p.category.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            key={p.imageUrl}
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://dummyimage.com/200x200/cccccc/000000.png&text=No+Image';
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">ID: {p.sku} | ${p.price}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-700">{p.shopName}</p>
                      <p className="text-[10px] text-[#16a34a] font-bold uppercase">{p.sellerStatus}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${filterStatus === 'pending' ? 'bg-blue-50 text-primary' :
                        filterStatus === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {p.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        {filterStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(p.id)}
                              className="w-10 h-10 rounded-xl bg-[#16a34a] text-white flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-green-100 cursor-pointer"
                              title="Approve"
                            >
                              <span className="material-symbols-outlined text-xl">check</span>
                            </button>
                            <button
                              onClick={() => handleRejectClick(p.id)}
                              className="w-10 h-10 rounded-xl bg-red-50 text-[#dc2626] flex items-center justify-center hover:bg-[#dc2626] hover:text-white transition-all cursor-pointer"
                              title="Reject"
                            >
                              <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => navigate('/manager/product_detail/' + p.id)}
                          className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"
                          title="View Detail"
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {products.length > 0 && (
          <div className={`p-6 bg-white border-t border-slate-100 flex items-center justify-between relative z-20 transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-4">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Showing <span className="text-primary">{(page - 1) * limit + 1} - {Math.min(page * limit, meta?.pagination?.total || products.length)}</span> of <span className="text-slate-800">{meta?.pagination?.total || products.length}</span> products
              </p>
              <div className="w-px h-4 bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rows per page:</span>
                <div className="relative" ref={dropdownRef} onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setRowsDropdownOpen(!rowsDropdownOpen)}
                    className="flex items-center gap-0.5 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none select-none disabled:opacity-50"
                  >
                    <span>{limit}</span>
                    <span className="material-symbols-outlined text-sm font-bold text-slate-500">
                      keyboard_arrow_down
                    </span>
                  </button>
                  {rowsDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 z-50 w-14 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      {[10, 20, 50].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setLimit(val);
                            setRowsDropdownOpen(false);
                          }}
                          className={`w-full text-center py-2 text-xs font-bold transition-colors block ${
                            limit === val
                              ? 'bg-primary text-white'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={loading || page <= 1}
                onClick={() => setPage(1)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-all bg-white shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">keyboard_double_arrow_left</span>
              </button>
              <button
                disabled={loading || page <= 1}
                onClick={() => setPage(page - 1)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-all bg-white shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {(() => {
                  const totalPages = meta?.pagination?.totalPages || 1;
                  const pages = [];
                  let startPage = Math.max(1, page - 2);
                  let endPage = Math.min(totalPages, page + 2);
                  if (endPage - startPage < 4) {
                    if (startPage === 1) endPage = Math.min(totalPages, 5);
                    if (endPage === totalPages) startPage = Math.max(1, totalPages - 4);
                  }
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        disabled={loading}
                        onClick={() => setPage(i)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${page === i
                            ? 'bg-primary text-white shadow-md shadow-blue-200'
                            : 'text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}
              </div>

              <button
                disabled={loading || page >= (meta?.pagination?.totalPages || 1)}
                onClick={() => setPage(page + 1)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-all bg-white shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
              <button
                disabled={loading || page >= (meta?.pagination?.totalPages || 1)}
                onClick={() => setPage(meta?.pagination?.totalPages || 1)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-all bg-white shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">keyboard_double_arrow_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ActionReasonModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, productId: null })}
        onSubmit={handleRejectConfirm}
        title="Reject Product"
        itemName="this product"
        type="product"
      />
    </>
  );
};

export default ProductApprovalTab;
