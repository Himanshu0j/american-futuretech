import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  PhoneCall,
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

export default function Hero({ onOpenLeadModal, onExploreCourses }) {
  const [activeTab, setActiveTab] = useState('lms'); // 'lms' | 'classroom' | 'credential' | 'admin'
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Subtle mouse parallax for desktop viewports
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 1024) return;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const offsetX = Math.max(-10, Math.min(10, (e.clientX - centerX) * 0.012));
      const offsetY = Math.max(-10, Math.min(10, (e.clientY - centerY) * 0.012));
      setMousePos({ x: offsetX, y: offsetY });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Tabs for the interactive LMS cockpit
  const cockpitTabs = [
    { id: 'lms', label: 'Student LMS', icon: GraduationCap },
    { id: 'classroom', label: 'Classroom Player', icon: Laptop },
    { id: 'credential', label: 'US Credential', icon: Award },
    { id: 'admin', label: 'Admin Telemetry', icon: BarChart3 },
  ];

  return (
    <section id="home" className="pt-4 pb-14 sm:pt-6 sm:pb-16 md:pt-8 md:pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* ============================================================
              LEFT COLUMN: Editorial Typography, Eyebrow & Value Prop
              ============================================================ */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6">
            
            {/* Staggered Eyebrow Badge */}
            <div className="anim-hero-eyebrow">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#2d5c36]/20 shadow-xs text-xs font-semibold text-[#1a361d]">
                <span className="w-2 h-2 rounded-full bg-[#76ff8a] pulse-mint-dot" />
                <span className="tracking-wide uppercase font-mono text-[11px] font-bold">
                  US Accredited Technology Fellowships · Sheridan, WY
                </span>
              </div>
            </div>

            {/* Editorial Headline */}
            <div className="anim-hero-heading space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-[#1a361d] tracking-tight leading-[1.12] font-heading">
                Engineered for Applied Excellence.
              </h1>
              <div className="pt-1">
                <span className="highlight text-2xl sm:text-3xl lg:text-4xl">
                  Master Applied AI, Cybersecurity & Cloud.
                </span>
              </div>
            </div>

            {/* Supporting Editorial Paragraph */}
            <p className="anim-hero-body text-base sm:text-lg text-gray-700 max-w-xl font-normal leading-relaxed">
              Rigorous, 6-month engineering fellowships designed for serious technologists. Master production-grade AI systems, offensive cyber operations, and cloud architecture through live faculty labs, GitHub codebases, and verifiable US credentials.
            </p>

            {/* Social Proof Alumni Avatars with real images */}
            <div className="anim-hero-body flex items-center gap-3 pt-1">
              <div className="flex -space-x-2.5 overflow-hidden">
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-2xs"
                  src="/images/hero-technologist.jpg"
                  alt="Alum"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-2xs"
                  src="/images/fellows-collaborating.jpg"
                  alt="Alum"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-2xs"
                  src="/images/mentorship-session.jpg"
                  alt="Alum"
                />
                <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white bg-[#1a361d] text-[#76ff8a] font-bold text-[10px] items-center justify-center shadow-2xs font-mono">
                  +1.2K
                </div>
              </div>
              <div className="text-left text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-[#1a361d]">
                  <span>1,200+ Fellows Placed</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[11px] text-slate-500 font-normal">Hired at Google, Microsoft, AWS & Top Tech</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="anim-hero-cta flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1 w-full sm:w-auto">
              <button
                onClick={onExploreCourses}
                className="elms-btn-primary !py-3.5 !px-7 !text-sm cursor-pointer group shadow-md"
              >
                <span>Explore Specializations</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                onClick={onOpenLeadModal}
                className="elms-btn-secondary !py-3.5 !px-6 !text-sm cursor-pointer shadow-xs flex items-center justify-center gap-2 group hover:border-[#1a361d]/40"
              >
                <FileText className="w-4 h-4 text-[#2d5c36] group-hover:scale-110 transition-transform" />
                <span>Download Curriculum & Syllabus</span>
              </button>
            </div>

            {/* Trust Microcopy Ledger */}
            <div className="anim-hero-cta pt-2 w-full border-t border-gray-200/80">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left pt-3">
                <div>
                  <div className="text-sm font-bold text-[#1a361d] font-heading flex items-center gap-1">
                    <span>★ 4.9 / 5.0</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">Graduate Satisfaction</div>
                </div>

                <div>
                  <div className="text-sm font-bold text-[#1a361d] font-heading">100% Verifiable</div>
                  <div className="text-[11px] text-gray-500 font-medium">Accredited US Registry</div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <div className="text-sm font-bold text-[#9e4f8f] font-heading font-mono">$99 Deposit</div>
                  <div className="text-[11px] text-gray-500 font-medium">Risk-Free Reservation</div>
                </div>
              </div>

              {/* Cohort Intake Notice */}
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#2d5c36]">
                <span className="w-2 h-2 rounded-full bg-[#40844e]" />
                <span>Spring 2026 Admissions Open · Capped at 25 Fellows Per Cohort</span>
              </div>
            </div>

          </div>

          {/* ============================================================
              RIGHT COLUMN: Layered Visual Composition & Real LMS Cockpit
              ============================================================ */}
          <div
            className="lg:col-span-6 anim-hero-preview w-full relative parallax-layer"
            style={{ transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)` }}
          >
            {/* Ambient Radial Backlight Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#76ff8a]/20 via-[#40844e]/10 to-transparent rounded-3xl blur-2xl -z-10 pointer-events-none" />

            {/* Top-Left Floating Mentor Status Badge */}
            <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#2d5c36]/20 shadow-lg absolute -top-4 -left-3 z-20 animate-float-slow">
              <div className="w-8 h-8 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center font-bold text-xs shrink-0">
                <Users className="w-4 h-4 text-[#2d5c36]" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#1a361d] flex items-center gap-1.5">
                  <span>1-on-1 Faculty Lab</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#40844e] animate-pulse" />
                </div>
                <div className="text-[10px] text-gray-500 font-medium">Thursday Office Hours Booked</div>
              </div>
            </div>

            {/* Top-Right Floating Velocity Metric Badge */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#2d5c36]/20 shadow-lg absolute -top-3 -right-3 z-20 animate-float-drift">
              <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center font-bold text-[11px]">
                ⚡
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold text-[#1a361d]">98.7% Retention</div>
                <div className="text-[9px] text-gray-500 font-mono">Cohort Velocity</div>
              </div>
            </div>

            {/* Bottom-Right Floating Credential Status Badge with Official Gold Seal Asset */}
            <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#2d5c36]/20 shadow-lg absolute -bottom-3 -right-2 z-20 animate-float-delayed">
              <img
                src="/images/gold-seal-medal.webp"
                alt="Gold Medal Seal"
                className="w-8 h-8 object-contain shrink-0 drop-shadow-sm"
              />
              <div className="text-left">
                <div className="text-xs font-bold text-[#1a361d]">Accredited US Diploma</div>
                <div className="text-[10px] font-mono text-[#40844e] font-bold">AFT-CERT-AI9821 Verified</div>
              </div>
            </div>

            {/* Bottom-Left Floating Interactive Cloud Lab Visual Asset */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#2d5c36]/20 shadow-xl absolute -bottom-4 -left-3 z-20 animate-float-slow">
              <div className="w-10 h-9 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700 shadow-inner">
                <img
                  src="/images/floating-laptop-code.webp"
                  alt="Live Code Lab"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#1a361d] flex items-center gap-1.5">
                  <span>Cloud GPU Lab</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="text-[10px] font-mono text-slate-500">PyTorch & Agentic RAG</div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden text-left transition-all duration-300 hover:shadow-2xl relative z-10">
              
              {/* Cockpit Window Header & View Switcher */}
              <div className="bg-[#f8fafc] border-b border-gray-200 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 font-mono text-[11px] text-gray-500 truncate hidden sm:inline">
                      lms.americanfuturetech.com/cockpit
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#d8ffd2] text-[#1a361d] text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2d5c36] animate-pulse" />
                    <span>Live Software Preview</span>
                  </div>
                </div>

                {/* 4 Interactive Segmented Control Tabs */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-gray-200/70 rounded-xl">
                  {cockpitTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white text-[#1a361d] shadow-xs'
                            : 'text-gray-600 hover:text-[#1a361d] hover:bg-white/50'
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
              <div className="p-5 sm:p-6 bg-white min-h-[380px] flex flex-col justify-between">
                
                {/* VIEW 1: STUDENT LMS DASHBOARD */}
                {activeTab === 'lms' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    
                    {/* Visual Fellow Context Banner */}
                    <div className="relative rounded-xl overflow-hidden h-24 border border-gray-200 group">
                      <img
                        src="/images/hero-technologist.jpg"
                        alt="Applied Technology Lab Fellow"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#1a361d]/90 via-[#1a361d]/70 to-transparent flex items-center p-3.5">
                        <div className="text-left space-y-0.5">
                          <span className="px-2 py-0.5 rounded-full bg-[#76ff8a] text-[#1a361d] text-[9px] font-mono font-bold uppercase">
                            Active Academic Term
                          </span>
                          <div className="text-white font-bold text-sm font-heading">Applied AI & Cloud Systems Lab</div>
                          <div className="text-[#d8ffd2] text-[10px]">Cohort Track: Data Science with AI Integration</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1a361d] text-[#fffff2] flex items-center justify-center font-bold text-xs font-heading">
                          EH
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1a361d] font-heading">Ethan Hunt</div>
                          <div className="text-[11px] text-gray-500 font-mono">Fellow ID: AFT-2026-8819</div>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8ffd2] text-[#1a361d] font-bold">
                        Enrolled
                      </span>
                    </div>

                    {/* Active Track Progress Card */}
                    <div className="p-4 rounded-xl bg-[#fffff2] border border-[#2d5c36]/20 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#40844e] uppercase tracking-wider text-[10px] font-heading">
                          Primary Specialization
                        </span>
                        <span className="font-mono text-[#1a361d] font-bold">68% Complete</span>
                      </div>
                      <div className="text-base font-bold text-[#1a361d]">Data Science with AI Integration</div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2d5c36] rounded-full w-[68%]" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                        <span>Current: Module 4 (Agentic RAG & LangGraph)</span>
                        <Link to="/student/login" className="text-[#9e4f8f] font-bold hover:underline flex items-center gap-1">
                          Resume <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Upcoming Cohort Milestones */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="text-[10px] uppercase font-bold text-gray-400">Next Live Lab</div>
                        <div className="font-bold text-[#1a361d] mt-0.5">Saturday, 10:00 AM EST</div>
                        <div className="text-[11px] text-gray-500">Multi-Agent Orchestration</div>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="text-[10px] uppercase font-bold text-gray-400">Faculty Office Hours</div>
                        <div className="font-bold text-[#1a361d] mt-0.5">1-on-1 Code Review</div>
                        <div className="text-[11px] text-[#2d5c36] font-semibold">Booked for Thursday</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW 2: CLASSROOM PLAYER */}
                {activeTab === 'classroom' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="relative aspect-video rounded-xl bg-[#0d170e] border border-[#2d5c36]/40 overflow-hidden flex items-center justify-center group">
                      <img
                        src="/images/fellows-collaborating.jpg"
                        alt="Applied Lab Fellows Collaborating"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                      <div className="w-12 h-12 rounded-full bg-[#9e4f8f] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10 cursor-pointer">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white z-10">
                        <span className="font-semibold text-[11px] truncate">Lesson 4.2: Vector Pipelines & LangGraph Agents</span>
                        <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded font-mono">18:45 / 42:10</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#1a361d]">Unit 4: LangGraph Multi-Agent Workflows</div>
                        <div className="text-[11px] text-gray-500">Hands-on lab repository synced to GitHub</div>
                      </div>
                      <button
                        onClick={() => setLessonCompleted(!lessonCompleted)}
                        className={`px-3 py-1.5 rounded-full font-bold text-xs transition-colors cursor-pointer ${
                          lessonCompleted
                            ? 'bg-[#d8ffd2] text-[#1a361d]'
                            : 'bg-[#2d5c36] text-white hover:bg-[#1a361d]'
                        }`}
                      >
                        {lessonCompleted ? '✓ Completed' : 'Mark Complete'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                      <span>Prerequisites: Python 3.12, Vector Databases</span>
                      <span className="font-mono text-[#2d5c36] font-semibold">HD 1080p Recorded Lab</span>
                    </div>
                  </div>
                )}

                {/* VIEW 3: VERIFIED CREDENTIAL */}
                {activeTab === 'credential' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-5 rounded-xl bg-[#fffdfa] border-2 border-[#1a361d]/15 shadow-sm text-center space-y-2.5 shimmer-active relative">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-[#1a361d]">AFT-CERT-AI9821</span>
                        <span className="px-2 py-0.5 rounded bg-[#d8ffd2] text-[#1a361d] font-bold text-[10px]">
                          VERIFIED AUTHENTIC
                        </span>
                      </div>

                      <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold pt-1">
                        The American Institute of Applied Emerging Technology
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-1">
                        <img
                          src="/images/gold-seal-medal.webp"
                          alt="Official Gold Seal Medal"
                          className="w-12 h-12 object-contain drop-shadow-md shrink-0 animate-float-slow"
                        />
                        <div>
                          <div className="text-xl font-bold font-heading text-[#1a361d]">Ethan Hunt</div>
                          <div className="text-xs text-gray-600">has successfully defended and completed the 6-month fellowship in</div>
                          <div className="text-sm font-bold text-[#2d5c36]">Data Science with AI Integration</div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
                        <span>Sheridan, WY Charter</span>
                        <Link
                          to="/certificate/AFT-CERT-AI9821"
                          className="text-[#9e4f8f] font-bold hover:underline inline-flex items-center gap-1"
                        >
                          Public Ledger Link <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    <div className="text-center text-xs text-gray-500">
                      Instantly shareable to LinkedIn, GitHub, and prospective employer HR portals.
                    </div>
                  </div>
                )}

                {/* VIEW 4: ADMIN TELEMETRY */}
                {activeTab === 'admin' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="text-[10px] uppercase font-bold text-gray-400">Total Enrolled Fellows</div>
                        <div className="text-2xl font-bold text-[#1a361d] font-heading mt-0.5">142</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">+18 this month</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="text-[10px] uppercase font-bold text-gray-400">Graduation Rate</div>
                        <div className="text-2xl font-bold text-[#1a361d] font-heading mt-0.5">94.2%</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Industry benchmark 45%</div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#fffff2] border border-[#2d5c36]/20 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-[#1a361d]">
                        <span>Active Admissions Pipeline</span>
                        <span className="font-mono text-[#40844e]">42 Open Inquiries</span>
                      </div>
                      <div className="text-[11px] text-gray-600">
                        Spring 2026 Cohorts: Data Science (23/25 filled), Cyber Security (19/25 filled).
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-gray-500">Enterprise Control Plane v2.4</span>
                      <Link to="/admin/login" className="text-[#1a361d] font-bold hover:underline flex items-center gap-1">
                        Admin Login <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Cockpit Universal Footer */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#40844e]" />
                    Real Production Architecture
                  </span>
                  <Link
                    to="/student/login"
                    className="text-[#2d5c36] font-bold hover:underline flex items-center gap-1"
                  >
                    Open Student Portal <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
