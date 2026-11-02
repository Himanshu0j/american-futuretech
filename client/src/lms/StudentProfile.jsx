import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import StudentAvatar from './StudentAvatar';

export default function StudentProfile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const u = res.data.user;
        setUser(u);
        setName(u.name || '');
        setPhone(u.phone || '');
        setBio(u.bio || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(
        '/api/auth/profile',
        { name, phone, bio },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        setFeedback({ type: 'success', message: 'Profile updated successfully!' });
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update profile.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgb(var(--tw-sand-200))] border border-[rgb(var(--tw-gold-500)/40%)] text-[color:rgb(var(--tw-ink-900))] text-xs font-bold uppercase tracking-wider mb-2">
          <User className="w-3.5 h-3.5 text-[color:rgb(var(--tw-blue-700))]" />
          <span>Learner Identity & Security</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-[color:rgb(var(--tw-ink-900))]">
          Student Profile & Credentials
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed max-w-xl">
          Manage your verified student profile, enrollment identification, contact information, and account security.
        </p>
      </div>

      {feedback.message && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 shadow-xs ${
          feedback.type === 'success'
            ? 'bg-[rgb(var(--tw-sand-200))] border border-[rgb(var(--tw-gold-500)/40%)] text-[color:rgb(var(--tw-ink-900))]'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[color:rgb(var(--tw-blue-700))] shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Verified Student ID Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <StudentAvatar
            src={user?.avatar}
            name={name}
            className="h-14 w-14"
            rounded="rounded-2xl"
            textClassName="text-base"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-heading font-bold text-[color:rgb(var(--tw-ink-900))]">{name || 'Enrolled Student'}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[rgb(var(--tw-sand-200))] text-[color:rgb(var(--tw-ink-900))]">
                ACTIVE
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-xs font-mono">
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">ENROLLMENT ID</span>
            <span className="text-[color:rgb(var(--tw-ink-900))] font-bold tracking-wider">
              {user?.studentDetails?.enrollmentNumber || user?.enrollmentNumber || '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">INSTITUTION</span>
            <span className="text-slate-700 font-sans font-medium">American FutureTech LLC</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Details */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <h3 className="text-sm font-heading font-bold text-[color:rgb(var(--tw-ink-900))] uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-[color:rgb(var(--tw-blue-700))]" />
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[rgb(var(--tw-ink-900))] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[rgb(var(--tw-ink-900))] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Profile photo</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-[color:rgb(var(--tw-blue-700))]" />
                Set by the admissions team
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Short Bio / Career Goals</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Aspiring AI engineer focusing on LLMs and scalable inference pipelines..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[rgb(var(--tw-ink-900))] focus:bg-white resize-none transition-all"
            />
          </div>
        </div>

        {/* Password is admin-managed: no student-side reset/change form. */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <h3 className="text-sm font-heading font-bold text-[color:rgb(var(--tw-ink-900))] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[color:rgb(var(--tw-blue-700))]" />
            Password & Sign-in
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your password is managed by the academy administrator. If you have forgotten it or need a new one,
            contact admissions — the admin will set a new password for your account. There is no self-service
            password reset in the student portal.
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[rgb(var(--tw-blue-700))] hover:bg-[rgb(var(--tw-blue-800))] text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
