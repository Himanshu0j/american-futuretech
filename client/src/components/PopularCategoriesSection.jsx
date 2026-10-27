import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * "Popular course categories" — three tracks on a sand panel.
 *
 * The cards carry hand-drawn line art rather than photos, the way the reference
 * art does: ink strokes on cream, with a red accent mark. Hovering a card
 * re-draws its art (the paths animate from stroke-dashoffset 1 to 0), which is
 * why every path is marked pathLength="1" — that normalises the dash maths so a
 * single keyframe works on short and long strokes alike.
 *
 * Categories map to the programmes the site actually sells (see the catalogue),
 * so nothing here promises a subject the institute does not teach.
 */
const CATEGORIES = [
  {
    title: 'AI & Data',
    body: 'Data science, generative AI and agentic systems — the tracks that ship models instead of notebooks.',
    art: 'data',
  },
  {
    title: 'Cyber Security',
    body: 'Ethical hacking, defensive operations and the hybrid AI-security programme.',
    art: 'shield',
  },
  {
    title: 'Cloud & DevOps',
    body: 'Kubernetes, delivery pipelines and platform work with AI in the loop.',
    art: 'cloud',
  },
];

/** Shared props so every stroke in the three illustrations reads the same. */
const SKETCH = {
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function DataArt() {
  return (
    <svg viewBox="0 0 160 130" className="h-full w-full" aria-hidden="true">
      {/* Monitor */}
      <g className="aft-sketch">
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M26 18h108a8 8 0 0 1 8 8v62a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8Z" />
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M66 96v12m-18 0h36" />
        {/* Rising bars */}
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M40 76V62m18 14V50m18 26V38m18 38V54" />
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M34 82h92" />
        {/* Node graph in the corner */}
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M112 34h16m-8-6v12" opacity="0.55" />
      </g>
      <g className="aft-sketch aft-sketch-accent">
        <circle cx="94" cy="30" r="4" fill="rgb(var(--tw-gold-500))" stroke="none" />
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M94 34v4m3 0h-6" />
      </g>
      {/* Sketch marks */}
      <g className="aft-sketch" opacity="0.45">
        <path {...SKETCH} d="M18 108c4-3 8 3 12 0s8 3 12 0" />
        <path {...SKETCH} d="M132 14v6m3-3h-6" />
      </g>
    </svg>
  );
}

function ShieldArt() {
  return (
    <svg viewBox="0 0 160 130" className="h-full w-full" aria-hidden="true">
      <g className="aft-sketch">
        <path
          {...SKETCH}
          pathLength="1"
          className="aft-sketch-line"
          d="M80 12l46 17v34c0 26-19 45-46 57-27-12-46-31-46-57V29Z"
        />
        {/* Terminal prompt inside the shield */}
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M60 50l12 11-12 11" />
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M82 72h20" />
        {/* Padlock bar */}
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M62 30h36" opacity="0.35" />
      </g>
      <g className="aft-sketch aft-sketch-accent">
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M112 44l6 6 12-14" />
      </g>
      <g className="aft-sketch" opacity="0.45">
        <path {...SKETCH} d="M16 96c5-4 9 4 14 0" />
        <path {...SKETCH} d="M132 96v6m3-3h-6" />
      </g>
    </svg>
  );
}

function CloudArt() {
  return (
    <svg viewBox="0 0 160 130" className="h-full w-full" aria-hidden="true">
      <g className="aft-sketch">
        {/* Cloud */}
        <path
          {...SKETCH}
          pathLength="1"
          className="aft-sketch-line"
          d="M52 62a18 18 0 0 1 3-36 24 24 0 0 1 44-4 19 19 0 0 1 9 40Z"
        />
        {/* Stacked containers under the cloud */}
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M44 76h28v20H44Zm0 6h28" />
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M88 76h28v20H88Zm0 6h28" />
        {/* Deploy loop */}
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M58 104c14 12 40 12 52-2" />
        <path {...SKETCH} pathLength="1" className="aft-sketch-line" d="M110 102l2-8-8 2" />
      </g>
      <g className="aft-sketch aft-sketch-accent">
        <circle cx="80" cy="20" r="3.5" fill="rgb(var(--tw-gold-500))" stroke="none" />
      </g>
      <g className="aft-sketch" opacity="0.45">
        <path {...SKETCH} d="M20 34c4-3 8 3 12 0s8 3 12 0" />
        <path {...SKETCH} d="M124 34v6m3-3h-6" />
      </g>
    </svg>
  );
}

const ART = { data: DataArt, shield: ShieldArt, cloud: CloudArt };

export default function PopularCategoriesSection() {
  return (
    <section id="popular-categories" className="bg-[#fffcf9] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-[#faf0ee] px-4 py-10 ring-1 ring-[rgb(var(--tw-ink-900)/6%)] sm:px-8 sm:py-12">
          {/* Dotted paper texture, the way the reference art sits on graph paper. */}
          <div aria-hidden="true" className="aft-dotted-paper pointer-events-none absolute inset-0 opacity-[0.35]" />

          <div className="relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <span className="font-heading text-xs font-bold uppercase tracking-widest text-[color:rgb(var(--tw-gold-600))]">
                  Find your track
                </span>
                <h2 className="mt-3 font-heading text-2xl font-bold leading-tight tracking-tight text-[color:rgb(var(--tw-ink-900))] sm:text-3xl lg:text-4xl">
                  Popular course categories
                </h2>
              </div>
              <Link
                to="/courses"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[rgb(var(--tw-ink-900))] px-5 py-2.5 font-heading text-xs font-bold text-white transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[rgb(var(--tw-gold-600))]"
              >
                See every program
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {CATEGORIES.map(({ title, body, art }) => {
                const Art = ART[art];
                return (
                  <Link
                    key={title}
                    to="/courses"
                    className="aft-sketch-card group flex flex-col rounded-[24px] bg-[#fffdfb] p-5 ring-1 ring-[rgb(var(--tw-ink-900)/7%)] transition-all duration-300 hover:-translate-y-1 hover:ring-[rgb(var(--tw-gold-500)/35%)] hover:shadow-[0_26px_50px_-32px_rgba(120,20,20,0.45)] sm:p-6"
                  >
                    <div className="flex h-32 w-full items-center justify-center text-[color:rgb(var(--tw-ink-900))] transition-transform duration-500 ease-spring group-hover:-rotate-1">
                      <Art />
                    </div>
                    <h3 className="mt-4 font-heading text-lg font-bold tracking-tight text-[color:rgb(var(--tw-ink-900))]">
                      {title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{body}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 font-heading text-xs font-bold text-[color:rgb(var(--tw-gold-600))]">
                      Explore programs
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
