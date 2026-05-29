import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

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
  const totalPages = Math.ceil(shops.length / itemsPerPage);
  const paginatedShops = shops.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {paginatedShops.length} of {shops.length} pending applications
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-10 h-10 rounded-xl bg-[#004ac6] text-white flex items-center justify-center font-black shadow-lg shadow-blue-100">
              {currentPage}
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopApprovalTab;
