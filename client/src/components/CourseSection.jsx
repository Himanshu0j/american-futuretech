import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Clock,
  Calendar,
  ArrowRight,
  Award,
  ShieldCheck,
  Sparkles,
  Users,
  ZoomIn,
  Eye
} from 'lucide-react';
import { usePublicCourses } from '../lib/publicCourses';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { formatDepositAmount, formatSeatDeposit, lowestSeatDeposit } from '../lib/seatDeposit';
import { MICROSOFT_CERTIFICATES } from '../data/microsoftCertificates';
import CertificateModal from './CertificateModal';
import aiIllustration from '../assets/illustrations/programs/ai-intelligence.svg';
import dataScienceIllustration from '../assets/illustrations/programs/data-science.svg';
import cyberIllustration from '../assets/illustrations/programs/cybersecurity.svg';
import cloudIllustration from '../assets/illustrations/programs/cloud-infrastructure.svg';
import devopsIllustration from '../assets/illustrations/programs/devops-engineering.svg';
import agenticIllustration from '../assets/illustrations/programs/agentic-ai.svg';

function getCourseIllustration(course) {
  if (!course) return aiIllustration;
  const text = ((course.slug || '') + ' ' + (course.title || '') + ' ' + (course.category || '')).toLowerCase();
  if (text.includes('agentic') || text.includes('generative')) return agenticIllustration;
  if (text.includes('cyber') || text.includes('security') || text.includes('hacking')) return cyberIllustration;
  if (text.includes('cloud') || text.includes('infrastructure')) return cloudIllustration;
  if (text.includes('devops') || text.includes('deployment')) return devopsIllustration;
  if (text.includes('data') || text.includes('analytics')) return dataScienceIllustration;
  return aiIllustration;
}

function getCourseImage(course) {
  const text = ((course.slug || '') + ' ' + (course.title || '') + ' ' + (course.category || '')).toLowerCase();
  if (text.includes('agentic') || text.includes('generative')) {
    return '/images/course-agentic-ai.jpg';
  }
  if (text.includes('hybrid') || (text.includes('cyber') && text.includes('ai'))) {
    return '/images/course-hybrid-ai.jpg';
  }
  if (text.includes('cyber') || text.includes('security') || text.includes('hacking')) {
    return '/images/course-cybersecurity.jpg';
  }
  if (text.includes('data') || text.includes('intelligence') || text.includes('ai')) {
    return '/images/course-data-science.jpg';
  }
  return '/images/classroom-lab.jpg';
}

/**
 * The picture a course card shows.
 *
 * The image the team uploaded in the CMS always wins (the same one the
 * /courses page uses), so the home page grid and the catalogue never disagree.
 * Only a course nobody has given a picture to falls back to the branded artwork
 * picked by keyword above.
 */
function getCourseCardImage(course) {
  return course?.thumbnail || course?.cardImage || course?.heroImage || getCourseImage(course);
}

/**
 * The three bullets a program card shows.
 *
 * Almost no course carries curated `curriculumHighlights`, and the old single
 * hardcoded set told a cybersecurity card to "master PyTorch". So: curated text
 * wins, the client-approved data-science copy stays on the data tracks, and
 * everything else is written from that course's own skills — never borrowed
 * from a different program.
 */
function getHighlightBullets(course) {
  const curated = (course?.curriculumHighlights || []).filter(Boolean);
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

export default function CourseSection({ onSelectCourse, onOpenSyllabusModal }) {
  /*
   * The catalogue comes from the shared loader: the HTML snapshot (or the last
   * API reply) paints immediately, and a failed request keeps that instead of
   * swapping in the demo programmes this section used to carry.
   */
  const { courses, loading, failed, refresh } = usePublicCourses();
  // Settings → Deposit. The card CTA and the fine print beside it print the
  // amount checkout charges, so the home page can never disagree with the
  // header menu (or with /courses).
  const { settings } = useSiteSettings() || {};
  // The lowest fee in the catalogue, for the intro sentence. Each card prints
  // its OWN program's fee: the four-month tracks (CISSP, AI Product Manager,
  // GRC) reserve at $499 while the six-month tracks keep the site default, so
  // one page-wide number would misquote most of the cards.
  const depositFrom = formatDepositAmount(lowestSeatDeposit(settings, courses));
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeCertIdx, setActiveCertIdx] = useState(0);
  const [selectedModalCert, setSelectedModalCert] = useState(null);

  const filterCategories = [
    'All Programs',
    'Artificial Intelligence',
    'Cyber Security',
    'Cloud & DevOps'
  ];

  const filteredCourses = courses.filter((c) => {
    if (activeFilter === 'All Programs' || activeFilter === 'All') return true;
    if (activeFilter === 'Artificial Intelligence') {
      return (
        c.category?.toLowerCase().includes('intelligence') ||
        c.title?.toLowerCase().includes('ai') ||
        c.title?.toLowerCase().includes('data')
      );
    }
    if (activeFilter === 'Cyber Security') {
      return (
        c.category?.toLowerCase().includes('security') ||
        c.title?.toLowerCase().includes('cyber') ||
        c.title?.toLowerCase().includes('hacking')
      );
    }
    if (activeFilter === 'Cloud & DevOps') {
      return (
        c.category?.toLowerCase().includes('cloud') ||
        c.title?.toLowerCase().includes('devops') ||
        c.title?.toLowerCase().includes('cloud')
      );
    }
    return true;
  });


  return (
    <section id="courses" className="py-12 sm:py-16 relative z-10 bg-white dark:bg-[rgb(var(--tw-ink-800))] text-slate-900 dark:text-slate-100 border-t border-slate-200/60 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-10 gap-6 text-left">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-bold font-heading uppercase tracking-wider mb-3.5 shadow-xs">
              <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>6-Month Career Training Programs · Dual US & Microsoft Credentials</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-slate-900 dark:text-white tracking-tight leading-tight">
              Fellowship Specializations
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {`Curriculums engineered with Silicon Valley engineering leads. Deploy production code, defend capstone architectures, and gain lifetime alumni placement support. Reserve any track from ${depositFrom}.`}
            </p>
          </div>

          {/* Track Filter Tabs (Refined Pill Style) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
            {filterCategories.map((cat) => {
              const isSelected = activeFilter === cat || (cat === 'All Programs' && activeFilter === 'All');
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* EVERY specialization uses the same full-width showcase layout the
            client picked from the home page: programme artwork on the left, the
            whole story (curriculum highlights, stack, tuition, CTAs) beside it.
            The map parameter is deliberately named `flagship` so every course
            renders through the card markup below unchanged. */}
        {/* Nothing real to show is stated plainly. The section used to answer
            a failed request with hardcoded demo programmes, which is how a
            phone ended up showing titles and artwork the admin had long since
            replaced — worse than an honest retry. */}
        {failed && !courses.length && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              The programme catalogue could not be loaded.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Check your connection and try again — nothing is being shown rather than out-of-date content.
            </p>
            <button
              type="button"
              onClick={() => refresh()}
              className="mt-4 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {loading && !courses.length && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            Loading the programme catalogue…
          </div>
        )}

        {filteredCourses.map((flagship) => {
          /* This card's reservation fee: the course's own $499 (Admin →
             Courses → Reservation fee) or the site default. */
          const depositAmount = formatSeatDeposit(settings, flagship);
          return (
          <div
            key={flagship._id || flagship.slug}
            className="mb-6 sm:mb-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_24px_54px_-34px_rgba(0,32,96,0.5)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.07),0_30px_64px_-36px_rgba(0,32,96,0.58)] transition-all duration-300 overflow-hidden text-left group"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Visual Column — the SAME artwork treatment the /courses
                  catalogue card uses. The client compared the two pages side by
                  side: the catalogue showed the whole banner while the homepage
                  was cropping it ("image cut ho raha hai"), because this panel is
                  a near-square frame and `object-cover` trimmed roughly 29% of a
                  3:2 photo — straight through the headline baked into the
                  artwork. So: soft tinted panel, 4:3 frame, `object-contain`, and
                  every course's image fits in full on both pages. */}
              {/* The column is as tall as the story beside it, so the artwork
                  used to sit pinned to the top and leave a lopsided empty band
                  below the cohort line ("niche jada space, odd lag raha"). The
                  whole visual block — frame plus cohort/faculty — is centred in
                  the column instead, giving the even breathing room the
                  /courses catalogue card already has. */}
              <div className="lg:col-span-5 relative min-w-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-3 sm:p-4 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-center">
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
                  <img
                    src={getCourseCardImage(flagship)}
                    alt={flagship.title}
                    className="absolute inset-0 w-full h-full object-contain object-center group-hover:scale-[1.02] transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                  />

                  {flagship.badge && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[rgb(var(--tw-ink-900)/88%)] text-[color:rgb(var(--tw-gold-400))] text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                      {flagship.badge}
                    </span>
                  )}

                  <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[rgb(var(--tw-ink-900)/88%)] text-white text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-xs">
                    <Clock className="w-3.5 h-3.5 text-[color:rgb(var(--tw-gold-400))]" />
                    {flagship.duration || '6 Months · Weekend Masterclasses + Labs'}
                  </span>
                </div>

                {/* Cohort + faculty used to be printed over the photo. On a
                    letterboxed artwork they would sit on the empty frame rather
                    than on the picture, so they now sit under it on the panel. */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{flagship.cohort || 'Next Cohort: Oct 15, 2026'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{flagship.faculty || 'Silicon Valley & Fortune 500 Faculty'}</span>
                  </span>
                </div>
              </div>

              {/* Right Content Column */}
              <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4 relative">
                <div className="hidden sm:block absolute top-6 right-6 w-14 h-14 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <img src={getCourseIllustration(flagship)} alt="" className="w-full h-full object-contain" />
                </div>
                <div>
                  {/* Program identity block. The client circled exactly this
                      area on the live page ("yaha thoda UI and Box daliye") and
                      asked for a real box around it instead of loose text
                      floating on white, then for that box to carry a light
                      colour so it reads as a highlight rather than a white card
                      on a white page. The /courses page carries the same
                      treatment — see client/src/pages/CoursesPage.jsx. */}
                  <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50 via-sky-50/70 to-white p-4 shadow-xs dark:border-blue-900/50 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900/40">
                    {/* The status chip stays on one line: inside the new box it
                        has less room than it did in the open column, and it used
                        to wrap to two lines at this width. */}
                    <div className="flex items-center justify-between gap-3 mb-2 flex-wrap pr-0 sm:pr-24">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 min-w-0 truncate">
                        {flagship.category || 'Executive Engineering Track'}
                      </span>
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 whitespace-nowrap shrink-0">
                        Admissions Open · Capped at 30 Fellows
                      </span>
                    </div>

                    <Link to={`/courses/${flagship.slug}`}>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                        {flagship.title}
                      </h3>
                    </Link>

                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {flagship.shortDescription || flagship.description}
                    </p>
                  </div>

                  {/* 3 Structured Curriculum Highlights — boxed and labelled,
                      matching the identity panel above so the card reads as two
                      deliberate blocks rather than one long column of text. */}
                  <div className="mt-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Curriculum Highlights
                    </div>
                    {getHighlightBullets(flagship).map((highlight, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                        <span className="font-medium leading-normal">{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tech Stack Pills */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono text-slate-500 mr-1">Stack:</span>
                    {/* `skills?.` alone was not enough: a course whose skills list
                        saved as an empty array is truthy, so `[] || defaults`
                        kept the empty array and the row rendered a bare "Stack:"
                        label with no pills under it (the live home page did
                        exactly that). */}
                    {(flagship.skills?.length ? flagship.skills.slice(0, 6) : ['Python 3.12', 'PyTorch', 'Docker', 'LangChain', 'AWS']).map(
                      (skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-md font-medium border border-slate-200/50 dark:border-slate-700/50"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Bottom Pricing and Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                      Tuition & Reservation
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                        ${flagship.pricing?.discountedPrice || 499}
                      </span>
                      <span className="text-sm text-slate-500 line-through font-mono">
                        ${flagship.pricing?.originalPrice || 1299}
                      </span>
                      {/* One text node, and data-no-edit. "Reserve with
                          {depositAmount}" splits the label into two text nodes,
                          and a saved inline edit keyed to the old single node
                          then lands on the fragment: the live cards read
                          "Reserve with $499 $99". A template string keeps the
                          node whole and the lock keeps the amount honest. */}
                      <Link
                        to={`/checkout?tier=deposit&courseId=${flagship._id}`}
                        data-no-edit="true"
                        className="text-xs font-bold text-blue-700 dark:text-blue-300 font-mono bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded hover:underline"
                      >
                        {`Reserve with ${depositAmount}`}
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Public syllabus download removed at the client's request —
                        the curriculum is viewable on screen via View Details. */}

                    <Link
                      to={`/checkout?tier=deposit&courseId=${flagship._id}`}
                      data-no-edit="true"
                      className="elms-btn-primary group"
                    >
                      <span>{`Reserve Seat — ${depositAmount}`}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })}


        {/* Official Microsoft Partner Credential Showcase */}
        <div className="mt-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[rgb(var(--tw-ink-800))] to-[rgb(var(--tw-ink-800))] text-white border border-blue-500/30 shadow-2xl text-left">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-blue-500/20">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Dual Credential Framework &bull; US Institute + Microsoft Certified</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
                Official Microsoft Certified Partner Credentials
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Every American FutureTech fellow graduates with dual industry credentials: our accredited US Fellowship Diploma verified on our Wyoming Registry, plus official alignment with Microsoft Certified Professional certifications.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/certificate/AFT-CERT-AI9821"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-colors text-center shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Verify Sample Credential</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              {/* Deposit price removed from this credential panel at the
                  client's request — the CTA now reads "Reserve Seat" only. */}
              <Link
                to="/checkout?tier=deposit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors text-center shadow-md"
              >
                Reserve Seat
              </Link>
            </div>
          </div>

          {/* Certificate Selector Pills */}
          <div className="pt-6">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-300 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" />
              <span>Select Microsoft Certification to Inspect:</span>
            </div>

            <div className="flex flex-wrap gap-2 pb-2">
              {MICROSOFT_CERTIFICATES.map((cert, idx) => (
                <button
                  key={cert.id}
                  onClick={() => setActiveCertIdx(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                    activeCertIdx === idx
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700'
                  }`}
                >
                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 text-[10px]">
                    {cert.code}
                  </span>
                  <span>{cert.title.replace('Microsoft Certified: ', '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Certificate Spotlight Card */}
          {MICROSOFT_CERTIFICATES[activeCertIdx] && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-slate-950/60 p-6 sm:p-6 rounded-2xl border border-blue-500/20">
              {/* Certificate Image with Zoom Lightbox Trigger */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div
                  onClick={() => setSelectedModalCert(MICROSOFT_CERTIFICATES[activeCertIdx])}
                  className="group relative cursor-pointer rounded-xl overflow-hidden border-2 border-blue-400/40 shadow-2xl bg-white w-full max-w-md transition-all duration-300 hover:scale-[1.02] hover:border-blue-400"
                >
                  <img
                    src={MICROSOFT_CERTIFICATES[activeCertIdx].image}
                    alt={MICROSOFT_CERTIFICATES[activeCertIdx].title}
                    className="w-full h-auto max-h-[210px] sm:max-h-[240px] object-contain transition-transform duration-300 group-hover:contrast-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <span className="px-3.5 py-1.5 rounded-full bg-white/90 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                      <ZoomIn className="w-4 h-4 text-blue-600" />
                      <span>Inspect High-Res Certificate</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/95 border-t border-slate-800 text-center flex items-center justify-between text-[11px] font-mono text-blue-300 px-3">
                    <span className="font-bold text-white">{MICROSOFT_CERTIFICATES[activeCertIdx].code}</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-blue-400" /> Click to Enlarge
                    </span>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold uppercase border border-blue-400/30">
                    {MICROSOFT_CERTIFICATES[activeCertIdx].badge}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold uppercase border border-blue-400/30">
                    {MICROSOFT_CERTIFICATES[activeCertIdx].category}
                  </span>
                </div>

                <h4 className="text-xl sm:text-2xl font-bold font-heading text-white">
                  {MICROSOFT_CERTIFICATES[activeCertIdx].title}
                </h4>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {MICROSOFT_CERTIFICATES[activeCertIdx].description}
                </p>

                {/* Core Competencies Tested */}
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">
                    Core Technical Competencies Validated:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MICROSOFT_CERTIFICATES[activeCertIdx].skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3 text-blue-400" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Wyoming Institutional Registry Backed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-blue-400" />
                    Direct Verification Endpoint
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enterprise Group Training Discovery Banner */}
        <div className="mt-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white font-heading">
              Looking for corporate group training or customized enterprise cohorts?
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              We provide private cohorts with customized AI red teaming and LLM infrastructure curriculums for engineering teams.
            </div>
          </div>

          <Link
            to="/courses"
            className="elms-btn-secondary !text-xs !py-2.5 !px-5 whitespace-nowrap shrink-0"
          >
            <span>Browse Complete Catalog (8 Programs)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <CertificateModal
        isOpen={!!selectedModalCert}
        certificate={selectedModalCert}
        onClose={() => setSelectedModalCert(null)}
      />
    </section>
  );
}
