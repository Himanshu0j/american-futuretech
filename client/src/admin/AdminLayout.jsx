import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ShieldAlert,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  Bell,
  CreditCard,
  Briefcase,
  FileText,
  LifeBuoy,
  Settings,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isSuperAdmin = (user?.role || '').toUpperCase() === 'SUPERADMIN';
  const userPermissions = user?.permissions || [];

  const navItems = [
    { name: 'Executive Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, permission: 'DASHBOARD_VIEW' },
    { name: 'Admissions Pipeline', path: '/admin/leads', icon: Users, permission: 'LEADS_VIEW' },
    { name: 'Curriculum & Courses CMS', path: '/admin/courses', icon: BookOpen, permission: 'COURSES_VIEW' },
    { name: 'Batches & Urgency', path: '/admin/batches', icon: Calendar, permission: 'PROGRAMS_VIEW' },
    { name: 'Enrolled Students', path: '/admin/students', icon: GraduationCap, permission: 'STUDENTS_VIEW' },
    { name: 'Tuition & Billing Ledger', path: '/admin/payments', icon: CreditCard, permission: 'SETTINGS_VIEW' },
    { name: 'Partner Job Board', path: '/admin/jobs', icon: Briefcase, permission: 'JOBS_VIEW' },
    { name: 'Content & FAQs CMS', path: '/admin/content', icon: FileText, permission: 'FAQ_VIEW' },
    { name: 'Student Support Desk', path: '/admin/support', icon: LifeBuoy, permission: 'STUDENTS_VIEW' },
    { name: 'Settings & Audit Log', path: '/admin/settings', icon: Settings, permission: 'SETTINGS_VIEW' },
    { name: 'Staff & Security RBAC', path: '/admin/users', icon: ShieldAlert, permission: 'ADMIN_MANAGEMENT_VIEW' },
    { name: 'How to Use Admin', path: '/admin/guide', icon: HelpCircle, permission: null },
  ];

  const hasItemAccess = (item) => {
    if (isSuperAdmin) return true;
    if (item.superAdminOnly) return false;
    if (!item.permission) return true;
    return userPermissions.includes(item.permission);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col md:flex-row antialiased">
      
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0c0f17] border-b border-white/[0.08] sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 border border-white/15 flex items-center justify-center font-bold text-white text-xs">
            AF
          </div>
          <span className="font-bold text-sm text-white font-heading">AFT Executive Console</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-white/[0.06] text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileOpen ? 'block' : 'hidden'
        } md:flex flex-col flex-shrink-0 bg-[#0c0f17] border-r border-white/[0.08] transition-all duration-300 z-40 fixed md:sticky top-0 h-screen ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.08]">
          <Link to="/admin/dashboard" className="flex items-center gap-2 overflow-hidden">
            {collapsed ? (
              <img
                src="/images/logo-crest.webp"
                alt="AF"
                className="w-8 h-8 object-contain"
              />
            ) : (
              <img
                src="/images/logo-horizontal-white.webp"
                alt="American FutureTech"
                className="h-8 w-auto object-contain"
              />
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Quick Info */}
        <div className="p-3 border-b border-white/[0.06]">
          <div className={`p-2.5 rounded-xl bg-[#0e121a] border border-white/[0.06] flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-[#141923] border border-white/10 flex items-center justify-center font-bold text-xs text-sky-400 flex-shrink-0">
              {user?.name ? user.name.charAt(0) : 'A'}
            </div>
            {!collapsed && (
              <div className="overflow-hidden text-left">
                <div className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-mono text-sky-400">{user?.role || 'SuperAdmin'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (!hasItemAccess(item)) return null;

            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-sky-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/[0.08] space-y-1">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="View Live Landing Page"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            {!collapsed && <span>Live Public Site</span>}
          </a>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 px-6 sm:px-8 bg-[#080a0f]/90 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-left">
            <span className="text-xs font-mono text-slate-500">Executive /</span>
            <span className="text-sm font-semibold text-white">
              {navItems.find((n) => location.pathname.startsWith(n.path))?.name || 'Admin Console'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Gateway Nominal</span>
            </div>

            <Link
              to="/"
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-[#141923] text-slate-300 hover:text-white hover:border-white/20 flex items-center gap-1.5 transition-colors"
            >
              <span>Landing Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            </Link>
          </div>
        </header>

        {/* Body Content */}
        <main className="flex-1 p-5 sm:p-8 overflow-y-auto bg-[#080a0f]">
          {(() => {
            const matchedNav = navItems.find((n) => location.pathname.startsWith(n.path));
            if (matchedNav && !hasItemAccess(matchedNav)) {
              return (
                <div className="max-w-xl mx-auto mt-16 p-8 rounded-3xl bg-[#0f172a] border border-rose-500/30 text-center space-y-4 shadow-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-bold text-white font-heading">
                    Access Restricted (403 Forbidden)
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                    Your account (<span className="text-white font-mono">{user?.email}</span>) does not possess the required permission (<strong className="text-rose-400 font-mono">{matchedNav.permission}</strong>) to access this administrative module.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/admin/dashboard"
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors inline-block"
                    >
                      Return to Executive Dashboard
                    </Link>
                  </div>
                </div>
              );
            }
            return <Outlet />;
          })()}
        </main>
      </div>

    </div>
  );
}
