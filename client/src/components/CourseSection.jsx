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
  Users,
  Terminal,
  FileText
} from 'lucide-react';
import api from '../lib/api';

const defaultCoursesFallback = [
  {
    _id: 'default-1',
    title: 'Data Science with AI Integration',
    slug: 'data-science-with-ai-integration',
    category: 'Artificial Intelligence & Analytics',
    duration: '6 Months · Weekend Masterclasses + Lab',
    shortDescription:
      'Master modern machine learning, deep neural architectures, PyTorch, and end-to-end vector pipeline deployment on cloud infrastructure.',
    pricing: { discountedPrice: 499, originalPrice: 1299 },
    badge: 'Flagship Track',
    cohort: 'Next Cohort: Oct 15, 2026',
    faculty: 'Silicon Valley ML Practitioners',
    curriculumHighlights: [
      'Deep learning with PyTorch, CUDA acceleration, and tensor operations',
      'Production LLM architectures, RAG vector indexing, and LangChain agents',
      'Enterprise capstone: deploy low-latency inference pipelines on AWS/GCP'
    ],
    skills: ['Python 3.12', 'PyTorch', 'LangChain', 'Vector DBs', 'MLOps', 'Docker']
  },
  {
    _id: 'default-2',
    title: 'Cyber Security with Ethical Hacking',
    slug: 'cyber-security-with-ethical-hacking',
    category: 'Information Security & Offensive Operations',
    duration: '6 Months · 150+ Hands-on Labs',
    shortDescription:
      'Offensive penetration testing, vulnerability assessment, threat intelligence, and digital forensics in dedicated Kali Linux virtual sandboxes.',
    pricing: { discountedPrice: 499, originalPrice: 1299 },
    badge: 'High Demand',
    cohort: 'Next Cohort: Oct 22, 2026',
    faculty: 'Active US Red Team Operators',
    curriculumHighlights: [
      'Offensive network penetration, Metasploit, and Burp Suite Pro testing',
      'Active Directory exploitation, privilege escalation, and evasion techniques',
      'SIEM telemetry, SOC operations, and NIST cybersecurity framework'
    ],
    skills: ['Kali Linux', 'Metasploit', 'Burp Suite', 'Network Defense', 'SIEM', 'Wireshark']
  },
  {
    _id: 'default-3',
    title: 'Cyber Security & Artificial Intelligence Hybrid',
    slug: 'cyber-security-and-artificial-intelligence',
    category: 'Information Security & Offensive Operations',
    duration: '6 Months · Dual Specialization',
    shortDescription:
      'Dual-specialization combining offensive penetration testing with machine learning-driven threat detection and AI red teaming.',
    pricing: { discountedPrice: 599, originalPrice: 1499 },
    badge: 'Executive Track',
    cohort: 'Next Cohort: Nov 05, 2026',
    faculty: 'AI Security Researchers & CISOs',
    curriculumHighlights: [
      'Adversarial ML attacks: prompt injection, model inversion, jailbreaking',
      'Automated SOC defense with autonomous security agent workflows',
      'Zero-trust cloud architecture & cryptographically signed workloads'
    ],
    skills: ['AI Red Teaming', 'Adversarial ML', 'Cloud Security', 'Automated Defense', 'Python']
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

  // Flagship program (first item or designated flagship)
  const flagship = filteredCourses.length > 0 ? filteredCourses[0] : null;
  const secondaryCourses = filteredCourses.length > 1 ? filteredCourses.slice(1) : [];

  return (
    <section id="courses" className="py-20 sm:py-28 relative z-10 bg-[#fffff2] text-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6 text-left">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d8ffd2] border border-[#10b981]/30 text-[#1a361d] text-xs font-bold font-heading uppercase tracking-wider mb-3.5 shadow-xs">
              <Award className="w-3.5 h-3.5 text-[#10b981]" />
              <span>Editorial Program Showcase</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-[#1a361d] tracking-tight leading-tight">
              Fellowship Specializations
            </h2>

            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              Curriculums engineered with Silicon Valley engineering leads. Deploy production code, defend capstone architectures, and gain lifetime alumni placement support.
            </p>
          </div>

          {/* Track Filter Tabs (Refined Pill Style) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
            {filterCategories.map((cat) => {
              const isSelected = activeFilter === cat || (cat === 'All Programs' && activeFilter === 'All');
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a361d] text-[#fffff2] shadow-sm'
                      : 'text-gray-600 hover:text-[#1a361d] hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* FLAGSHIP HERO SHOWCASE CARD (Stanford/Wharton Executive Style) */}
        {flagship && (
          <div className="mb-12 rounded-3xl bg-white border-2 border-[#1a361d]/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden text-left group">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Visual Column */}
              <div className="lg:col-span-5 relative aspect-[16/10] lg:aspect-auto min-h-[280px] lg:min-h-[420px] overflow-hidden bg-gray-950">
                <img
                  src={getCourseImage(flagship)}
                  alt={flagship.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1b11] via-[#0f1b11]/50 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[#0f1b11]/40 lg:to-[#0f1b11]" />

                {/* Floating Top Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
                  <span className="px-3 py-1 rounded-full bg-[#1a361d] text-[#76ff8a] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#76ff8a]/30 shadow-md">
                    {flagship.badge || 'Flagship Track'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-medium">
                    {flagship.duration || '6 Months · Weekend Masterclasses'}
                  </span>
                </div>

                {/* Bottom Left Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 z-10 text-white space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#76ff8a] font-mono font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{flagship.cohort || 'Next Cohort: Oct 15, 2026'}</span>
                  </div>
                  <div className="text-xs text-gray-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>{flagship.faculty || 'Silicon Valley & Fortune 500 Faculty'}</span>
                  </div>
                </div>
              </div>

              {/* Right Content Column */}
              <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#10b981]">
                      {flagship.category || 'Executive Engineering Track'}
                    </span>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#d8ffd2] text-[#1a361d] font-bold">
                      Limited Cohort Cap: 30 Fellows
                    </span>
                  </div>

                  <Link to={`/courses/${flagship.slug}`}>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#1a361d] font-heading tracking-tight group-hover:text-[#2d5c36] transition-colors leading-tight">
                      {flagship.title}
                    </h3>
                  </Link>

                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                    {flagship.shortDescription || flagship.description}
                  </p>

                  {/* 3 Structured Curriculum Highlights */}
                  <div className="mt-5 space-y-2.5 border-t border-b border-gray-100 py-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono">
                      Curriculum Highlights
                    </div>
                    {(
                      flagship.curriculumHighlights || [
                        'Master deep neural architectures, PyTorch, and tensor operations',
                        'Deploy production LangChain vector RAG pipelines on Kubernetes',
                        'Full enterprise capstone defense evaluated by external tech leaders'
                      ]
                    ).map((highlight, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-2.5 text-xs text-gray-700">
                        <div className="w-4 h-4 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                        <span className="font-medium leading-normal">{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tech Stack Pills */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono text-gray-500 mr-1">Stack:</span>
                    {(flagship.skills?.slice(0, 6) || ['Python 3.12', 'PyTorch', 'Docker', 'LangChain', 'AWS']).map(
                      (skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[11px] font-mono bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-md font-medium"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Bottom Pricing and Actions */}
                <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono text-gray-500 uppercase tracking-wider font-semibold">
                      Tuition & Reservation
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-black text-[#1a361d] font-mono">
                        ${flagship.pricing?.discountedPrice || 499}
                      </span>
                      <span className="text-sm text-gray-400 line-through font-mono">
                        ${flagship.pricing?.originalPrice || 1299}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 font-mono bg-[#d8ffd2] px-2 py-0.5 rounded">
                        Reserve with $99
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => (onOpenSyllabusModal ? onOpenSyllabusModal(flagship) : null)}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1a361d] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download Syllabus</span>
                    </button>

                    <button
                      onClick={() => (onSelectCourse ? onSelectCourse(flagship) : null)}
                      className="elms-btn-primary group"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECONDARY TRACKS MODULAR GRID */}
        {secondaryCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8 text-left">
            {secondaryCourses.map((course) => {
              const tuition = course.pricing?.discountedPrice || 499;
              const originalTuition = course.pricing?.originalPrice || 1299;

              return (
                <div
                  key={course._id || course.slug}
                  className="elms-card flex flex-col justify-between group bg-white border border-gray-200 rounded-2xl hover:border-[#1a361d]/40 transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden"
                >
                  <div>
                    {/* Visual Thumbnail Header */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-950">
                      <img
                        src={getCourseImage(course)}
                        alt={course.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a361d]/90 via-transparent to-black/30" />

                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-[#d8ffd2]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#76ff8a] pulse-mint-dot" />
                        <span>Admissions Open</span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono font-bold text-white bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
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
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#10b981] mb-1.5">
                        {course.category || 'Specialization Track'}
                      </div>

                      <Link to={`/courses/${course.slug}`} className="block group-hover:text-[#2d5c36] transition-colors">
                        <h4 className="text-lg font-bold text-[#1a361d] font-heading tracking-tight leading-snug">
                          {course.title}
                        </h4>
                      </Link>

                      <p className="text-xs text-gray-600 mt-2.5 line-clamp-2 leading-relaxed font-normal">
                        {course.shortDescription || course.description}
                      </p>

                      {/* Tech Stack Strip */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                        {(course.skills?.slice(0, 4) || ['Kali Linux', 'Metasploit', 'Burp Suite', 'Python']).map(
                          (skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[10px] font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded font-medium"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Tuition & CTAs */}
                  <div className="p-6 pt-0">
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">
                          Reserve with $99
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-lg font-black text-[#1a361d] font-mono">${tuition}</span>
                          <span className="text-xs text-gray-400 line-through font-mono">${originalTuition}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => (onOpenSyllabusModal ? onOpenSyllabusModal(course) : null)}
                          className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[#1a361d] text-xs font-bold transition-colors cursor-pointer"
                        >
                          Syllabus
                        </button>

                        <button
                          onClick={() => (onSelectCourse ? onSelectCourse(course) : null)}
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
        )}

        {/* Enterprise Group Training Discovery Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div>
            <div className="text-sm font-bold text-[#1a361d] font-heading">
              Looking for corporate group training or customized enterprise cohorts?
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              We provide private cohorts with customized AI red teaming and LLM infrastructure curriculums for engineering teams.
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
