import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BrainCircuit,
  Briefcase,
  CalendarClock,
  CalendarDays,
  Clock3,
  GraduationCap,
  MonitorPlay,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { formatSeatDeposit } from '../lib/seatDeposit';
import { TOOL_LOGOS, findToolLogo } from '../data/courseContentData';

/**
 * The one course card the whole site renders.
 *
 * The client sent a reference artwork and asked every program box to follow it:
 * a dark poster on the left carrying the artwork with only its badge and
 * duration pill, and on the right the details column — category eyebrow, title
 * with the specialisation in blue, the three curriculum highlights, the tool
 * stack with real logos, a duration/schedule/batch/mode strip, and the tuition
 * row with the reserve and enroll buttons.
 *
 * Why a shared component: the home grid and the /courses catalogue used to be
 * two hand-maintained copies of the same markup, so every design change had to
 * be made twice and the two pages drifted apart. Both now render this card and
 * every field is read from the course itself, so each program shows its own
 * category, highlights, tools, duration and price instead of a borrowed set.
 *
 * The artwork runs at full strength: the old card flattened the photo under a
 * 96% navy wash, so no course picture was actually visible. The poster prints no
 * duplicate headline or tagline — the details column owns that copy — so the
 * photo only needs a soft scrim behind the badge and the duration pill.
 */

/** One icon per highlight row, cycled by position. */
const HIGHLIGHT_ICONS = [BrainCircuit, TrendingUp, Rocket];

/**
 * What every program includes — printed as the band across the bottom of the
 * card, the way the client's reference artwork does. Same five promises on every
 * card because they are true of every cohort, not per-program copy.
 */
const INCLUDED = [
  { icon: GraduationCap, title: 'Hands-on Projects', sub: 'Build real-world experience' },
  { icon: Briefcase, title: 'Job Assistance', sub: '200+ Hiring Partners' },
  { icon: Users, title: 'Expert Mentorship', sub: '20+ Years Industry Experts' },
  { icon: Award, title: 'Certification Prep', sub: 'Microsoft DP-900 & SC-900' },
  { icon: CalendarClock, title: 'Flexible Learning', sub: 'Live + Recorded Classes' },
];

/**
 * Split a program title into ink lead + blue accent, the way the reference card
 * prints "Data Science with **AI Integration** Program": the words between
 * "with" and a trailing Program/Track keep the accent, everything else stays
 * dark. A title without "with" highlights its last word, and a one-word title is
 * printed plain rather than half-coloured.
 */
function splitTitle(title) {
  const text = String(title || '').trim();
  const match = text.match(/^(.*?\bwith)\s+(.+?)(\s+(?:Program|Programme|Track|Certification))?$/i);
  if (match) {
    return { lead: `${match[1]} `, accent: match[2], tail: match[3] ? ` ${match[3].trim()}` : '' };
  }
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 2) {
    return { lead: `${words.slice(0, -1).join(' ')} `, accent: words[words.length - 1], tail: '' };
  }
  return { lead: text, accent: '', tail: '' };
}

/**
 * The three bullets the card shows.
 *
 * Curated text wins; the client-approved data-science copy stays on the data
 * tracks; everything else is written from that course's own skills, so a
 * cybersecurity card never tells the reader to master PyTorch.
 */
function courseHighlights(course) {
  const curated = (course?.highlights || course?.curriculumHighlights || []).filter(Boolean);
  if (curated.length) return curated.slice(0, 3);

  const haystack = `${course?.slug || ''} ${course?.title || ''} ${course?.category || ''}`.toLowerCase();
  if (haystack.includes('data') || haystack.includes('analytics') || haystack.includes('intelligence & analytics')) {
    return [
      'Master deep neural architectures, PyTorch, and tensor operations',
      'Deploy production LangChain vector RAG pipelines on Kubernetes',
      'Full enterprise capstone defense evaluated by external tech leaders',
    ];
  }

  const skills = (course?.skills || []).filter(Boolean).map(String).slice(0, 4);
  const bullets = [];
  if (skills.length) {
    const list =
      skills.length > 1 ? `${skills.slice(0, -1).join(', ')} and ${skills[skills.length - 1]}` : skills[0];
    bullets.push(`Hands-on, mentor-led labs across ${list}`);
    bullets.push(`Ship a production capstone built with ${skills[0]}`);
  }
  if (course?.duration) {
    bullets.push(`Live cohort training over ${String(course.duration).replace(/\s*·.*$/, '')} with weekly mentor reviews`);
  }
  return bullets.length
    ? bullets.slice(0, 3)
    : [
        'Live mentor-led cohort sessions with recorded replays',
        'Production capstone project reviewed by working practitioners',
        'Placement support until you are hired',
      ];
}

/** The artwork the poster paints: CMS upload first, branded fallback after. */
function posterImage(course) {
  const uploaded = course?.thumbnail || course?.cardImage || course?.heroImage;
  if (uploaded) return uploaded;
  const text = `${course?.slug || ''} ${course?.title || ''} ${course?.category || ''}`.toLowerCase();
  if (text.includes('agentic') || text.includes('generative')) return '/images/course-agentic-ai.jpg';
  if (text.includes('cyber') || text.includes('security') || text.includes('hacking')) return '/images/course-cybersecurity.jpg';
  if (text.includes('data') || text.includes('intelligence') || text.includes('ai')) return '/images/course-data-science.jpg';
  return '/images/classroom-lab.jpg';
}

/**
 * Logo for a tool name, tolerant of the extra words courses carry.
 * "Burp Suite Pro" and "Splunk Enterprise" should still find their mark even
 * though the logo map only knows "burp suite" / "splunk".
 */
function logoForTool(name) {
  const direct = findToolLogo(name);
  if (direct) return direct;
  const needle = String(name || '').toLowerCase().trim();
  if (!needle) return '';
  const key = Object.keys(TOOL_LOGOS).find((candidate) => needle.includes(candidate) || candidate.includes(needle));
  return key ? TOOL_LOGOS[key] : '';
}

/** Tools first, skills as the fallback list; logos come from the local SVGs. */
function courseTools(course) {
  const source = (course?.tools?.length ? course.tools : course?.skills) || [];
  return source
    .map((tool) => (typeof tool === 'string' ? { name: tool } : tool || {}))
    .map((tool) => ({
      name: String(tool.name || '').trim(),
      logo: String(tool.icon || '').trim() || logoForTool(tool.name),
    }))
    .filter((tool) => tool.name)
    .slice(0, 6);
}

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

export default function CourseCard({ course, settings, className = '' }) {
  const settingsContext = useSiteSettings() || {};
  const siteSettings = settings || settingsContext.settings;
  if (!course) return null;

  const { lead, accent, tail } = splitTitle(course.title);
  const category = course.category || 'Executive Engineering Track';
  const highlights = courseHighlights(course);
  const tools = courseTools(course);

  const duration = course.duration || '6 Months';
  const schedule = course.schedule || 'Sat & Sun (2 hrs/day)';
  const batchSize = course.batchSize || 'Capped at 30 Fellows';
  const mode = course.mode || 'Live Online + LMS';

  const price = Number(course.pricing?.discountedPrice ?? 2499);
  const original = Number(course.pricing?.originalPrice ?? course.pricing?.basePrice ?? 0);
  const saving = original > price ? original - price : 0;
  const deposit = formatSeatDeposit(siteSettings, course) || '$99';
  const checkoutHref = `/checkout?courseId=${course._id}&tier=deposit`;

  const metaItems = [
    { icon: Clock3, label: 'Schedule', value: schedule },
    { icon: Users, label: 'Batch Size', value: batchSize },
    { icon: MonitorPlay, label: 'Mode', value: mode },
  ];

  return (
    <article
      className={`aft-course-cloud group rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_24px_48px_-32px_rgba(0,32,96,0.45)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.07),0_28px_58px_-34px_rgba(0,32,96,0.55)] transition-all duration-300 text-left ${className}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* ── Poster: the program's own artwork, badge and duration ────────── */}
        <div className="lg:col-span-5 relative min-h-[130px] sm:min-h-[210px] lg:min-h-[272px] overflow-hidden bg-[rgb(var(--tw-ink-950))]">
          <img
            src={posterImage(course)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
            loading="lazy"
            decoding="async"
          />
          {/* Soft scrim only in the corners that hold the badge and the pill,
              so the programme artwork itself is what the poster shows. */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,10,24,0.7)_0%,rgba(3,10,24,0.3)_27%,rgba(3,10,24,0)_55%,rgba(3,10,24,0.32)_80%,rgba(3,10,24,0.78)_100%)]" />
          <div className="absolute -top-16 -right-10 w-52 h-52 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.28),transparent_70%)] blur-xl" />

          <div className="relative h-full p-3.5 sm:p-4 flex flex-col items-start justify-between gap-2.5 text-white">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-600 text-[9px] font-bold tracking-wide shadow-lg">
              <Sparkles className="w-2.5 h-2.5" />
              {course.badge || 'Admissions Open'}
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/40 bg-[rgb(var(--tw-ink-950)/45%)] text-[10px] font-bold backdrop-blur-xs">
              <CalendarDays className="w-3 h-3 text-blue-300" />
              {`${duration} Program`}
            </span>
          </div>
        </div>

        {/* ── Details column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-7 p-3.5 sm:p-4 flex flex-col gap-2 sm:gap-2.5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300 whitespace-nowrap">
                {category}
              </span>
              <span className="h-[2px] flex-1 bg-gradient-to-r from-blue-600/70 to-transparent rounded-full" />
            </div>

            <Link to={`/courses/${course.slug}`}>
              <h2 className="mt-1.5 text-[22px] sm:text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight leading-[1.12] group-hover:text-[color:rgb(var(--tw-ink-900))] transition-colors">
                {lead}
                {accent && <span className="text-blue-600 dark:text-blue-400">{accent}</span>}
                {tail}
              </h2>
            </Link>
          </div>

          {/* Highlights + tool stack share one bordered block, like the reference. */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white/75 backdrop-blur-xs dark:bg-slate-900/60 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            <div className="lg:col-span-7 p-2.5 sm:p-3 space-y-2 lg:border-r border-slate-200/80 dark:border-slate-700">
              {highlights.map((highlight, index) => {
                const Icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length];
                return (
                  <div key={`${highlight}-${index}`} className="flex items-start gap-2.5">
                    <span className="w-[26px] h-[26px] shrink-0 rounded-full bg-gradient-to-br from-[rgb(var(--tw-ink-900))] to-[rgb(var(--tw-blue-700))] flex items-center justify-center shadow-sm">
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </span>
                    <span className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200 leading-snug pt-0.5">
                      {highlight}
                    </span>
                  </div>
                );
              })}
            </div>

            {tools.length > 0 && (
              <div className="lg:col-span-5 grid grid-cols-2 border-t lg:border-t-0 border-slate-200/80 dark:border-slate-700">
                {tools.map((tool, index) => (
                  <div
                    key={`${tool.name}-${index}`}
                    className={`items-center gap-1.5 px-2 py-1 border-slate-200/70 dark:border-slate-700 ${
                      /* Phones print four tools — two tidy rows — instead of
                         three, which kept the stack shorter than the copy. */
                      index >= 4 ? 'hidden sm:flex' : 'flex'
                    } ${index % 2 === 0 ? 'border-r' : ''}
                    ${index < tools.length - (tools.length % 2 === 0 ? 2 : 1) ? 'border-b' : ''}`}
                  >
                    {tool.logo ? (
                      <img src={tool.logo} alt="" className="w-[18px] h-[18px] shrink-0 object-contain" loading="lazy" decoding="async" />
                    ) : (
                      <span className="w-[18px] h-[18px] shrink-0 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[8px] font-bold flex items-center justify-center">
                        {initials(tool.name)}
                      </span>
                    )}
                    <span className="text-[10.5px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {tool.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule / batch / mode — the duration is on the poster pill. */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-2.5">
            {metaItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-1.5 lg:border-l lg:first:border-l-0 lg:pl-2.5 lg:first:pl-0 border-slate-200 dark:border-slate-700">
                <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[color:rgb(var(--tw-ink-900))] dark:text-blue-300" />
                <div className="min-w-0">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
                  <div className="text-[10.5px] font-bold leading-snug text-slate-800 dark:text-slate-100">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tuition + CTAs */}
          <div className="mt-auto pt-3 border-t border-slate-200/80 dark:border-slate-700 flex flex-wrap lg:flex-nowrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Tuition &amp; Reservation</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xl sm:text-[22px] leading-none font-black font-mono text-slate-900 dark:text-white">
                  ${price}
                </span>
                {original > price && (
                  <>
                    <span className="text-xs text-slate-400 line-through font-mono">${original}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                      {`Save $${saving}`}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Link
                to={checkoutHref}
                data-no-edit="true"
                className="inline-flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-3.5 py-2 rounded-full bg-white dark:bg-slate-900 border border-[color:rgb(var(--tw-blue-700)/35%)] dark:border-blue-800 text-[color:rgb(var(--tw-blue-700))] dark:text-blue-300 text-[11.5px] font-bold hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
              >
                <Clock3 className="w-3.5 h-3.5" />
                {`Reserve with ${deposit}`}
              </Link>
              <Link
                to={checkoutHref}
                data-no-edit="true"
                className="inline-flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 rounded-full bg-[rgb(var(--tw-ink-900))] hover:bg-[rgb(var(--tw-ink-800))] text-white text-[11.5px] font-bold transition-colors shadow-sm"
              >
                Enroll Now
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── What every cohort includes ─────────────────────────────────────
          The five promises from the reference artwork: five tiles across on a
          wide card, three on a tablet. Phones keep the compact card the client
          asked for — the same facts are already in the strip above. */}
      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-2 px-3.5 sm:px-4 py-2.5 border-t border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40">
        {INCLUDED.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[rgb(var(--tw-ink-900))] to-[rgb(var(--tw-blue-700))] flex items-center justify-center shadow-sm">
              <Icon className="w-3.5 h-3.5 text-white" />
            </span>
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold leading-tight text-slate-800 dark:text-slate-100">{title}</div>
              <div className="mt-0.5 text-[9.5px] leading-tight text-slate-500 dark:text-slate-400">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
