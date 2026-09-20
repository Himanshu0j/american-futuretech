import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Award, CreditCard, LifeBuoy,
  User, LogOut, Menu, X, ExternalLink, GraduationCap, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/student/courses', icon: BookOpen },
    { name: 'Certificates', path: '/student/certificates', icon: Award },
    { name: 'Invoices & Receipts', path: '/student/payments', icon: CreditCard },
    { name: 'Student Support', path: '/student/support', icon: LifeBuoy },
    { name: 'Profile Settings', path: '/student/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 flex flex-col lg:flex-row antialiased">
      {/* Mobile Top Header */}
      <header className="lg:hidden h-16 bg-[#1a361d] border-b border-[#2d5c36] px-4 flex items-center justify-between z-30 sticky top-0 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2d5c36] border border-[#76ff8a]/30 flex items-center justify-center font-bold text-white text-xs">
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
        fixed inset-y-0 left-0 z-40 w-72 bg-[#1a361d] text-white border-r border-[#2d5c36] flex flex-col justify-between
        transition-transform duration-300 lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-[#2d5c36] flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/logo-horizontal-white.webp"
                alt="American FutureTech"
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Student Profile Strip */}
          <div className="p-4 border-b border-[#2d5c36] flex items-center gap-3 bg-[#132815] text-left">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'Student'}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#76ff8a]"
            />
            <div className="min-w-0">
              <div className="font-display font-bold text-xs text-white truncate">{user?.name || 'Ethan Hunt'}</div>
              <div className="text-[11px] text-emerald-200/80 truncate">{user?.email || 'student@americanfuturetech.com'}</div>
              <div className="text-[10px] text-[#76ff8a] font-mono mt-0.5 font-semibold">ID: {user?.enrollmentNumber || 'AFT-892144'}</div>
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
                      ? 'bg-[#2d5c36] text-white font-bold border-l-4 border-[#76ff8a] shadow-xs'
                      : 'text-emerald-100/90 hover:bg-[#2d5c36]/50 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#76ff8a]" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#2d5c36] space-y-1.5 text-left">
          <Link
            to="/"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-emerald-200/80 hover:bg-[#2d5c36]/50 hover:text-white transition-colors"
          >
            <span>Return to Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-bold text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#fffff2]">
        <Outlet />
      </main>
    </div>
  );
}
