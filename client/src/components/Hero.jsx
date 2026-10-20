import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Pause,
  Play,
  Users,
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

// The promo clip that ships with the site (client/public/videos/hero.mp4). It
// plays in the cockpit's Flagship Studio frame in place of the photograph;
// Admin → Settings → Homepage Hero → "Homepage Video URL" overrides it.
const BUNDLED_HERO_VIDEO = '/videos/hero.mp4';
// The clip's own first frame, so the frame is never black while the file is
// still arriving. It is only used for the bundled clip: a URL pasted in the CMS
// gets no poster rather than a frozen frame from a different video.
const BUNDLED_HERO_POSTER = '/videos/hero-poster.jpg';

// The graduation photograph the client chose for the top of the home page. It
// is the section's own background now (not a card): a wide crop for desktop and
// a portrait crop so narrow screens are not squeezed into an unreadable sliver
// (see scratch/build-hero-banner.py).
const HERO_BANNER_IMG = '/images/hero-graduation.jpg';
// Phone crop: square, framed from the thrown caps down to the gowns, so the
// faces land at ~24-59% of the frame and the copy can start right below them.
const HERO_BANNER_IMG_PHONE = '/images/hero-graduation-phone.jpg';

import { useSiteSettings } from '../context/SiteSettingsContext';
import { formatSeatDeposit } from '../lib/seatDeposit';
import useAlwaysPlayingVideo from '../hooks/useAlwaysPlayingVideo';

export default function Hero({ onOpenLeadModal, onExploreCourses }) {
  const { settings } = useSiteSettings();
  const heroData = settings?.hero || {};
  // Settings → Deposit: the hero ledger and the fallback CTA label print the
  // amount the checkout charges, not a typed-in constant.
  const depositAmount = formatSeatDeposit(settings);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // The client's promo clip fills the Flagship Studio frame — the first thing a
  // visitor looks at — and the studio photograph becomes the fallback.
  //   • a URL/path      → that file plays;
  //   • empty string    → the CMS value was cleared, so the photo returns;
  //   • undefined       → an older server that predates the setting, so the
  //                       bundled clip plays rather than an empty frame.
  const heroVideoUrl = heroData.videoUrl === undefined
    ? BUNDLED_HERO_VIDEO
    : String(heroData.videoUrl || '').trim();
  // The clip must be moving the moment the frame appears and must keep moving
  // whenever the visitor comes back to the tab (see the hook for why
  // `autoPlay` on its own does not manage that).
  const {
    videoRef: heroVideoRef,
    isPlaying: heroVideoPlaying,
    toggle: toggleHeroVideo,
  } = useAlwaysPlayingVideo(heroVideoUrl);
  const heroVideoPoster = heroVideoUrl === BUNDLED_HERO_VIDEO ? BUNDLED_HERO_POSTER : '';

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
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/60 to-transparent dark:from-[rgb(var(--tw-ink-950))] dark:via-[rgb(var(--tw-ink-950)/55%)] lg:hidden" />

          {/* Desktop scrim: it has one job — hold the copy's contrast — so it
              stays near 0.9 across the editorial column and then falls away to
              nothing. The earlier version still held 0.55 white at the right
              edge, and the bottom rise below stacked on top of it, putting
              ~95% white over the lower right of the frame: that is where the
              graduates are, so the photograph read as a blank panel.

              Every stop is written as an arbitrary opacity — `from-white/92`
              and friends compiled to nothing, because Tailwind's `/n` modifier
              only accepts the values on its own opacity scale (multiples of 5).
              Without them this div was a plain white-to-transparent wash, which
              is why the body copy sat on bare photograph and greyed out. */}
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-white/[0.86] from-0% via-white/[0.76] via-[58%] to-transparent to-[88%] dark:from-slate-950/[0.93] dark:via-slate-950/[0.84] dark:to-slate-950/[0.55]" />
          {/* The copy's lower half — trust ledger and intake line — sits over
              the black gowns, where a light veil is not enough for 11px type,
              so this rise carries those two blocks. It is masked off across the
              right half of the frame on purpose: that is where the faces are,
              and a full-width rise is exactly what blanked them. */}
          <div className="hidden lg:block absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-white from-0% via-white/[0.62] via-[45%] to-transparent [mask-image:linear-gradient(to_right,black_0%,black_52%,transparent_78%)] dark:from-[rgb(var(--tw-ink-950))] dark:via-[rgb(var(--tw-ink-950))]/[0.62]" />
          {/* A short full-width fade, so the photograph's bottom edge still
              dissolves into the section's own aurora wash instead of ending on
              a hard line. Deliberately short: only gowns live down here. */}
          <div className="hidden lg:block absolute inset-x-0 bottom-0 h-[9%] bg-gradient-to-t from-white to-transparent dark:from-[rgb(var(--tw-ink-950))]" />
        </div>
      </div>

      {/* Background Architectural Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f108_1px,transparent_1px),linear-gradient(to_bottom,#6366f108_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-6 items-center">
          
          {/* ============================================================
              LEFT COLUMN: Editorial Typography & Strategic Positioning

              `lg:self-start` overrides the grid's `items-center`. The right
              column (LMS cockpit) is ~350px taller than this copy, so centring
              used to push the badge ~170px down the page and leave a band of
              empty white between the navbar and the eyebrow badge on load.
              The copy now starts on the same line as the cockpit's floating
              badges, so the headline is above the fold instead of below a gap.
              ============================================================ */}
          <div className="lg:col-span-6 lg:self-start relative z-10 pt-[58vw] sm:pt-0 space-y-4 text-left">

            {/* ============================================================
                PHONE BAND (< sm): the copy reads ON the photograph.

                The photo is the column's own background for its top part: the
                column's padding-top is the space the photo gets to itself
                (clear of the badge), and the copy then sits on its veiled lower
                half. It is full-bleed (the section's padding is cancelled) and
                starts exactly at the header's lower edge — the header is
                `fixed`, so anything above that line is hidden behind it (see
                the offset note on the band itself). A negative z-index keeps
                the band behind the copy while staying inside the column's
                stacking context.
                ============================================================ */}
            {/* The band sits exactly at the header's lower edge — no negative
                margin. It used to carry `-mt-8`, which pulled the top 16px of the
                crop behind the fixed header; the portrait crop only leaves ~6%
                headroom above the crowns, so those 16px were the graduates'
                heads being cut off (the client's circled screenshot). Measured at
                390x844 the column's own top IS the header's edge, so the band
                simply starts there and the whole photograph is on screen. */}
            <div
              className="anim-hero-banner sm:hidden -z-10 absolute inset-x-0 top-0 -mx-4 h-[calc(58vw_+_272px)] overflow-hidden pointer-events-none bg-[url('/images/hero-graduation-phone.jpg')] bg-cover bg-top bg-no-repeat sm:bg-none"
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
                  ships multiples of 5 only, so `to-76%` compiles to nothing.

                  It needs a dark variant too: written once in white it ended the
                  band in `#ffffff` over the ink section, and in dark mode the
                  last headline line then sat white-on-white. The dark curve ends
                  on #001845 — the colour the section's own aurora ink starts at. */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0.10)_40%,rgba(255,255,255,0.42)_54%,rgba(255,255,255,0.55)_75%,rgba(255,255,255,0.68)_94%,#ffffff_100%)] dark:bg-[linear-gradient(to_bottom,rgba(0,24,69,0)_0%,rgba(0,24,69,0.30)_40%,rgba(0,24,69,0.60)_54%,rgba(0,24,69,0.72)_75%,rgba(0,24,69,0.84)_94%,#001845_100%)]" />
            </div>

            {/* Staggered Eyebrow Badge */}
            <div className="anim-hero-eyebrow">
              <div className="section-eyebrow section-eyebrow-on-photo shadow-xs">
                <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-blue-500 pulse-mint-dot" />
                <span className="min-w-0 break-words">
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
                <span>{heroData.primaryCtaText || `Reserve Your Seat — ${depositAmount}`}</span>
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
                  <div className="text-sm font-bold text-gold-700 dark:text-gold-300 font-heading font-mono">{depositAmount} Deposit</div>
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

            {/* The two credential pins that used to hang off the panel's lower
                corners (Cloud GPU Lab / Accredited US Diploma) are gone: the clip
                is the panel's full width now, so they only sat on top of the
                caption. The upper two pins stay — they label the fellowship and
                the track without covering any video. */}

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

                        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-left relative z-10">
              {/* The hero is the client's promo clip and nothing else.

                  On the live page the clip sat inside a fake browser window: a
                  traffic-light + URL header, a "Live Product Ecosystem" chip, a
                  five-view tab strip, a row of three info tiles and a Reserve /
                  Browse button pair underneath. Every one of those was marked out
                  and asked to go ("sirf video dekhe"), along with the four other
                  tab views that only that strip could reach — see git history if
                  they are ever wanted back.

                  What is left is the panel's full width as a true 16:9 rectangle.
                  The clip is 1080x608 (already 1.78:1), so `object-cover` in this
                  frame shows every pixel with no letterboxing and no side-cropping,
                  and it renders larger than the old tall 9:5 box ever could. */}
              <div className="relative w-full aspect-video bg-slate-950">
                {heroVideoUrl ? (
                  <video
                    ref={heroVideoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    src={heroVideoUrl}
                    poster={heroVideoPoster || undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    disablePictureInPicture
                    disableRemotePlayback
                    aria-label="Promo clip: instructors and fellows inside a live American FutureTech cohort session"
                  />
                ) : (
                  /* No clip configured in the CMS: the studio photograph keeps the
                     same 16:9 shape, so the panel is never an empty black box.
                     `block h-full` matters on an inline <picture>: without it the
                     image's `h-full` resolves to auto and the photo grows past the
                     frame instead of filling it. */
                  <picture className="block h-full">
                    <source media="(min-width: 1024px)" srcSet={HERO_WORKSPACE_IMG} />
                    <img
                      src={HERO_WORKSPACE_IMG_TALL}
                      alt="A professional working on a laptop — American FutureTech fellows train for exactly this work"
                      width="1300"
                      height="1721"
                      loading="eager"
                      fetchpriority="high"
                      decoding="async"
                      className="w-full h-full object-cover object-[50%_40%] sm:object-[50%_16%] lg:object-[50%_50%]"
                    />
                  </picture>
                )}

                {/* Scrim + caption: the clip fills the panel edge to edge now, so
                    the caption needs the gradient to stay readable over any frame.
                    Both are pointer-events-none so they cannot swallow clicks. */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 pointer-events-none">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                      Live Silicon Valley Ecosystem
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30 text-[10px] font-mono font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      Active Cohort
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-lg sm:text-2xl font-heading drop-shadow-lg">
                    American FutureTech Innovation Lab
                  </h3>
                  <p className="text-slate-200 text-xs sm:text-sm mt-1 max-w-lg">
                    Enterprise cloud environments, dedicated workstations, and live 1-on-1 faculty coaching.
                  </p>
                </div>

                {/* Pause / play — the clip loops, so WCAG 2.2.2 asks for a visible
                    way to stop the motion. */}
                {heroVideoUrl && (
                  <button
                    type="button"
                    onClick={toggleHeroVideo}
                    aria-label={heroVideoPlaying ? 'Pause the hero video' : 'Play the hero video'}
                    className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  >
                    {heroVideoPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
</div>
          </div>

        </div>
      </div>
    </section>
  );
}
