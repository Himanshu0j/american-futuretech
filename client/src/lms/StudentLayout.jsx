import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, BookOpen, Award, CreditCard, LifeBuoy,
  User, LogOut, Menu, X, ExternalLink, GraduationCap, ChevronRight, Video,
  ListChecks, ClipboardList, BarChart3, Briefcase, CalendarDays, ScrollText,
  Trophy, Medal, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StudentAvatar from './StudentAvatar';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Heartbeat: the admin access log shows "active now" only while this is
  // recent. A closed tab stops pinging, so it turns inactive by itself.
  useEffect(() => {
    if (!user?._id) return undefined;
    const ping = () => axios.post('/api/auth/heartbeat').catch(() => {});
    const warmup = window.setTimeout(ping, 8000);
    const timer = window.setInterval(ping, 120000);
    return () => {
      window.clearTimeout(warmup);
      window.clearInterval(timer);
    };
  }, [user?._id]);

  useEffect(() => {
    let alive = true;
    axios
      .get('/api/lms/notifications')
      .then((res) => {
        if (alive) setUnreadNotifications(res.data?.unreadCount || 0);
      })
      .catch(() => {
        // A missing inbox must never block the portal shell.
      });

    const onCount = (event) => setUnreadNotifications(Number(event.detail) || 0);
    window.addEventListener('lms:notification-count', onCount);
    return () => {
      alive = false;
      window.removeEventListener('lms:notification-count', onCount);
    };
  }, [user?._id]);

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/student/courses', icon: BookOpen },
    { name: 'My Classes', path: '/student/classes', icon: Video },
    { name: 'Calendar', path: '/student/calendar', icon: CalendarDays },
    { name: 'My Quizzes', path: '/student/quizzes', icon: ListChecks },
    { name: 'Assignments', path: '/student/assignments', icon: ClipboardList },
    { name: 'Grades & GPA', path: '/student/grades', icon: BarChart3 },
    { name: 'Transcript', path: '/student/transcript', icon: ScrollText },
    { name: 'Leaderboard', path: '/student/leaderboard', icon: Trophy },
    { name: 'Badges', path: '/student/badges', icon: Medal },
    { name: 'Notifications', path: '/student/notifications', icon: Bell },
    { name: 'Job Openings', path: '/student/jobs', icon: Briefcase },
    { name: 'Certificates', path: '/student/certificates', icon: Award },
    { name: 'Invoices & Receipts', path: '/student/payments', icon: CreditCard },
    { name: 'Student Support', path: '/student/support', icon: LifeBuoy },
    { name: 'Profile Settings', path: '/student/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-800 flex flex-col lg:flex-row antialiased">
      {/* Mobile Top Header */}
      <header className="lg:hidden h-16 bg-[rgb(var(--tw-ink-900))] border-b border-[rgb(var(--tw-blue-700))] px-4 flex items-center justify-between z-30 sticky top-0 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[rgb(var(--tw-blue-700))] border border-[rgb(var(--tw-gold-500)/30%)] flex items-center justify-center font-bold text-white text-xs">
            AF
          </div>
          <span className="font-display font-bold text-sm text-white">Student Classroom</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 cursor-pointer"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[rgb(var(--tw-ink-900))] text-white border-r border-[rgb(var(--tw-blue-700))] flex flex-col justify-between
        transition-transform duration-300 lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-5 border-b border-[rgb(var(--tw-blue-700))] flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              {/* White plate + dark lockup — the white lockup's crest box read
                  as a stray square on this blue sidebar (same fix as the
                  public footer and the admin sidebar). */}
              <span className="inline-flex items-center rounded-xl bg-white px-2.5 py-1.5">
                <img
                  src="/images/logo-horizontal.png"
                  alt="American FutureTech"
                  className="h-7 w-auto object-contain"
                />
              </span>
            </Link>
          </div>

          {/* Student Profile Strip */}
          <div className="p-4 border-b border-[rgb(var(--tw-blue-700))] flex items-center gap-3 bg-[rgb(var(--tw-ink-900))] text-left">
            <StudentAvatar
              src={user?.avatar}
              name={user?.name}
              className="w-10 h-10"
              textClassName="text-xs"
            />
            <div className="min-w-0">
              <div className="font-display font-bold text-xs text-white truncate">
                {user?.name || 'Student'}
              </div>
              <div className="text-[11px] text-blue-200/80 truncate">{user?.email || ''}</div>
              <div className="text-[10px] text-[color:rgb(var(--tw-gold-400))] font-mono mt-0.5 font-semibold">
                ID: {user?.enrollmentNumber || user?.studentDetails?.enrollmentNumber || '—'}
              </div>
              {(user?.assignedBatch?.batchCode || user?.assignedBatch?.name) && (
                <div className="text-[10px] text-blue-200/70 truncate">
                  Batch: {user.assignedBatch.batchCode || user.assignedBatch.name}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-left">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all
                    ${isActive
                      ? 'bg-[rgb(var(--tw-blue-700))] text-white font-bold border-l-4 border-[rgb(var(--tw-gold-500))] shadow-xs'
                      : 'text-blue-100/90 hover:bg-[rgb(var(--tw-blue-700)/50%)] hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[color:rgb(var(--tw-gold-400))]" />
                  <span className="flex-1">{item.name}</span>
                  {item.path === '/student/notifications' && unreadNotifications > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[rgb(var(--tw-gold-500))] text-[rgb(var(--tw-ink-900))] text-[9px] font-black flex items-center justify-center">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[rgb(var(--tw-blue-700))] space-y-1.5 text-left">
          <Link
            to="/"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-blue-200/80 hover:bg-[rgb(var(--tw-blue-700)/50%)] hover:text-white transition-colors"
          >
            <span>Return to Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-bold text-red-300 hover:bg-red-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F7F7F5]">
        <Outlet />
      </main>
    </div>
  );
}
