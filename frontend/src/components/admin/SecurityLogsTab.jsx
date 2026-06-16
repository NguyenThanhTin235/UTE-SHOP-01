import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SecurityLogsTab = ({ searchTerm }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActions, setTotalActions] = useState(0);

  const [timeRange, setTimeRange] = useState('all');
  const [role, setRole] = useState('all');
  const [actionType, setActionType] = useState('all');
  const [detailModal, setDetailModal] = useState({ isOpen: false, log: null });

  const [activePageInput, setActivePageInput] = useState(page.toString());

  useEffect(() => {
    setActivePageInput(page.toString());
  }, [page]);

  const handleActivePageSubmit = () => {
    const pageNum = parseInt(activePageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum);
    } else {
      setActivePageInput(page.toString());
      toast.error(`Please enter a valid page between 1 and ${totalPages}`);
    }
  };

  const getPageNumbers = () => {
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);

    if (page <= 3) {
      start = 1;
      end = maxVisible;
    } else if (page >= totalPages - 2) {
      start = totalPages - maxVisible + 1;
      end = totalPages;
    }

    return Array.from({ length: (end - start) + 1 }, (_, i) => start + i);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const params = new URLSearchParams({
        page,
        limit: 5,
        timeRange,
        role,
        actionType,
        search: searchTerm || ''
      });

      const response = await axios.get(`http://localhost:5000/api/admin/security-logs?${params.toString()}`, config);

      if (response.data && response.data.success) {
        setLogs(response.data.data);
        setTotalPages(response.data.meta.pagination.totalPages);
        setTotalActions(response.data.meta.totalActions);
      } else {
        toast.error('Failed to load security logs');
      }
    } catch (error) {
      console.error('fetchLogs error:', error);
      toast.error('Failed to load security logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, timeRange, role, actionType, searchTerm]);

  const openDetailModal = (log) => {
    setDetailModal({ isOpen: true, log });
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getActionColor = (action) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('BAN') || act.includes('LOCK')) return 'bg-error';
    if (act.includes('APPROVE') || act.includes('UPDATE') || act.includes('GRANT')) return 'bg-success';
    if (act.includes('MODIFY') || act.includes('EDIT')) return 'bg-warning';
    return 'bg-primary';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-level-1 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="material-symbols-outlined text-slate-400 text-sm">calendar_today</span>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 outline-none"
          >
            <option value="all">All Time</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="material-symbols-outlined text-slate-400 text-sm">badge</span>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Super Admin</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="material-symbols-outlined text-slate-400 text-sm">category</span>
          <select 
            value={actionType} 
            onChange={(e) => setActionType(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 outline-none"
          >
            <option value="all">All Action Types</option>
            <option value="update">Data Update</option>
            <option value="grant">Access Grant / Role</option>
            <option value="delete">Deletion</option>
            <option value="alert">Security Alert</option>
          </select>
        </div>
        <div className="flex-1"></div>
        <button 
          onClick={() => {
            setTimeRange('all');
            setRole('all');
            setActionType('all');
            setPage(1);
          }}
          className="px-5 py-2.5 text-primary text-xs font-black uppercase tracking-widest hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
        >
          Clear Filters
        </button>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-level-1 overflow-x-auto custom-scrollbar">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <colgroup>
              <col style={{ width: '15%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Administrator</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Target Entity</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-500 font-medium text-sm">
                    No security logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => {
                  const logId = log._id || log.id || index;
                  const { date, time } = formatDate(log.createdAt);

                  return (
                    <React.Fragment key={logId}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-6">
                          <p className="text-sm font-bold text-slate-700">{date}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{time}</p>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black ${log.actor?.role === 'admin' ? 'bg-primary' : 'bg-slate-400'}`}>
                              {getInitials(log.actor?.full_name)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 leading-tight">{log.actor?.full_name || 'System Auto'}</p>
                              <p className={`text-[10px] font-black uppercase tracking-tight ${log.actor?.role === 'admin' ? 'text-primary' : 'text-slate-400'}`}>
                                {log.actor?.role || 'SYSTEM'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${getActionColor(log.action)}`}></span>
                            <p className="text-sm font-bold text-slate-700 uppercase tracking-tight">{log.action}</p>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <p className="text-sm font-bold text-slate-700">{log.entity_type}</p>
                          <p className="text-[11px] text-slate-400 font-medium break-all">ID: {log.entity_id || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <button 
                            onClick={() => openDetailModal(log)} 
                            className="p-2 transition-all cursor-pointer text-slate-400 hover:text-primary"
                          >
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && logs.length > 0 && totalPages > 1 && (
        <div className="px-8 py-5 bg-white border border-slate-200 rounded-3xl flex items-center justify-between shadow-level-1 gap-4 flex-wrap">
          <p className="text-[11px] text-slate-500 font-bold">
            Showing <span className="text-slate-900">{(page - 1) * 5 + 1}</span> to{' '}
            <span className="text-slate-900">
              {Math.min(page * 5, totalActions)}
            </span>{' '}
            of <span className="text-slate-900">{totalActions.toLocaleString('vi-VN')}</span> actions
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              {/* Jump to first page */}
              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-primary disabled:opacity-40 transition-all cursor-pointer"
                title="First Page"
              >
                <span className="material-symbols-outlined text-sm">first_page</span>
              </button>

              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-primary disabled:opacity-40 transition-all cursor-pointer"
                title="Previous Page"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              <div className="flex items-center gap-1">
                {getPageNumbers().map((p) => {
                  const isActive = page === p;
                  return isActive ? (
                    <input
                      key={p}
                      type="number"
                      min="1"
                      max={totalPages}
                      value={activePageInput}
                      onChange={(e) => setActivePageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleActivePageSubmit();
                        }
                      }}
                      onBlur={handleActivePageSubmit}
                      className="w-10 h-8 text-center bg-primary text-white rounded-xl text-[11px] font-black outline-none border-none focus:ring-2 focus:ring-blue-300 shadow-md shadow-blue-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                      title="Enter page number directly"
                    />
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white border border-transparent hover:border-slate-200 text-slate-500 font-bold text-[11px] transition-all cursor-pointer"
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-primary disabled:opacity-40 transition-all cursor-pointer"
                title="Next Page"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>

              {/* Jump to last page */}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-primary disabled:opacity-40 transition-all cursor-pointer"
                title="Last Page"
              >
                <span className="material-symbols-outlined text-sm">last_page</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.isOpen && detailModal.log && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131b2e]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl border border-[#c3c6d7]/30 transform scale-100 transition-all max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-12 bg-blue-50 rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">info</span>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#131b2e]">Log Details</h3>
                  <p className="text-[#434655] text-xs font-medium">Action: <span className="font-bold text-primary">{detailModal.log.action}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setDetailModal({ isOpen: false, log: null })}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {detailModal.log.metadata && Object.keys(detailModal.log.metadata).length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(detailModal.log.metadata).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{key.replace(/([A-Z])/g, ' $1').trim().replace(/_/g, ' ')}</p>
                      {typeof value === 'object' && value !== null ? (
                        <pre className="text-sm font-mono text-slate-600 bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-base font-bold text-slate-800 break-words">{String(value)}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 text-sm font-medium">
                  No detailed metadata available
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setDetailModal({ isOpen: false, log: null })}
                className="py-3 px-8 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityLogsTab;
