import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Star, Sparkles, BookOpen, ArrowRight, ChevronRight, ShieldCheck } from 'lucide-react';
import { usePublicCourses } from '../lib/publicCourses';
import Navbar from '../components/Navbar';
import PageBanner from '../components/PageBanner';
import Footer from '../components/Footer';
import CyberParticles from '../components/CyberParticles';
import LeadModal from '../components/LeadModal';
import SyllabusModal from '../components/SyllabusModal';
import PersonalizedLearningSection from '../components/PersonalizedLearningSection';
import TrustMarquee from '../components/TrustMarquee';
import { DEFAULT_TOOL_CATEGORIES } from '../data/siteContent';
import { compareCoursesByOrder } from '../lib/courseOrder';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { formatDepositAmount, lowestSeatDeposit } from '../lib/seatDeposit';
import { Wrench } from 'lucide-react';
import FaqAccordion from '../components/common/FaqAccordion';
import CourseCard from '../components/CourseCard';

/**
 * Brand logos for some enterprise tools are no longer served by any public icon
 * CDN (trademark removals), so a tile may have no `logo` or the request may fail
 * at runtime. In that case we render a letter monogram instead of a broken
 * image. The logo really loading is the only path that shows a picture.
 */
const toolMonogram = (name) =>
  (name || '?')
    .split(/[\s&/-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

function ToolLogo({ name, logo }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center p-2 mb-2">
      {logo && !broken ? (
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="w-8 h-8 object-contain"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className="text-[11px] font-black font-heading tracking-tight text-slate-500 dark:text-slate-400"
        >
          {toolMonogram(name)}
        </span>
      )}
    </div>
  );
}

export default function CoursesPage() {
  // Same shared loader as the homepage and the header menu: the first paint uses
  // the server's snapshot, and a failed request keeps the last real list instead
  // of emptying the catalogue.
  const { courses, loading, failed, refresh } = usePublicCourses();
  // Settings → Deposit plus each program's own Reservation fee (Admin →
  // Courses). The catalogue mixes $99 and $499 reservations, so the intro
  // sentence quotes the lowest fee and every card prints its own.
  const { settings } = useSiteSettings() || {};
  const depositFrom = formatDepositAmount(lowestSeatDeposit(settings, courses));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  // 'featured' is the admin's own program sequence (Admin → Courses → Move
  // up/down). It is the default so the catalogue opens in the order the client
  // asked for — Data Science, then Cyber, with the visitor's own sorting one
  // choice away.
  const [sortBy, setSortBy] = useState('featured');
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);
  const location = useLocation();
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);

  useEffect(() => {
    if (location.hash) {
      const elem = document.querySelector(location.hash);
      if (elem) {
        setTimeout(() => {
          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [location.hash]);

  const categories = [
    'All',
    'Artificial Intelligence & Analytics',
    'Information Security & Offensive Operations',
    'Cloud Engineering & Infrastructure',
    'Product & Leadership',
    'Cyber Governance & Legal Tech'
  ];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      course.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'featured') return compareCoursesByOrder(a, b);
    if (sortBy === 'popular') return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
    if (sortBy === 'price-low') return (a.pricing?.discountedPrice || 0) - (b.pricing?.discountedPrice || 0);
    if (sortBy === 'price-high') return (b.pricing?.discountedPrice || 0) - (a.pricing?.discountedPrice || 0);
    if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[rgb(var(--tw-ink-800))] text-slate-900 dark:text-slate-100 font-sans antialiased relative overflow-x-hidden">
      <Navbar onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Admin photo strip (Content → Website Images). Renders nothing until a
          photo is picked for this page. */}
      <PageBanner pageKey="courses" />

      <main className="pt-28 pb-10 relative z-10">
        <TrustMarquee />

        {/* Header Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold font-heading uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>6-Month Career Training & US Accredited Fellowships</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight text-slate-900 dark:text-white mb-4">
            Applied Technology Specializations
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            {`Live instructor-led engineering tracks featuring production capstone builds, dedicated 1-on-1 mentorship, and guaranteed placement support. Reserve any program with a refundable seat deposit from ${depositFrom}.`}
          </p>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-3xl mx-auto mb-8 flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by track, tool (PyTorch, Kali, Kubernetes)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Sort programs by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="featured">Featured Order</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Tuition: Low to High</option>
                <option value="price-high">Tuition: High to Low</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills (Easy LMS Style) */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Course Cards Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="elms-card p-6 space-y-4">
                  <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : failed && courses.length === 0 ? (
            /* A failed catalogue request says so and offers a retry. Rendering
               the demo list here is what showed phones a stale catalogue. */
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto p-6 shadow-sm">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Catalogue unavailable</h3>
              <p className="text-slate-500 text-xs mb-4">The programmes could not be loaded. Nothing stale is being shown in their place.</p>
              <button onClick={() => refresh()} className="elms-btn-primary !text-xs !py-2 !px-4">
                Retry
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto p-6 shadow-sm">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Specializations Found</h3>
              <p className="text-slate-500 text-xs mb-4">Try clearing filters or search terms.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                className="elms-btn-primary !text-xs !py-2 !px-4"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            /* One course per row — the client asked to stop showing two cards
               side by side, so the next specialization always starts on the
               line below the previous one. */
            <div className="grid grid-cols-1 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course._id || course.slug} course={course} className="w-full" />
              ))}

            </div>
          )}
        </section>

        {/* ── Enterprise Tools & Technologies (grouped by discipline) ───── */}
        <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-12 mt-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Wrench className="w-3.5 h-3.5" />
                <span>Tools &amp; Tech Stack</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-slate-900 dark:text-white">
                Enterprise Tools &amp; Technologies You'll Master
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Gain hands-on proficiency with the modern toolchains and industry-standard software demanded by top technology employers.
              </p>
            </div>

            <div className="space-y-8">
              {DEFAULT_TOOL_CATEGORIES.map((cat) => {
                // Every discipline runs right → left as a looping strip (the
                // client wanted the logos travelling right to left, like the
                // company marquee). The tools are repeated four times so one pass
                // is always wider than the widest screen, then that strip is
                // duplicated: the animation travels 0 → -50%, so the loop never
                // shows a gap.
                const strip = [];
                for (let i = 0; i < 4; i += 1) strip.push(...cat.tools);
                const track = [...strip, ...strip];

                return (
                  <div key={cat.id}>
                    {/* Track name: the client wanted it visibly bigger and bold
                        so each discipline reads as a heading, not a caption. */}
                    <div className="flex items-center gap-3 mb-4">
                      <span aria-hidden="true" className="w-1.5 h-6 rounded-full bg-blue-600 shrink-0" />
                      <span className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900 dark:text-white font-heading">
                        {cat.label}
                      </span>
                      <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    </div>

                    <div className="relative overflow-hidden marquee-mask">
                      <div className="animate-infinite-marquee-slow items-stretch gap-3 sm:gap-4 py-2">
                        {track.map((tool, idx) => (
                          <div
                            key={`${tool.name}-${idx}`}
                            // Only the first pass is announced to screen readers;
                            // the repeats exist purely to make the loop seamless.
                            aria-hidden={idx >= cat.tools.length ? 'true' : undefined}
                            className="group w-[128px] sm:w-[150px] shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 text-center hover:border-blue-500/40 hover:shadow-sm transition-all flex flex-col items-center justify-center"
                          >
                            <ToolLogo name={tool.name} logo={tool.logo} />
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight w-full">
                              {tool.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Personalized Learning Extended 1-on-1 Track */}
        <PersonalizedLearningSection />

        {/* Program and Admissions FAQ Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl pt-8 pb-12">
          <FaqAccordion
            initialCategory="All"
            title="Frequently Asked Program & Admissions Questions"
          />
        </section>
      </main>

      <Footer onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        preselectedCourse={selectedCourseForModal}
      />
      <SyllabusModal
        isOpen={isSyllabusModalOpen}
        onClose={() => setIsSyllabusModalOpen(false)}
        course={selectedCourseForModal}
        onApplyNow={(course) => {
          setIsSyllabusModalOpen(false);
          setSelectedCourseForModal(course);
          setIsLeadModalOpen(true);
        }}
      />
    </div>
  );
}
