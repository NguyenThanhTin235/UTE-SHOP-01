import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
}

const SkeletonReport = () => (
  <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 animate-pulse flex gap-6">
    <div className="size-14 rounded-2xl bg-slate-200 shrink-0"></div>
    <div className="flex-1 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-6 w-48 bg-slate-200 rounded"></div>
        <div className="h-5 w-20 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="h-4 w-full bg-slate-200 rounded"></div>
      <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
      <div className="flex gap-6 mt-4">
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
      </div>
    </div>
  </div>
);

const ViolationsTab = () => {
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const severityFilter = searchParams.get('severity') || 'all';
  const [rowsDropdownOpen, setRowsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, id: null, action: '', title: '', reason: '' });

  const navigate = useNavigate();

  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 10;

  useEffect(() => {
    if (!searchParams.has('page') || !searchParams.has('limit') || !searchParams.has('severity')) {
      const newParams = new URLSearchParams(searchParams);
      if (!newParams.has('page')) newParams.set('page', '1');
      if (!newParams.has('limit')) newParams.set('limit', '10');
      if (!newParams.has('severity')) newParams.set('severity', 'all');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setRowsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/manager/violations`, {
        params: {
          page,
          limit,
          severity: severityFilter,
        },
        headers: getAuthHeader(),
      });
      if (data.success) {
        setViolations(data.data || []);
        setTotalCount(data.meta?.pagination?.total || data.data.length || 0);
      }
    } catch (err) {
      console.error('Fetch violations error:', err);
      toast.error('Failed to load incident queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, [page, limit, severityFilter]);

  const confirmAction = (id, action, title) => {
    setActionModal({ isOpen: true, id, action, title });
  };

  const executeAction = async () => {
    const { id, action } = actionModal;
    setActionModal({ isOpen: false, id: null, action: '', title: '' });
    try {
      const { data } = await axios.post(
        `${API}/manager/violations/${id}/action`,
        { action },
        { headers: getAuthHeader() }
      );
      if (data.success) {
        toast.success(data.message || 'Action executed successfully');
        fetchViolations();
      }
    } catch (err) {
      console.error('Action error:', err);
      toast.error(err.response?.data?.message || 'Failed to execute moderation action');
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Filter */}
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-xl font-black text-slate-900">Incident Queue</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Review user reports and automated flags
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={severityFilter}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              params.set('severity', e.target.value);
              params.set('page', 1);
              setSearchParams(params);
            }}
            className="pl-4 pr-10 py-2 min-w-[140px] bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:ring-[#004ac6] focus:border-[#004ac6] cursor-pointer shadow-sm outline-none"
          >
            <option value="all">All Severities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
          </select>
        </div>
      </div>

      {/* Incident List */}
      <div className="p-8">
        <div className="space-y-6">
          {loading ? (
            <>
              <SkeletonReport />
              <SkeletonReport />
            </>
          ) : violations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/20 rounded-3xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">gavel</span>
              <h3 className="text-lg font-bold text-slate-900">Incident Queue Clean</h3>
              <p className="text-sm text-slate-500 mt-1">There are no pending violations matching your filter.</p>
            </div>
          ) : (
            violations.map((violation) => {
              const isHigh = violation.severity === 'high';
              const isMedium = violation.severity === 'medium';

              let iconName = 'warning';
              let iconBg = 'bg-red-100 text-[#dc2626]';
              if (violation.type === 'chat_abusive') {
                iconName = 'chat_bubble';
                iconBg = 'bg-orange-100 text-[#f59e0b]';
              } else if (violation.type === 'product_flag') {
                iconName = 'inventory_2';
                iconBg = 'bg-orange-100 text-[#f59e0b]';
              } else if (violation.severity === 'low') {
                iconName = 'info';
                iconBg = 'bg-blue-100 text-[#004ac6]';
              }

              const targetShopId = violation.shopId?.id || violation.shopId;
              const targetProductId = violation.productId?.id || violation.productId;

              return (
                <div
                  key={violation.id}
                  onClick={() => navigate(`/manager/violation_detail/${violation.id}`)}
                  className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 hover:border-[#004ac6]/20 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex flex-col xl:flex-row items-start justify-between gap-6">
                    <div className="flex gap-6">
                      <div className={`size-14 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                        <span className="material-symbols-outlined text-3xl">{iconName}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                            {violation.title}
                          </h3>
                          <span
                            className={`px-3 py-1 text-white text-[10px] font-black rounded-lg uppercase tracking-wider ${isHigh
                              ? 'bg-red-500'
                              : isMedium
                                ? 'bg-orange-500'
                                : 'bg-blue-500'
                              }`}
                          >
                            {violation.severity} Risk
                          </span>
                        </div>
                        
                        {/* Display Shop and Product Info */}
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          {violation.shopId?.name && (
                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-lg">
                              <span className="material-symbols-outlined text-[16px] text-[#004ac6]">storefront</span>
                              {violation.shopId.name}
                            </div>
                          )}
                          {violation.productId?.name && (
                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-lg">
                              <span className="material-symbols-outlined text-[16px] text-orange-500">inventory_2</span>
                              {violation.productId.name}
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-slate-600 mt-3 font-medium leading-relaxed max-w-3xl">
                          {violation.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-lg">calendar_today</span>
                            <span className="text-[11px] font-bold text-slate-500 uppercase">
                              {new Date(violation.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {violation.reporterInfo && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-slate-400 text-lg">person</span>
                              <span className="text-[11px] font-bold text-slate-500 uppercase">
                                {violation.reporterInfo}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-wrap xl:flex-col gap-2 shrink-0 w-full xl:w-auto xl:min-w-[160px]">
                      {violation.severity === 'high' ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmAction(violation.id || violation._id, 'lock_shop', violation.title); }}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md hover:scale-[1.02] transition-all cursor-pointer text-center w-full"
                          >
                            Lock Shop
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmAction(violation.id || violation._id, 'hide_products', violation.title); }}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer text-center w-full"
                          >
                            Hide Product
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmAction(violation.id || violation._id, 'dismiss', violation.title); }}
                            className="px-6 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer text-center w-full"
                          >
                            Dismiss
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmAction(violation.id || violation._id, 'issue_warning', violation.title); }}
                            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl shadow-md hover:scale-[1.02] transition-all cursor-pointer text-center w-full"
                          >
                            Issue Warning
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmAction(violation.id || violation._id, 'suspend_chat', violation.title); }}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer text-center w-full"
                          >
                            Suspend Chat
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmAction(violation.id || violation._id, 'dismiss', violation.title); }}
                            className="px-6 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer text-center w-full"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      {!loading && totalCount > 0 && (
        <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 z-20 relative">
          <div className="flex flex-wrap items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <span>Showing {startItem} - {endItem} of {totalCount} reports</span>
            <span className="hidden md:inline text-slate-200">|</span>
            <div className="flex items-center gap-2 relative" ref={dropdownRef}>
              <span>Rows per page:</span>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setRowsDropdownOpen(!rowsDropdownOpen)}
                className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 transition-colors px-2 py-1 rounded-lg text-slate-700 font-black cursor-pointer shadow-sm"
              >
                {limit}
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>

              {rowsDropdownOpen && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 min-w-[70px] animate-in fade-in slide-in-from-bottom-2 duration-150"
                >
                  {[10, 20, 50].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setLimit(option);
                        setRowsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs font-black transition-colors block cursor-pointer ${limit === option
                        ? 'bg-[#E8EFFF] text-[#004ac6]'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Page Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:pointer-events-none disabled:opacity-40 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const active = idx + 1 === page;
              return (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  className={`size-10 rounded-xl flex items-center justify-center font-black transition-all cursor-pointer shadow-sm ${active
                    ? 'bg-[#004ac6] text-white shadow-md shadow-blue-100'
                    : 'bg-white border border-slate-200 text-slate-500 hover:text-[#004ac6]'
                    }`}
                >
                  {idx + 1}
                </button>
              );
            })}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:pointer-events-none disabled:opacity-40 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className={`size-16 rounded-full flex items-center justify-center mx-auto border ${actionModal.action === 'dismiss' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                actionModal.action === 'lock_shop' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'
              }`}>
              <span className="material-symbols-outlined text-[32px] font-bold">
                {actionModal.action === 'dismiss' ? 'delete_sweep' : 'warning'}
              </span>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {actionModal.action === 'lock_shop' ? 'Lock Shop?' :
                  actionModal.action === 'hide_products' ? 'Hide Products?' :
                    actionModal.action === 'issue_warning' ? 'Issue Warning?' :
                      actionModal.action === 'suspend_chat' ? 'Suspend Chat?' : 'Dismiss Report?'}
              </h3>
              <p className="text-slate-500 font-medium text-sm">
                Are you sure you want to {actionModal.action.replace('_', ' ')} for <br /> <strong className="text-slate-700">{actionModal.title}</strong>?
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setActionModal({ isOpen: false, id: null, action: '', title: '' })}
                className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className={`flex-1 py-4 text-white rounded-2xl font-black text-sm cursor-pointer shadow-lg ${actionModal.action === 'dismiss' ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-200' :
                    actionModal.action === 'lock_shop' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
                  }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationsTab;
