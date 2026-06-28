import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const RoleUpgradesTab = ({ searchTerm: globalSearchTerm }) => {
  const [requests, setRequests] = useState({ sellers: [], shippers: [] });
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters & Pagination via URL
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedStatus = searchParams.get('status') || 'all';
  const selectedRole = searchParams.get('role') || 'all';
  const currentPage = parseInt(searchParams.get('page')) || 1;

  const [localSearch, setLocalSearch] = useState('');
  const itemsPerPage = 10;

  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value === 'all' || value === 1) params.delete(key);
        else params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  const setSelectedStatus = (status) => updateParams({ status, page: 1 });
  const setSelectedRole = (role) => updateParams({ role, page: 1 });
  const setCurrentPage = (page) => updateParams({ page });

  // Reset page when localSearch changes
  useEffect(() => {
    if (localSearch) updateParams({ page: 1 });
  }, [localSearch]);

  // Modals
  const [selectedRequest, setSelectedRequest] = useState(null); // { type, data }
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Dropdowns
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Sync global search
  useEffect(() => {
    if (globalSearchTerm !== undefined) {
      setLocalSearch(globalSearchTerm);
    }
  }, [globalSearchTerm]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const response = await axios.get('http://localhost:5000/api/admin/role-upgrades', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      toast.error('Error loading upgrade requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (type, id) => {
    setActionLoadingId(id);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const response = await axios.put(`http://localhost:5000/api/admin/role-upgrades/${type}/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success(response.data.message || `Successfully approved ${type} request`);
        fetchRequests();
        if (selectedRequest && selectedRequest.data._id === id) {
           setSelectedRequest(null); // Close modal on success
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error approving request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (type, id) => {
    if (!rejectionReason.trim()) {
        return toast.error('Please provide a rejection reason');
    }
    setActionLoadingId(id);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const response = await axios.put(`http://localhost:5000/api/admin/role-upgrades/${type}/${id}/reject`, {
        rejection_reason: rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success(response.data.message || `Successfully rejected ${type} request`);
        setRejectingId(null);
        setRejectionReason('');
        fetchRequests();
        if (selectedRequest && selectedRequest.data._id === id) {
           setSelectedRequest(null);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error rejecting request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredData = useMemo(() => {
    let allData = [];
    
    // Normalize and add type
    requests.sellers.forEach(r => allData.push({ ...r, type: 'seller' }));
    requests.shippers.forEach(r => allData.push({ ...r, type: 'shipper' }));

    // Filter by Role
    if (selectedRole !== 'all') {
      allData = allData.filter(r => r.type === selectedRole);
    }

    // Filter by Status
    if (selectedStatus !== 'all') {
      allData = allData.filter(r => r.status === selectedStatus);
    }

    // Filter by Search
    if (localSearch.trim()) {
      const searchLower = localSearch.toLowerCase();
      allData = allData.filter(r => {
        const nameMatch = r.user_id?.full_name?.toLowerCase().includes(searchLower);
        const emailMatch = r.user_id?.email?.toLowerCase().includes(searchLower);
        const phoneMatch = r.user_id?.phone?.includes(searchLower);
        return nameMatch || emailMatch || phoneMatch;
      });
    }

    // Sort by createdAt descending
    allData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return allData;
  }, [requests, selectedRole, selectedStatus, localSearch]);

  // Paginate data
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-md text-xs font-bold uppercase">Pending</span>;
      case 'active': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-bold uppercase">Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-xs font-bold uppercase">Rejected</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-xs font-bold uppercase">{status}</span>;
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
  };

  return (
    <div className="p-4 md:p-10 font-sans w-full max-w-7xl mx-auto">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-4xl">verified_user</span>
            Role Upgrades
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Review and manage user requests to become Sellers or Shippers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium w-64 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <button 
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:border-slate-300 transition-all shadow-sm text-slate-700"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              {selectedRole === 'all' ? 'All Roles' : selectedRole === 'seller' ? 'Sellers Only' : 'Shippers Only'}
            </button>
            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20">
                <button onClick={() => {setSelectedRole('all'); setShowRoleDropdown(false)}} className={`w-full text-left px-4 py-2 text-sm font-bold ${selectedRole === 'all' ? 'text-primary bg-primary/5' : 'text-slate-600 hover:bg-slate-50'}`}>All Roles</button>
                <button onClick={() => {setSelectedRole('seller'); setShowRoleDropdown(false)}} className={`w-full text-left px-4 py-2 text-sm font-bold ${selectedRole === 'seller' ? 'text-primary bg-primary/5' : 'text-slate-600 hover:bg-slate-50'}`}>Sellers Only</button>
                <button onClick={() => {setSelectedRole('shipper'); setShowRoleDropdown(false)}} className={`w-full text-left px-4 py-2 text-sm font-bold ${selectedRole === 'shipper' ? 'text-primary bg-primary/5' : 'text-slate-600 hover:bg-slate-50'}`}>Shippers Only</button>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button 
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:border-slate-300 transition-all shadow-sm text-slate-700"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              {selectedStatus === 'all' ? 'All Statuses' : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
            </button>
            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20">
                <button onClick={() => {setSelectedStatus('all'); setShowStatusDropdown(false)}} className={`w-full text-left px-4 py-2 text-sm font-bold ${selectedStatus === 'all' ? 'text-primary bg-primary/5' : 'text-slate-600 hover:bg-slate-50'}`}>All Statuses</button>
                <button onClick={() => {setSelectedStatus('pending'); setShowStatusDropdown(false)}} className={`w-full text-left px-4 py-2 text-sm font-bold ${selectedStatus === 'pending' ? 'text-primary bg-primary/5' : 'text-slate-600 hover:bg-slate-50'}`}>Pending</button>
                <button onClick={() => {setSelectedStatus('active'); setShowStatusDropdown(false)}} className={`w-full text-left px-4 py-2 text-sm font-bold ${selectedStatus === 'active' ? 'text-primary bg-primary/5' : 'text-slate-600 hover:bg-slate-50'}`}>Approved</button>
                <button onClick={() => {setSelectedStatus('rejected'); setShowStatusDropdown(false)}} className={`w-full text-left px-4 py-2 text-sm font-bold ${selectedStatus === 'rejected' ? 'text-primary bg-primary/5' : 'text-slate-600 hover:bg-slate-50'}`}>Rejected</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
           <div className="flex justify-center items-center py-20">
               <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
           </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <span className="material-symbols-outlined text-6xl mb-4 opacity-50">inbox</span>
             <p className="font-bold text-lg text-slate-500">No requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="w-[35%] px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">User</th>
                  <th className="w-[20%] px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Request Role</th>
                  <th className="w-[20%] px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="w-[120px] px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                  <th className="w-[150px] md:w-[200px] px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentData.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {req.user_id?.avatar_url ? (
                            <img src={req.user_id.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400">person</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{req.user_id?.full_name || 'Unknown User'}</p>
                          <p className="text-xs font-medium text-slate-500">{req.user_id?.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold capitalize ${req.type === 'seller' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        <span className="material-symbols-outlined text-[14px]">
                           {req.type === 'seller' ? 'storefront' : 'local_shipping'}
                        </span>
                        {req.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-sm font-bold text-slate-700">{new Date(req.createdAt).toLocaleDateString()}</p>
                       <p className="text-xs text-slate-400 font-medium">{new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                       {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button 
                         onClick={() => setSelectedRequest({ type: req.type, data: req })}
                         className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                       >
                         <span className="material-symbols-outlined text-[16px]">visibility</span>
                         View Details
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {filteredData.length > itemsPerPage && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200">
                <p className="text-sm text-slate-500 font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(filteredData.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${selectedRequest.type === 'seller' ? 'bg-blue-600' : 'bg-purple-600'} shadow-lg`}>
                  <span className="material-symbols-outlined text-2xl">{selectedRequest.type === 'seller' ? 'storefront' : 'local_shipping'}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight capitalize">{selectedRequest.type} Request</h3>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">Application Date: {new Date(selectedRequest.data.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => {setSelectedRequest(null); setRejectingId(null); setRejectionReason('');}} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
               {/* User Info */}
               <div className="mb-8">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Applicant Information</h4>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                     <img src={selectedRequest.data.user_id?.avatar_url || `https://ui-avatars.com/api/?name=${selectedRequest.data.user_id?.full_name}`} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                     <div>
                        <h5 className="font-bold text-lg text-slate-900">{selectedRequest.data.user_id?.full_name}</h5>
                        <p className="text-sm text-slate-500 font-medium">{selectedRequest.data.user_id?.email} • {selectedRequest.data.user_id?.phone}</p>
                     </div>
                     <div className="ml-auto">
                        {getStatusBadge(selectedRequest.data.status)}
                     </div>
                  </div>
               </div>

               {/* Request Details */}
               <div className="mb-8">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Application Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                     {selectedRequest.type === 'seller' ? (
                       <>
                         <DetailItem label="Bank Name" value={selectedRequest.data.bank_name} />
                         <DetailItem label="Account Holder" value={selectedRequest.data.bank_account_name} />
                         <DetailItem label="Account Number" value={selectedRequest.data.bank_account_number} />
                         <DetailItem label="GST Number" value={selectedRequest.data.gst_number || 'N/A'} />
                         <DetailItem label="Pickup Address" value={selectedRequest.data.pickup_address} fullWidth />
                       </>
                     ) : (
                       <>
                         <DetailItem label="CCCD Number" value={selectedRequest.data.cccd_number} />
                         <DetailItem label="Vehicle Type" value={selectedRequest.data.vehicle_type} />
                         <DetailItem label="Vehicle Plate" value={selectedRequest.data.vehicle_plate} />
                         <DetailItem label="Operating Area" value={selectedRequest.data.operating_area} />
                       </>
                     )}
                  </div>
               </div>

               {/* Documents */}
               <div className="mb-8">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Uploaded Documents</h4>
                  <div className="grid grid-cols-2 gap-4">
                     {selectedRequest.type === 'seller' ? (
                       <>
                         <DocumentPreview label="Identity Card" url={selectedRequest.data.identity_card_url} getImageUrl={getImageUrl} />
                         <DocumentPreview label="Business License" url={selectedRequest.data.business_license_url} getImageUrl={getImageUrl} />
                       </>
                     ) : (
                       <>
                         <DocumentPreview label="CCCD Front" url={selectedRequest.data.cccd_front_url} getImageUrl={getImageUrl} />
                         <DocumentPreview label="CCCD Back" url={selectedRequest.data.cccd_back_url} getImageUrl={getImageUrl} />
                       </>
                     )}
                  </div>
               </div>

               {selectedRequest.data.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
                     <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Rejection Reason</p>
                     <p className="font-medium text-sm">{selectedRequest.data.rejection_reason}</p>
                  </div>
               )}
            </div>

            {/* Action Bar */}
            {selectedRequest.data.status === 'pending' && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
                 {rejectingId === selectedRequest.data._id ? (
                    <div className="animate-in slide-in-from-bottom-2">
                       <label className="text-xs font-bold text-slate-700 mb-1 block">Reason for Rejection <span className="text-red-500">*</span></label>
                       <textarea 
                         value={rejectionReason}
                         onChange={(e) => setRejectionReason(e.target.value)}
                         placeholder="Explain why this request is rejected..."
                         className="w-full p-3 rounded-xl border border-red-200 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 text-sm mb-3"
                         rows="3"
                       />
                       <div className="flex justify-end gap-2">
                          <button onClick={() => setRejectingId(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                          <button 
                            onClick={() => handleReject(selectedRequest.type, selectedRequest.data._id)}
                            disabled={actionLoadingId === selectedRequest.data._id}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors flex items-center gap-2"
                          >
                            {actionLoadingId === selectedRequest.data._id ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : null}
                            Confirm Rejection
                          </button>
                       </div>
                    </div>
                 ) : (
                    <div className="flex justify-end gap-3">
                       <button 
                         onClick={() => setRejectingId(selectedRequest.data._id)}
                         className="px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors shadow-sm"
                       >
                         Reject Request
                       </button>
                       <button 
                         onClick={() => handleApprove(selectedRequest.type, selectedRequest.data._id)}
                         disabled={actionLoadingId === selectedRequest.data._id}
                         className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-md shadow-green-600/20 transition-all flex items-center gap-2"
                       >
                         {actionLoadingId === selectedRequest.data._id ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                         Approve Request
                       </button>
                    </div>
                 )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value, fullWidth }) => (
  <div className={`bg-white border border-slate-200 rounded-xl p-3 ${fullWidth ? 'col-span-2' : ''}`}>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-bold text-slate-900">{value}</p>
  </div>
);

const DocumentPreview = ({ label, url, getImageUrl }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <div className="h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden group relative">
       {url ? (
         <>
           <img src={getImageUrl(url)} alt={label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
           <a href={getImageUrl(url)} target="_blank" rel="noreferrer" className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
             <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">open_in_new</span>
           </a>
         </>
       ) : (
         <span className="text-xs font-medium text-slate-400">No Document</span>
       )}
    </div>
  </div>
);

export default RoleUpgradesTab;
