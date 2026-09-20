import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, UserCheck, UserX, X, Mail, Lock, User, Sparkles } from 'lucide-react';
import api from '../lib/api';

export default function StaffRBAC() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Counselor');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/auth/users/${userId}`, { role: newRole });
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      console.error('Update role failed:', err);
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      const res = await api.put(`/auth/users/${userId}`, { isActive: !currentActive });
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive: !currentActive } : u))
        );
      }
    } catch (err) {
      console.error('Toggle status failed:', err);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/users', {
        name,
        email,
        password,
        role,
      });

      if (res.data.success) {
        setModalOpen(false);
        setName('');
        setEmail('');
        setPassword('');
        fetchUsers();
      }
    } catch (err) {
      console.error('Create staff failed:', err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
            Staff & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage granular permissions across SuperAdmin, Counselor, and Instructor personas.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/[0.08] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b101d] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
            <tr>
              <th className="px-6 py-4 font-bold">Team Member</th>
              <th className="px-6 py-4 font-bold">System Email</th>
              <th className="px-6 py-4 font-bold">Assigned Role</th>
              <th className="px-6 py-4 font-bold">Account Status</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {users.map((staff) => (
              <tr key={staff._id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center font-bold text-white text-xs">
                      {staff.name.charAt(0)}
                    </div>
                    <span className="font-bold text-white text-sm">{staff.name}</span>
                  </div>
                </td>

                <td className="px-6 py-4 text-slate-300 font-mono">
                  {staff.email}
                </td>

                <td className="px-6 py-4">
                  <select
                    value={staff.role}
                    onChange={(e) => handleRoleChange(staff._id, e.target.value)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs font-bold text-sky-400 focus:outline-none"
                  >
                    <option value="SuperAdmin">SuperAdmin (Full Control)</option>
                    <option value="Counselor">Admissions Counselor</option>
                    <option value="Instructor">Lead Instructor</option>
                  </select>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      staff.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${staff.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span>{staff.isActive ? 'Active' : 'Deactivated'}</span>
                  </span>
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleToggleActive(staff._id, staff.isActive)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      staff.isActive
                        ? 'text-rose-400 hover:bg-rose-500/10'
                        : 'text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    {staff.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0f172a] border border-white/[0.12] shadow-2xl p-7 text-left">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Create Staff Account</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="s.jenkins@americanfuturetech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                >
                  <option value="SuperAdmin">SuperAdmin</option>
                  <option value="Counselor">Counselor</option>
                  <option value="Instructor">Instructor</option>
                </select>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
