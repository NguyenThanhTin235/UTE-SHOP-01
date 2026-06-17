import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const WithdrawalApprovalTab = ({ searchTerm }) => {
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({
    pendingCount: 0,
    pendingAmount: 0,
    approvedToday: 0,
    rejectedToday: 0,
  });
  const [loading, setLoading] = useState(false);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals & Action states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === 'all' ? '' : statusFilter;
      const res = await axios.get('http://localhost:5000/api/admin/withdrawals', {
        params: { page, limit, status: statusParam },
        ...getHeaders()
      });

      if (res.data && res.data.success) {
        setRequests(res.data.data.requests || []);
        if (res.data.data.summary) {
          setSummary(res.data.data.summary);
        }
        if (res.data.meta) {
          setTotal(res.data.meta.total || 0);
          setTotalPages(res.data.meta.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Fetch withdrawals error:', err);
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [page, limit, statusFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/admin/withdrawals/${selectedRequest.id}/approve`,
        {},
        getHeaders()
      );
      if (res.data && res.data.success) {
        toast.success('Withdrawal request approved successfully');
        setApproveModalOpen(false);
        setSelectedRequest(null);
        fetchWithdrawals();
      }
    } catch (err) {
      console.error('Approve withdrawal error:', err);
      toast.error(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/admin/withdrawals/${selectedRequest.id}/reject`,
        { reject_reason: rejectReason },
        getHeaders()
      );
      if (res.data && res.data.success) {
        toast.success('Withdrawal request rejected successfully');
        setRejectModalOpen(false);
        setSelectedRequest(null);
        setRejectReason('');
        fetchWithdrawals();
      }
    } catch (err) {
      console.error('Reject withdrawal error:', err);
      toast.error(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0';
    return price.toLocaleString('vi-VN');
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Client-side search filtering (if needed on top of API results)
  const filteredRequests = requests.filter(req => {
    const matchesSearch = searchTerm ? (
      (req.shopId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.bankAccount || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) : true;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pending Requests Count */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Requests</p>
            <h3 className="text-2xl font-black text-slate-900">{summary.pendingCount}</h3>
          </div>
        </div>

        {/* Pending Amount */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="size-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <span className="material-symbols-outlined text-3xl">payments</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Volume</p>
            <h3 className="text-2xl font-black text-slate-900">{formatPrice(summary.pendingAmount)} <span className="text-xs text-slate-400 font-medium">₫</span></h3>
          </div>
        </div>

        {/* Approved Today */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="size-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Approved Today</p>
            <h3 className="text-2xl font-black text-slate-900">{summary.approvedToday}</h3>
          </div>
        </div>

        {/* Rejected Today */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="size-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
            <span className="material-symbols-outlined text-3xl">cancel</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rejected Today</p>
            <h3 className="text-2xl font-black text-slate-900">{summary.rejectedToday}</h3>
          </div>
        </div>
      </div>

      {/* Main Governance Content */}
      <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-black text-slate-950 uppercase tracking-widest text-[11px] flex items-center gap-2">
            <span className="material-symbols-outlined text-base">receipt_long</span>
            Withdrawal Request List
          </h3>

          {/* Tab Filter Controls */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="min-h-[350px] flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Requests...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Date</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Details</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-16 text-center text-sm font-medium text-slate-400">
                      No withdrawal requests found.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req, index) => {
                    const { date, time } = formatDate(req.createdAt);
                    
                    let badgeClass = 'bg-slate-100 text-slate-600 border border-slate-200/50';
                    if (req.status === 'pending') badgeClass = 'bg-blue-50 text-primary border border-blue-100/50';
                    if (req.status === 'approved' || req.status === 'paid') badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100/50';
                    if (req.status === 'rejected') badgeClass = 'bg-rose-50 text-rose-700 border border-rose-100/50';

                    return (
                      <tr key={req.id || index} className="hover:bg-slate-50/30 transition-colors">
                        {/* Shop info */}
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={req.shopId?.logoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23E2E8F0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%2364748B">Shop</text></svg>`}
                              alt={req.shopId?.name || 'Shop Logo'}
                              className="size-10 rounded-full border border-slate-200 object-cover"
                            />
                            <div>
                              <p className="text-sm font-black text-slate-800">{req.shopId?.name || 'Unknown Shop'}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">@{req.shopId?.slug || 'shop'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Request Date */}
                        <td className="px-8 py-5">
                          <p className="text-xs font-bold text-slate-800">{date}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{time}</p>
                        </td>

                        {/* Bank Details */}
                        <td className="px-8 py-5 text-xs font-semibold text-slate-600">
                          {req.bankDetails ? (
                            <div className="space-y-1">
                              <p className="font-black text-slate-900">{req.bankDetails.bankName}</p>
                              <p className="font-mono text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded inline-block select-all">{req.bankDetails.accountNumber}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{req.bankDetails.accountName}</p>
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">No details found</p>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-8 py-5 text-sm font-black text-slate-900">
                          {formatPrice(req.amount)} ₫
                        </td>

                        {/* Status Badge */}
                        <td className="px-8 py-5">
                          <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${badgeClass}`}>
                            {req.status}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="px-8 py-5 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setApproveModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer border border-emerald-100/50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setRejectModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer border border-rose-100/50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-slate-400">
                              {req.status === 'rejected' ? (
                                <p className="italic max-w-[200px] ml-auto text-rose-500 font-semibold" title={req.rejectReason}>
                                  Reason: {req.rejectReason || 'N/A'}
                                </p>
                              ) : (
                                <p className="italic">
                                  Approved by {req.approvedBy?.name || 'Admin'}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} requests
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="size-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`size-9 rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer ${
                    page === p
                      ? 'bg-primary text-white shadow-lg shadow-blue-200'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="size-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Approve Modal */}
      {approveModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 max-w-[450px] w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-widest mb-2">Approve Withdrawal</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Are you sure you want to approve the withdrawal of <strong className="text-slate-900">{formatPrice(selectedRequest.amount)} ₫</strong> for <strong className="text-slate-900">{selectedRequest.shopId?.name}</strong>? This will release the funds immediately.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setApproveModalOpen(false);
                  setSelectedRequest(null);
                }}
                disabled={submitting}
                className="px-5 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-5 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                {submitting ? 'Approving...' : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 max-w-[450px] w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-widest mb-2">Reject Withdrawal</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Please enter the reason for rejecting the withdrawal of <strong className="text-slate-900">{formatPrice(selectedRequest.amount)} ₫</strong> for <strong className="text-slate-900">{selectedRequest.shopId?.name}</strong>.
            </p>
            <div className="space-y-4 mb-6">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason (e.g., Invalid bank details, account mismatch)"
                rows="3"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                disabled={submitting}
                className="px-5 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="px-5 py-3 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                {submitting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalApprovalTab;
