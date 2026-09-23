import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock, Star, Award, CheckCircle2, FileText, ArrowRight, Play,
  ChevronDown, ChevronUp, Shield, Users, Sparkles, Download, PhoneCall,
  Calendar, Briefcase, Zap, Check, Lock, BookOpen, Layers, ZoomIn, Eye,
  ShieldCheck, MessageSquare, Monitor, GraduationCap, Mail, Sparkle,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LeadModal from '../components/LeadModal';
import CertificateModal from '../components/CertificateModal';
import { getAlignedMicrosoftCert } from '../data/microsoftCertificates';
import { getDetailedCourseData, getToolLogo } from '../data/courseContentData';
import { useSiteSettings } from '../context/SiteSettingsContext';

export default function CourseDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModuleIndex, setOpenModuleIndex] = useState(0);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedModalCert, setSelectedModalCert] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/courses');
      const courses = res.data.courses || [];

      // Flexible slug matching: handles slug string, mongo _id, numeric id (e.g. "8"), or title keyword
      let found = courses.find(c =>
        c.slug === slug ||
        c._id === slug ||
        String(c.id) === slug ||
        (slug === '8' && (c.slug?.includes('data-science') || c.title?.toLowerCase().includes('data science')))
      );

      // Fallback if slug is "8" or unknown
      if (!found && slug === '8') {
        found = courses.find(c => c.slug?.includes('data-science') || c.title?.toLowerCase().includes('data science')) || courses[0];
      } else if (!found) {
        found = courses[0];
      }

      setCourse(found);

      if (found) {
        try {
          const curRes = await axios.get(`/api/curriculum/courses/${found._id}`);
          setCurriculum(curRes.data.modules || []);
        } catch (curErr) {
          console.warn('Curriculum API fallback', curErr);
        }
      }
    } catch (err) {
      console.error('Failed to load course details', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center text-[#0B1220] font-sans text-sm">
        <div className="w-10 h-10 border-4 border-[#0B1220]/20 border-t-[#0B1220] rounded-full animate-spin mb-4" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-[#0B1220] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-display font-bold mb-4">Program Not Found</h2>
        <Link to="/courses" className="px-6 py-2.5 bg-[#4338CA] text-white rounded-full font-semibold hover:bg-[#3730A3] transition-colors">
          Browse All Programs
        </Link>
      </div>
    );
  }

  // Retrieve comprehensive data
  const detailedData = getDetailedCourseData(course);
  const alignedMsCert = getAlignedMicrosoftCert(course.slug || course.category || course.title);

  const toolsList = detailedData.tools || [
    { name: 'Python', icon: '/images/tools/python.svg' },
    { name: 'TensorFlow', icon: '/images/tools/tensorflow.svg' },
    { name: 'PyTorch', icon: '/images/tools/pytorch.svg' },
    { name: 'Scikit-Learn', icon: '/images/tools/scikitlearn.svg' },
    { name: 'Pandas', icon: '/images/tools/pandas.svg' },
    { name: 'NumPy', icon: '/images/tools/numpy.svg' },
    { name: 'Jupyter', icon: '/images/tools/jupyter.svg' },
    { name: 'Tableau', icon: '/images/tools/tableau.svg' },
    { name: 'Power BI', icon: '/images/tools/powerbi.svg' },
    { name: 'OpenAI / LLMs', icon: '/images/tools/openai.svg' },
    { name: 'LangChain', icon: '/images/tools/langchain.svg' },
    { name: 'Docker', icon: '/images/tools/docker.svg' },
  ];

  const whyChooseList = detailedData.whyChoose || [];
  const whoCanApplyList = detailedData.whoCanApply || [];
  const audiencePills = detailedData.audiencePills || [];
  // Admin-defined capstone projects take priority; fallback to static course data
  const adminCapstones = settings?.capstone?.projects;
  const capstones = (adminCapstones && adminCapstones.length > 0)
    ? adminCapstones
    : (detailedData.capstoneProjects || []);
  const careerRoles = detailedData.careerRoles || [];
  const certImages = detailedData.certificates || {};

  // ── Admin-controlled blocks (edited on this course in Curriculum & Courses CMS) ──
  const eligibility = course?.eligibility || {};
  const eligibilityPoints = eligibility.points?.length ? eligibility.points : whoCanApplyList;
  const certificationPoints = eligibility.certificationPoints?.length
    ? eligibility.certificationPoints
    : [
        'Official American FutureTech US Fellowship Diploma',
        'Microsoft Certified Professional Exam Alignment',
        'Permanent Credential Verification on Global Ledger',
      ];
  const audienceTags = eligibility.audiences?.length
    ? eligibility.audiences
    : audiencePills.map((p) => p.tag);
  const audienceColors = [
    'from-[#4338CA] to-[#6366F1]',
    'from-emerald-600 to-teal-500',
    'from-rose-500 to-pink-500',
    'from-violet-600 to-fuchsia-500',
  ];

  // "Choose your learning experience" — the admin ticks decide which cards show.
  const showGroupBatch = course?.viewOptions?.groupBatch !== false;
  const showPersonalizedMentor = course?.viewOptions?.personalizedMentor !== false;
  const personalized = settings?.personalizedLearning || {};
  const groupPrice = Number(course?.pricing?.discountedPrice) || Number(course?.pricing?.basePrice) || 0;
  const groupOriginal = Number(course?.pricing?.basePrice) || groupPrice;
  const personalizedPrice = Number(personalized.price) || Number(personalized.fee) || 5499;
  const personalizedOriginal = Number(personalized.originalPrice) || Number(personalized.originalFee) || personalizedPrice;
  const groupFeatures = (course?.highlights?.length ? course.highlights : [
    `${course?.duration || '6 Months'} live syllabus`,
    'Hands-on projects and guided labs',
    'Career preparation and portfolio support',
    'Lifetime community access',
  ]).slice(0, 5);
  const personalizedFeatures = (Array.isArray(personalized.features) && personalized.features.length
    ? personalized.features
    : [
        'Everything in group classes',
        'Weekly private mentorship',
        'Personalized interview preparation',
        'Salary negotiation and career support',
      ]).slice(0, 5);

  const whyIcons = {
    MessageSquare,
    ShieldCheck,
    CheckCircle2,
    Monitor,
    GraduationCap,
    Briefcase
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-800 font-sans antialiased relative selection:bg-[#E5C275] selection:text-[#0B1220]">
      <Navbar onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      <main className="pt-24 pb-10">
        {/* Breadcrumb strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link to="/" className="hover:text-[#0B1220] transition-colors">Home</Link>
            <span>/</span>
            <Link to="/courses" className="hover:text-[#0B1220] transition-colors">Academy Programs</Link>
            <span>/</span>
            <span className="text-[#0B1220] font-semibold truncate">{course.title}</span>
          </nav>
        </div>

        {/* 1. Course Hero Banner Container */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="rounded-3xl bg-[#0B1220] text-white p-6 sm:p-7 lg:p-8 shadow-xl border border-[#4338CA] relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-16 w-96 h-96 bg-[#E5C275]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-16 w-96 h-96 bg-[#4338CA]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start relative z-10">
              {/* Left Column: Course Header Info */}
              <div className="lg:col-span-8">
                <div className="flex flex-wrap items-center gap-2.5 mb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0B1220] bg-[#EFE6D6] px-3.5 py-1.5 rounded-full shadow-xs">
                    {course.category || 'Career Program'}
                  </span>
                  <span className="text-xs font-semibold text-[#E5C275] bg-[#E5C275]/15 px-3.5 py-1.5 rounded-full border border-[#E5C275]/40">
                    Dual US & Microsoft Accredited
                  </span>
                  <span className="text-xs font-medium text-emerald-200 bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-500/30">
                    Live Mentor-Led Cohort
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-tight mb-5">
                  {course.title}
                </h1>

                <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed mb-8 max-w-3xl">
                  {course.description || 'Master enterprise Data Science and Artificial Intelligence from core predictive algorithms to real-time LLM agent orchestration, mentored live by active Silicon Valley architects.'}
                </p>

                {/* Key Metrics / Highlights Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0B1220]/90 border border-[#4338CA] text-center sm:text-left backdrop-blur-xs mb-8">
                  <div>
                    <div className="text-xs text-emerald-300/80 font-medium">Duration</div>
                    <div className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                      <Clock className="w-4 h-4 text-[#E5C275]" />
                      {course.duration || '24 Weeks'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-300/80 font-medium">Student Rating</div>
                    <div className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                      <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                      {course.rating || '4.9'} / 5.0
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-300/80 font-medium">Learning Format</div>
                    <div className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                      <Zap className="w-4 h-4 text-[#E5C275]" />
                      Live Interactive Lab
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-300/80 font-medium">Placement Support</div>
                    <div className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                      <Briefcase className="w-4 h-4 text-[#E5C275]" />
                      100% Career Assistance
                    </div>
                  </div>
                </div>

                {/* Key Skills Tags */}
                <div>
                  <div className="text-xs font-bold text-emerald-300/90 uppercase tracking-wider mb-3">Skills You Will Master:</div>
                  <div className="flex flex-wrap gap-2">
                    {(course.skills || ['Machine Learning', 'Deep Learning', 'PyTorch', 'Vector Databases', 'RAG Pipelines', 'Computer Vision', 'LLM Fine-Tuning', 'MLOps']).map((skill, i) => (
                      <span key={i} className="px-3.5 py-1.5 rounded-full bg-[#0B1220] text-emerald-100 text-xs font-semibold border border-[#4338CA] shadow-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Enrollment Card */}
              <div className="lg:col-span-4 lg:sticky lg:top-28">
                <div className="rounded-3xl bg-white text-slate-800 p-6 sm:p-5 shadow-2xl border border-slate-200/80">
                  <div className="mb-6 pb-5 border-b border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tuition Investment</div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-3xl font-display font-black text-[#0B1220]">${course.pricing?.discountedPrice || 1899}</span>
                      <span className="text-sm text-slate-400 line-through">${course.pricing?.basePrice || 2499}</span>
                    </div>
                    <div className="text-xs text-[#4338CA] font-bold flex items-center gap-1.5 mt-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                      Save ${(course.pricing?.basePrice || 2499) - (course.pricing?.discountedPrice || 1899)} with institutional scholarship
                    </div>
                  </div>

                  {/* Flexible Deposit Box */}
                  <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-[#E5C275]/60 mb-4 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0B1220]">
                        Flexible Seat Deposit
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#EFE6D6] text-[#0B1220] text-[10px] font-black uppercase tracking-wider">
                        Most Popular
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                      Reserve your seat in the upcoming cohort today with just <strong>$99 down</strong>. Remainder payable prior to start.
                    </p>
                    <Link
                      to={`/checkout?courseId=${course._id}&tier=deposit`}
                      className="w-full py-3 px-4 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white text-sm font-bold text-center shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      Reserve Seat for $99
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <Link
                    to={`/checkout?courseId=${course._id}&tier=full`}
                    className="w-full py-2.5 px-4 rounded-full border-2 border-[#0B1220] hover:bg-[#0B1220] hover:text-white text-[#0B1220] text-sm font-bold text-center transition-all flex items-center justify-center gap-2 mb-3"
                  >
                    Enroll Full Tuition (${course.pricing?.discountedPrice || 1899})
                  </Link>

                  <button
                    onClick={() => setIsLeadModalOpen(true)}
                    className="w-full py-2 px-4 rounded-full text-slate-600 hover:text-[#0B1220] hover:bg-slate-100 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-2 mb-4 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#10B981]" />
                    Talk to Admissions Counselor
                  </button>

                  {/* Seat Urgency Badge */}
                  <div className="text-center py-2.5 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    {course.seatsUrgencyText || 'Only 3 seats remaining for this cohort'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Data Science & AI Program Tools Covered */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-[#0B1220] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkle className="w-3.5 h-3.5 text-[#4338CA]" />
              Hands-On Industry Toolkit
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#0B1220] tracking-tight">
              {detailedData.heroTitle || `${course.title} Program`} Tools Covered
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Master enterprise-grade frameworks, libraries, and cloud platforms trusted by top technology teams globally.
            </p>
          </div>

          {/* Compact tool grid: 6 columns on desktop, small square boxes */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {toolsList.map((tool, idx) => {
              const iconPath = tool.icon || getToolLogo(tool.name || tool);
              const toolName = tool.name || tool;

              return (
                <div
                  key={idx}
                  className="group rounded-xl bg-white border border-slate-200/80 p-2.5 text-center shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center justify-center cursor-default"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 group-hover:bg-slate-100/80 group-hover:scale-105 transition-all duration-200">
                    <img
                      src={iconPath}
                      alt={toolName}
                      className="w-6 h-6 object-contain"
                      loading="lazy"
                    />
                  </div>

                  <h3 className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-slate-700 tracking-tight leading-tight truncate w-full group-hover:text-[#0B1220] transition-colors">
                    {toolName}
                  </h3>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Why Get Certification From American FutureTech (6 Feature Cards) */}
        <section className="bg-slate-50/70 border-y border-slate-200/70 py-10 sm:py-12 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE6D6] text-[#0B1220] text-xs font-bold uppercase tracking-wider mb-3">
                <Award className="w-3.5 h-3.5 text-[#4338CA]" />
                The American FutureTech Advantage
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#0B1220] tracking-tight max-w-3xl mx-auto">
                Why Get {course.title} Certification From American FutureTech
              </h2>
              <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                We combine rigorous Ivy-League caliber syllabus with practical, production-ready engineering drills and direct career placement pipelines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6">
              {whyChooseList.map((item, idx) => {
                const IconComponent = whyIcons[item.icon] || CheckCircle2;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center mb-5 shadow-md`}>
                        <IconComponent className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2.5 font-display">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-[#4338CA]">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      <span>Guaranteed Standard</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3b. Choose Your Learning Experience — Group batch vs Personalized mentor */}
        {(showGroupBatch || showPersonalizedMentor) && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold uppercase tracking-wider mb-3">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />
                Choose Your Learning Experience
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#0B1220] tracking-tight">
                One curriculum. Two ways to learn.
              </h2>
              <p className="text-slate-600 text-base mt-3 leading-relaxed">
                Select the support level that matches your schedule and career goals. Pricing is shown in USD.
              </p>
            </div>

            <div
              className={`grid grid-cols-1 gap-5 ${
                showGroupBatch && showPersonalizedMentor ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto'
              }`}
            >
              {showGroupBatch && (
                <div className="rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col">
                  <div className="p-6 sm:p-7 flex flex-col flex-1">
                    <h3 className="text-2xl font-bold font-display text-[#0B1220]">Group Classes</h3>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                      Full Immersive Journey
                    </div>

                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="text-4xl font-black font-display text-[#0B1220]">${groupPrice.toLocaleString()}</span>
                      {groupOriginal > groupPrice && (
                        <span className="text-sm text-slate-400 line-through">${groupOriginal.toLocaleString()}</span>
                      )}
                    </div>

                    <ul className="mt-6 space-y-3 text-sm text-slate-700 flex-1">
                      {groupFeatures.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={`/checkout?tier=full&courseId=${course._id}`}
                      className="mt-7 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white border-2 border-[#0B1220] text-[#0B1220] hover:bg-[#0B1220] hover:text-white text-sm font-bold transition-colors"
                    >
                      Enroll in group classes <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {showPersonalizedMentor && (
                <div className="relative rounded-3xl bg-gradient-to-br from-[#0B1220] via-[#1B2740] to-[#0B1220] text-white shadow-2xl border border-[#4338CA]/40 flex flex-col overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-52 h-52 bg-[#E5C275]/20 rounded-full blur-3xl pointer-events-none" />
                  <span className="absolute top-5 right-5 px-3 py-1 rounded-full bg-[#E5C275] text-[#0B1220] text-[10px] font-black uppercase tracking-wider">
                    Most Popular
                  </span>
                  <div className="p-6 sm:p-7 flex flex-col flex-1 relative">
                    <h3 className="text-2xl font-bold font-display text-white">Personalized Services</h3>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#E5C275] mt-1">
                      Top Industry Mentor Track
                    </div>

                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="text-4xl font-black font-display text-white">${personalizedPrice.toLocaleString()}</span>
                      {personalizedOriginal > personalizedPrice && (
                        <span className="text-sm text-white/50 line-through">${personalizedOriginal.toLocaleString()}</span>
                      )}
                    </div>

                    <ul className="mt-6 space-y-3 text-sm text-slate-200 flex-1">
                      {personalizedFeatures.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-[#E5C275] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={`/checkout?tier=personalized&courseId=${course._id}`}
                      className="mt-7 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#E5C275] text-[#0B1220] hover:bg-white text-sm font-bold transition-colors"
                    >
                      Enroll in personalized classes <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4. Who Can Apply for this Course */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-center">
            {/* Left: Numbered Criteria */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-900 text-xs font-bold uppercase tracking-wider mb-3">
                <Users className="w-3.5 h-3.5 text-violet-700" />
                {eligibility.eyebrow || 'Eligibility & Candidate Profile'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#0B1220] tracking-tight mb-4">
                {eligibility.title || 'Who Can Apply for this Course?'}
              </h2>
              <p className="text-slate-600 text-base mb-8 leading-relaxed">
                {eligibility.subtitle || 'Our fellowship is designed to bridge learners from diverse professional and academic backgrounds into high-tier technology roles.'}
              </p>

              <div className="space-y-4">
                {eligibilityPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#0B1220]/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#0B1220] text-[#E5C275] font-display font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium pt-0.5">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Globally Recognised Certification Card + Audience Pills */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl bg-gradient-to-br from-[#0B1220] via-[#1f4223] to-[#0B1220] text-white p-6 sm:p-6 shadow-2xl border border-[#4338CA] relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-[#E5C275]/20 rounded-full blur-2xl pointer-events-none" />
                <div className="w-12 h-12 rounded-2xl bg-[#E5C275]/20 border border-[#E5C275]/40 text-[#E5C275] flex items-center justify-center mb-5">
                  <Award className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold font-display text-white mb-3">
                  {eligibility.certificationTitle || 'Globally Recognised Certification'}
                </h3>
                <p className="text-sm text-emerald-100/90 leading-relaxed mb-6">
                  {eligibility.certificationText || 'Earn a verified credential recognized by Fortune 500 employers across the United States, Europe, and Asia. Accelerate your career with measurable credentials.'}
                </p>

                <div className="space-y-2.5 text-xs text-emerald-200 font-medium pt-2 border-t border-[#4338CA]">
                  {certificationPoints.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#E5C275] shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audience Category Badges */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Target Audiences Welcomed:</div>
                <div className="flex flex-wrap gap-2.5">
                  {audienceTags.map((tag, i) => (
                    <span
                      key={i}
                      className={`px-4 py-2 rounded-full bg-gradient-to-r ${
                        eligibility.audiences?.length
                          ? audienceColors[i % audienceColors.length]
                          : (audiencePills[i]?.color || audienceColors[i % audienceColors.length])
                      } text-white text-xs font-bold shadow-xs`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Curriculum Section (Preserved & Enhanced) */}
        <section className="bg-[#f7f9f6] border-y border-slate-200/70 py-10 sm:py-12 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#0B1220] text-xs font-bold uppercase tracking-wider mb-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Structured Syllabus
                </div>
                <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#0B1220]">
                  {course.title} Course Curriculum
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  {curriculum.length} enterprise modules aligned with real production workflows.
                </p>
              </div>
            </div>

            {/* Accordion List */}
            <div className="space-y-3.5 max-w-4xl mx-auto">
              {curriculum.map((mod, index) => {
                const isOpen = openModuleIndex === index;
                return (
                  <div
                    key={mod._id || index}
                    className="rounded-2xl bg-white border border-slate-200 overflow-hidden transition-all shadow-xs hover:border-[#0B1220]/40"
                  >
                    <button
                      onClick={() => setOpenModuleIndex(isOpen ? -1 : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="w-11 h-11 rounded-xl bg-[#EFE6D6] text-[#0B1220] font-display font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          {index + 1 < 10 ? `0${index + 1}` : index + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-[#0B1220] truncate leading-tight">
                            {mod.title}
                          </h3>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                            <span>{mod.lessons?.length || 4} Lessons</span>
                            {mod.quiz && (
                              <>
                                <span>•</span>
                                <span className="text-[#4338CA] font-semibold">1 Assessment</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-2.5 bg-[#fafbf9]">
                        {mod.description && (
                          <p className="text-xs text-slate-600 py-2 leading-relaxed">{mod.description}</p>
                        )}
                        <div className="space-y-2">
                          {(mod.lessons || []).map((lesson, lIdx) => (
                            <div
                              key={lesson._id || lIdx}
                              className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Play className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                                <span className="truncate font-medium">{lesson.title}</span>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0 text-slate-500">
                                <span>{lesson.videoDuration || '45m'}</span>
                                {lesson.isPreview && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFE6D6] text-[#0B1220]">
                                    Free Preview
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Capstone Projects: compact cards, 3 per row */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 text-teal-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              Build &amp; Showcase
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#0B1220] tracking-tight">
              Capstone Projects
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Hands-on enterprise projects covering the full end-to-end learning lifecycle. Deploy real systems to showcase to hiring managers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {capstones.map((proj, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col group"
              >
                {/* Colored Top Accent Banner */}
                <div className={`h-0.5 w-full bg-gradient-to-r ${proj.color || 'from-indigo-500 to-blue-500'}`} />

                <div className="p-3.5 flex-1">
                  <span className={`inline-block px-2 py-0.5 rounded-full bg-gradient-to-r ${proj.color || 'from-indigo-500 to-blue-500'} text-white text-[9px] font-bold uppercase tracking-wider mb-1.5 shadow-xs`}>
                    {proj.tag}
                  </span>

                  <h3 className="text-[13px] font-bold text-slate-900 mb-1 group-hover:text-[#0B1220] transition-colors font-display leading-snug line-clamp-1">
                    {proj.title}
                  </h3>

                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                    {proj.desc}
                  </p>
                </div>

                {/* Tech Stack Chips */}
                <div className="px-3.5 pb-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1">
                    {(proj.stack || []).slice(0, 4).map((tech, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-semibold whitespace-nowrap"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Unlock Your Potential - What Can You Become? */}
        <section className="bg-gradient-to-b from-white via-slate-50 to-white border-y border-slate-200/80 py-10 sm:py-12 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-900 text-xs font-bold uppercase tracking-wider mb-3">
                <Briefcase className="w-3.5 h-3.5 text-rose-700" />
                Career Opportunities
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#0B1220] tracking-tight">
                Unlock Your Potential — What Can You Become?
              </h2>
              <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Master {course.title} to qualify for high-impact, high-growth technology roles in top tier companies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {careerRoles.map((role, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-[#0B1220]/40 transition-all flex items-center gap-3.5 group"
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${role.color || 'from-emerald-500 to-teal-500'} text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform`}>
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 leading-tight group-hover:text-[#0B1220] transition-colors">
                    {role.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. American FutureTech Certificate & Microsoft Certification Showcase */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold uppercase tracking-wider mb-3">
              <Award className="w-3.5 h-3.5 text-indigo-700" />
              Dual Industry Recognition
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#0B1220] tracking-tight">
              American FutureTech & Microsoft Credentials
            </h2>
            <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Successfully graduate to receive dual industry credentials: an accredited American FutureTech US Fellowship Diploma and official alignment with Microsoft Certified Professional certifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-6 max-w-5xl mx-auto">
            {/* Card 1: American FutureTech Certificate */}
            <div className="group rounded-3xl bg-white border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                    Accredited US Fellowship
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-300">Issued by American FutureTech</span>
              </div>

              {/* Certificate Image Preview with zoom */}
              <div
                onClick={() => setSelectedModalCert({
                  title: certImages.completionTitle || 'American FutureTech Certificate of Completion',
                  image: certImages.completionImage || '/static/images/dsai.jpeg',
                  code: 'AFT-FELLOWSHIP-DIPLOMA',
                })}
                className="relative h-44 sm:h-52 bg-slate-100 overflow-hidden cursor-pointer group/zoom"
                title="Click to inspect certificate in 4K"
              >
                <img
                  src={certImages.completionImage || '/static/images/dsai.jpeg'}
                  alt="American FutureTech Certificate"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/zoom:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/zoom:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="px-4 py-2 rounded-full bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xl">
                    <ZoomIn className="w-4 h-4 text-[#0B1220]" /> Inspect in 4K
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-display mb-2">
                    {certImages.completionTitle || 'Certificate of Completion'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {certImages.completionDesc || `Awarded to learners who successfully complete ${course.title}. Verified on the public registry.`}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Public Verification Registry
                  </span>
                  <Link
                    to="/certificate/AFT-CERT-AI9821"
                    className="text-[#0B1220] font-semibold hover:underline flex items-center gap-1"
                  >
                    Sample <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Microsoft Official Certification */}
            <div className="group rounded-3xl bg-white border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-2 gap-[2px]">
                    <span className="w-1.5 h-1.5 bg-[#f25022]" />
                    <span className="w-1.5 h-1.5 bg-[#7fba00]" />
                    <span className="w-1.5 h-1.5 bg-[#00a4ef]" />
                    <span className="w-1.5 h-1.5 bg-[#ffb900]" />
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-300">
                    Microsoft Official Exam
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-300">{certImages.microsoftCode || alignedMsCert.code}</span>
              </div>

              {/* Certificate Image Preview with zoom */}
              <div
                onClick={() => setSelectedModalCert({
                  title: certImages.microsoftTitle || alignedMsCert.title,
                  image: certImages.microsoftImage || alignedMsCert.image,
                  code: certImages.microsoftCode || alignedMsCert.code,
                })}
                className="relative h-44 sm:h-52 bg-slate-100 overflow-hidden cursor-pointer group/zoom"
                title="Click to inspect Microsoft Certificate in 4K"
              >
                <img
                  src={certImages.microsoftImage || alignedMsCert.image}
                  alt="Microsoft Certificate"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/zoom:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/zoom:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="px-4 py-2 rounded-full bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xl">
                    <ZoomIn className="w-4 h-4 text-blue-600" /> Inspect in 4K
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-display mb-2">
                    {certImages.microsoftTitle || alignedMsCert.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {certImages.microsoftDesc || 'Earn official Microsoft certification validating enterprise proficiency in modern cloud frameworks and Azure AI infrastructure.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-blue-700 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Microsoft Certified Professional
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">Global Transcript ID</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Register Now Bottom Cockpit (Matching user request: Register now ka niche option) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1220] via-[#0B1220] to-[#0d1c0e] text-white p-6 sm:p-6 lg:p-8 shadow-2xl border border-[#4338CA]">
            {/* Ambient background orbs */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#E5C275]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#4338CA]/25 blur-3xl" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-center relative z-10">
              {/* Left Column: Register Now Details & Checklist */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5C275]/20 border border-[#E5C275]/40 text-[#E5C275] text-xs font-bold uppercase tracking-wider mb-5">
                  <span className="w-2 h-2 rounded-full bg-[#E5C275] animate-ping" />
                  Limited Seats Available for Next Cohort
                </div>

                <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-4">
                  Register Now
                </h2>

                <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed mb-8 max-w-xl">
                  Secure your place in the upcoming cohort, learn from seasoned Silicon Valley mentors, and graduate with industry-recognized credentials.
                </p>

                {/* 3 Checklist Items */}
                <div className="space-y-3.5 mb-8">
                  <div className="flex items-center gap-3 text-sm text-emerald-100 font-medium">
                    <span className="w-7 h-7 rounded-full bg-[#E5C275]/20 border border-[#E5C275]/40 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[#E5C275]" />
                    </span>
                    <span>Complete the course successfully with 1-on-1 mentor guidance</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-emerald-100 font-medium">
                    <span className="w-7 h-7 rounded-full bg-[#E5C275]/20 border border-[#E5C275]/40 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[#E5C275]" />
                    </span>
                    <span>Receive your accredited American FutureTech completion diploma</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-emerald-100 font-medium">
                    <span className="w-7 h-7 rounded-full bg-[#E5C275]/20 border border-[#E5C275]/40 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[#E5C275]" />
                    </span>
                    <span>Eligible learners receive official Microsoft certification alignment</span>
                  </div>
                </div>

                {/* Post-Registration Guarantee Note */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3 text-xs text-emerald-200/90 max-w-xl">
                  <Mail className="w-4 h-4 text-[#E5C275] shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-white">After registration:</strong> You will immediately receive a welcome orientation email, syllabus kit, and direct invite to the private cohort Slack & virtual lab.
                  </p>
                </div>
              </div>

              {/* Right Column: High-Conversion CTA Buttons Box */}
              <div className="lg:col-span-5">
                <div className="rounded-3xl bg-white text-slate-800 p-5 sm:p-6 shadow-2xl border border-white/20">
                  <div className="text-center mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Live Cohort</span>
                    <div className="text-3xl font-display font-black text-[#0B1220] mt-1">
                      ${course.pricing?.discountedPrice || 1899}
                    </div>
                    <span className="text-xs text-slate-500">Or get started with just a $99 deposit</span>
                  </div>

                  <div className="space-y-3.5">
                    <Link
                      to={`/checkout?courseId=${course._id}&tier=deposit`}
                      className="w-full py-4 px-6 rounded-2xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-extrabold text-base text-center shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      Register Now — $99 Deposit
                      <ArrowRight className="w-5 h-5" />
                    </Link>

                    <Link
                      to={`/checkout?courseId=${course._id}&tier=full`}
                      className="w-full py-3 px-6 rounded-2xl border-2 border-[#0B1220] hover:bg-[#0B1220] hover:text-white text-[#0B1220] font-bold text-sm text-center transition-all flex items-center justify-center gap-2"
                    >
                      Enroll Full Tuition (${course.pricing?.discountedPrice || 1899})
                    </Link>

                    <button
                      onClick={() => setIsLeadModalOpen(true)}
                      className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs text-center transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4 text-[#4338CA]" />
                      Talk to an Admissions Advisor
                    </button>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5 text-[#4338CA]" />
                    <span>256-Bit SSL Encrypted & Money-Back Guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 4K Zoom Inspect Certificate Modal */}
      <CertificateModal
        isOpen={!!selectedModalCert}
        certificate={selectedModalCert}
        onClose={() => setSelectedModalCert(null)}
      />

      <Footer onOpenLeadModal={() => setIsLeadModalOpen(true)} />
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        preselectedCourse={course}
      />
    </div>
  );
}
