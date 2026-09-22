import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  UserCheck,
  UserX,
  X,
  Mail,
  Lock,
  User,
  Sparkles,
  Key,
  Trash2,
  Edit2,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  History,
  Users,
  Shield,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  Clock,
  Phone,
  Check,
  Copy
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  ALL_PERMISSIONS,
  PERMISSION_MODULES,
  ROLE_PRESETS
} from '../constants/permissions';

export default function StaffRBAC() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'audit'

  // Data state
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Create Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('ADMIN');
  const [formPermissions, setFormPermissions] = useState([]);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('ADMIN');

  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await api.get('/settings/audit-logs');
      if (res.data.success) {
        setAuditLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const showNotification = (type, message) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback({ type: '', message: '' }), 4000);
  };

  // Open Permissions Modal for editing an existing admin
  const handleOpenPermissions = (targetUser) => {
    setSelectedUser(targetUser);
    setFormPermissions(targetUser.permissions || []);
    setPermissionsModalOpen(true);
  };

  // Open Edit Profile Modal
  const handleOpenEdit = (targetUser) => {
    setSelectedUser(targetUser);
    setEditName(targetUser.name || '');
    setEditPhone(targetUser.phone || '');
    setEditRole(targetUser.role || 'ADMIN');
    setEditModalOpen(true);
  };

  // Open Password Reset Modal
  const handleOpenPasswordReset = (targetUser) => {
    setSelectedUser(targetUser);
    setNewPassword('');
    setPasswordModalOpen(true);
  };

  // Create Staff Handler
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/users', {
        name: formName,
        email: formEmail,
        password: formPassword,
        phone: formPhone,
        role: formRole,
        permissions: formPermissions,
      });

      if (res.data.success) {
        setCreateModalOpen(false);
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setFormPhone('');
        setFormPermissions([]);
        showNotification('success', `Created account for ${formName} successfully!`);
        fetchUsers();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to create user account.');
    }
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.put(`/auth/users/${selectedUser._id}`, {
        permissions: formPermissions,
      });
      if (res.data.success) {
        setPermissionsModalOpen(false);
        showNotification('success', `Updated permissions for ${selectedUser.name}!`);
        fetchUsers();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to update permissions.');
    }
  };

  // Save Profile Info
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await api.put(`/auth/users/${selectedUser._id}`, {
        name: editName,
        phone: editPhone,
        role: editRole,
      });
      if (res.data.success) {
        setEditModalOpen(false);
        showNotification('success', `Profile updated for ${selectedUser.name}!`);
        fetchUsers();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to update user profile.');
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await api.post(`/auth/users/${selectedUser._id}/reset-password`, {
        newPassword,
      });
      if (res.data.success) {
        setPasswordModalOpen(false);
        setNewPassword('');
        showNotification('success', `Password successfully reset for ${selectedUser.name}!`);
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to reset password.');
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (targetUser) => {
    try {
      const res = await api.put(`/auth/users/${targetUser._id}`, {
        isActive: !targetUser.isActive,
      });
      if (res.data.success) {
        showNotification('success', `Account ${targetUser.isActive ? 'deactivated' : 'reactivated'} for ${targetUser.name}`);
        fetchUsers();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to toggle account status.');
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${targetUser.name} (${targetUser.email})? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.delete(`/auth/users/${targetUser._id}`);
      if (res.data.success) {
        showNotification('success', `User account permanently deleted.`);
        fetchUsers();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // Permission selection helpers
  const togglePermission = (permId) => {
    setFormPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAllPermissions = () => {
    setFormPermissions(ALL_PERMISSIONS);
  };

  const handleClearAllPermissions = () => {
    setFormPermissions([]);
  };

  const handleApplyPreset = (preset) => {
    setFormPermissions(preset.permissions);
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || (u.role && u.role.toUpperCase() === roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 text-left max-w-7xl pb-16 font-sans">
      
      {/* Toast Feedback Notification */}
      {actionFeedback.message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold shadow-xl border animate-fadeIn ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback({ type: '', message: '' })}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SuperAdmin Executive Console • Enterprise RBAC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            Staff & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Create administrators, assign granular module permissions, inspect audit events, and govern backend API access policies.
          </p>
        </div>

        <button
          onClick={() => {
            setFormName('');
            setFormEmail('');
            setFormPassword('');
            setFormPhone('');
            setFormRole('ADMIN');
            setFormPermissions(ROLE_PRESETS[1].permissions); // Default to Content Editor
            setCreateModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Admin</span>
        </button>
      </div>

      {/* Navigation Tabs (Staff vs Audit Log) */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff & Administrators ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>System Audit Trail</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STAFF & ADMINISTRATORS TABLE                                       */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#0f172a]/70 border border-white/[0.08]">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-mono">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPERADMIN">SuperAdmin</option>
                <option value="ADMIN">Admin</option>
                <option value="COUNSELOR">Counselor</option>
                <option value="INSTRUCTOR">Instructor</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/[0.08] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b101d] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
                  <tr>
                    <th className="px-6 py-4 font-bold">Administrator / Staff</th>
                    <th className="px-6 py-4 font-bold">System Email</th>
                    <th className="px-6 py-4 font-bold">Assigned Role</th>
                    <th className="px-6 py-4 font-bold">Permissions</th>
                    <th className="px-6 py-4 font-bold">Account Status</th>
                    <th className="px-6 py-4 font-bold text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span className="text-xs font-mono">Loading staff & permission profiles...</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No administrators match your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((member) => {
                      const isSuper = (member.role || '').toUpperCase() === 'SUPERADMIN';
                      const isSelf = member._id === currentUser?.id;
                      const permissionsCount = member.permissions?.length || 0;

                      return (
                        <tr key={member._id} className="hover:bg-slate-800/30 transition-colors">
                          {/* Name & Avatar */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0 ${
                                  isSuper
                                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black'
                                    : 'bg-gradient-to-tr from-sky-500 to-blue-600'
                                }`}
                              >
                                {member.name ? member.name.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm flex items-center gap-2">
                                  <span>{member.name}</span>
                                  {isSelf && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {member.phone || 'No phone recorded'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-6 py-4 text-slate-300 font-mono">
                            {member.email}
                          </td>

                          {/* Role */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold uppercase ${
                                isSuper
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                  : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                              }`}
                            >
                              <Shield className="w-3 h-3" />
                              <span>{member.role || 'ADMIN'}</span>
                            </span>
                          </td>

                          {/* Permissions Badge */}
                          <td className="px-6 py-4">
                            {isSuper ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                <Sparkles className="w-3 h-3" />
                                <span>Full Unrestricted Authority</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenPermissions(member)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg border border-sky-500/30 transition-colors cursor-pointer"
                              >
                                <Key className="w-3 h-3" />
                                <span>{permissionsCount} {permissionsCount === 1 ? 'Permission' : 'Permissions'}</span>
                              </button>
                            )}
                          </td>

                          {/* Account Status */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                member.isActive
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                              <span>{member.isActive ? 'Active' : 'Deactivated'}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Permissions */}
                              {!isSuper && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPermissions(member)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                                  title="Edit Granular Permissions"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Edit Profile */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(member)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Edit Profile Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Password */}
                              <button
                                type="button"
                                onClick={() => handleOpenPasswordReset(member)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                title="Reset Temporary Password"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Status (Deactivate / Activate) */}
                              {!isSuper && !isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(member)}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                    member.isActive
                                      ? 'text-rose-400 hover:bg-rose-500/10 border border-rose-500/20'
                                      : 'text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20'
                                  }`}
                                >
                                  {member.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              )}

                              {/* Delete Admin */}
                              {!isSuper && !isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(member)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Delete Staff Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SYSTEM AUDIT TRAIL                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0f172a]/70 border border-white/[0.08]">
            <span className="text-xs font-mono text-slate-400">
              Showing recent administrative actions and security events.
            </span>
            <button
              onClick={fetchAuditLogs}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Log</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/[0.08] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b101d] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
                  <tr>
                    <th className="px-6 py-4 font-bold">Timestamp</th>
                    <th className="px-6 py-4 font-bold">Actor</th>
                    <th className="px-6 py-4 font-bold">Action</th>
                    <th className="px-6 py-4 font-bold">Target Entity</th>
                    <th className="px-6 py-4 font-bold">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span className="text-xs font-mono">Loading system audit records...</span>
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-white whitespace-nowrap">
                          <span className="text-sky-400">{log.actorName}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">({log.actorRole})</span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                          {log.entity}
                        </td>
                        <td className="px-6 py-3.5 text-slate-300 text-xs">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW ADMIN WITH PERMISSIONS MATRIX                         */}
      {/* ========================================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0f172a] border border-white/[0.12] shadow-2xl p-7 text-left max-h-[92vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-400" />
                  Create New Administrator Account
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  SuperAdmin delegation: Assign granular module permissions to this staff persona.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="r.adams@americanfuturetech.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Initial Password * (min 6 chars)</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 234-5678"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">System Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="ADMIN">ADMIN (Granular Permission Governed)</option>
                  <option value="COUNSELOR">COUNSELOR (Admissions Focus)</option>
                  <option value="INSTRUCTOR">INSTRUCTOR (Curriculum Focus)</option>
                </select>
              </div>

              {/* Permission Presets */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>Quick Permission Presets:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-[10px] font-mono font-bold text-sky-400 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleClearAllPermissions}
                      className="text-[10px] font-mono font-bold text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ROLE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/40 text-slate-300 hover:text-white text-[10px] font-mono transition-colors cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permission Checkboxes Grouped by Module */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                <span className="text-[11px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                  Select Module Permissions ({formPermissions.length} selected):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PERMISSION_MODULES.map((mod) => (
                    <div key={mod.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5">
                      <span className="font-bold text-sky-300 text-[11px] block">{mod.label}</span>
                      <div className="space-y-1">
                        {mod.permissions.map((p) => {
                          const checked = formPermissions.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission(p.id)}
                                className="rounded bg-slate-900 border-white/20 text-sky-500 focus:ring-0 cursor-pointer"
                              />
                              <span className="text-[11px] font-mono">{p.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-md cursor-pointer transition-colors"
                >
                  Create Administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT GRANULAR PERMISSIONS                                        */}
      {/* ========================================================================= */}
      {permissionsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0f172a] border border-white/[0.12] shadow-2xl p-7 text-left max-h-[92vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                  <Key className="w-5 h-5 text-sky-400" />
                  Edit Permissions: {selectedUser.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {selectedUser.email} • Role: {selectedUser.role}
                </p>
              </div>
              <button
                onClick={() => setPermissionsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Row */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Assign Permission Preset:</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="text-[10px] font-mono font-bold text-sky-400 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={handleClearAllPermissions}
                    className="text-[10px] font-mono font-bold text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/40 text-slate-300 hover:text-white text-[10px] font-mono transition-colors cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox Matrix */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PERMISSION_MODULES.map((mod) => (
                  <div key={mod.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5">
                    <span className="font-bold text-sky-300 text-xs block">{mod.label}</span>
                    <div className="space-y-1.5">
                      {mod.permissions.map((p) => {
                        const checked = formPermissions.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(p.id)}
                              className="rounded bg-slate-900 border-white/20 text-sky-500 focus:ring-0 cursor-pointer"
                            />
                            <span className="font-mono text-[11px]">{p.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                {formPermissions.length} permissions assigned
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPermissionsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-colors"
                >
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT PROFILE INFO                                                */}
      {/* ========================================================================= */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0f172a] border border-white/[0.12] shadow-2xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white font-heading">
                Edit Staff Member Details
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Assigned Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="COUNSELOR">COUNSELOR</option>
                  <option value="INSTRUCTOR">INSTRUCTOR</option>
                </select>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold cursor-pointer"
                >
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RESET PASSWORD                                                   */}
      {/* ========================================================================= */}
      {passwordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0f172a] border border-white/[0.12] shadow-2xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Reset Password: {selectedUser.name}
              </h3>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <p className="text-slate-400 text-[11px]">
                Enter a new temporary password for this staff member. They will use this password to sign in immediately.
              </p>

              <div>
                <label className="block text-slate-400 font-bold mb-1">New Password * (min 6 characters)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Set New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
