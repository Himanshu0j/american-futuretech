import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useCompanyInfo from '../hooks/useCompanyInfo';
import { useSiteSettings } from '../context/SiteSettingsContext';
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
  Compass,
  DollarSign
} from 'lucide-react';

const DEFAULT_7_PROGRAMS = [
  { title: 'Data Science with AI Integration', slug: 'data-science-with-ai-integration', badge: 'High Demand', duration: '6 Months', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { title: 'Cyber Security with Ethical Hacking', slug: 'cyber-security-with-ethical-hacking', badge: 'Top Rated', duration: '6 Months', color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300' },
  { title: 'Cyber Security & AI Hybrid', slug: 'cyber-security-and-artificial-intelligence', badge: 'Flagship', duration: '6 Months', color: 'text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300' },
  { title: 'Advanced Generative & Agentic AI', slug: 'advanced-generative-and-agentic-ai-master-program', badge: 'Cutting-Edge', duration: '6 Months', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300' },
  { title: 'DevOps, Kubernetes & Cloud with AI', slug: 'devops-and-cloud-with-ai', badge: 'Enterprise Standard', duration: '6 Months', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { title: 'AI Product Manager with Agentic AI', slug: 'ai-product-manager', badge: 'High Impact', duration: '4 Months', color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300' },
  { title: 'Governance, Risk, and Compliance (GRC)', slug: 'governance-risk-and-compliance-grc-with-ai', badge: 'Enterprise Security', duration: '4 Months', color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300' },
  { title: 'Placement Support', slug: 'placement-support', badge: 'Career Accelerator', duration: '3 Months', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300' },
];

export default function Navbar({ onOpenLeadModal, onNavigateSection }) {
  const company = useCompanyInfo();
  const { settings } = useSiteSettings() || {};
  // Admin → Settings → General → "Global Top Announcement Banner".
  // `enabled` / `linkUrl` are the schema names; the legacy `active` / `link` are
  // still honoured so an older saved document keeps working.
  const banner = settings?.announcementBanner || {};
  const bannerOn = banner.enabled ?? banner.active ?? true;
  const bannerLink = banner.linkUrl || banner.link || '/courses';
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdown, setCoursesDropdown] = useState(false);
  const [moreDropdown, setMoreDropdown] = useState(false);
  const [dbCourses, setDbCourses] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch real database courses for Career Programs dropdown
  useEffect(() => {
    let isMounted = true;
    axios.get('/api/courses')
      .then(res => {
        if (isMounted && res.data?.courses?.length > 0) {
          setDbCourses(res.data.courses);
        }
      })
      .catch(() => {
        // Fallback to default programs if network is offline
      });
    return () => { isMounted = false; };
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
    { name: 'HOME', path: '/' },
    { name: 'LIVE JOBS', path: '/jobs' },
    { name: 'CAREER PROGRAMS', path: '/courses', hasDropdown: true },

    { name: 'CERTIFICATIONS', path: '/certificate/AFT-CERT-AI9821' },
    { name: 'ABOUT US', path: '/about' },
  ];

  const moreLinks = [
    { name: 'AI Certification Program', path: '/certifications/ai-certification' },
    { name: 'Data Science Certification', path: '/certifications/data-science-certification' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Refund & Return Policy', path: '/refund-policy' },
    { name: 'Cookie Policy', path: '/cookie-policy' },
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Career Support', path: '/career-support' },
    { name: 'Success Stories', path: '/success-stories' },
    { name: 'Insights & Blog', path: '/blog' },
    { name: 'Admissions FAQ', path: '/faq' },
  ];

  // Merge DB courses with formatting
  const programList = dbCourses.length > 0
    ? dbCourses.map((c, i) => ({
        title: c.title,
        slug: c.slug,
        badge: c.badge || (i === 0 ? 'High Demand' : i === 1 ? 'Top Rated' : 'Enterprise'),
        duration: c.duration || '6 Months',
        color: i % 2 === 0
          ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300'
          : 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300'
      }))
    : DEFAULT_7_PROGRAMS;

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
    } else if (path.includes('#')) {
      const [targetPath, hash] = path.split('#');
      if (location.pathname === targetPath) {
        const elem = document.getElementById(hash);
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(path);
      }
    } else {
      navigate(path);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none">
      {/* 1. Institutional Topbar (Sheridan, Wyoming & US Accreditation) */}
      <div className={`relative bg-ink-gradient text-[#EFE6D6] text-[11px] font-sans py-1.5 px-4 hidden md:block transition-all duration-300 pointer-events-auto ${scrolled ? 'opacity-0 -translate-y-full h-0 py-0 overflow-hidden border-0' : 'opacity-100'}`}>
        {/* Champagne hairline — the premium signature of the header */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#E5C275]/70 to-transparent" />
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            {bannerOn && banner.text && (
              <>
                <Link
                  to={bannerLink}
                  title={banner.text}
                  className="flex items-center gap-1.5 max-w-[380px] px-2.5 py-0.5 rounded-full bg-[#E5C275] text-[#0B1220] font-bold hover:bg-white transition-colors min-w-0"
                >
                  {banner.badge && (
                    <span className="text-[9px] uppercase tracking-wider opacity-70 shrink-0">{banner.badge}</span>
                  )}
                  <span className="truncate">{banner.text}</span>
                </Link>
                <span className="text-white/20 shrink-0">•</span>
              </>
            )}
            <span className="flex items-center gap-1.5 text-white shrink-0">
              <span className="text-xs">🇺🇸</span>
              <strong className="font-semibold">US Registered Technology Institute</strong>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-[#EFE6D6]/90">
              <MapPin className="w-3 h-3 text-[#E5C275]" />
              {company.address}
            </span>
            <span className="text-white/20">•</span>
            <a href={company.phoneHref} className="flex items-center gap-1 text-[#EFE6D6]/90 hover:text-white transition-colors">
              <Phone className="w-3 h-3 text-[#E5C275]" />
              {company.phone}
            </a>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link
              to="/student/login"
              className="flex items-center gap-1.5 text-[#E5C275] hover:text-white font-semibold transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student LMS</span>
            </Link>
            <span className="text-white/20">•</span>
            <Link
              to="/certificate/AFT-CERT-AI9821"
              className="flex items-center gap-1 text-[#EFE6D6]/90 hover:text-white transition-colors"
            >
              <Award className="w-3 h-3 text-[#E5C275]" />
              <span>Verify Credential</span>
            </Link>
            <span className="text-white/20">•</span>
            <Link
              to="/admin/login"
              className="flex items-center gap-1 text-[#EFE6D6]/70 hover:text-white transition-colors"
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
              : 'bg-[#F7F7F5]/95 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-6 lg:px-8 h-20'
          } flex items-center justify-between`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group py-1 cursor-pointer shrink-0 min-w-[150px] sm:min-w-[170px]">
            <img
              src="/images/logo-horizontal.webp"
              alt="American FutureTech"
              className={`w-auto object-contain transition-all duration-200 group-hover:scale-[1.02] ${scrolled ? 'h-8 sm:h-9' : 'h-9 sm:h-10'}`}
            />
          </Link>

          {/* Desktop Navigation Links: HOME, LIVE JOBS, CAREER PROGRAMS ▼, PERSONALIZED LEARNING, CERTIFICATIONS, ABOUT US, MORE ▼ */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 min-w-0">
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
                    <div className="flex items-center">
                      {/* Clicking the label itself navigates to the full courses page */}
                      <Link
                        to="/courses"
                        onClick={() => setCoursesDropdown(false)}
                        className={`text-[12px] xl:text-[13px] font-bold transition-colors py-1 whitespace-nowrap ${
                          location.pathname.startsWith('/courses')
                            ? 'text-[#0B1220]'
                            : 'text-slate-600 hover:text-[#0B1220]'
                        }`}
                      >
                        <span>{link.name}</span>
                      </Link>
                      <button
                        type="button"
                        aria-label="Toggle Career Programs dropdown"
                        onClick={() => setCoursesDropdown(!coursesDropdown)}
                        className="pl-0.5 py-1 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform duration-200" />
                      </button>
                    </div>

                    {/* Career Programs Mega-Menu Dropdown (fetching real DB courses) */}
                    <div
                      id="career-programs-dropdown"
                      data-testid="career-programs-dropdown"
                      className={`absolute top-full left-0 w-96 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-1.5 transition-all duration-200 z-50 max-h-[85vh] overflow-y-auto ${
                        coursesDropdown ? 'block' : 'hidden group-hover:block'
                      }`}
                    >
                      <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-[#0B1220] dark:text-[#E5C275] tracking-widest border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span>Flagship Career Programs</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-sans font-bold text-[10px]">All with $99 Deposit</span>
                      </div>
                      
                      {programList.map((prog) => (
                        <Link
                          key={prog.slug}
                          to={`/courses/${prog.slug}`}
                          onClick={() => setCoursesDropdown(false)}
                          className="block p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group/item"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-[#0B1220] dark:text-slate-100 group-hover/item:text-[#4338CA] dark:group-hover/item:text-[#E5C275]">
                            <span className="truncate pr-2">{prog.title}</span>
                            <span className="text-[10px] text-slate-500 shrink-0 font-mono font-normal">{prog.duration}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${prog.color}`}>
                              {prog.badge}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              $99 Deposit
                            </span>
                          </div>
                        </Link>
                      ))}

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          to="/courses"
                          onClick={() => setCoursesDropdown(false)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-[#EFE6D6]/60 dark:hover:bg-slate-700 text-[#0B1220] dark:text-white text-xs font-bold transition-colors"
                        >
                          <span>Explore All 8 Programs</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#4338CA] dark:text-[#E5C275]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-[12px] xl:text-[13px] font-bold transition-colors py-1 relative whitespace-nowrap ${
                    isActive
                      ? 'text-[#0B1220]'
                      : 'text-slate-600 hover:text-[#0B1220]'
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-600 to-gold-400 rounded-full" />
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
                className="text-[12px] xl:text-[13px] font-bold text-slate-600 hover:text-[#0B1220] flex items-center gap-1 transition-colors py-1 cursor-pointer"
              >
                <span>MORE</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform duration-200" />
              </button>

              {moreDropdown && (
                <div className="absolute top-full right-0 w-64 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-[#0B1220] dark:text-[#E5C275] tracking-widest border-b border-slate-100 dark:border-slate-800">
                    Institutional Governance
                  </div>
                  {moreLinks.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMoreDropdown(false)}
                      className="block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0B1220] transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Right CTAs: LMS LOGIN and REGISTER NOW */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <Link
              to="/student/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#0B1220] bg-white hover:bg-slate-100 border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs"
            >
              <GraduationCap className="w-4 h-4 text-[#4338CA]" />
              <span>LMS LOGIN</span>
            </Link>

            <Link
              to="/student/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-gradient shadow-brand border border-white/15 hover:brightness-110 transition-all hover:-translate-y-px"
            >
              <span>REGISTER NOW</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E5C275]" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="lg:hidden p-2 rounded-xl text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#0B1220]" /> : <Menu className="w-6 h-6 text-[#0B1220]" />}
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
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between p-6 z-10 animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="space-y-4">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <img
                  src="/images/logo-horizontal.webp"
                  alt="American FutureTech"
                  className="h-9 w-auto object-contain"
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <span>{link.name}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>

              {/* Programs Quick List (All 8 Programs with $99 Deposit Badge) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3 flex items-center justify-between">
                  <span>Flagship Tracks</span>
                  <span className="text-[#4338CA] dark:text-[#E5C275] font-bold">8 Programs</span>
                </div>
                {programList.map((prog) => (
                  <button
                    key={prog.slug}
                    onClick={() => handleNavClick(`/courses/${prog.slug}`)}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                  >
                    <span className="truncate pr-2">{prog.title}</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded shrink-0">{prog.duration}</span>
                  </button>
                ))}
              </div>

              {/* Legal & More Links */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3">
                  Policies & Governance
                </div>
                <div className="grid grid-cols-2 gap-1 px-1">
                  {moreLinks.slice(0, 6).map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.path)}
                      className="text-left text-[11px] py-1.5 px-2 rounded text-slate-600 dark:text-slate-400 hover:text-[#0B1220] hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions in Drawer: LMS LOGIN and REGISTER NOW */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <Link
                to="/student/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0B1220] dark:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <GraduationCap className="w-4 h-4 text-[#4338CA]" />
                <span>LMS LOGIN</span>
              </Link>

              <Link
                to="/student/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-ink-gradient border border-white/10 text-[#EFE6D6] font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <span>REGISTER NOW</span>
                <ArrowRight className="w-4 h-4 text-[#E5C275]" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
