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
  FileText,
  ZoomIn,
  Eye
} from 'lucide-react';
import api from '../lib/api';
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
  const [activeCertIdx, setActiveCertIdx] = useState(0);
  const [selectedModalCert, setSelectedModalCert] = useState(null);

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
    <section id="courses" className="py-12 sm:py-16 relative z-10 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 border-t border-slate-200/60 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-10 gap-6 text-left">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-heading uppercase tracking-wider mb-3.5 shadow-xs">
              <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>6-Month Career Training Programs · Dual US & Microsoft Credentials</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-slate-900 dark:text-white tracking-tight leading-tight">
              Fellowship Specializations
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Curriculums engineered with Silicon Valley engineering leads. Deploy production code, defend capstone architectures, and gain lifetime alumni placement support. Reserve any track for $99.
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
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white dark:hover:bg-slate-700'
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
          <div className="mb-12 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/20 dark:border-indigo-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden text-left group">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Visual Column */}
              <div className="lg:col-span-5 relative aspect-[16/10] lg:aspect-auto min-h-[280px] lg:min-h-[420px] overflow-hidden bg-slate-950">
                <img
                  src={getCourseImage(flagship)}
                  alt={flagship.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-slate-950/40 lg:to-slate-950" />

                {/* Floating Top Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
                  <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider border border-indigo-400/30 shadow-md">
                    6-Month Career Training
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-medium">
                    {flagship.duration || '6 Months · Weekend Masterclasses + Labs'}
                  </span>
                </div>

                {/* Bottom Left Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 z-10 text-white space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-mono font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{flagship.cohort || 'Next Cohort: Oct 15, 2026'}</span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{flagship.faculty || 'Silicon Valley & Fortune 500 Faculty'}</span>
                  </div>
                </div>
              </div>

              {/* Right Content Column */}
              <div className="lg:col-span-7 p-5 sm:p-8 flex flex-col justify-between space-y-6 relative">
                <div className="hidden sm:block absolute top-6 right-6 w-20 h-20 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <img src={getCourseIllustration(flagship)} alt="" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-4 mb-2 pr-0 sm:pr-24">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {flagship.category || 'Executive Engineering Track'}
                    </span>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                      Admissions Open · Capped at 30 Fellows
                    </span>
                  </div>

                  <Link to={`/courses/${flagship.slug}`}>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                      {flagship.title}
                    </h3>
                  </Link>

                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {flagship.shortDescription || flagship.description}
                  </p>

                  {/* 3 Structured Curriculum Highlights */}
                  <div className="mt-5 space-y-2.5 border-t border-b border-slate-100 dark:border-slate-800 py-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                      Curriculum Highlights
                    </div>
                    {(
                      flagship.curriculumHighlights || [
                        'Master deep neural architectures, PyTorch, and tensor operations',
                        'Deploy production LangChain vector RAG pipelines on Kubernetes',
                        'Full enterprise capstone defense evaluated by external tech leaders'
                      ]
                    ).map((highlight, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                        <span className="font-medium leading-normal">{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tech Stack Pills */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono text-slate-500 mr-1">Stack:</span>
                    {(flagship.skills?.slice(0, 6) || ['Python 3.12', 'PyTorch', 'Docker', 'LangChain', 'AWS']).map(
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
                      <span className="text-sm text-slate-400 line-through font-mono">
                        ${flagship.pricing?.originalPrice || 1299}
                      </span>
                      <Link
                        to={`/checkout?tier=deposit&courseId=${flagship._id}`}
                        className="text-xs font-bold text-indigo-700 dark:text-indigo-300 font-mono bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded hover:underline"
                      >
                        Reserve with $99
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => (onOpenSyllabusModal ? onOpenSyllabusModal(flagship) : null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download Syllabus</span>
                    </button>

                    <Link
                      to={`/checkout?tier=deposit&courseId=${flagship._id}`}
                      className="elms-btn-primary group"
                    >
                      <span>Reserve Seat — $99</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
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
                  className="elms-card flex flex-col justify-between group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500/40 transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden"
                >
                  <div>
                    {/* Visual Thumbnail Header */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
                      <img
                        src={getCourseImage(course)}
                        alt={course.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30" />

                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-emerald-300 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-mint-dot" />
                        <span>Admissions Open</span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono font-bold text-white bg-indigo-600/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
                          {course.duration || '6-Month Career Training'}
                        </span>

                        <span className="text-[10px] font-bold text-white bg-indigo-900/80 px-2.5 py-0.5 rounded-full shadow-sm border border-indigo-500/30">
                          {course.badge || '6-Month Track'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 relative">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {course.category || 'Specialization Track'}
                        </div>
                        <div className="w-9 h-9 p-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 shrink-0">
                          <img src={getCourseIllustration(course)} alt="" className="w-full h-full object-contain" />
                        </div>
                      </div>

                      <Link to={`/courses/${course.slug}`} className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white font-heading tracking-tight leading-snug">
                          {course.title}
                        </h4>
                      </Link>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed font-normal">
                        {course.shortDescription || course.description}
                      </p>

                      {/* Tech Stack Strip */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                        {(course.skills?.slice(0, 4) || ['Kali Linux', 'Metasploit', 'Burp Suite', 'Python']).map(
                          (skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium border border-slate-200/50 dark:border-slate-700/50"
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
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                          Reserve with $99
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-lg font-black text-slate-900 dark:text-white font-mono">${tuition}</span>
                          <span className="text-xs text-slate-400 line-through font-mono">${originalTuition}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => (onOpenSyllabusModal ? onOpenSyllabusModal(course) : null)}
                          className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Syllabus
                        </button>

                        <Link
                          to={`/checkout?tier=deposit&courseId=${course._id}`}
                          className="elms-btn-primary !text-xs !py-1.5 !px-4 cursor-pointer flex items-center gap-1"
                        >
                          <span>Reserve $99</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Official Microsoft Partner Credential Showcase */}
        <div className="mt-12 p-5 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B132B] to-[#1E1B4B] text-white border border-indigo-500/30 shadow-2xl text-left">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-indigo-500/20">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dual Credential Framework &bull; US Institute + Microsoft Certified</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-white">
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
              <Link
                to="/checkout?tier=deposit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors text-center shadow-md"
              >
                Reserve Seat — $99
              </Link>
            </div>
          </div>

          {/* Certificate Selector Pills */}
          <div className="pt-6">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>Select Microsoft Certification to Inspect:</span>
            </div>

            <div className="flex flex-wrap gap-2 pb-2">
              {MICROSOFT_CERTIFICATES.map((cert, idx) => (
                <button
                  key={cert.id}
                  onClick={() => setActiveCertIdx(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                    activeCertIdx === idx
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/40'
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
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-950/60 p-6 sm:p-8 rounded-2xl border border-indigo-500/20">
              {/* Certificate Image with Zoom Lightbox Trigger */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div
                  onClick={() => setSelectedModalCert(MICROSOFT_CERTIFICATES[activeCertIdx])}
                  className="group relative cursor-pointer rounded-xl overflow-hidden border-2 border-indigo-400/40 shadow-2xl bg-white w-full max-w-md transition-all duration-300 hover:scale-[1.02] hover:border-indigo-400"
                >
                  <img
                    src={MICROSOFT_CERTIFICATES[activeCertIdx].image}
                    alt={MICROSOFT_CERTIFICATES[activeCertIdx].title}
                    className="w-full h-auto object-contain transition-transform duration-300 group-hover:contrast-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <span className="px-3.5 py-1.5 rounded-full bg-white/90 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                      <ZoomIn className="w-4 h-4 text-indigo-600" />
                      <span>Inspect High-Res Certificate</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/95 border-t border-slate-800 text-center flex items-center justify-between text-[11px] font-mono text-indigo-300 px-3">
                    <span className="font-bold text-white">{MICROSOFT_CERTIFICATES[activeCertIdx].code}</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-indigo-400" /> Click to Enlarge
                    </span>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold uppercase border border-indigo-400/30">
                    {MICROSOFT_CERTIFICATES[activeCertIdx].badge}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold uppercase border border-emerald-400/30">
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
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Wyoming Institutional Registry Backed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-indigo-400" />
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
