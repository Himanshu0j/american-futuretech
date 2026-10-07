import React from 'react';
import { Sparkles } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { resolveSiteImages } from '../data/siteImages';

/**
 * The sliding brand band.
 *
 * This replaced the "Life at American FutureTech" photo showcase: the client
 * asked for the pictures to come off the homepage and for the company name to
 * run across that space instead.
 *
 * Two tracks slide in opposite directions — the wordmark in huge solid/outlined
 * type, and the disciplines it teaches underneath. Both are the same seamless
 * loop the logo marquee uses (the track holds the sequence twice and travels
 * exactly -50% / +50%), so there is never a visible jump, and hovering pauses it.
 *
 * Two deliberate details:
 *   • the section keeps the old element (`<section id="campus-life">`, same
 *     position in <main>) so every inline-editor edit on the homepage keeps its
 *     DOM key — the one thing on this page that must not move;
 *   • the repeated words are marked as editor UI, because the track renders the
 *     name eight times for the loop and the inline editor edits ONE node: letting
 *     the client retype one repeat would break the pattern. The section on/off
 *     switch in Admin → Settings still controls it.
 */

const WORDMARK = 'AMERICAN FUTURETECH';

const DISCIPLINES = [
  'Applied Artificial Intelligence',
  'Cyber Security',
  'Cloud & DevOps',
  'Data Science & Engineering',
  'Product Management',
  'Verified US Credentials',
];

/** Repeat a sequence so the -50% loop has no seam and the row is never short. */
const fill = (items, times) => {
  const out = [];
  for (let i = 0; i < times; i += 1) out.push(...items);
  return out;
};

export default function BrandBand() {
  const { settings } = useSiteSettings();
  const visibility = settings?.sectionVisibility || {};
  const images = resolveSiteImages(settings);

  // Both switches that used to control the photo showcase still control this
  // band, so the client's existing on/off controls keep doing what they did:
  // Settings → Section Visibility, and "Visible / Hidden" in Website Images.
  if (visibility.siteImages === false || images.enabled === false) return null;

  const wordSequence = fill([0, 1], 4); // 8 wordmarks, alternating solid / outline
  const track = [...wordSequence, ...wordSequence];

  const disciplineSequence = DISCIPLINES.map((label, idx) => ({ label, key: `${label}-${idx}` }));
  const disciplineTrack = [...disciplineSequence, ...disciplineSequence];

  return (
    <section
      id="campus-life"
      className="relative py-12 sm:py-14 bg-[#002060] border-t border-b border-[#1D4ED8]/40 overflow-hidden"
    >
      {/* Depth: brand glows plus the faint engineering grid used on the dark panels */}
      <div className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-[#F00000]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-72 w-72 rounded-full bg-[#1D4ED8]/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 aft-grid-3d opacity-50" />

      <div className="relative">
        <p className="text-center text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.34em] text-[#FFD9D9]/80 px-4">
          American FutureTech · Applied Technology Fellowships
        </p>

        {/* Track 1 — the name, sliding left */}
        <div className="mt-5 sm:mt-6 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div
            data-site-editor-ui="true"
            className="animate-infinite-marquee items-center gap-6 sm:gap-10 py-1"
            style={{ animationDuration: '40s' }}
          >
            {track.map((variant, idx) => (
              <span key={`word-${idx}`} className="flex items-center gap-6 sm:gap-10 shrink-0">
                <span
                  className={`text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black font-heading uppercase tracking-tight whitespace-nowrap ${
                    variant === 1 ? 'aft-word-outline' : 'aft-word-solid'
                  }`}
                >
                  {WORDMARK}
                </span>
                <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-[#F00000] shrink-0" />
              </span>
            ))}
          </div>
        </div>

        {/* Track 2 — the disciplines, sliding the other way */}
        <div className="mt-4 sm:mt-5 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div
            data-site-editor-ui="true"
            className="animate-infinite-marquee-ltr items-center gap-4 sm:gap-6 py-1"
            style={{ animationDuration: '52s' }}
          >
            {disciplineTrack.map((item, idx) => (
              <span key={`dis-${idx}`} className="flex items-center gap-4 sm:gap-6 shrink-0">
                <span className="text-[11px] sm:text-sm font-mono font-bold uppercase tracking-[0.2em] text-[#FFD9D9]/85 whitespace-nowrap">
                  {item.label}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] shrink-0" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Edges fade into the neighbouring white sections */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F00000]/60 to-transparent" />
    </section>
  );
}
