import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RBACTab = ({ searchTerm, setAddRoleTrigger }) => {
  const [activeSubTab, setActiveSubTab] = useState('roles');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [roles, setRoles] = useState([]);
  const [matrixData, setMatrixData] = useState({ roles: [], permissions: [], matrix: [] });
  const [localMatrix, setLocalMatrix] = useState([]);

  // Edit Role Modal State
  const [editingRole, setEditingRole] = useState(null);
  const [editRoleForm, setEditRoleForm] = useState({ name: '', description: '' });
  const [savingRole, setSavingRole] = useState(false);
  const [localRoleSearch, setLocalRoleSearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const roleNameMap = {
    ADMIN: 'Platform Admin',
    MANAGER: 'Platform Manager',
    SELLER: 'Verified Seller',
    CUSTOMER: 'Customer'
  };
  const getRoleDisplayName = (name) => roleNameMap[(name || '').toUpperCase()] || name;

  // Modules that the UI specifically displays in the Permission Matrix
  const modulesList = ['User', 'Shop', 'Product', 'Order', 'Finance', 'Report', 'Settings'];

  const getHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/rbac/roles', getHeaders());
      if (res.data && res.data.success) {
        setRoles(res.data.data);
      }
    } catch (error) {
      console.error('Fetch roles error:', error);
      toast.error('Failed to load roles');
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/rbac/permissions', getHeaders());
      if (res.data && res.data.success) {
        setMatrixData(res.data.data);
        // deep copy for local edits
        setLocalMatrix(JSON.parse(JSON.stringify(res.data.data.matrix)));
      }
    } catch (error) {
      console.error('Fetch permissions error:', error);
      toast.error('Failed to load permissions');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchRoles(), fetchPermissions()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (setAddRoleTrigger) {
      setAddRoleTrigger(() => handleCreateRoleModal);
      return () => setAddRoleTrigger(null);
    }
  }, [setAddRoleTrigger]);

  const handleCreateRoleModal = () => {
    setEditingRole({ id: 'new', name: '', description: '', status: 'custom' });
    setEditRoleForm({ name: '', description: '' });
  };

  const handleToggleModule = (roleId, mod) => {
    setLocalMatrix(prevMatrix => {
      const newMatrix = JSON.parse(JSON.stringify(prevMatrix));
      const roleIndex = newMatrix.findIndex(r => r.roleId === roleId);
      if (roleIndex !== -1) {
        const modPerms = matrixData.permissions.filter(p => p.module === mod);
        const currentlyHasAny = modPerms.some(p => newMatrix[roleIndex].permissions[p.id]);
        const nextState = !currentlyHasAny;
        modPerms.forEach(p => {
          newMatrix[roleIndex].permissions[p.id] = nextState;
        });
      }
      return newMatrix;
    });
  };

  const handleManageRole = (role) => {
    setEditingRole(role);
    setEditRoleForm({ name: role.name, description: role.description || '' });
  };

  const handleSaveRole = async () => {
    if (!editingRole) return;
    setSavingRole(true);
    try {
      const isNew = editingRole.id === 'new';
      const url = isNew 
        ? 'http://localhost:5000/api/admin/rbac/roles' 
        : `http://localhost:5000/api/admin/rbac/roles/${editingRole.id}`;
      const method = isNew ? 'post' : 'put';

      const res = await axios[method](url, editRoleForm, getHeaders());
      if (res.data && res.data.success) {
        toast.success(isNew ? 'Role created successfully' : 'Role updated successfully');
        setEditingRole(null);
        await fetchRoles(); // Refresh roles list
      }
    } catch (error) {
      console.error('Save role error:', error);
      toast.error(error.response?.data?.message || 'Failed to save role');
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRoleClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!editingRole || editingRole.id === 'new') return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/admin/rbac/roles/${editingRole.id}`, getHeaders());
      if (res.data && res.data.success) {
        toast.success('Role deleted successfully');
        setShowDeleteConfirm(false);
        setEditingRole(null);
        loadData(); // Refresh roles and matrix
      }
    } catch (error) {
      console.error('Delete role error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    try {
      const updates = [];
      localMatrix.forEach(roleData => {
        Object.keys(roleData.permissions || {}).forEach(permId => {
          updates.push({
            role_id: roleData.roleId,
            permission_id: permId,
            checked: roleData.permissions[permId]
          });
        });
      });

      const res = await axios.put('http://localhost:5000/api/admin/rbac/permissions', { updates }, getHeaders());
      if (res.data && res.data.success) {
        toast.success('Permission matrix saved successfully');
        await fetchPermissions(); // refresh
      }
    } catch (error) {
      console.error('Save matrix error:', error);
      toast.error('Failed to save permission matrix');
    } finally {
      setSaving(false);
    }
  };

  const filteredRoles = roles.filter(r => {
    const search = localRoleSearch || searchTerm || '';
    const displayName = getRoleDisplayName(r.name);
    return search ? 
      r.name.toLowerCase().includes(search.toLowerCase()) || 
      displayName.toLowerCase().includes(search.toLowerCase()) || 
      (r.description && r.description.toLowerCase().includes(search.toLowerCase())) 
      : true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-8 border-b border-slate-200 sticky top-0 bg-[#F8FAFC] z-30 pt-4">
        <button 
          onClick={() => {
            setActiveSubTab('roles');
            document.getElementById('roles-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className={`px-2 py-4 text-sm font-bold tracking-tight transition-all ${activeSubTab === 'roles' ? 'border-b-[3px] border-primary text-primary font-black' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Role Management
        </button>
        <button 
          onClick={() => {
            setActiveSubTab('permissions');
            document.getElementById('permissions-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className={`px-2 py-4 text-sm font-bold tracking-tight transition-all ${activeSubTab === 'permissions' ? 'border-b-[3px] border-primary text-primary font-black' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Permission Matrix
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Roles Table */}
        <section id="roles-section" className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden scroll-mt-24">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-black text-slate-950 uppercase tracking-widest text-[11px]">System Roles</h3>
              <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Search roles..." 
                    value={localRoleSearch}
                    onChange={(e) => setLocalRoleSearch(e.target.value)}
                    className="text-xs border-slate-200 rounded-lg px-3 py-1.5 focus:ring-primary/20"
                  />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-4">Role Name</th>
                    <th className="px-8 py-4">Description</th>
                    <th className="px-8 py-4">Members</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRoles.map(role => {
                    const isSystem = role.status === 'system';
                    const isManager = role.name.toUpperCase() === 'MANAGER';
                    const isSeller = role.name.toUpperCase() === 'SELLER';
                    
                    let dotColor = 'bg-slate-400';
                    if (role.name.toUpperCase() === 'ADMIN') dotColor = 'bg-primary';
                    if (isManager) dotColor = 'bg-success';
                    if (role.name.toUpperCase() === 'MANAGER') dotColor = 'bg-success';
                    if (isSeller) dotColor = 'bg-amber-500';
                    
                    const statusBadge = isSystem ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-blue-100 text-primary uppercase tracking-widest">System</span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-green-100 text-green-700 uppercase tracking-widest">Active</span>
                    );

                    return (
                      <tr key={role.id || Math.random()} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`size-2 rounded-full ${dotColor}`}></div>
                            <span className="text-sm font-black text-slate-900">{getRoleDisplayName(role.name)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-500 font-medium">{role.description || 'No description provided.'}</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-900">
                          {role.userCount?.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">Users</span>
                        </td>
                        <td className="px-8 py-5">
                          {statusBadge}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => handleManageRole(role)}
                            className="text-primary text-[11px] font-black uppercase hover:underline"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRoles.length === 0 && (
                     <tr key="empty_roles">
                        <td colSpan="5" className="px-8 py-8 text-center text-sm text-slate-500">No roles found matching your criteria.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        {/* Permission Matrix */}
        <section id="permissions-section" className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden scroll-mt-24">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Permission Matrix</h3>
                <p className="text-slate-500 text-sm font-medium">High-level mapping of roles to platform modules.</p>
              </div>
              <button 
                onClick={handleSaveMatrix}
                disabled={saving}
                className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Matrix Changes'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center">
                <thead>
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 sticky left-0 z-20 w-48 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.05)]">Role \ Module</th>
                    {modulesList.map(mod => (
                      <th key={mod} className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 text-center">
                        {mod === 'Settings' ? 'SETTINGS' : `${mod}S`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localMatrix.map(roleRow => {
                    const isSystemAdmin = (roleRow.roleName || '').toUpperCase() === 'ADMIN';

                    return (
                      <tr key={roleRow.roleId || Math.random()} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 border-r border-slate-100 bg-white sticky left-0 z-10 w-48 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.1)]">
                          <span className="text-sm font-bold text-slate-800">{getRoleDisplayName(roleRow.roleName)}</span>
                        </td>
                        {modulesList.map(mod => {
                          const modPerms = matrixData.permissions.filter(p => p.module === mod);
                          const isChecked = isSystemAdmin || (modPerms.length > 0 && modPerms.some(p => roleRow.permissions[p.id]));
                          const isDisabled = isSystemAdmin || modPerms.length === 0;

                          return (
                            <td key={mod} className="px-4 py-6">
                              <div className="flex justify-center">
                                <input 
                                  type="checkbox" 
                                  checked={!!isChecked} 
                                  disabled={isDisabled}
                                  onChange={() => handleToggleModule(roleRow.roleId, mod)}
                                  className="rounded border-slate-300 text-primary focus:ring-primary/20 size-5 cursor-pointer disabled:opacity-50"
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
      </div>

      {/* Edit Role Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-8">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-2">Access Config</span>
                  <h4 className="text-3xl font-black tracking-tight">{editingRole.id === 'new' ? 'Create New Role' : `Edit Role: ${getRoleDisplayName(editingRole.name)}`}</h4>
                </div>
                <button 
                  onClick={() => setEditingRole(null)}
                  className="p-2 hover:bg-slate-50 rounded-full text-slate-400"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="space-y-8 mt-10">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Role Name</label>
                    <input 
                      type="text" 
                      value={editRoleForm.name} 
                      onChange={(e) => setEditRoleForm({ ...editRoleForm, name: e.target.value })}
                      disabled={editingRole.status === 'system'}
                      className="w-full border-slate-200 rounded-xl px-4 py-3 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    {editingRole.status === 'system' && (
                      <p className="text-[10px] text-amber-500 font-bold mt-2">System role names cannot be changed.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Role Key</label>
                    <input 
                      type="text" 
                      value={editRoleForm.name ? `role_${editRoleForm.name.toLowerCase().replace(/\s+/g, '_')}` : ''} 
                      disabled 
                      className="w-full border-slate-100 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-400 font-mono italic"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Description</label>
                  <textarea 
                    value={editRoleForm.description}
                    onChange={(e) => setEditRoleForm({ ...editRoleForm, description: e.target.value })}
                    className="w-full border-slate-200 rounded-xl px-4 py-3 text-sm font-medium h-24"
                    placeholder="Briefly describe what users with this role can do..."
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-between mt-12">
                <div>
                  {editingRole.id !== 'new' && editingRole.status !== 'system' && (
                    <button 
                      onClick={handleDeleteRoleClick}
                      className="px-6 py-3 text-error text-xs font-black uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Delete Role
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setEditingRole(null)}
                    className="px-8 py-3 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveRole}
                    disabled={savingRole}
                    className="px-10 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {savingRole ? 'Saving...' : 'Save Role Config'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="size-16 bg-red-100 text-error rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Delete Role?</h3>
              <p className="text-sm text-slate-500 font-medium mb-8">
                Are you sure you want to delete <span className="font-bold text-slate-900">{getRoleDisplayName(editingRole?.name)}</span>? This action cannot be undone and will remove all associated permissions.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 bg-error text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RBACTab;
