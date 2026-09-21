import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Play,
  Award,
  Calendar,
  Users,
  Code2,
  Check,
  FileCode,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Laptop,
  GraduationCap,
  BarChart3,
  Flame,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lottie } from 'lottie-react';
import heroOnlineLearningSvg from '../assets/illustrations/hero/hero-online-learning.svg';
import heroCodingLottie from '../assets/animations/hero/hero-coding-laptop.json';
import heroDeskImg from '../assets/hero-desk.png';

import { useSiteSettings } from '../context/SiteSettingsContext';

export default function Hero({ onOpenLeadModal, onExploreCourses }) {
  const { settings } = useSiteSettings();
  const heroData = settings?.hero || {};

  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'lms' | 'classroom' | 'credential' | 'admin'
  const [heroCredView, setHeroCredView] = useState('us'); // 'us' | 'microsoft'
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Subtle mouse parallax for desktop viewports
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 1024) return;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const offsetX = Math.max(-8, Math.min(8, (e.clientX - centerX) * 0.01));
      const offsetY = Math.max(-8, Math.min(8, (e.clientY - centerY) * 0.01));
      setMousePos({ x: offsetX, y: offsetY });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const cockpitTabs = [
    { id: 'workspace', label: 'Flagship Studio', icon: Laptop },
    { id: 'lms', label: 'Student LMS', icon: Code2 },
    { id: 'classroom', label: 'Live Classroom', icon: Play },
    { id: 'credential', label: 'US Credential', icon: Award },
    { id: 'admin', label: 'Admin Telemetry', icon: BarChart3 },
  ];

  return (
    <section className="relative pt-6 sm:pt-10 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-white to-slate-100/80 dark:from-[#0B132B] dark:via-[#0F172A] dark:to-[#0B132B] overflow-hidden">
      
      {/* Background Architectural Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f10a_1px,transparent_1px),linear-gradient(to_bottom,#6366f10a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* ============================================================
              LEFT COLUMN: Editorial Typography & Strategic Positioning
              ============================================================ */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Staggered Eyebrow Badge */}
            <div className="anim-hero-eyebrow">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-indigo-500/20 shadow-xs text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint-dot" />
                <span className="tracking-widest uppercase font-mono text-[11px] font-bold">
                  {heroData.eyebrowBadgeText || heroData.eyebrow || 'AMERICAN FUTURETECH · 6-MONTH CAREER TRAINING & FELLOWSHIPS'}
                </span>
              </div>
            </div>

            {/* Editorial Agency-Grade Headline */}
            <div className="anim-hero-heading space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-slate-900 dark:text-white tracking-tight leading-[1.08] font-heading whitespace-pre-line">
                {heroData.headline ? (
                  heroData.headline
                ) : (
                  <>
                    BUILD HIGH-VALUE SKILLS.<br />
                    <span className="text-indigo-600 dark:text-indigo-400">GET US CERTIFIED.</span><br />
                    LAUNCH YOUR CAREER.
                  </>
                )}
              </h1>
            </div>

            {/* Supporting Editorial Paragraph */}
            <p className="anim-hero-body text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
              {heroData.subheadline || 'Rigorous, mentor-guided 6-month career training and 1-on-1 personalized tracks engineered for real industry impact. Master production-grade AI, cybersecurity, and cloud systems with verifiable US credentials and direct placement support.'}
            </p>

            {/* Social Proof Alumni Avatars with real images */}
            <div className="anim-hero-body flex items-center gap-3 pt-1">
              <div className="flex -space-x-2.5 overflow-hidden">
                <img
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover shadow-2xs"
                  src="/images/hero-technologist.jpg"
                  alt="Fellow Alum"
                />
                <img
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover shadow-2xs"
                  src="/images/fellows-collaborating.jpg"
                  alt="Fellow Alum"
                />
                <img
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover shadow-2xs"
                  src="/images/mentorship-session.jpg"
                  alt="Fellow Alum"
                />
                <div className="inline-flex h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-800 bg-indigo-900 text-indigo-200 font-bold text-[10px] items-center justify-center shadow-2xs font-mono">
                  +1.2K
                </div>
              </div>
              <div className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <span>{heroData.statsBadgeText || '1,200+ Fellows Placed'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Hired at Google, Microsoft, AWS & Fortune 500</div>
              </div>
            </div>

            {/* Dual High-Impact Action Buttons */}
            <div className="anim-hero-cta flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 w-full sm:w-auto">
              <Link
                to={heroData.primaryCtaLink || '/checkout?tier=deposit'}
                className="elms-btn-primary !py-4 !px-8 !text-sm cursor-pointer group shadow-xl flex items-center justify-center gap-2"
              >
                <span>{heroData.primaryCtaText || 'Reserve Your Seat — $99'}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              <Link
                to={heroData.secondaryCtaLink || '/jobs'}
                className="elms-btn-secondary !py-3.5 !px-7 !text-sm cursor-pointer shadow-xs flex items-center justify-center gap-2 group hover:border-indigo-500/40"
              >
                <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>{heroData.secondaryCtaText || 'Explore Live Jobs'}</span>
              </Link>
            </div>

            {/* Trust Microcopy Ledger */}
            <div className="anim-hero-cta pt-4 w-full border-t border-slate-200/80 dark:border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left pt-2">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-heading flex items-center gap-1">
                    <span>★ 4.9 / 5.0</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Graduate Satisfaction</div>
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-heading">100% Verifiable</div>
                  <div className="text-[11px] text-slate-500 font-medium">Accredited US Registry</div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-heading font-mono">$99 Deposit</div>
                  <div className="text-[11px] text-slate-500 font-medium">Risk-Free Reservation</div>
                </div>
              </div>

              {/* Cohort Intake Notice */}
              <div className="mt-3.5 flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>6-Month Training & 1-on-1 Personalized Mentorship · Admissions Open</span>
              </div>
            </div>

          </div>

          {/* ============================================================
              RIGHT COLUMN: Layered Visual Composition & Real LMS Product Cockpit
              ============================================================ */}
          <div
            className="lg:col-span-6 anim-hero-preview w-full relative parallax-layer pt-7"
            style={{ transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)` }}
          >
            {/* Ambient Radial Backlight Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 via-blue-500/10 to-transparent rounded-3xl blur-2xl -z-10 pointer-events-none" />

            {/* Top-Left Floating Mentor Status Badge */}
            <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg absolute -top-1 -left-3 z-20 animate-float-slow">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>1-on-1 Faculty Mentorship</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Silicon Valley Faculty Active</div>
              </div>
            </div>

            {/* Top-Right Floating Velocity Metric Badge */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg absolute -top-1 -right-3 z-20 animate-float-drift">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                ⚡
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white">6-Month Career Track</div>
                <div className="text-[9px] text-slate-500 font-mono">Accelerated Placement</div>
              </div>
            </div>

            {/* Bottom-Right Floating Credential Status Badge with Official Gold Seal Asset */}
            <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg absolute -bottom-3 -right-2 z-20 animate-float-delayed">
              <img
                src="/images/gold-seal-medal.webp"
                alt="Gold Medal Seal"
                className="w-8 h-8 object-contain shrink-0 drop-shadow-sm"
              />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Accredited US Diploma</div>
                <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">AFT-CERT-AI9821 Verified</div>
              </div>
            </div>

            {/* Bottom-Left Floating Interactive Cloud Lab Visual Asset */}
            <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl absolute -bottom-4 -left-3 z-20 animate-float-slow">
              <div className="w-10 h-9 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700 shadow-inner">
                <img
                  src="/images/floating-laptop-code.webp"
                  alt="Live Code Lab"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Cloud GPU Lab</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="text-[10px] font-mono text-slate-500">PyTorch & Agentic RAG</div>
              </div>
            </div>

            {/* Sourced unDraw Hero Illustration Banner */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mt-6 mb-3 flex items-center justify-between p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-md relative z-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 p-1 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                  <img
                    src={heroOnlineLearningSvg}
                    alt="Online Learning Fellowship"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-heading text-slate-900 dark:text-white">
                      Silicon Valley Technology Fellowships
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold">
                      Cohort 2026
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    6-Month Career Programs · 1-on-1 Personalized Mentoring · Production Sandboxes
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                <Lottie src={heroCodingLottie} loop autoplay className="w-[26px] h-[26px]" />
              </div>
            </motion.div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-left transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] relative z-10">
              
              {/* Cockpit Window Header & View Switcher */}
              <div className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 font-mono text-[11px] text-slate-500 truncate hidden sm:inline">
                      lms.americanfuturetech.com/cockpit
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Product Ecosystem</span>
                  </div>
                </div>

                {/* 5 Interactive Segmented Control Tabs */}
                <div className="grid grid-cols-5 gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl">
                  {cockpitTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white/50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate hidden sm:inline">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cockpit Dynamic Views */}
              <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 min-h-[380px] flex flex-col justify-between">
                
                {/* VIEW 0: FLAGSHIP WORKSPACE & STUDIO */}
                {activeTab === 'workspace' && (
                  <div className="space-y-4 animate-in fade-in duration-200 text-left">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-md group bg-slate-950">
                      <img
                        src={heroDeskImg}
                        alt="American FutureTech Flagship Tech Workspace"
                        className="w-full h-56 sm:h-60 object-cover object-center group-hover:scale-102 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                            Live Silicon Valley Ecosystem
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active Cohort
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-base sm:text-lg font-heading">
                          American FutureTech Innovation Lab
                        </h3>
                        <p className="text-slate-300 text-xs mt-0.5">
                          Enterprise cloud environments, dedicated workstations, and live 1-on-1 faculty coaching.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">Tuition Model</div>
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">$99 Reservation</div>
                        <div className="text-[10px] text-slate-500">Refundable deposit</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">Curriculum</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">6-Month Training</div>
                        <div className="text-[10px] text-slate-500">Or 1-on-1 Track</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">Placement</div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Live Job Board</div>
                        <div className="text-[10px] text-slate-500">Direct hiring pipeline</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        to="/checkout?tier=deposit"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <span>Reserve Seat for $99</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={onExploreCourses}
                        className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
                      >
                        Browse Courses
                      </button>
                    </div>
                  </div>
                )}

                {/* VIEW 1: STUDENT LMS DASHBOARD */}
                {activeTab === 'lms' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Visual Fellow Context Banner */}
                    <div className="relative rounded-xl overflow-hidden h-24 border border-slate-200 dark:border-slate-700 group">
                      <img
                        src="/images/hero-technologist.jpg"
                        alt="Applied Technology Lab Fellow"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent flex items-center p-3.5">
                        <div className="text-left space-y-0.5">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-mono font-bold uppercase">
                            Active Academic Term
                          </span>
                          <div className="text-white font-bold text-sm font-heading">Applied AI & Cloud Systems Lab</div>
                          <div className="text-indigo-200 text-[10px]">Cohort Track: 6-Month AI Systems & Cloud</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                          EH
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">Ethan Hunt</div>
                          <div className="text-[10px] text-slate-500 font-mono">Fellow ID: AFT-2026-8819</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                        Enrolled
                      </span>
                    </div>

                    <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Primary Specialization:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">68% Complete</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        6-Month Career Track: Data Science with AI Integration
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full w-[68%]" />
                      </div>
                      <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500">
                        <span>Current: Module 4 (Agentic RAG & LangGraph)</span>
                        <Link to="/courses/data-science-with-ai-integration" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5">
                          <span>Resume</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 font-mono">NEXT LIVE LAB</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">Saturday, 10:00 AM EST</div>
                        <div className="text-[10px] text-slate-500">Multi-Agent Orchestration</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 font-mono">FACULTY OFFICE HOURS</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">1-on-1 Code Review</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Booked for Thursday</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW 2: CLASSROOM PLAYER */}
                {activeTab === 'classroom' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 flex flex-col justify-between p-4 border border-slate-800">
                      <div className="flex items-center justify-between text-white/80 text-xs">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/20">Lesson 4.2</span>
                        <span className="text-[10px]">34:12 / 48:00</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 ml-0.5" />
                        </div>
                      </div>
                      <div className="text-left text-white">
                        <div className="text-xs font-bold font-heading">Production Fine-Tuning with LoRA & vLLM</div>
                        <div className="text-[10px] text-slate-400">Instructor: Dr. Marcus Vance, Ex-Staff Research Scientist</div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs space-y-1.5 text-left border border-slate-800">
                      <div className="text-[10px] text-slate-500 flex items-center justify-between border-b border-slate-800 pb-1">
                        <span>main.py — Live Cloud Container</span>
                        <span className="text-emerald-400">Python 3.11</span>
                      </div>
                      <div className="text-emerald-400">import torch, vllm</div>
                      <div className="text-slate-300">from langchain.agents import initialize_agent</div>
                      <div className="text-slate-400"># Model initialized with FlashAttention-2</div>
                      <div className="text-cyan-300">agent = initialize_agent(tools, llm, verbose=True)</div>
                    </div>

                    <button
                      onClick={() => setLessonCompleted(!lessonCompleted)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                        lessonCompleted
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {lessonCompleted ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Module Completed & Progress Synced</span>
                        </>
                      ) : (
                        <span>Mark Lesson as Completed</span>
                      )}
                    </button>
                  </div>
                )}

                {/* VIEW 3: US CREDENTIAL & MICROSOFT PARTNER VERIFICATION */}
                {activeTab === 'credential' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    {/* View Switcher Bar */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setHeroCredView('us')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 text-[11px] ${
                          heroCredView === 'us'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>US Institute Diploma</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroCredView('microsoft')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 text-[11px] ${
                          heroCredView === 'microsoft'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Microsoft Certified</span>
                      </button>
                    </div>

                    {heroCredView === 'us' ? (
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-800 dark:via-slate-850 dark:to-indigo-950/30 border-2 border-indigo-500/20 text-center relative overflow-hidden shadow-inner">
                        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-2.5 mb-3">
                          <div className="text-left">
                            <div className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest font-heading">
                              AMERICAN FUTURETECH
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono">Registry of Digital Credentials · Wyoming</div>
                          </div>
                          <img
                            src="/images/gold-seal-medal.webp"
                            alt="Gold Medal Seal"
                            className="w-8 h-8 object-contain"
                          />
                        </div>

                        <div className="text-[11px] text-slate-500 uppercase tracking-widest font-mono">
                          This Certifies That
                        </div>
                        <div className="text-base font-bold text-slate-900 dark:text-white font-heading mt-0.5">
                          Ethan Hunt
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-300 max-w-xs mx-auto mt-0.5 leading-relaxed">
                          has successfully completed the 24-week (6-month) professional fellowship in
                        </div>
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-heading mt-0.5">
                          Applied Artificial Intelligence & Machine Learning Systems
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-[9px] font-mono text-slate-500">
                          <span>ID: AFT-CERT-AI9821</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">STATUS: ACCREDITED</span>
                          <span>ISSUED: 2026</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-slate-900 border-2 border-indigo-500/30 text-center relative overflow-hidden shadow-inner space-y-2.5">
                        <div className="relative rounded-xl overflow-hidden border border-indigo-400/40 bg-white max-h-40 flex items-center justify-center">
                          <img
                            src="/images/certificates/ms-cert-sc100.png"
                            alt="Microsoft Certified SC-100"
                            className="w-full h-auto max-h-36 object-contain"
                          />
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-indigo-900/90 text-indigo-200 text-[9px] font-mono font-bold">
                            SC-100 EXPERT
                          </div>
                        </div>

                        <div className="text-left space-y-0.5 px-1">
                          <div className="text-xs font-bold text-white font-heading truncate">
                            Microsoft Certified: Cybersecurity Architect Expert
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Conferred to: Ethan Hunt</span>
                            <span className="text-emerald-400 font-bold">VERIFIED ACTIVE</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Link
                      to="/certificate/AFT-CERT-AI9821"
                      className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Open Cryptographic Registry Record</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                {/* VIEW 4: ADMIN TELEMETRY */}
                {activeTab === 'admin' && (
                  <div className="space-y-3 animate-in fade-in duration-200 text-left">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono uppercase">Current Cohort Enrollment</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">142 Fellows Active</div>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold font-mono">
                        98.7% Retention
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 font-mono">AVERAGE COMPLETION</div>
                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">84.2%</div>
                        <div className="text-[10px] text-slate-500">Across 6 flagship labs</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 font-mono">PLACEMENT VELOCITY</div>
                        <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">89%</div>
                        <div className="text-[10px] text-slate-500">Hired within 90 days</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                      <div className="text-[10px] text-slate-500 font-mono uppercase">Partner Employer Inquiries</div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Google Cloud, Databricks, Snowflake & CrowdStrike active hiring pipelines.
                      </div>
                    </div>

                    <Link
                      to="/admin/login"
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Launch Staff Admin Console</span>
                    </Link>
                  </div>
                )}

                {/* Footer Software Assurance */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Real Production Architecture
                  </span>
                  <span className="font-mono text-[10px]">v4.2 Enterprise</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
