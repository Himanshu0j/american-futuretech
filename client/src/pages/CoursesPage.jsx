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
import FaqAccordion from '../components/common/FaqAccordion';

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
    <div className="min-h-screen bg-[#fffff2] text-[#1b1b1b] font-sans antialiased relative overflow-x-hidden">
      <Navbar onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      <main className="pt-28 pb-20 relative z-10">
        {/* Header Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d8ffd2] text-[#1a361d] text-xs font-bold font-heading uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#40844e]" />
            <span>US Accredited Fellowships</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight text-[#1a361d] mb-4">
            Applied Technology Specializations
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Live instructor-led engineering tracks featuring production capstone builds, dedicated 1-on-1 mentorship, and guaranteed placement support.
          </p>

          {/* Search & Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm max-w-3xl mx-auto mb-8 flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by track, tool (PyTorch, Kali, Kubernetes)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[#1b1b1b] placeholder:text-gray-400 focus:outline-none focus:border-[#2d5c36] transition-colors text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[#1b1b1b] text-xs font-medium focus:outline-none focus:border-[#2d5c36] transition-colors"
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
                    ? 'bg-[#1a361d] text-[#fffff2] shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
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
                  <div className="h-5 w-24 bg-gray-200 rounded" />
                  <div className="h-6 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-100 rounded" />
                  <div className="pt-4 border-t border-gray-100 flex justify-between">
                    <div className="h-5 w-16 bg-gray-200 rounded" />
                    <div className="h-8 w-24 bg-gray-200 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 max-w-md mx-auto p-8 shadow-sm">
              <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#1a361d] mb-1">No Specializations Found</h3>
              <p className="text-gray-500 text-xs mb-4">Try clearing filters or search terms.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                className="elms-btn-primary !text-xs !py-2 !px-4"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredCourses.map((course) => (
                <div
                  key={course._id}
                  className="elms-card p-6 flex flex-col justify-between text-left group bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#1a361d]/30"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono text-[#1a361d] bg-[#d8ffd2] px-2.5 py-0.5 rounded-full font-bold truncate max-w-[70%]">
                        {course.category}
                      </span>
                      {course.badge && (
                        <span className="text-[10px] font-bold text-[#9e4f8f] bg-[#ffe6fa] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          {course.badge}
                        </span>
                      )}
                    </div>

                    <Link to={`/courses/${course.slug}`}>
                      <h3 className="text-lg font-bold text-[#1a361d] font-heading tracking-tight group-hover:text-[#2d5c36] transition-colors leading-snug">
                        {course.title}
                      </h3>
                    </Link>

                    <p className="text-gray-600 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {course.shortDescription || course.description}
                    </p>

                    {/* Meta details */}
                    <div className="flex items-center gap-4 text-xs text-gray-600 my-4 py-2 border-y border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#40844e]" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-[#1a361d]">{course.rating || '4.9'}</span>
                        <span className="text-gray-400">({course.reviewsCount || '320'})</span>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-1.5 mb-4">
                      {(course.highlights || ['Live Weekend Interactive Labs', '1-on-1 Faculty Mentorship', 'Accredited US Digital Credential']).slice(0, 3).map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#40844e] shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing and Action CTAs */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-baseline justify-between mb-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-[#1a361d] font-mono">${course.pricing?.discountedPrice || 499}</span>
                        <span className="text-xs text-gray-400 line-through font-mono">${course.pricing?.basePrice || course.pricing?.originalPrice || 1299}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#1a361d] bg-[#d8ffd2] px-2.5 py-0.5 rounded-full">
                        Or $99 Deposit
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
                        Enroll Now →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
