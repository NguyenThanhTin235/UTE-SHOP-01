import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
}

const ProductApprovalTab = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/manager/products?status=${filterStatus}`, {
        headers: getAuthHeader(),
      });
      if (data.success) {
        setProducts(data.data || []);
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
  }, [filterStatus]);

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

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      const { data } = await axios.post(`${API}/manager/products/${id}/reject`, { reason }, {
        headers: getAuthHeader(),
      });
      if (data.success) {
        toast.success('Product rejected successfully');
        setProducts(products.filter(p => p.id !== id));
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
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${filterStatus === 'pending' ? 'bg-white text-[#004ac6] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                Pending {filterStatus === 'pending' && `(${products.length})`}
              </button>
              <button 
                onClick={() => setFilterStatus('approved')}
                className={`px-4 py-2 text-xs font-bold transition-all rounded-lg ${filterStatus === 'approved' ? 'bg-white text-[#004ac6] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                Approved {filterStatus === 'approved' && `(${products.length})`}
              </button>
              <button 
                onClick={() => setFilterStatus('rejected')}
                className={`px-4 py-2 text-xs font-bold transition-all rounded-lg ${filterStatus === 'rejected' ? 'bg-white text-[#004ac6] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                Rejected {filterStatus === 'rejected' && `(${products.length})`}
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
                products.map((p) => (
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
                      <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                        filterStatus === 'pending' ? 'bg-blue-50 text-[#004ac6]' : 
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
                              onClick={() => handleReject(p.id)}
                              className="w-10 h-10 rounded-xl bg-red-50 text-[#dc2626] flex items-center justify-center hover:bg-[#dc2626] hover:text-white transition-all cursor-pointer"
                              title="Reject"
                            >
                              <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => toast.success('View details coming soon!')}
                          className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-[#004ac6] hover:text-white transition-all cursor-pointer"
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

        {/* Pagination placeholder */}
        {!loading && products.length > 0 && (
          <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing {products.length} products
            </p>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] transition-all shadow-sm">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-10 h-10 rounded-xl bg-[#004ac6] text-white flex items-center justify-center font-black shadow-lg shadow-blue-100">1</button>
              <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] transition-all shadow-sm">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductApprovalTab;
