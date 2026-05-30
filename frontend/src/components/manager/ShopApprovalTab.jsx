import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
}

const SkeletonRow = () => (
  <tr className="animate-pulse bg-slate-50/50">
    <td className="px-8 py-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-200"></div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="h-3 w-20 bg-slate-200 rounded"></div>
        </div>
      </div>
    </td>
    <td className="px-8 py-6">
      <div className="h-6 w-24 bg-slate-200 rounded-lg"></div>
    </td>
    <td className="px-8 py-6">
      <div className="space-y-2">
        <div className="h-4 w-28 bg-slate-200 rounded"></div>
        <div className="h-3 w-32 bg-slate-200 rounded"></div>
      </div>
    </td>
    <td className="px-8 py-6">
      <div className="flex gap-2 justify-center">
        <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
        <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
      </div>
    </td>
  </tr>
);

const ShopApprovalTab = () => {
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [rowsDropdownOpen, setRowsDropdownOpen] = useState(false);
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

  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 10;

  useEffect(() => {
    if (!searchParams.has('page') || !searchParams.has('limit')) {
      const newParams = new URLSearchParams(searchParams);
      if (!newParams.has('page')) newParams.set('page', '1');
      if (!newParams.has('limit')) newParams.set('limit', '10');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setPage = (newPage) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage);
      setSearchParams(params);
  };

  const setLimit = (newLimit) => {
      const params = new URLSearchParams(searchParams);
      params.set('limit', newLimit);
      params.set('page', 1);
      setSearchParams(params);
  };

  const fetchPendingShops = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/manager/shops/pending`, {
        headers: getAuthHeader(),
      });
      if (data.success) {
        setShops(data.data || []);
      }
    } catch (err) {
      console.error('Fetch pending shops error:', err);
      toast.error('Failed to load pending shops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingShops();
  }, []);

  const handleApprove = async (id, shopName) => {
    try {
      const { data } = await axios.post(`${API}/manager/shops/${id}/approve`, {}, { headers: getAuthHeader() });
      if (data.success) {
        toast.success(`Approved ${shopName}`);
        setShops((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      toast.error(`Failed to approve ${shopName}`);
    }
  };

  const handleReject = async (id, shopName) => {
    const reason = window.prompt(`Reason for rejecting ${shopName}:`);
    if (reason === null) return; // User cancelled
    try {
      const { data } = await axios.post(
        `${API}/manager/shops/${id}/reject`,
        { reason: reason || 'Not eligible' },
        { headers: getAuthHeader() }
      );
      if (data.success) {
        toast.success(`Rejected ${shopName}`);
        setShops((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      toast.error(`Failed to reject ${shopName}`);
    }
  };


  const handleExportCSV = () => {
    if (shops.length === 0) {
      toast.error('No data to export');
      return;
    }
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Shop Name,Tax ID,Legal Representative,Applied At\n' +
      shops.map((s) => `"${s.shopName}","${s.taxId}","${s.legalRep}","${new Date(s.appliedAt).toISOString()}"`).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'pending_shops.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported to CSV');
  };

  // Pagination logic
  const totalPages = Math.ceil(shops.length / limit);
  const paginatedShops = shops.slice((page - 1) * limit, page * limit);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-xl font-black text-slate-900">Pending Registrations</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Review new seller business documents
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Export CSV
          </button>

        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop Name</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax ID (MST)</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Representative</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : paginatedShops.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-20 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">verified</span>
                  <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
                  <p className="text-sm text-slate-500 mt-1">There are no pending shop registrations to review.</p>
                </td>
              </tr>
            ) : (
              paginatedShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/manager/shop_detail/${shop.id}`)}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined">store</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-none">{shop.shopName}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Applied: {shop.timeAgo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200 font-mono">
                      {shop.taxId}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-700">{shop.legalRep}</p>
                    <p className="text-[10px] text-[#16a34a] font-medium">Verified Identity</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleApprove(shop.id, shop.shopName); }}
                        className="w-9 h-9 rounded-xl bg-green-50 text-[#16a34a] flex items-center justify-center hover:bg-[#16a34a] hover:text-white transition-all cursor-pointer"
                        title="Approve"
                      >
                        <span className="material-symbols-outlined text-xl">check</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReject(shop.id, shop.shopName); }}
                        className="w-9 h-9 rounded-xl bg-red-50 text-[#dc2626] flex items-center justify-center hover:bg-[#dc2626] hover:text-white transition-all cursor-pointer"
                        title="Reject"
                      >
                        <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/manager/shop_detail/${shop.id}`); }}
                        className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-[#004ac6] hover:text-white transition-all cursor-pointer"
                        title="View Documents"
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

      {!loading && shops.length > 0 && (
        <div className="p-6 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between rounded-b-3xl relative z-20">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Showing <span className="text-[#004ac6]">{(page - 1) * limit + 1} - {Math.min(page * limit, shops.length)}</span> of <span className="text-slate-800">{shops.length}</span> shops
            </p>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rows per page:</span>
                <div className="relative" ref={dropdownRef} onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setRowsDropdownOpen(!rowsDropdownOpen)}
                    className="flex items-center gap-0.5 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none select-none"
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
                              ? 'bg-[#004ac6] text-white'
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
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:opacity-30 transition-all bg-white shadow-sm"
              >
                  <span className="material-symbols-outlined text-sm">keyboard_double_arrow_left</span>
              </button>
              <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:opacity-30 transition-all bg-white shadow-sm"
              >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                  {(() => {
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
                                  onClick={() => setPage(i)}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                      page === i
                                          ? 'bg-[#004ac6] text-white shadow-md shadow-blue-200'
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
                  disabled={page >= totalPages || totalPages === 0}
                  onClick={() => setPage(page + 1)}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:opacity-30 transition-all bg-white shadow-sm"
              >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
              <button
                  disabled={page >= totalPages || totalPages === 0}
                  onClick={() => setPage(totalPages)}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:opacity-30 transition-all bg-white shadow-sm"
              >
                  <span className="material-symbols-outlined text-sm">keyboard_double_arrow_right</span>
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopApprovalTab;
