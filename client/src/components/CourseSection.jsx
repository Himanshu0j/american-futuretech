import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Calendar,
  ArrowRight,
  Clock,
  Award,
  BookOpen,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import api from '../lib/api';

const defaultCoursesFallback = [
  {
    _id: 'default-1',
    title: 'Data Science with AI Integration',
    slug: 'data-science-with-ai-integration',
    category: 'Artificial Intelligence & Analytics',
    duration: '6 Months',
    shortDescription: 'Master modern machine learning, deep neural architectures, and end-to-end vector pipeline deployment.',
    pricing: { discountedPrice: 499, originalPrice: 1299 },
    badge: 'Most Popular',
    skills: ['Python 3.12', 'PyTorch', 'LangChain', 'Vector DBs', 'MLOps'],
  },
  {
    _id: 'default-2',
    title: 'Cyber Security with Ethical Hacking',
    slug: 'cyber-security-with-ethical-hacking',
    category: 'Information Security & Offensive Operations',
    duration: '6 Months',
    shortDescription: 'Offensive penetration testing, vulnerability assessment, threat intelligence, and digital forensics.',
    pricing: { discountedPrice: 499, originalPrice: 1299 },
    badge: 'High Demand',
    skills: ['Kali Linux', 'Metasploit', 'Burp Suite', 'Network Defense', 'SIEM'],
  },
  {
    _id: 'default-3',
    title: 'Cyber Security & Artificial Intelligence Hybrid',
    slug: 'cyber-security-and-artificial-intelligence',
    category: 'Information Security & Offensive Operations',
    duration: '6 Months',
    shortDescription: 'Dual-specialization combining offensive penetration testing with machine learning-driven threat mitigation.',
    pricing: { discountedPrice: 599, originalPrice: 1499 },
    badge: 'Flagship Track',
    skills: ['AI Red Teaming', 'Adversarial ML', 'Cloud Security', 'Automated Defense'],
  }
];

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

export default function CourseSection({ onSelectCourse, onOpenSyllabusModal }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        if (res.data.success && res.data.courses.length > 0) {
          setCourses(res.data.courses);
        } else {
          setCourses(defaultCoursesFallback);
        }
      } catch (err) {
        setCourses(defaultCoursesFallback);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filterCategories = [
    'All',
    'Artificial Intelligence',
    'Cyber Security',
    'Cloud',
  ];

  const filteredCourses = courses.filter((c) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Artificial Intelligence') {
      return c.category?.toLowerCase().includes('intelligence') || c.title?.toLowerCase().includes('ai') || c.title?.toLowerCase().includes('data');
    }
    if (activeFilter === 'Cyber Security') {
      return c.category?.toLowerCase().includes('security') || c.title?.toLowerCase().includes('cyber') || c.title?.toLowerCase().includes('hacking');
    }
    if (activeFilter === 'Cloud') {
      return c.category?.toLowerCase().includes('cloud') || c.title?.toLowerCase().includes('devops') || c.title?.toLowerCase().includes('cloud');
    }
    return true;
  });

  return (
    <section id="courses" className="py-16 sm:py-24 relative z-10 bg-[#fffff2] text-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 text-left">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d8ffd2] text-[#1a361d] text-xs font-bold font-heading uppercase tracking-wider mb-3">
              <span>Accredited Curriculum</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#1a361d] tracking-tight leading-tight">
              Fellowship Specializations
            </h2>

            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              Engineered with US industry leaders. Work directly on production codebases, deploy real architectures, and receive dedicated 1-on-1 placement support.
            </p>
          </div>

          {/* Track Filter Tabs (Easy LMS Pill Style) */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
            {filterCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === cat
                    ? 'bg-[#1a361d] text-[#fffff2] shadow-sm'
                    : 'text-[#1a361d]/80 hover:text-[#1a361d] hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Course Directory Layout with Visual Thumbnails */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-left">
          {filteredCourses.map((course) => {
            const tuition = course.pricing?.discountedPrice || 499;
            const originalTuition = course.pricing?.originalPrice || 1299;

            return (
              <div
                key={course._id || course.slug}
                className="elms-card flex flex-col justify-between group relative bg-white border border-gray-200 rounded-2xl hover:border-[#1a361d]/30 transition-all shadow-sm hover:shadow-xl overflow-hidden hover-glow-ambient"
              >
                <div>
                  {/* Visual Context Thumbnail Header */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-900">
                    <img
                      src={getCourseImage(course)}
                      alt={course.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a361d]/90 via-transparent to-black/20" />
                    
                    {/* Top-Left Live Status Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-[#d8ffd2]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#76ff8a] pulse-mint-dot" />
                      <span>Admissions Open</span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-mono font-bold text-white bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
                        {course.duration || '6 Months'}
                      </span>

                      {course.badge && (
                        <span className="text-[10px] font-bold text-[#fffff2] bg-[#9e4f8f] px-2.5 py-0.5 rounded-full shadow-sm">
                          {course.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Category Label */}
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#40844e] mb-1.5">
                      {course.category || 'Specialization Track'}
                    </div>

                    {/* Program Title */}
                    <Link
                      to={`/courses/${course.slug}`}
                      className="block group-hover:text-[#2d5c36] transition-colors"
                    >
                      <h3 className="text-lg font-bold text-[#1a361d] font-heading tracking-tight leading-snug">
                        {course.title}
                      </h3>
                    </Link>

                    {/* Summary */}
                    <p className="text-xs text-gray-600 mt-2.5 line-clamp-2 leading-relaxed font-normal">
                      {course.shortDescription || course.description}
                    </p>

                    {/* Skills / Modules Strip */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                      {(course.skills?.slice(0, 4) || ['PyTorch', 'LangChain', 'Docker', 'MLOps']).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action & Tuition Strip */}
                <div className="p-6 pt-0">
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">
                        Reserve with $99
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-base font-extrabold text-[#1a361d] font-mono">${tuition}</span>
                        <span className="text-xs text-gray-400 line-through font-mono">${originalTuition}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenSyllabusModal ? onOpenSyllabusModal(course) : null}
                        className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[#1a361d] text-xs font-bold transition-colors cursor-pointer"
                        title="View Detailed Curriculum"
                      >
                        Syllabus
                      </button>

                      <button
                        onClick={() => onSelectCourse ? onSelectCourse(course) : null}
                        className="elms-btn-primary !text-xs !py-1.5 !px-4 cursor-pointer"
                      >
                        <span>Apply</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Catalog Discovery Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div>
            <div className="text-sm font-bold text-[#1a361d] font-heading">
              Looking for corporate group training or customized syllabus tracks?
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              We provide enterprise cohorts for engineering organizations with specialized security and AI stacks.
            </div>
          </div>

          <Link
            to="/courses"
            className="elms-btn-secondary !text-xs !py-2.5 !px-5 whitespace-nowrap shrink-0"
          >
            <span>Browse Complete Catalog (7 Programs)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
}
