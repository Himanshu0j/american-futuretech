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
// Remote working professionals on the job — served from /public so the photo is
// not bundled into the JS chunk, and cropped to this card's own aspect ratio (see
// scratch/build-hero-image.py) so `object-cover` never eats the subject.
const HERO_WORKSPACE_IMG = '/images/hero-innovator.jpg';
const HERO_WORKSPACE_IMG_TALL = '/images/hero-innovator-tall.jpg';

// The graduation photograph the client chose for the top of the home page. It
// is the section's own background now (not a card): a wide crop for desktop and
// a portrait crop so narrow screens are not squeezed into an unreadable sliver
// (see scratch/build-hero-banner.py).
const HERO_BANNER_IMG = '/images/hero-graduation.jpg';
// Phone crop: square, framed from the thrown caps down to the gowns, so the
// faces land at ~24-59% of the frame and the copy can start right below them.
const HERO_BANNER_IMG_PHONE = '/images/hero-graduation-phone.jpg';

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
    <section className="relative pt-8 sm:pt-12 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8 bg-aurora-light dark:bg-aurora-ink overflow-hidden">

      {/* ============================================================
          BANNER: the client's graduation photograph, one layer per layout.

          Phones draw it inside the editorial column, so the copy reads ON the
          photograph (see the phone band below). Tablets get a real banner block
          in the flow, and from `lg` this element becomes the section's
          full-bleed background with the copy on top of it.

          Each layout loads exactly one crop. Both halves of that are load-bearing:
          the wide crop is lazy so phones skip it, and the square crop is a CSS
          background that `sm:bg-none` removes above the phone breakpoint (an
          <img> would be downloaded at every width, display:none or not).
          ============================================================ */}
      {/* Hidden on phones: there the photo is the copy's own background instead
          (see the phone band inside the editorial column). */}
      <div className="hidden sm:block relative z-10 -mx-4 sm:-mx-6 -mt-8 sm:-mt-12 mb-7 lg:absolute lg:inset-0 lg:z-0 lg:m-0 lg:pointer-events-none">
        <div className="relative h-[19rem] overflow-hidden lg:h-full">
          {/* Tablet band: the wide crop, anchored to its bottom edge so the
              laughing faces sit mid-frame with the gowns running off the lower
              edge instead of a strip of empty sky above them. */}
          <img
            src={HERO_BANNER_IMG}
            alt="American FutureTech graduates celebrating at commencement"
            width="1920"
            height="1080"
            fetchpriority="high"
            decoding="async"
            // A hidden <img> is still downloaded, so without this every phone
            // would fetch the wide crop on top of its own square one. Lazy is
            // enough: from `sm` up the band is on screen at load, so it fetches
            // immediately, and below `sm` it has no layout box at all.
            loading="lazy"
            // The photo is not a still backdrop: it opens (fade + a 7% settle)
            // and then breathes on a 30s loop, which is the animation the copy
            // is timed against below (`.anim-hero-banner`, index.css).
            className="anim-hero-banner w-full h-full object-cover object-[50%_100%] lg:object-[50%_28%]"
          />

          {/* Phone/tablet: a short rise that hides the photo's bottom edge
              without veiling the graduates' faces. */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/60 to-transparent dark:from-[#001845] dark:via-[#001845]/55 lg:hidden" />

          {/* Desktop scrim: heavier behind the copy, easing off on the right so
              the photograph still reads as a photograph. Keeps the page's light
              aesthetic in light mode and its ink aesthetic in dark mode.

              Every stop is written as an arbitrary opacity — `from-white/92`
              and friends compiled to nothing, because Tailwind's `/n` modifier
              only accepts the values on its own opacity scale (multiples of 5).
              Without them this div was a plain white-to-transparent wash, which
              is why the body copy sat on bare photograph and greyed out. */}
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-white/[0.94] via-white/[0.84] to-white/[0.55] dark:from-slate-950/[0.95] dark:via-slate-950/[0.88] dark:to-slate-950/[0.72]" />
          {/* On desktop the trust ledger and the intake line sit over the gowns
              and caps, where a 55%-white veil is not enough for the smaller
              type. This taller bottom rise carries them and doubles as the fade
              into the section's own aurora wash, so the banner has no hard seam
              against the sections below. */}
          <div className="hidden lg:block absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-white from-[5%] via-white/[0.88] via-[45%] to-transparent dark:from-[#001845] dark:via-[#001845]/[0.88]" />
        </div>
      </div>

      {/* Background Architectural Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f108_1px,transparent_1px),linear-gradient(to_bottom,#6366f108_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-6 items-center">
          
          {/* ============================================================
              LEFT COLUMN: Editorial Typography & Strategic Positioning
              ============================================================ */}
          <div className="lg:col-span-6 relative z-10 pt-[58vw] sm:pt-0 space-y-4 text-left">

            {/* ============================================================
                PHONE BAND (< sm): the copy reads ON the photograph.

                The photo is the column's own background for its top part, so
                no fixed offset is needed: the column's padding-top is the
                space the photo gets to itself (clear of the badge), and the
                copy then sits on its veiled lower half. It is full-bleed (the
                section's padding is cancelled) and pulled up under the header,
                and a negative z-index keeps it behind the copy while staying
                inside the column's stacking context.
                ============================================================ */}
            <div
              className="anim-hero-banner sm:hidden -z-10 absolute inset-x-0 top-0 -mx-4 -mt-8 h-[calc(58vw_+_272px)] overflow-hidden pointer-events-none bg-[url('/images/hero-graduation-phone.jpg')] bg-cover bg-top bg-no-repeat sm:bg-none"
              aria-hidden="true"
            >
              {/* The band's height is tied to the copy rather than to a fixed
                  vw figure: 58vw is the run the crop gives the faces (which is
                  what the badge's own padding-top is), and 272px carries the
                  badge, the four-line headline and a little air. A plain 130vw
                  happened to fit at 390 but not on a 320px phone, where the
                  copy is the same number of pixels and the band is a fifth
                  shorter — the last line fell off the photograph. The crop is
                  cut to this ratio (scratch/build-hero-banner.py), so
                  `bg-cover` has almost nothing left to crop. */}
              {/* The veil is clear over the caps and faces, keeps the gowns
                  visible behind the copy (a mid wash, so the photograph is never
                  lost), and only dissolves to white across the band's last few
                  percent, where the section's own wash takes over.

                  Written as one arbitrary gradient on purpose: the tuned curve
                  needs six stops, and Tailwind's `from`/`via`/`to` utilities
                  carry only three. The named stop scale is also a trap here — it
                  ships multiples of 5 only, so `to-76%` compiles to nothing. */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0.10)_40%,rgba(255,255,255,0.42)_54%,rgba(255,255,255,0.55)_75%,rgba(255,255,255,0.68)_94%,#ffffff_100%)]" />
            </div>

            {/* Staggered Eyebrow Badge */}
            <div className="anim-hero-eyebrow">
              <div className="section-eyebrow section-eyebrow-on-photo shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 pulse-mint-dot" />
                <span>
                  {heroData.eyebrowBadgeText || heroData.eyebrow || 'AMERICAN FUTURETECH · 6-MONTH CAREER TRAINING & FELLOWSHIPS'}
                </span>
              </div>
            </div>

            {/* Editorial Agency-Grade Headline */}
            <div className="anim-hero-heading space-y-2">
              <h1 className="text-[34px] sm:text-5xl lg:text-[56px] font-black text-ink-900 dark:text-white tracking-[-0.03em] leading-[1.06] font-heading whitespace-pre-line text-balance">
                {heroData.headline ? (
                  heroData.headline
                ) : (
                  <>
                    BUILD HIGH-VALUE SKILLS.<br />
                    <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-blue-600 bg-clip-text text-transparent dark:from-brand-400 dark:to-blue-400">
                      GET US CERTIFIED.
                    </span>
                    <br />
                    LAUNCH YOUR CAREER.
                  </>
                )}
              </h1>
            </div>

            {/* Supporting Editorial Paragraph */}
            {/* One notch darker than the page's default body grey on phones: the
                first lines land on the tail of the phone band's photograph, where
                slate-700 measured 4.41:1 and slate-800 clears it comfortably. */}
            <p className="anim-hero-body text-base sm:text-lg text-slate-800 dark:text-slate-100 max-w-xl font-normal leading-relaxed">
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
                <div className="inline-flex h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-800 bg-blue-900 text-blue-200 font-bold text-[10px] items-center justify-center shadow-2xs font-mono">
                  +1.2K
                </div>
              </div>
              <div className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <span>{heroData.statsBadgeText || '1,200+ Fellows Placed'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                </div>
                {/* One notch darker than the plain page styles: over the banner
                    photograph those small labels have to carry their own
                    contrast instead of relying on a flat white background. */}
                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-normal">Hired at Google, Microsoft, AWS & Fortune 500</div>
              </div>
            </div>

            {/* Dual High-Impact Action Buttons */}
            <div className="anim-hero-cta flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 w-full sm:w-auto">
              <Link
                to={heroData.primaryCtaLink || '/checkout?tier=deposit'}
                className="elms-btn-gold sheen overflow-hidden !py-4 !px-8 !text-sm cursor-pointer group !rounded-xl flex items-center justify-center gap-2"
              >
                <span>{heroData.primaryCtaText || 'Reserve Your Seat — $99'}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              <Link
                to={heroData.secondaryCtaLink || '/jobs'}
                className="elms-btn-secondary !py-3.5 !px-7 !text-sm cursor-pointer shadow-xs flex items-center justify-center gap-2 group hover:border-blue-500/40"
              >
                <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span>{heroData.secondaryCtaText || 'Explore Live Jobs'}</span>
              </Link>
            </div>

            {/* Trust Microcopy Ledger */}
            <div className="anim-hero-cta pt-5 w-full border-t border-hairline dark:border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left pt-2">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-heading flex items-center gap-1">
                    <span>★ 4.9 / 5.0</span>
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Graduate Satisfaction</div>
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-heading">100% Verifiable</div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Accredited US Registry</div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <div className="text-sm font-bold text-gold-700 dark:text-gold-300 font-heading font-mono">$99 Deposit</div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Risk-Free Reservation</div>
                </div>
              </div>

              {/* Cohort Intake Notice */}
              <div className="mt-3.5 flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
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
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/20 via-blue-500/10 to-transparent rounded-3xl blur-2xl -z-10 pointer-events-none" />

            {/* Top-Left Floating Mentor Status Badge */}
            <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg absolute -top-1 -left-3 z-20 animate-float-slow">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>1-on-1 Faculty Mentorship</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Silicon Valley Faculty Active</div>
              </div>
            </div>

            {/* Top-Right Floating Velocity Metric Badge */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg absolute -top-1 -right-3 z-20 animate-float-drift">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px]">
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
                <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">AFT-CERT-AI9821 Verified</div>
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
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
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
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 p-1 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
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
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold">
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
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <span className="ml-2 font-mono text-[11px] text-slate-500 truncate hidden sm:inline">
                      lms.americanfuturetech.com/cockpit
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[10px] font-bold border border-blue-200 dark:border-blue-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
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
                        type="button"
                        // The label is visually hidden below the `sm` breakpoint, which
                        // left these icon-only buttons with no accessible name. The
                        // aria-label keeps them announced at every width.
                        aria-label={tab.label}
                        aria-pressed={isActive}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-white/50'
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
                    {/* This photo is the first thing a visitor looks at, so it is
                        deliberately the largest element in the cockpit: a tall,
                        full-bleed frame instead of the old 240px strip. */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-xl group bg-slate-950">
                      {/* Below `lg` the frame is taller than it is wide, so the
                          portrait crop is used; from `lg` the card is wider and
                          the 1.16:1 crop fits without cropping the subject. */}
                      <picture>
                        <source media="(min-width: 1024px)" srcSet={HERO_WORKSPACE_IMG} />
                        <img
                          src={HERO_WORKSPACE_IMG_TALL}
                          alt="A professional working on a laptop — American FutureTech fellows train for exactly this work"
                          width="1300"
                          height="1721"
                          loading="eager"
                          // Lowercase on purpose: React 18.3 does not map
                          // `fetchPriority` and warns about the camelCase prop.
                          fetchpriority="high"
                          decoding="async"
                          className="w-full h-[22rem] sm:h-[26rem] lg:h-[30rem] object-cover object-[50%_46%] group-hover:scale-[1.03] transition-transform duration-700"
                        />
                      </picture>
                      {/* Soft, bottom-anchored scrim: the photo carries the section,
                          so the gradient only exists to keep the caption legible. */}
                      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
                      <div className="absolute inset-0 flex flex-col justify-end p-5">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                            Live Silicon Valley Ecosystem
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            Active Cohort
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-xl sm:text-2xl font-heading drop-shadow-lg">
                          American FutureTech Innovation Lab
                        </h3>
                        <p className="text-slate-200 text-xs sm:text-sm mt-1 max-w-md">
                          Enterprise cloud environments, dedicated workstations, and live 1-on-1 faculty coaching.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">Tuition Model</div>
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">$99 Reservation</div>
                        <div className="text-[10px] text-slate-500">Refundable deposit</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">Curriculum</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">6-Month Training</div>
                        <div className="text-[10px] text-slate-500">Or 1-on-1 Track</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">Placement</div>
                        <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mt-0.5">Live Job Board</div>
                        <div className="text-[10px] text-slate-500">Direct hiring pipeline</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        to="/checkout?tier=deposit"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
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
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-mono font-bold uppercase">
                            Active Academic Term
                          </span>
                          <div className="text-white font-bold text-sm font-heading">Applied AI & Cloud Systems Lab</div>
                          <div className="text-blue-200 text-[10px]">Cohort Track: 6-Month AI Systems & Cloud</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                          EH
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">Ethan Hunt</div>
                          <div className="text-[10px] text-slate-500 font-mono">Fellow ID: AFT-2026-8819</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                        Enrolled
                      </span>
                    </div>

                    <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Primary Specialization:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">68% Complete</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        6-Month Career Track: Data Science with AI Integration
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full w-[68%]" />
                      </div>
                      <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500">
                        <span>Current: Module 4 (Agentic RAG & LangGraph)</span>
                        <Link to="/courses/data-science-with-ai-integration" className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
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
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Booked for Thursday</div>
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
                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
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
                        <span className="text-blue-400">Python 3.11</span>
                      </div>
                      <div className="text-blue-400">import torch, vllm</div>
                      <div className="text-slate-300">from langchain.agents import initialize_agent</div>
                      <div className="text-slate-400"># Model initialized with FlashAttention-2</div>
                      <div className="text-blue-300">agent = initialize_agent(tools, llm, verbose=True)</div>
                    </div>

                    <button
                      onClick={() => setLessonCompleted(!lessonCompleted)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                        lessonCompleted
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
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
                        <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>US Institute Diploma</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroCredView('microsoft')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 text-[11px] ${
                          heroCredView === 'microsoft'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Microsoft Certified</span>
                      </button>
                    </div>

                    {heroCredView === 'us' ? (
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-800 dark:via-slate-850 dark:to-blue-950/30 border-2 border-blue-500/20 text-center relative overflow-hidden shadow-inner">
                        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-2.5 mb-3">
                          <div className="text-left">
                            <div className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-widest font-heading">
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
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 font-heading mt-0.5">
                          Applied Artificial Intelligence & Machine Learning Systems
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-[9px] font-mono text-slate-500">
                          <span>ID: AFT-CERT-AI9821</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">STATUS: ACCREDITED</span>
                          <span>ISSUED: 2026</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-slate-900 border-2 border-blue-500/30 text-center relative overflow-hidden shadow-inner space-y-2.5">
                        <div className="relative rounded-xl overflow-hidden border border-blue-400/40 bg-white max-h-40 flex items-center justify-center">
                          <img
                            src="/images/certificates/ms-cert-sc100.png"
                            alt="Microsoft Certified SC-100"
                            className="w-full h-auto max-h-36 object-contain"
                          />
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-blue-900/90 text-blue-200 text-[9px] font-mono font-bold">
                            SC-100 EXPERT
                          </div>
                        </div>

                        <div className="text-left space-y-0.5 px-1">
                          <div className="text-xs font-bold text-white font-heading truncate">
                            Microsoft Certified: Cybersecurity Architect Expert
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Conferred to: Ethan Hunt</span>
                            <span className="text-blue-400 font-bold">VERIFIED ACTIVE</span>
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
                      <span className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold font-mono">
                        98.7% Retention
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 font-mono">AVERAGE COMPLETION</div>
                        <div className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">84.2%</div>
                        <div className="text-[10px] text-slate-500">Across 6 flagship labs</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 font-mono">PLACEMENT VELOCITY</div>
                        <div className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">89%</div>
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
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Launch Staff Admin Console</span>
                    </Link>
                  </div>
                )}

                {/* Footer Software Assurance */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
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
