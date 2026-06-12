import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Skeleton loaders
const SkeletonCard = () => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-pulse">
    <div className="h-3 bg-slate-200 rounded w-20 mb-2"></div>
    <div className="h-8 bg-slate-200 rounded w-28"></div>
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="h-3 bg-slate-200 rounded w-16"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-6">
      <div className="h-4 bg-slate-200 rounded w-40 mb-1"></div>
      <div className="h-3 bg-slate-200 rounded w-24"></div>
    </td>
    <td className="px-6 py-6">
      <div className="h-4 bg-slate-200 rounded w-20 mb-1"></div>
      <div className="h-3 bg-slate-200 rounded w-24"></div>
    </td>
    <td className="px-6 py-6 text-center">
      <div className="h-6 bg-slate-200 rounded-full w-16 mx-auto"></div>
    </td>
    <td className="px-6 py-6 text-center">
      <div className="flex justify-center gap-2">
        <div className="w-8 h-8 bg-slate-200 rounded-xl"></div>
        <div className="w-8 h-8 bg-slate-200 rounded-xl"></div>
        <div className="w-8 h-8 bg-slate-200 rounded-xl"></div>
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
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    newThisWeek: 0,
    bannedUsers: 0
  });

  // Filters
  const [localSearch, setLocalSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'

  // Dropdown states
  const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showRoleDropdownId, setShowRoleDropdownId] = useState(null);

  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Action Loading
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Active page input state (integrated directly into the center button)
  const [activePageInput, setActivePageInput] = useState(currentPage.toString());

  useEffect(() => {
    setActivePageInput(currentPage.toString());
  }, [currentPage]);

  const handleActivePageSubmit = () => {
    const pageNum = parseInt(activePageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pagination.totalPages) {
      setCurrentPage(pageNum);
    } else {
      setActivePageInput(currentPage.toString());
      toast.error(`Please enter a valid page between 1 and ${pagination.totalPages}`);
    }
  };

  // Helper to calculate 5 nearest page numbers
  const getPageNumbers = () => {
    const totalPages = pagination.totalPages;
    const current = currentPage;
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, current - 2);
    let end = Math.min(totalPages, current + 2);

    if (current <= 3) {
      start = 1;
      end = maxVisible;
    } else if (current >= totalPages - 2) {
      start = totalPages - maxVisible + 1;
      end = totalPages;
    }

    return Array.from({ length: (end - start) + 1 }, (_, i) => start + i);
  };

  // Sync global search term from Header
  useEffect(() => {
    if (globalSearchTerm !== undefined) {
      setLocalSearch(globalSearchTerm);
      setCurrentPage(1);
    }
  }, [globalSearchTerm]);

  // Fetch users & stats
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
        let fetchedUsers = response.data.data || [];
        
        // Sort users locally if needed
        if (sortBy === 'oldest') {
          fetchedUsers = [...fetchedUsers].reverse();
        }

        setUsers(fetchedUsers);
        
        if (response.data.meta) {
          if (response.data.meta.pagination) {
            setPagination(response.data.meta.pagination);
          }
          if (response.data.meta.stats) {
            setStats(response.data.meta.stats);
          }
        }
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error(error.response?.data?.message || 'Failed to retrieve platform users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, selectedStatus, selectedRole, sortBy]);

  // Local Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  // Toggle Ban/Unban status
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
        toast.success(newStatus === 'locked' ? 'User successfully banned' : 'User successfully unbanned');
        
        // Update user state locally
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        
        // Re-fetch users & stats to keep overview counts in sync
        fetchUsers();

        if (selectedUser && selectedUser.profile.id === userId) {
          setSelectedUser(prev => ({
            ...prev,
            profile: { ...prev.profile, status: newStatus }
          }));
        }
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle account ban status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Update User Role
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
        toast.success(`User role successfully updated to ${newRole}`);
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
      toast.error(error.response?.data?.message || 'Failed to update user system role');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Fetch full details for a user
  const loadUserDetails = async (userId) => {
    setDetailsLoading(true);
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
        return response.data.data;
      }
    } catch (error) {
      console.error('Load user details error:', error);
      toast.error('Failed to retrieve full user profile information');
    } finally {
      setDetailsLoading(false);
    }
    return null;
  };

  // Trigger Details Modal
  const openDetails = async (userId) => {
    setShowDetailsModal(true);
    const details = await loadUserDetails(userId);
    if (details) {
      setSelectedUser(details);
    } else {
      setShowDetailsModal(false);
    }
  };

  // Trigger History Modal
  const openHistory = async (userId) => {
    setShowHistoryModal(true);
    const details = await loadUserDetails(userId);
    if (details) {
      setSelectedUser(details);
    } else {
      setShowHistoryModal(false);
    }
  };

  // Export Users to CSV (All pages matching current filters)
  const handleExportData = async () => {
    const toastId = toast.loading('Generating export report, please wait...');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const search = localSearch.trim();
      const response = await axios.get(
        `http://localhost:5000/api/admin/users?page=1&limit=100000&search=${encodeURIComponent(search)}&role=${selectedRole}&status=${selectedStatus}`,
        config
      );

      if (!response.data || !response.data.success) {
        throw new Error('Failed to fetch export data');
      }

      let exportUsers = response.data.data || [];
      if (exportUsers.length === 0) {
        toast.error('No user records matching the current filters were found', { id: toastId });
        return;
      }

      if (sortBy === 'oldest') {
        exportUsers = [...exportUsers].reverse();
      }

      const headers = ['UID', 'Full Name', 'Email', 'Phone', 'Coin Balance', 'Wallet Balance', 'Role', 'Status', 'Join Date'];
      const rows = exportUsers.map(u => [
        `#${u.id.substring(u.id.length - 5)}`,
        u.fullName,
        u.email,
        u.phone || '',
        u.coinBalance,
        u.walletBalance,
        u.role,
        u.status,
        new Date(u.createdAt).toLocaleDateString('en-US')
      ]);

      // Prepend UTF-8 BOM (\uFEFF) to make Excel parse Vietnamese characters correctly
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `uteshop_users_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Successfully exported ${exportUsers.length} user records to CSV`, { id: toastId });
    } catch (error) {
      console.error('Export Error:', error);
      toast.error('Failed to export user CSV report', { id: toastId });
    }
  };

  // Badge stylers matching template
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'locked':
        return 'bg-error/10 text-error border-error/20';
      case 'inactive':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'pending':
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'seller':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'customer':
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Search form in page for mobile/direct interaction */}
      <div className="flex md:hidden items-center bg-[#F1F5F9] rounded-2xl px-4 py-2.5 w-full border border-slate-200/60">
        <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
        <input
          type="text"
          placeholder="Search by Email or Phone..."
          className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 font-medium ml-2 outline-none"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {loading && stats.totalUsers === 0 ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-level-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Users</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.totalUsers.toLocaleString('vi-VN')}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-level-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Today</p>
              <h3 className="text-2xl font-black text-[#004ac6]">{stats.activeToday.toLocaleString('vi-VN')}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-level-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New This Week</p>
              <h3 className="text-2xl font-black text-green-700">+{stats.newThisWeek.toLocaleString('vi-VN')}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-level-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Banned Users</p>
              <h3 className="text-2xl font-black text-[#ba1a1a]">{stats.bannedUsers.toLocaleString('vi-VN')}</h3>
            </div>
          </>
        )}
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter Popover */}
          <div className="relative">
            <button
              onClick={() => setShowStatusFilterDropdown(!showStatusFilterDropdown)}
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              <span>
                Status: {selectedStatus === 'all' ? 'All' : selectedStatus}
              </span>
            </button>
            {showStatusFilterDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatusFilterDropdown(false)}></div>
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                  {['all', 'active', 'locked', 'inactive', 'pending'].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setSelectedStatus(st);
                        setCurrentPage(1);
                        setShowStatusFilterDropdown(false);
                      }}
                      className={`w-full text-left px-5 py-2 text-xs font-bold capitalize transition-colors ${
                        selectedStatus === st 
                          ? 'bg-slate-50 text-[#004ac6]' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {st === 'locked' ? 'Banned / Locked' : st}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sort Filter Popover */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">sort</span>
              <span>
                Sort: {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
              </span>
            </button>
            {showSortDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)}></div>
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => { setSortBy('newest'); setShowSortDropdown(false); }}
                    className={`w-full text-left px-5 py-2 text-xs font-bold transition-colors ${sortBy === 'newest' ? 'bg-slate-50 text-[#004ac6]' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Newest First
                  </button>
                  <button
                    onClick={() => { setSortBy('oldest'); setShowSortDropdown(false); }}
                    className={`w-full text-left px-5 py-2 text-xs font-bold transition-colors ${sortBy === 'oldest' ? 'bg-slate-50 text-[#004ac6]' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Oldest First
                  </button>
                </div>
              </>
            )}
          </div>

          {/* System Role Selector Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-2xl outline-none cursor-pointer hover:bg-slate-50 transition-all"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="seller">Seller</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleExportData}
          className="px-6 py-3 bg-[#004ac6] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-200 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          <span>Export User Data</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-level-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <colgroup>
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Join Date</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && users.length === 0 ? (
              Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-16 text-sm font-bold text-slate-400">
                  No matching platform users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* User profile details */}
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-100 bg-slate-100 relative flex items-center justify-center text-slate-500 font-bold">
                        {user.avatarUrl && (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="absolute inset-0 w-full h-full object-cover z-10"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        {/* Fallback initials */}
                        <span className="text-xs uppercase">
                          {user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight flex items-center gap-1.5">
                          <span>{user.fullName}</span>
                          {user.role !== 'customer' && (
                            <span className={`px-1.5 py-0.2 border text-[8px] font-black rounded uppercase tracking-wider scale-90 ${getRoleBadgeClass(user.role)}`}>
                              {user.role}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold">
                          UID: #{user.id.substring(user.id.length - 5)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="px-6 py-6">
                    <p className="text-sm font-bold text-slate-700">{user.email}</p>
                    {user.phone && user.phone !== 'N/A' && user.phone.trim() !== '' && (
                      <p className="text-[11px] text-slate-400 font-medium">{user.phone}</p>
                    )}
                  </td>

                  {/* Join Date */}
                  <td className="px-6 py-6">
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium capitalize">
                      {user.email.includes('gmail') ? 'Google account' : 'Direct Registration'}
                    </p>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-6 text-center">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusBadgeClass(user.status)}`}>
                      {user.status === 'locked' ? 'Banned' : user.status}
                    </span>
                  </td>

                  {/* Action controls */}
                  <td className="px-6 py-6 text-center space-x-2 relative">
                    {/* View Details */}
                    <button
                      onClick={() => openDetails(user.id)}
                      className="p-2 text-slate-400 hover:text-[#004ac6] transition-all cursor-pointer inline-block"
                      title="View Details"
                    >
                      <span className="material-symbols-outlined text-xl">visibility</span>
                    </button>

                    {/* Order History */}
                    <button
                      onClick={() => openHistory(user.id)}
                      className="p-2 text-slate-400 hover:text-[#004ac6] transition-all cursor-pointer inline-block"
                      title="Purchase History"
                    >
                      <span className="material-symbols-outlined text-xl">shopping_bag</span>
                    </button>

                    {/* Ban / Unban Toggle */}
                    <button
                      onClick={() => handleToggleStatus(user.id, user.status)}
                      className={`p-2 transition-all cursor-pointer inline-block ${
                        user.status === 'locked' 
                          ? 'text-red-500 hover:brightness-110' 
                          : 'text-slate-400 hover:text-red-600'
                      }`}
                      title={user.status === 'locked' ? 'Unban User' : 'Ban User'}
                      disabled={actionLoadingId === user.id}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {user.status === 'locked' ? 'check_circle' : 'block'}
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-8 py-5 bg-white border border-slate-200 rounded-3xl flex items-center justify-between shadow-level-1 gap-4 flex-wrap">
          <p className="text-[11px] text-slate-500 font-bold">
            Showing <span className="text-slate-900">{(pagination.currentPage - 1) * pagination.perPage + 1}</span> to{' '}
            <span className="text-slate-900">
              {Math.min(pagination.currentPage * pagination.perPage, pagination.total)}
            </span>{' '}
            of <span className="text-slate-900">{pagination.total.toLocaleString('vi-VN')}</span> users
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              {/* Jump to first page */}
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-[#004ac6] disabled:opacity-40 transition-all cursor-pointer"
                title="First Page"
              >
                <span className="material-symbols-outlined text-sm">first_page</span>
              </button>

              <button
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-[#004ac6] disabled:opacity-40 transition-all cursor-pointer"
                title="Previous Page"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              <div className="flex items-center gap-1">
                {getPageNumbers().map((p) => {
                  const isActive = currentPage === p;
                  return isActive ? (
                    <input
                      key={p}
                      type="number"
                      min="1"
                      max={pagination.totalPages}
                      value={activePageInput}
                      onChange={(e) => setActivePageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleActivePageSubmit();
                        }
                      }}
                      onBlur={handleActivePageSubmit}
                      className="w-10 h-8 text-center bg-[#004ac6] text-white rounded-xl text-[11px] font-black outline-none border-none focus:ring-2 focus:ring-blue-300 shadow-md shadow-blue-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                      title="Enter page number directly"
                    />
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      disabled={loading}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white border border-transparent hover:border-slate-200 text-slate-500 font-bold text-[11px] transition-all cursor-pointer"
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === pagination.totalPages || loading}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-[#004ac6] disabled:opacity-40 transition-all cursor-pointer"
                title="Next Page"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>

              {/* Jump to last page */}
              <button
                disabled={currentPage === pagination.totalPages || loading}
                onClick={() => setCurrentPage(pagination.totalPages)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-[#004ac6] disabled:opacity-40 transition-all cursor-pointer"
                title="Last Page"
              >
                <span className="material-symbols-outlined text-sm">last_page</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal (Matching Template style exactly) */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Full User Profile</h3>
                <p className="text-[11px] text-[#004ac6] font-black uppercase tracking-widest mt-1">Identity Information</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {detailsLoading || !selectedUser ? (
                <div className="flex items-center gap-6 animate-pulse">
                  <div className="size-20 rounded-2xl bg-slate-200"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded w-28"></div>
                    <div className="h-5 bg-slate-200 rounded w-16"></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-6">
                    <div className="size-20 rounded-2xl bg-[#F1F5F9] flex items-center justify-center text-slate-400 text-2xl font-black border border-slate-200 overflow-hidden relative">
                      {selectedUser.profile.avatarUrl && (
                        <img
                          src={selectedUser.profile.avatarUrl}
                          alt={selectedUser.profile.fullName}
                          className="absolute inset-0 w-full h-full object-cover z-10"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <span className="uppercase">{selectedUser.profile.fullName.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-black text-slate-900">{selectedUser.profile.fullName}</h4>
                      <p className="text-sm font-bold text-slate-400">
                        UID: #{selectedUser.profile.id.substring(selectedUser.profile.id.length - 8)}
                      </p>
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border ${getStatusBadgeClass(selectedUser.profile.status)}`}>
                        {selectedUser.profile.status === 'locked' ? 'Banned' : selectedUser.profile.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                    <div className="col-span-2 space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                        <p className="text-sm font-bold text-slate-700">{selectedUser.profile.email}</p>
                      </div>
                      {selectedUser.profile.phone && selectedUser.profile.phone !== 'N/A' && selectedUser.profile.phone.trim() !== '' && (
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                          <p className="text-sm font-bold text-slate-700">{selectedUser.profile.phone}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                      <p className="text-sm font-bold text-slate-700">{selectedUser.stats.ordersCount} Orders</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Wallet Balance</p>
                      <p className="text-sm font-bold text-[#004ac6]">
                        {selectedUser.profile.walletBalance.toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Coin Balance</p>
                      <p className="text-sm font-bold text-amber-500">
                        {selectedUser.profile.coinBalance.toLocaleString('vi-VN')} Coins
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Role</p>
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase border ${getRoleBadgeClass(selectedUser.profile.role)}`}>
                        {selectedUser.profile.role}
                      </span>
                    </div>
                  </div>

                  {/* Registered Shipping Address */}
                  {selectedUser.addresses?.length > 0 && (() => {
                    const defaultAddr = selectedUser.addresses.find(a => a.isDefault || a.is_default) || selectedUser.addresses[0];
                    if (!defaultAddr) return null;
                    const rName = defaultAddr.recipientName || defaultAddr.recipient_name;
                    const rPhone = defaultAddr.recipientPhone || defaultAddr.recipient_phone;
                    const sAddress = defaultAddr.streetAddress || defaultAddr.street_address;
                    if (!rName && !sAddress) return null;
                    return (
                      <div className="pt-4 border-t border-slate-100 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Shipping Address</p>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-700 leading-relaxed">
                          <p className="font-bold text-slate-900">
                            {rName} {rPhone ? `(${rPhone})` : ''}
                            {defaultAddr.label && (
                              <span className="ml-2 bg-blue-50 text-[#004ac6] border border-blue-100 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {defaultAddr.label}
                              </span>
                            )}
                          </p>
                          <p className="mt-1 font-medium text-slate-500">
                            {sAddress}
                            {defaultAddr.city && `, ${defaultAddr.city}`}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Security</p>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Identity Verified</span>
                      <span className="text-success">Yes</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Two-Factor Auth</span>
                      <span className="text-slate-400 italic">Disabled</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex gap-4">
              <button onClick={() => setShowDetailsModal(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all cursor-pointer">
                Close
              </button>
              <button
                onClick={() => {
                  if (selectedUser) {
                    handleToggleStatus(selectedUser.profile.id, selectedUser.profile.status);
                  }
                }}
                disabled={actionLoadingId !== null}
                className="flex-1 py-4 bg-[#ba1a1a] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-red-200 hover:brightness-110 transition-all cursor-pointer"
              >
                {selectedUser?.profile.status === 'locked' ? 'Unban User' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase History Modal (Matching Template style exactly) */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {selectedUser ? `${selectedUser.profile.fullName}'s` : ''} Purchase History
                </h3>
                <p className="text-[11px] text-[#004ac6] font-black uppercase tracking-widest mt-1">Transaction Insight</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {detailsLoading || !selectedUser ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-28 bg-slate-100 rounded-2xl"></div>
                  <div className="h-28 bg-slate-100 rounded-2xl"></div>
                </div>
              ) : selectedUser.orders?.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold text-sm">
                  This user has no purchase history recorded in the system.
                </div>
              ) : (
                selectedUser.orders.map((order) => (
                  <div key={order.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-black text-slate-900">Order #{order.orderCode}</p>
                        <p className="text-[11px] text-slate-400 font-bold">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })} • {new Date(order.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                        order.status === 'delivered' || order.paymentStatus === 'success'
                          ? 'bg-success/10 text-success border-success/20'
                          : order.status === 'canceled'
                            ? 'bg-error/10 text-error border-error/20'
                            : 'bg-slate-200 text-slate-500 border-slate-300'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                      {order.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-4 py-3 border-t border-slate-200/40">
                          <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center shrink-0">
                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover rounded-md" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">{item.productName}</p>
                            <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-black text-slate-900">
                            {item.price.toLocaleString('vi-VN')}₫
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Order Total */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                      <span className="text-sm font-black text-[#004ac6] uppercase">
                        {order.totalFinal.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/30">
              <button onClick={() => setShowHistoryModal(false)} className="w-full py-4 bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all cursor-pointer">
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTab;
