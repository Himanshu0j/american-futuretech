import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Pause, Play, Radio, Target, Users, Video } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

/**
 * Homepage video showcase — the dark band that sits directly under the hero.
 *
 * The client's promo clip is a phone recording (1080×1920), so it is shown in a
 * portrait device-style frame instead of being cropped into a landscape banner.
 * The copy column gives the frame the context a bare video lacks: what a live
 * cohort is, and what the visitor gets out of one.
 *
 * This band is OPTIONAL and off by default (Section Visibility → "2. Homepage
 * Video Showcase"): the hero cockpit's own Flagship Studio frame plays the same
 * clip, so showing it here as well is a deliberate choice, not the default.
 *
 * Video source — Admin → Settings → Homepage Hero → "Homepage Video URL":
 *   • a URL/path → that file plays;
 *   • empty → the band is removed entirely;
 *   • field missing (an older server that predates the setting) → the bundled
 *     /videos/hero.mp4 plays, so an un-updated deploy still shows the clip.
 *
 * Accessibility: the clip autoplays muted (as every social feed does), but it
 * respects `prefers-reduced-motion` — those visitors get a frozen first frame —
 * and there is always a visible pause/play control, which WCAG 2.2.2 asks for
 * from any moving content that loops for more than five seconds.
 */

// Bundled master, shipped in this repo at client/public/videos/hero.mp4.
const BUNDLED_VIDEO = '/videos/hero.mp4';

const HIGHLIGHTS = [
  {
    icon: Radio,
    title: 'Live instruction, every weekend',
    copy: 'Instructors teach in real time with the cohort on camera — not a lecture archive.',
  },
  {
    icon: Users,
    title: 'Cohorts, not crowds',
    copy: 'Small groups, a dedicated mentor, and a career advisor who knows your name.',
  },
  {
    icon: Target,
    title: 'Outcome-built curriculum',
    copy: 'Every module ends in something you can show an employer: code, capstones, credentials.',
  },
];

export default function HomeVideoShowcase() {
  const { settings } = useSiteSettings();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const hero = settings?.hero || {};
  const configured = hero.videoUrl;
  const videoUrl = configured === undefined ? BUNDLED_VIDEO : String(configured || '').trim();

  // Reduced-motion visitors keep the first frame instead of a moving loop.
  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      node.pause();
      setIsPlaying(false);
    }
  }, [videoUrl]);

  if (!videoUrl) return null;

  const togglePlayback = () => {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) {
      const attempt = node.play();
      if (attempt?.catch) attempt.catch(() => {});
      setIsPlaying(true);
    } else {
      node.pause();
      setIsPlaying(false);
    }
  };

  const exploreText = hero.secondaryCtaText || 'Explore Programs';
  const exploreLink = hero.secondaryCtaLink || '/courses';
  const statsBadge = hero.statsBadgeText || '1,200+ Fellows Placed';

  return (
    <section
      id="home-showcase"
      aria-label="Inside a live American FutureTech cohort"
      className="relative overflow-hidden bg-aurora-ink text-white px-4 sm:px-6 lg:px-8 py-14 sm:py-20"
    >
      {/* Hairlines so the dark band reads as a deliberate chapter, not a gap */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_minmax(0,36rem)]">
        {/* ── Copy column ─────────────────────────────────────────────── */}
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
            <Video className="w-3.5 h-3.5 text-[color:rgb(var(--tw-gold-400))]" />
            Inside the Fellowship
          </span>

          {/* `text-white` is explicit on purpose: index.css paints every h1–h6
              with --ink-900, and only a utility on the element itself wins. */}
          <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.6rem] lg:leading-[1.12]">
            This is what a{' '}
            <span className="text-[color:rgb(var(--tw-gold-400))]">live cohort</span> looks like.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-[15px] lg:mx-0">
            Not a lecture archive. Real instructors, real weekend sessions, and fellows building
            capstones they can put in front of a hiring manager.
          </p>

          <ul className="mx-auto mt-8 max-w-xl space-y-4 text-left">
            {HIGHLIGHTS.map(({ icon: Icon, title, copy }) => (
              <li key={title} className="flex items-start gap-3.5">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-[color:rgb(var(--tw-gold-400))]">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{title}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-slate-400">{copy}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 lg:justify-start">
            <Link
              to={exploreLink}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-[color:rgb(var(--tw-ink-900))] shadow-premium transition-colors hover:bg-slate-100"
            >
              {exploreText}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-[color:rgb(var(--tw-gold-400))]" />
              {statsBadge}
            </span>
          </div>
        </div>

        {/* ── Video column: the promo clip in a cinema-style frame ─────
            The client clip is a landscape recording (1920×1080) exported into a
            vertical 1080×1920 canvas with pure-black bars top and bottom. The
            frame is 9:5 — the exact shape of the footage inside those bars —
            and `object-cover` then crops the bars away, so the clip fills the
            card edge to edge instead of showing a strip of video inside an
            otherwise black phone screen. */}
        <figure className="relative m-0">
          <div className="relative mx-auto w-full max-w-xl">
            {/* Brand-blue glow so the frame floats off the dark band */}
            <div
              aria-hidden="true"
              className="absolute -inset-8 rounded-[3rem] bg-[rgb(var(--tw-blue-700)/40%)] blur-[56px]"
            />
            {/* Halo ring */}
            <div
              aria-hidden="true"
              className="absolute -inset-2 rounded-[2rem] bg-gradient-to-b from-white/20 via-white/5 to-transparent"
            />

            <div className="relative rounded-[1.75rem] border border-white/20 bg-[rgb(var(--tw-ink-950))] p-2.5 shadow-premium">
              <div className="relative overflow-hidden rounded-[1.25rem] bg-black">
                <video
                  ref={videoRef}
                  className="block h-auto w-full aspect-[9/5] object-cover"
                  src={videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  disablePictureInPicture
                  disableRemotePlayback
                  aria-label="Short clip recorded inside an active American FutureTech cohort"
                />

                {/* Top chrome: live badge */}
                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center p-3 bg-gradient-to-b from-black/60 to-transparent">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--tw-gold-500))] animate-pulse" />
                    Live cohort footage
                  </span>
                </div>

                {/* Bottom scrim + caption */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/75 via-black/30 to-transparent">
                  <p className="text-[13px] font-semibold text-white">Inside an active fellowship</p>
                  <p className="mt-0.5 text-[11px] text-slate-300">Real sessions. Real mentors. No scripts.</p>
                </div>

                {/* Pause / play — WCAG 2.2.2 for looping motion */}
                <button
                  type="button"
                  onClick={togglePlayback}
                  aria-label={isPlaying ? 'Pause the showcase video' : 'Play the showcase video'}
                  className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <figcaption className="mt-4 text-center text-[11px] text-slate-400">
            Recorded live inside an American FutureTech cohort.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
