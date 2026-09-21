import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Phone,
  MapPin,
  GraduationCap,
  Award,
  ChevronDown,
  Briefcase,
  Sparkles,
  BookOpen,
  FileText,
  Lock,
  Compass
} from 'lucide-react';

export default function Navbar({ onOpenLeadModal, onNavigateSection }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdown, setCoursesDropdown] = useState(false);
  const [moreDropdown, setMoreDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Live Jobs', path: '/jobs' },
    { name: 'Career Programs', path: '/courses', hasDropdown: true },
    { name: 'Personalized Learning', path: '/courses' },
    { name: 'Certifications', path: '/certificate/AFT-CERT-AI9821' },
    { name: 'About Us', path: '/about' },
  ];

  const moreLinks = [
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Refund & Return Policy', path: '/refund-policy' },
    { name: 'Cookie Policy', path: '/cookie-policy' },
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Career Support', path: '/career-support' },
    { name: 'Success Stories', path: '/success-stories' },
    { name: 'Insights & Blog', path: '/blog' },
    { name: 'Admissions FAQ', path: '/faq' },
  ];

  const flagshipPrograms = [
    { title: 'Data Science with AI Integration', slug: 'data-science-with-ai-integration', tag: 'High Demand', duration: '6 Months', color: 'text-emerald-700 bg-emerald-50' },
    { title: 'Cyber Security with Ethical Hacking', slug: 'cyber-security-with-ethical-hacking', tag: 'Accredited', duration: '6 Months', color: 'text-blue-700 bg-blue-50' },
    { title: 'Cyber Security & AI Hybrid', slug: 'cyber-security-and-artificial-intelligence', tag: 'Flagship', duration: '6 Months', color: 'text-purple-700 bg-purple-50' },
    { title: 'Advanced Generative & Agentic AI', slug: 'advanced-generative-and-agentic-ai-master-program', tag: 'Specialization', duration: '4 Months', color: 'text-amber-700 bg-amber-50' },
  ];

  const handleNavClick = (path) => {
    setMobileMenuOpen(false);
    setCoursesDropdown(false);
    setMoreDropdown(false);
    if (path === '/') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    } else {
      navigate(path);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none">
      {/* 1. Institutional Topbar (Sheridan, Wyoming & US Accreditation) */}
      <div className={`bg-[#1a361d] border-b border-[#2d5c36]/60 text-[#d8ffd2] text-[11px] font-sans py-1.5 px-4 hidden md:block transition-all duration-300 pointer-events-auto ${scrolled ? 'opacity-0 -translate-y-full h-0 py-0 overflow-hidden border-0' : 'opacity-100'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-white">
              <span className="text-xs">🇺🇸</span>
              <strong className="font-semibold">US Registered Technology Institute</strong>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-[#d8ffd2]/90">
              <MapPin className="w-3 h-3 text-[#76ff8a]" />
              30 N Gould St, Sheridan, WY 82801
            </span>
            <span className="text-white/20">•</span>
            <a href="tel:+13072019494" className="flex items-center gap-1 text-[#d8ffd2]/90 hover:text-white transition-colors">
              <Phone className="w-3 h-3 text-[#76ff8a]" />
              +1 (307) 201-9494
            </a>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link
              to="/student/login"
              className="flex items-center gap-1.5 text-[#76ff8a] hover:text-white font-semibold transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student LMS</span>
            </Link>
            <span className="text-white/20">•</span>
            <Link
              to="/certificate/AFT-CERT-AI9821"
              className="flex items-center gap-1 text-[#d8ffd2]/90 hover:text-white transition-colors"
            >
              <Award className="w-3 h-3 text-[#76ff8a]" />
              <span>Verify Credential</span>
            </Link>
            <span className="text-white/20">•</span>
            <Link
              to="/admin/login"
              className="flex items-center gap-1 text-[#d8ffd2]/70 hover:text-white transition-colors"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin Console</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar with Adaptive Scroll Transformation */}
      <div className={`transition-all duration-300 pointer-events-auto ${scrolled ? 'pt-2 px-3 sm:px-6 max-w-7xl mx-auto' : 'w-full'}`}>
        <div
          className={`transition-all duration-300 ${
            scrolled
              ? 'bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl px-4 sm:px-6 h-16'
              : 'bg-[#fffff2]/95 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-6 lg:px-8 h-20'
          } flex items-center justify-between`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group py-1 cursor-pointer shrink-0">
            <img
              src="/images/logo-horizontal.webp"
              alt="American FutureTech"
              className={`w-auto object-contain transition-all duration-200 group-hover:scale-[1.02] ${scrolled ? 'h-9 sm:h-10' : 'h-10 sm:h-11'}`}
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path === '/jobs' && location.pathname === '/careers');

              if (link.hasDropdown) {
                return (
                  <div
                    key={link.name}
                    className="relative group py-2"
                    onMouseEnter={() => setCoursesDropdown(true)}
                    onMouseLeave={() => setCoursesDropdown(false)}
                  >
                    <Link
                      to="/courses"
                      className={`text-[13px] font-bold flex items-center gap-1 transition-colors py-1 ${
                        location.pathname.startsWith('/courses')
                          ? 'text-[#1a361d]'
                          : 'text-slate-600 hover:text-[#1a361d]'
                      }`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform duration-200" />
                    </Link>

                    {/* Programs Dropdown */}
                    {coursesDropdown && (
                      <div className="absolute top-full left-0 w-88 p-2 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                        <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-[#1a361d] tracking-widest border-b border-slate-100 flex items-center justify-between">
                          <span>Flagship Engineering Fellowships</span>
                          <span className="text-emerald-600">Spring 2026</span>
                        </div>
                        {flagshipPrograms.map((prog) => (
                          <Link
                            key={prog.slug}
                            to={`/courses/${prog.slug}`}
                            onClick={() => setCoursesDropdown(false)}
                            className="block p-2.5 rounded-xl hover:bg-slate-50 transition-colors group/item"
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-[#1a361d] group-hover/item:text-[#2d5c36]">
                              <span className="truncate pr-2">{prog.title}</span>
                              <span className="text-[10px] text-slate-500 shrink-0 font-mono font-normal">{prog.duration}</span>
                            </div>
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1 ${prog.color}`}>
                              {prog.tag}
                            </span>
                          </Link>
                        ))}
                        <div className="pt-2 border-t border-slate-100">
                          <Link
                            to="/courses"
                            onClick={() => setCoursesDropdown(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-[#d8ffd2]/50 text-[#1a361d] text-xs font-bold transition-colors"
                          >
                            <span>Explore All 7 Specializations</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#2d5c36]" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-[13px] font-bold transition-colors py-1 relative ${
                    isActive
                      ? 'text-[#1a361d]'
                      : 'text-slate-600 hover:text-[#1a361d]'
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#1a361d] rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* MORE ▾ Dropdown */}
            <div
              className="relative group py-2"
              onMouseEnter={() => setMoreDropdown(true)}
              onMouseLeave={() => setMoreDropdown(false)}
            >
              <button
                className="text-[13px] font-bold text-slate-600 hover:text-[#1a361d] flex items-center gap-1 transition-colors py-1 cursor-pointer"
              >
                <span>More</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform duration-200" />
              </button>

              {moreDropdown && (
                <div className="absolute top-full right-0 w-64 p-2 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-[#1a361d] tracking-widest border-b border-slate-100">
                    Institutional Governance
                  </div>
                  {moreLinks.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMoreDropdown(false)}
                      className="block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1a361d] transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/student/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#1a361d] bg-white hover:bg-slate-100 border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs"
            >
              <GraduationCap className="w-4 h-4 text-[#2d5c36]" />
              <span>LMS Login</span>
            </Link>

            <Link
              to="/checkout"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1a361d] via-[#2d5c36] to-[#1a361d] hover:brightness-110 shadow-sm transition-all hover:shadow-md"
            >
              <span>Reserve Seat ($99)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="lg:hidden p-2 rounded-xl text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#1a361d]" /> : <Menu className="w-6 h-6 text-[#1a361d]" />}
          </button>
        </div>
      </div>

      {/* 3. DEDICATED MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 pointer-events-auto">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-in Drawer Container */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col justify-between p-6 z-10 animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <img
                  src="/images/logo-horizontal.webp"
                  alt="American FutureTech"
                  className="h-9 w-auto object-contain"
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Links */}
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link.path)}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors text-left"
                  >
                    <span>{link.name}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>

              {/* Programs Quick List */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3">
                  Flagship Tracks
                </div>
                {flagshipPrograms.map((prog) => (
                  <button
                    key={prog.slug}
                    onClick={() => handleNavClick(`/courses/${prog.slug}`)}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left"
                  >
                    <span className="truncate pr-2">{prog.title}</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">{prog.duration}</span>
                  </button>
                ))}
              </div>

              {/* Legal & More Links */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3">
                  Policies & Governance
                </div>
                <div className="grid grid-cols-2 gap-1 px-1">
                  {moreLinks.slice(0, 4).map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.path)}
                      className="text-left text-[11px] py-1.5 px-2 rounded text-slate-600 hover:text-[#1a361d] hover:bg-slate-50"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions in Drawer */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <Link
                to="/student/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-slate-100 text-[#1a361d] font-bold text-xs flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student LMS Portal</span>
              </Link>

              <Link
                to="/checkout"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-[#1a361d] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <span>Reserve Seat ($99 Deposit)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
