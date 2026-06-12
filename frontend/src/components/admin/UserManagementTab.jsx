import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Skeleton component for rows
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-8 py-5">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 rounded w-28"></div>
          <div className="h-3 bg-slate-200 rounded w-40"></div>
        </div>
      </div>
    </td>
    <td className="px-8 py-5">
      <div className="h-4 bg-slate-200 rounded w-20 mb-1"></div>
      <div className="h-3 bg-slate-200 rounded w-16"></div>
    </td>
    <td className="px-8 py-5">
      <div className="h-6 bg-slate-200 rounded-full w-20"></div>
    </td>
    <td className="px-8 py-5">
      <div className="h-6 bg-slate-200 rounded-full w-16"></div>
    </td>
    <td className="px-8 py-5 text-right">
      <div className="flex justify-end gap-2">
        <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
        <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
      </div>
    </td>
  </tr>
);

const UserManagementTab = ({ searchTerm: globalSearchTerm }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    perPage: 10,
    currentPage: 1,
    totalPages: 1
  });

  // Local filters
  const [localSearch, setLocalSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal and details
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Role dropdown popover
  const [showRoleDropdownId, setShowRoleDropdownId] = useState(null);

  // Action loading state
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Sync global search term from Header
  useEffect(() => {
    if (globalSearchTerm !== undefined) {
      setLocalSearch(globalSearchTerm);
      setCurrentPage(1);
    }
  }, [globalSearchTerm]);

  // Fetch Users from Backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const search = localSearch.trim();
      const response = await axios.get(
        `http://localhost:5000/api/admin/users?page=${currentPage}&limit=10&search=${encodeURIComponent(search)}&role=${selectedRole}&status=${selectedStatus}`,
        config
      );

      if (response.data && response.data.success) {
        setUsers(response.data.data || []);
        if (response.data.meta && response.data.meta.pagination) {
          setPagination(response.data.meta.pagination);
        }
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch platform users');
    } finally {
      setLoading(false);
    }
  };

  // Run search on page change or filter changes
  useEffect(() => {
    fetchUsers();
  }, [currentPage, selectedRole, selectedStatus]);

  // Debounced search / search button trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  // Toggle user locked/active status
  const handleToggleStatus = async (userId, currentStatus) => {
    setActionLoadingId(userId);
    const newStatus = currentStatus === 'locked' ? 'active' : 'locked';
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/status`,
        { status: newStatus },
        config
      );

      if (response.data && response.data.success) {
        toast.success(`User status updated to ${newStatus}`);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        if (selectedUser && selectedUser.profile.id === userId) {
          setSelectedUser(prev => ({
            ...prev,
            profile: { ...prev.profile, status: newStatus }
          }));
        }
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Update user role
  const handleUpdateRole = async (userId, newRole) => {
    setActionLoadingId(userId);
    setShowRoleDropdownId(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        { role: newRole },
        config
      );

      if (response.data && response.data.success) {
        toast.success(`User role updated to ${newRole}`);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        if (selectedUser && selectedUser.profile.id === userId) {
          setSelectedUser(prev => ({
            ...prev,
            profile: { ...prev.profile, role: newRole }
          }));
        }
      }
    } catch (error) {
      console.error('Update role error:', error);
      toast.error(error.response?.data?.message || 'Failed to update user role');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open user details slide-over
  const handleViewDetails = async (userId) => {
    setDetailsLoading(true);
    setShowDetailsModal(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.get(
        `http://localhost:5000/api/admin/users/${userId}`,
        config
      );

      if (response.data && response.data.success) {
        setSelectedUser(response.data.data);
      }
    } catch (error) {
      console.error('Fetch user details error:', error);
      toast.error(error.response?.data?.message || 'Failed to load user detailed profile');
      setShowDetailsModal(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Helper styles for Role badges
  const getRoleStyle = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'manager':
        return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'seller':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
      case 'customer':
      default:
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    }
  };

  // Helper styles for Status badges
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-50 text-green-600 border border-green-100';
      case 'locked':
        return 'bg-red-50 text-red-600 border border-red-100';
      case 'inactive':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-600 border border-amber-100';
    }
  };

  // Format currency helper
  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="space-y-6">
      {/* Section Title & Description */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">User Directory</h2>
          <p className="text-slate-500 text-xs mt-1">Manage platform accounts, audit permissions, modify access rights, and view transactions logs.</p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#F1F5F9] rounded-xl px-4 py-2.5 w-full md:w-80 border border-slate-200/60 focus-within:ring-2 focus-within:ring-[#004ac6]/20 transition-all">
          <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Search users by name, email, phone..."
            className="bg-transparent border-none text-xs w-full placeholder:text-slate-400 font-semibold ml-2 outline-none"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {localSearch && (
            <button type="button" onClick={() => { setLocalSearch(''); setCurrentPage(1); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl outline-none cursor-pointer transition-all"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="seller">Seller</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl outline-none cursor-pointer transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <button
            onClick={() => { setLocalSearch(''); setSelectedRole('all'); setSelectedStatus('all'); setCurrentPage(1); }}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer border border-slate-200/40"
            title="Reset Filters"
          >
            <span className="material-symbols-outlined text-lg">filter_alt_off</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-4">User Profile</th>
                <th className="px-8 py-4">Wallets / Balances</th>
                <th className="px-8 py-4">System Role</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-sm font-bold text-slate-400">
                    No matching users found in the system.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60 relative">
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150';
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-medium">
                            <span className="line-clamp-1">{user.email}</span>
                            <span>•</span>
                            <span>{user.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <div className="text-xs font-semibold text-slate-700">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-amber-500">monetization_on</span>
                          <span>{user.coinBalance.toLocaleString('vi-VN')} Coins</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[13px] text-[#004ac6]">wallet</span>
                          <span>{formatCurrency(user.walletBalance)}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-5 relative">
                      <div className="inline-block relative">
                        <button
                          onClick={() => setShowRoleDropdownId(showRoleDropdownId === user.id ? null : user.id)}
                          className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest cursor-pointer hover:brightness-95 flex items-center gap-1.5 transition-all ${getRoleStyle(user.role)}`}
                          disabled={actionLoadingId === user.id}
                        >
                          <span>{user.role}</span>
                          <span className="material-symbols-outlined text-[10px] font-black">expand_more</span>
                        </button>

                        {showRoleDropdownId === user.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdownId(null)}></div>
                            <div className="absolute left-0 mt-2 w-32 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                              {['admin', 'manager', 'seller', 'customer'].map((r) => (
                                <button
                                  key={r}
                                  onClick={() => handleUpdateRole(user.id, r)}
                                  className={`w-full text-left px-4 py-1.5 text-xs font-bold capitalize transition-colors ${
                                    user.role === r 
                                      ? 'bg-slate-50 text-[#004ac6]' 
                                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                  }`}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-widest ${getStatusStyle(user.status)}`}>
                        {user.status}
                      </span>
                    </td>

                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(user.id)}
                          className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-[#004ac6] hover:bg-blue-50 border border-slate-200/40 transition-all flex items-center justify-center cursor-pointer"
                          title="View detailed profiles"
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/40 transition-all flex items-center justify-center cursor-pointer ${
                            user.status === 'locked'
                              ? 'text-green-500 hover:text-green-600 hover:bg-green-50'
                              : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={user.status === 'locked' ? 'Unlock account' : 'Lock account'}
                          disabled={actionLoadingId === user.id}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {actionLoadingId === user.id ? 'sync' : user.status === 'locked' ? 'lock_open' : 'lock'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
              Showing page <span className="text-slate-900">{pagination.currentPage}</span> of <span className="text-slate-900">{pagination.totalPages}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  disabled={loading}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all cursor-pointer ${
                    currentPage === p
                      ? 'bg-[#004ac6] text-white shadow-lg shadow-blue-100'
                      : 'border border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage === pagination.totalPages || loading}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over User Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Dark background overlay */}
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
              onClick={() => { if (!detailsLoading) setShowDetailsModal(false); }}
            ></div>

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-lg transform transition-all duration-300 animate-in slide-in-from-right sm:duration-500">
                <div className="flex h-full flex-col bg-white shadow-2xl border-l border-slate-100 overflow-y-auto">
                  {/* Slide-over Header */}
                  <div className="bg-slate-50 px-6 py-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-widest" id="slide-over-title">
                      User Profile Ledger
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowDetailsModal(false)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>

                  {/* Slide-over Body */}
                  <div className="relative flex-1 p-6 space-y-8">
                    {detailsLoading || !selectedUser ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 animate-pulse">
                          <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          </div>
                        </div>
                        <div className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>
                        <div className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>
                      </div>
                    ) : (
                      <>
                        {/* Profile Summary Card */}
                        <div className="flex flex-col items-center text-center p-6 bg-slate-50 border border-slate-200/50 rounded-2xl">
                          <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden shadow-md relative">
                            <img
                              src={selectedUser.profile.avatarUrl}
                              alt={selectedUser.profile.fullName}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                          </div>
                          <h3 className="mt-4 text-lg font-black text-slate-900 tracking-tight">
                            {selectedUser.profile.fullName}
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold">{selectedUser.profile.email}</p>

                          <div className="flex items-center gap-3 mt-4">
                            <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${getRoleStyle(selectedUser.profile.role)}`}>
                              {selectedUser.profile.role}
                            </span>
                            <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${getStatusStyle(selectedUser.profile.status)}`}>
                              {selectedUser.profile.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-slate-200/60 text-left">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Coin Balance</span>
                              <div className="flex items-center gap-1 mt-1 text-slate-800 font-extrabold text-sm">
                                <span className="material-symbols-outlined text-amber-500 text-sm">monetization_on</span>
                                <span>{selectedUser.profile.coinBalance.toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Wallet Balance</span>
                              <div className="flex items-center gap-1 mt-1 text-[#004ac6] font-extrabold text-sm">
                                <span className="material-symbols-outlined text-sm">wallet</span>
                                <span>{formatCurrency(selectedUser.profile.walletBalance)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Customer Transaction Stats */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order & Spend Activity</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white border border-slate-200/60 p-4 rounded-xl text-center">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
                              <span className="text-lg font-black text-slate-900 block mt-1">{selectedUser.stats.ordersCount}</span>
                            </div>
                            <div className="bg-white border border-slate-200/60 p-4 rounded-xl text-center">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
                              <span className="text-lg font-black text-green-600 block mt-1">{selectedUser.stats.successfulOrdersCount}</span>
                            </div>
                            <div className="bg-white border border-slate-200/60 p-4 rounded-xl text-center">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Spent</span>
                              <span className="text-xs font-black text-[#004ac6] block mt-2.5 truncate" title={formatCurrency(selectedUser.stats.totalSpent)}>
                                {formatCurrency(selectedUser.stats.totalSpent)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Profile Parameters */}
                        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Account Parameters</h4>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Number</p>
                              <p className="font-bold text-slate-800 mt-0.5">{selectedUser.profile.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gender</p>
                              <p className="font-bold text-slate-800 mt-0.5 capitalize">{selectedUser.profile.gender}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date of Birth</p>
                              <p className="font-bold text-slate-800 mt-0.5">
                                {selectedUser.profile.dob ? new Date(selectedUser.profile.dob).toLocaleDateString('vi-VN') : 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registration Date</p>
                              <p className="font-bold text-slate-800 mt-0.5">
                                {new Date(selectedUser.profile.createdAt).toLocaleDateString('vi-VN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Shipping Address Book */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shipping Addresses ({selectedUser.addresses.length})</h4>
                          <div className="space-y-3">
                            {selectedUser.addresses.length === 0 ? (
                              <p className="text-xs font-bold text-slate-400 italic">No shipping addresses registered for this customer.</p>
                            ) : (
                              selectedUser.addresses.map((addr, index) => (
                                <div key={index} className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl text-xs space-y-1 relative group">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-900">{addr.receiver_name}</span>
                                    <span className="text-slate-400 font-medium">|</span>
                                    <span className="font-bold text-slate-600">{addr.receiver_phone}</span>
                                    {addr.is_default && (
                                      <span className="bg-[#004ac6]/10 text-[#004ac6] border border-[#004ac6]/20 text-[8px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider ml-auto">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-500 font-semibold leading-relaxed mt-1.5">
                                    {addr.details && `${addr.details}, `}
                                    {addr.ward}, {addr.district}, {addr.province}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Audit Log Timeline */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Governance Audit Trail</h4>
                          <div className="flow-root">
                            <ul className="-mb-8">
                              {selectedUser.history.length === 0 ? (
                                <p className="text-xs font-bold text-slate-400 italic">No audit records found for this account.</p>
                              ) : (
                                selectedUser.history.map((log, logIdx) => (
                                  <li key={log.id || logIdx}>
                                    <div className="relative pb-8">
                                      {logIdx !== selectedUser.history.length - 1 ? (
                                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true"></span>
                                      ) : null}
                                      <div className="relative flex space-x-3">
                                        <div>
                                          <span className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                                            <span className="material-symbols-outlined text-base">
                                              {log.action === 'UPDATE_USER_ROLE' ? 'shield' : log.action === 'UPDATE_USER_STATUS' ? 'security' : 'settings'}
                                            </span>
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1.5">
                                          <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                                            {log.action.replace(/_/g, ' ')}
                                          </p>
                                          <p className="text-xs text-slate-600 mt-1 leading-normal font-medium">
                                            {log.note}
                                          </p>
                                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest mt-2">
                                            <span>By: {log.actorName}</span>
                                            <span>•</span>
                                            <span>{new Date(log.date).toLocaleString('vi-VN')}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </li>
                                ))
                              )}
                            </ul>
                          </div>
                        </div>

                        {/* Quick account action panel */}
                        <div className="border-t border-slate-100 pt-6 flex gap-3">
                          <button
                            onClick={() => handleToggleStatus(selectedUser.profile.id, selectedUser.profile.status)}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer text-center ${
                              selectedUser.profile.status === 'locked'
                                ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            }`}
                            disabled={actionLoadingId === selectedUser.profile.id}
                          >
                            {selectedUser.profile.status === 'locked' ? 'Unlock Account' : 'Lock Account'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTab;
