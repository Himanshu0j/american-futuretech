import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Clock, Star, Sparkles, BookOpen, ArrowRight, ChevronRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CyberParticles from '../components/CyberParticles';
import LeadModal from '../components/LeadModal';
import SyllabusModal from '../components/SyllabusModal';
import PersonalizedLearningSection from '../components/PersonalizedLearningSection';
import CompanyMarquee from '../components/CompanyMarquee';
import { DEFAULT_TOOL_CATEGORIES } from '../data/siteContent';
import { Wrench } from 'lucide-react';
import FaqAccordion from '../components/common/FaqAccordion';

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
    <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center p-1.5 mb-1.5">
      {logo && !broken ? (
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="w-6 h-6 object-contain"
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
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);
  const location = useLocation();
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

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

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

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
    if (sortBy === 'popular') return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
    if (sortBy === 'price-low') return (a.pricing?.discountedPrice || 0) - (b.pricing?.discountedPrice || 0);
    if (sortBy === 'price-high') return (b.pricing?.discountedPrice || 0) - (a.pricing?.discountedPrice || 0);
    if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 font-sans antialiased relative overflow-x-hidden">
      <Navbar onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      <main className="pt-28 pb-10 relative z-10">
        <CompanyMarquee />

        {/* Header Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold font-heading uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>6-Month Career Training & US Accredited Fellowships</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight text-slate-900 dark:text-white mb-4">
            Applied Technology Specializations
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            Live instructor-led engineering tracks featuring production capstone builds, dedicated 1-on-1 mentorship, and guaranteed placement support. Reserve any program with a refundable $99 deposit.
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Sort programs by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors"
              >
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
                    ? 'bg-indigo-600 text-white shadow-sm'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course._id}
                  className="elms-card p-6 flex flex-col justify-between text-left group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full font-bold truncate max-w-[70%] border border-indigo-200/50 dark:border-indigo-800/50">
                        {course.category}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full whitespace-nowrap border border-emerald-200 dark:border-emerald-800">
                        6-Month Track
                      </span>
                    </div>

                    <Link to={`/courses/${course.slug}`}>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                        {course.title}
                      </h3>
                    </Link>

                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {course.shortDescription || course.description}
                    </p>

                    {/* Meta details */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 my-4 py-2 border-y border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{course.duration || '6 Months (24 Wks)'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-slate-900 dark:text-white">{course.rating || '4.9'}</span>
                        <span className="text-slate-400">({course.reviewsCount || '320'})</span>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-1.5 mb-4">
                      {(course.highlights || ['Live Weekend Interactive Labs', '1-on-1 Faculty Mentorship', 'Accredited US Digital Credential']).slice(0, 3).map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing and Action CTAs */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline justify-between mb-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">${course.pricing?.discountedPrice || 499}</span>
                        <span className="text-xs text-slate-400 line-through font-mono">${course.pricing?.basePrice || course.pricing?.originalPrice || 1299}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                        Reserve with $99
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/courses/${course.slug}`}
                        className="elms-btn-secondary !text-xs !py-2 !px-3 text-center justify-center font-bold"
                      >
                        Details
                      </Link>
                      <Link
                        to={`/checkout?courseId=${course._id}&tier=deposit`}
                        className="elms-btn-primary !text-xs !py-2 !px-3 text-center justify-center font-bold"
                      >
                        Reserve $99 →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Enterprise Tools & Technologies (grouped by discipline) ───── */}
        <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-12 mt-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4">
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
              {DEFAULT_TOOL_CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 font-heading">
                      {cat.label}
                    </span>
                    <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {cat.tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="group rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-2.5 text-center hover:border-indigo-500/40 hover:shadow-sm transition-all flex flex-col items-center justify-center"
                      >
                        <ToolLogo name={tool.name} logo={tool.logo} />
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight truncate w-full">
                          {tool.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
