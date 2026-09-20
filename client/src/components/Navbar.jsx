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
  FileText
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
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    { title: 'Data Science with AI Integration', slug: 'data-science-with-ai-integration', tag: 'High Demand', duration: '6 Months' },
    { title: 'Cyber Security with Ethical Hacking', slug: 'cyber-security-with-ethical-hacking', tag: 'Accredited', duration: '6 Months' },
    { title: 'Cyber Security & AI Hybrid', slug: 'cyber-security-and-artificial-intelligence', tag: 'Flagship', duration: '6 Months' },
    { title: 'Advanced Generative & Agentic AI', slug: 'advanced-generative-and-agentic-ai-master-program', tag: 'Specialization', duration: '4 Months' },
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
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Institutional Topbar / US Accreditation Bar */}
      <div className="bg-[#1a361d] border-b border-[#2d5c36] text-[#d8ffd2] text-[11px] font-sans py-1.5 px-4 hidden md:block">
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
              className="flex items-center gap-1.5 text-[#76ff8a] hover:text-white font-medium transition-colors"
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

      {/* Main Navigation Bar */}
      <div
        className={`${
          scrolled
            ? 'bg-[#fffff2]/95 backdrop-blur-md border-b border-[#1a361d]/10 shadow-sm'
            : 'bg-[#fffff2] border-b border-[#1a361d]/08'
        } transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Official American FutureTech Logo */}
            <Link to="/" className="flex items-center gap-2 group cursor-pointer py-1">
              <img
                src="/images/logo-horizontal.webp"
                alt="American FutureTech"
                className="h-10 sm:h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-5">
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
                        className={`text-[13px] font-semibold flex items-center gap-1 transition-colors py-1 ${
                          location.pathname.startsWith('/courses')
                            ? 'text-[#1a361d] border-b-2 border-[#1a361d]'
                            : 'text-[#1a361d]/80 hover:text-[#1a361d]'
                        }`}
                      >
                        <span>{link.name}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-[#1a361d]/60 group-hover:rotate-180 transition-transform duration-200" />
                      </Link>

                      {/* Programs Dropdown */}
                      {coursesDropdown && (
                        <div className="absolute top-full left-0 w-80 p-2 rounded-xl bg-white border border-gray-200 shadow-xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="px-3 py-1 text-[11px] uppercase font-bold text-[#1a361d] tracking-wider border-b border-gray-100">
                            Flagship Engineering Tracks
                          </div>
                          {flagshipPrograms.map((prog) => (
                            <Link
                              key={prog.slug}
                              to={`/courses/${prog.slug}`}
                              onClick={() => setCoursesDropdown(false)}
                              className="block p-2 rounded-lg hover:bg-[#fffff2] transition-colors group/item"
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-[#1a361d] group-hover/item:text-[#2d5c36]">
                                <span className="truncate pr-2">{prog.title}</span>
                                <span className="text-[10px] text-gray-500 shrink-0 font-mono font-normal">{prog.duration}</span>
                              </div>
                              <span className="text-[10px] text-[#40844e] font-medium">{prog.tag}</span>
                            </Link>
                          ))}
                          <div className="pt-1.5 border-t border-gray-100">
                            <Link
                              to="/courses"
                              onClick={() => setCoursesDropdown(false)}
                              className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#fffff2] hover:bg-[#d8ffd2]/40 text-[#1a361d] text-xs font-bold transition-colors"
                            >
                              <span>Explore All Specializations</span>
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
                    className={`text-[13px] font-semibold transition-colors py-1 ${
                      isActive
                        ? 'text-[#1a361d] border-b-2 border-[#1a361d]'
                        : 'text-[#1a361d]/80 hover:text-[#1a361d]'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              {/* MORE ▾ Dropdown (Includes Legal Policies, FAQ, Blog, Career Support) */}
              <div
                className="relative group py-2"
                onMouseEnter={() => setMoreDropdown(true)}
                onMouseLeave={() => setMoreDropdown(false)}
              >
                <button
                  className="text-[13px] font-semibold text-[#1a361d]/80 hover:text-[#1a361d] flex items-center gap-1 transition-colors py-1 cursor-pointer"
                >
                  <span>More</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#1a361d]/60 group-hover:rotate-180 transition-transform duration-200" />
                </button>

                {moreDropdown && (
                  <div className="absolute top-full right-0 w-64 p-2 rounded-xl bg-white border border-gray-200 shadow-xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#1a361d] tracking-wider border-b border-gray-100">
                      Institutional Policies & More
                    </div>
                    {moreLinks.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setMoreDropdown(false)}
                        className="block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-[#fffff2] hover:text-[#1a361d] transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Right Action Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Prominent LMS Login Button */}
              <Link
                to="/student/login"
                className="px-3.5 py-2 rounded-full border-2 border-[#1a361d] hover:bg-[#1a361d] text-[#1a361d] hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                <span>LMS Login</span>
              </Link>

              {/* Reserve Seat ($99) */}
              <Link
                to="/checkout"
                className="elms-btn-primary !text-xs !py-2.5 !px-4"
              >
                <span>Reserve Seat ($99)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile Menu Trigger */}
            <div className="flex lg:hidden items-center gap-2">
              <Link
                to="/student/login"
                className="px-2.5 py-1.5 rounded-full border border-[#1a361d] text-[#1a361d] font-bold text-[11px]"
              >
                LMS
              </Link>

              <Link
                to="/checkout"
                className="elms-btn-primary !text-[11px] !py-1.5 !px-3"
              >
                $99 Seat
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-[#1a361d] hover:bg-black/5 transition-colors focus:outline-none cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#fffff2] border-b border-gray-200 shadow-2xl animate-in slide-in-from-top duration-200 max-h-[85vh] overflow-y-auto">
          <div className="px-4 pt-3 pb-6 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.path)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between ${
                    isActive ? 'bg-[#1a361d] text-[#fffff2]' : 'text-[#1a361d] hover:bg-black/5'
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#76ff8a]" />}
                </button>
              );
            })}

            <div className="pt-2 border-t border-gray-200">
              <div className="px-3 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Policies & Resources
              </div>
              {moreLinks.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.path)}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="pt-4 mt-2 border-t border-gray-200 flex flex-col gap-2.5">
              <Link
                to="/student/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full elms-btn-secondary !text-xs !py-2.5 justify-center flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student LMS Classroom Login</span>
              </Link>
              <Link
                to="/checkout"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full elms-btn-primary !text-xs !py-2.5 justify-center"
              >
                Reserve Seat ($99 Deposit)
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
