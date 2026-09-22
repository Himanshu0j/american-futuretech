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

export default function CourseDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
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
      <div className="min-h-screen bg-[#fffff2] flex items-center justify-center text-[#1a361d] font-sans text-sm">
        <div className="w-10 h-10 border-4 border-[#1a361d]/20 border-t-[#1a361d] rounded-full animate-spin mb-4" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#fffff2] text-[#1a361d] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-display font-bold mb-4">Program Not Found</h2>
        <Link to="/courses" className="px-6 py-2.5 bg-[#9e4f8f] text-white rounded-full font-semibold hover:bg-[#582c50] transition-colors">
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
  const capstones = detailedData.capstoneProjects || [];
  const careerRoles = detailedData.careerRoles || [];
  const certImages = detailedData.certificates || {};

  const whyIcons = {
    MessageSquare,
    ShieldCheck,
    CheckCircle2,
    Monitor,
    GraduationCap,
    Briefcase
  };

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased relative selection:bg-[#76ff8a] selection:text-[#1a361d]">
      <Navbar onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      <main className="pt-24 pb-20">
        {/* Breadcrumb strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link to="/" className="hover:text-[#1a361d] transition-colors">Home</Link>
            <span>/</span>
            <Link to="/courses" className="hover:text-[#1a361d] transition-colors">Academy Programs</Link>
            <span>/</span>
            <span className="text-[#1a361d] font-semibold truncate">{course.title}</span>
          </nav>
        </div>

        {/* 1. Course Hero Banner Container */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="rounded-3xl bg-[#1a361d] text-white p-8 sm:p-12 lg:p-14 shadow-xl border border-[#2d5c36] relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-[#76ff8a]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-[#9e4f8f]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10">
              {/* Left Column: Course Header Info */}
              <div className="lg:col-span-8">
                <div className="flex flex-wrap items-center gap-2.5 mb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1a361d] bg-[#d8ffd2] px-3.5 py-1.5 rounded-full shadow-xs">
                    {course.category || 'Career Program'}
                  </span>
                  <span className="text-xs font-semibold text-[#76ff8a] bg-[#76ff8a]/15 px-3.5 py-1.5 rounded-full border border-[#76ff8a]/40">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#132815]/90 border border-[#2d5c36] text-center sm:text-left backdrop-blur-xs mb-8">
                  <div>
                    <div className="text-xs text-emerald-300/80 font-medium">Duration</div>
                    <div className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                      <Clock className="w-4 h-4 text-[#76ff8a]" />
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
                      <Zap className="w-4 h-4 text-[#76ff8a]" />
                      Live Interactive Lab
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-300/80 font-medium">Placement Support</div>
                    <div className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                      <Briefcase className="w-4 h-4 text-[#76ff8a]" />
                      100% Career Assistance
                    </div>
                  </div>
                </div>

                {/* Key Skills Tags */}
                <div>
                  <div className="text-xs font-bold text-emerald-300/90 uppercase tracking-wider mb-3">Skills You Will Master:</div>
                  <div className="flex flex-wrap gap-2">
                    {(course.skills || ['Machine Learning', 'Deep Learning', 'PyTorch', 'Vector Databases', 'RAG Pipelines', 'Computer Vision', 'LLM Fine-Tuning', 'MLOps']).map((skill, i) => (
                      <span key={i} className="px-3.5 py-1.5 rounded-full bg-[#132815] text-emerald-100 text-xs font-semibold border border-[#2d5c36] shadow-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Enrollment Card */}
              <div className="lg:col-span-4 lg:sticky lg:top-28">
                <div className="rounded-3xl bg-white text-slate-800 p-6 sm:p-7 shadow-2xl border border-slate-200/80">
                  <div className="mb-6 pb-5 border-b border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tuition Investment</div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-3xl font-display font-black text-[#1a361d]">${course.pricing?.discountedPrice || 1899}</span>
                      <span className="text-sm text-slate-400 line-through">${course.pricing?.basePrice || 2499}</span>
                    </div>
                    <div className="text-xs text-[#2d5c36] font-bold flex items-center gap-1.5 mt-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#40844e]" />
                      Save ${(course.pricing?.basePrice || 2499) - (course.pricing?.discountedPrice || 1899)} with institutional scholarship
                    </div>
                  </div>

                  {/* Flexible Deposit Box */}
                  <div className="p-4 rounded-2xl bg-[#f7fdf8] border border-[#76ff8a]/60 mb-4 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1a361d]">
                        Flexible Seat Deposit
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#d8ffd2] text-[#1a361d] text-[10px] font-black uppercase tracking-wider">
                        Most Popular
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                      Reserve your seat in the upcoming cohort today with just <strong>$99 down</strong>. Remainder payable prior to start.
                    </p>
                    <Link
                      to={`/checkout?courseId=${course._id}&tier=deposit`}
                      className="w-full py-3 px-4 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white text-sm font-bold text-center shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      Reserve Seat for $99
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <Link
                    to={`/checkout?courseId=${course._id}&tier=full`}
                    className="w-full py-2.5 px-4 rounded-full border-2 border-[#1a361d] hover:bg-[#1a361d] hover:text-white text-[#1a361d] text-sm font-bold text-center transition-all flex items-center justify-center gap-2 mb-3"
                  >
                    Enroll Full Tuition (${course.pricing?.discountedPrice || 1899})
                  </Link>

                  <button
                    onClick={() => setIsLeadModalOpen(true)}
                    className="w-full py-2 px-4 rounded-full text-slate-600 hover:text-[#1a361d] hover:bg-slate-100 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-2 mb-4 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#40844e]" />
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

        {/* 2. Data Science & AI Program Tools Covered (Matching reference image media_1790065920420.png) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-[#1a361d] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkle className="w-3.5 h-3.5 text-[#2d5c36]" />
              Hands-On Industry Toolkit
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#1a361d] tracking-tight">
              {detailedData.heroTitle || `${course.title} Program`} Tools Covered
            </h2>
            <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Master enterprise-grade frameworks, libraries, and cloud platforms trusted by top technology teams globally.
            </p>
          </div>

          {/* Grid of 4 columns on desktop, matching reference screenshot media_1790065920420.png with authentic real logos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {toolsList.map((tool, idx) => {
              const iconPath = tool.icon || getToolLogo(tool.name || tool);
              const toolName = tool.name || tool;

              return (
                <div
                  key={idx}
                  className="group rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 text-center shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center cursor-default"
                >
                  {/* Squircle container holding the vivid authentic tool logo */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-3 sm:p-3.5 shadow-inner group-hover:bg-slate-100/80 group-hover:scale-105 transition-all duration-300">
                    <img
                      src={iconPath}
                      alt={toolName}
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain filter-none drop-shadow-xs"
                      loading="lazy"
                    />
                  </div>

                  {/* Tool Name in clean, high-contrast bold typography */}
                  <h3 className="mt-4 text-sm sm:text-base font-bold text-slate-800 tracking-tight group-hover:text-[#1a361d] transition-colors">
                    {toolName}
                  </h3>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Why Get Certification From American FutureTech (6 Feature Cards) */}
        <section className="bg-slate-50/70 border-y border-slate-200/70 py-18">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d8ffd2] text-[#1a361d] text-xs font-bold uppercase tracking-wider mb-3">
                <Award className="w-3.5 h-3.5 text-[#2d5c36]" />
                The American FutureTech Advantage
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#1a361d] tracking-tight max-w-3xl mx-auto">
                Why Get {course.title} Certification From American FutureTech
              </h2>
              <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                We combine rigorous Ivy-League caliber syllabus with practical, production-ready engineering drills and direct career placement pipelines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {whyChooseList.map((item, idx) => {
                const IconComponent = whyIcons[item.icon] || CheckCircle2;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white border border-slate-200/80 p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center mb-5 shadow-md`}>
                        <IconComponent className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2.5 font-display">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-[#2d5c36]">
                      <CheckCircle2 className="w-4 h-4 text-[#40844e]" />
                      <span>Guaranteed Standard</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Who Can Apply for this Course */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-18">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left: Numbered Criteria */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-900 text-xs font-bold uppercase tracking-wider mb-3">
                <Users className="w-3.5 h-3.5 text-violet-700" />
                Eligibility & Candidate Profile
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#1a361d] tracking-tight mb-4">
                Who Can Apply for this Course?
              </h2>
              <p className="text-slate-600 text-base mb-8 leading-relaxed">
                Our fellowship is designed to bridge learners from diverse professional and academic backgrounds into high-tier technology roles.
              </p>

              <div className="space-y-4">
                {whoCanApplyList.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#1a361d]/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#1a361d] text-[#76ff8a] font-display font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
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
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl bg-gradient-to-br from-[#1a361d] via-[#1f4223] to-[#132815] text-white p-8 sm:p-9 shadow-2xl border border-[#2d5c36] relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-[#76ff8a]/20 rounded-full blur-2xl pointer-events-none" />
                <div className="w-14 h-14 rounded-2xl bg-[#76ff8a]/20 border border-[#76ff8a]/40 text-[#76ff8a] flex items-center justify-center mb-5">
                  <Award className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold font-display text-white mb-3">
                  Globally Recognised Certification
                </h3>
                <p className="text-sm text-emerald-100/90 leading-relaxed mb-6">
                  Earn a verified credential recognized by Fortune 500 employers across the United States, Europe, and Asia. Accelerate your career with measurable credentials.
                </p>

                <div className="space-y-2.5 text-xs text-emerald-200 font-medium pt-2 border-t border-[#2d5c36]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#76ff8a]" />
                    <span>Official American FutureTech US Fellowship Diploma</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#76ff8a]" />
                    <span>Microsoft Certified Professional Exam Alignment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#76ff8a]" />
                    <span>Permanent Credential Verification on Global Ledger</span>
                  </div>
                </div>
              </div>

              {/* Audience Category Badges */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Target Audiences Welcomed:</div>
                <div className="flex flex-wrap gap-2.5">
                  {audiencePills.map((pill, i) => (
                    <span
                      key={i}
                      className={`px-4 py-2 rounded-full bg-gradient-to-r ${pill.color} text-white text-xs font-bold shadow-xs`}
                    >
                      {pill.tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Curriculum Section (Preserved & Enhanced) */}
        <section className="bg-[#f7f9f6] border-y border-slate-200/70 py-18">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#1a361d] text-xs font-bold uppercase tracking-wider mb-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Structured Syllabus
                </div>
                <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#1a361d]">
                  {course.title} Course Curriculum
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  {curriculum.length} enterprise modules aligned with real production workflows.
                </p>
              </div>
              <a
                href={course.brochureUrl || '/brochures/American_FutureTech_Syllabus.pdf'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a361d] text-white hover:bg-[#2d5c36] text-xs font-bold transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Full Syllabus PDF
              </a>
            </div>

            {/* Accordion List */}
            <div className="space-y-3.5 max-w-4xl mx-auto">
              {curriculum.map((mod, index) => {
                const isOpen = openModuleIndex === index;
                return (
                  <div
                    key={mod._id || index}
                    className="rounded-2xl bg-white border border-slate-200 overflow-hidden transition-all shadow-xs hover:border-[#1a361d]/40"
                  >
                    <button
                      onClick={() => setOpenModuleIndex(isOpen ? -1 : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="w-11 h-11 rounded-xl bg-[#d8ffd2] text-[#1a361d] font-display font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          {index + 1 < 10 ? `0${index + 1}` : index + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-[#1a361d] truncate leading-tight">
                            {mod.title}
                          </h3>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                            <span>{mod.lessons?.length || 4} Lessons</span>
                            <span>•</span>
                            <span>{mod.durationHours || 24} Hours Total</span>
                            {mod.quiz && (
                              <>
                                <span>•</span>
                                <span className="text-[#9e4f8f] font-semibold">1 Assessment</span>
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
                                <Play className="w-3.5 h-3.5 text-[#40844e] shrink-0" />
                                <span className="truncate font-medium">{lesson.title}</span>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0 text-slate-500">
                                <span>{lesson.videoDuration || '45m'}</span>
                                {lesson.isPreview && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d8ffd2] text-[#1a361d]">
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

        {/* 5. Capstone Projects (8 Real Production Builds) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-18">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 text-teal-900 text-xs font-bold uppercase tracking-wider mb-3">
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              Build & Showcase
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#1a361d] tracking-tight">
              Capstone Projects
            </h2>
            <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Hands-on enterprise projects covering the full end-to-end learning lifecycle. Deploy real systems to showcase to hiring managers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capstones.map((proj, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                {/* Colored Top Accent Banner */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${proj.color || 'from-indigo-500 to-blue-500'}`} />

                <div className="p-6">
                  {/* Tag Pill */}
                  <span className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${proj.color || 'from-indigo-500 to-blue-500'} text-white text-[11px] font-bold uppercase tracking-wider mb-3 shadow-xs`}>
                    {proj.tag}
                  </span>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#1a361d] transition-colors font-display">
                    {proj.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {proj.desc}
                  </p>
                </div>

                {/* Tech Stack Chips */}
                <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1.5">
                    {(proj.stack || []).map((tech, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold"
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
        <section className="bg-gradient-to-b from-white via-slate-50 to-white border-y border-slate-200/80 py-18">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-900 text-xs font-bold uppercase tracking-wider mb-3">
                <Briefcase className="w-3.5 h-3.5 text-rose-700" />
                Career Opportunities
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#1a361d] tracking-tight">
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
                  className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-[#1a361d]/40 transition-all flex items-center gap-3.5 group"
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${role.color || 'from-emerald-500 to-teal-500'} text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform`}>
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 leading-tight group-hover:text-[#1a361d] transition-colors">
                    {role.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. American FutureTech Certificate & Microsoft Certification Showcase */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-18">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold uppercase tracking-wider mb-3">
              <Award className="w-3.5 h-3.5 text-indigo-700" />
              Dual Industry Recognition
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#1a361d] tracking-tight">
              American FutureTech & Microsoft Credentials
            </h2>
            <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Successfully graduate to receive dual industry credentials: an accredited American FutureTech US Fellowship Diploma and official alignment with Microsoft Certified Professional certifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-5xl mx-auto">
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
                className="relative aspect-[16/11] bg-slate-100 overflow-hidden cursor-pointer group/zoom"
                title="Click to inspect certificate in 4K"
              >
                <img
                  src={certImages.completionImage || '/static/images/dsai.jpeg'}
                  alt="American FutureTech Certificate"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/zoom:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/zoom:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="px-4 py-2 rounded-full bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xl">
                    <ZoomIn className="w-4 h-4 text-[#1a361d]" /> Inspect in 4K
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
                    className="text-[#1a361d] font-semibold hover:underline flex items-center gap-1"
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
                className="relative aspect-[16/11] bg-slate-100 overflow-hidden cursor-pointer group/zoom"
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a361d] via-[#132815] to-[#0d1c0e] text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-[#2d5c36]">
            {/* Ambient background orbs */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#76ff8a]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#9e4f8f]/25 blur-3xl" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
              {/* Left Column: Register Now Details & Checklist */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#76ff8a]/20 border border-[#76ff8a]/40 text-[#76ff8a] text-xs font-bold uppercase tracking-wider mb-5">
                  <span className="w-2 h-2 rounded-full bg-[#76ff8a] animate-ping" />
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
                    <span className="w-7 h-7 rounded-full bg-[#76ff8a]/20 border border-[#76ff8a]/40 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[#76ff8a]" />
                    </span>
                    <span>Complete the course successfully with 1-on-1 mentor guidance</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-emerald-100 font-medium">
                    <span className="w-7 h-7 rounded-full bg-[#76ff8a]/20 border border-[#76ff8a]/40 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[#76ff8a]" />
                    </span>
                    <span>Receive your accredited American FutureTech completion diploma</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-emerald-100 font-medium">
                    <span className="w-7 h-7 rounded-full bg-[#76ff8a]/20 border border-[#76ff8a]/40 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[#76ff8a]" />
                    </span>
                    <span>Eligible learners receive official Microsoft certification alignment</span>
                  </div>
                </div>

                {/* Post-Registration Guarantee Note */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3 text-xs text-emerald-200/90 max-w-xl">
                  <Mail className="w-4 h-4 text-[#76ff8a] shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-white">After registration:</strong> You will immediately receive a welcome orientation email, syllabus kit, and direct invite to the private cohort Slack & virtual lab.
                  </p>
                </div>
              </div>

              {/* Right Column: High-Conversion CTA Buttons Box */}
              <div className="lg:col-span-5">
                <div className="rounded-3xl bg-white text-slate-800 p-7 sm:p-9 shadow-2xl border border-white/20">
                  <div className="text-center mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Live Cohort</span>
                    <div className="text-3xl font-display font-black text-[#1a361d] mt-1">
                      ${course.pricing?.discountedPrice || 1899}
                    </div>
                    <span className="text-xs text-slate-500">Or get started with just a $99 deposit</span>
                  </div>

                  <div className="space-y-3.5">
                    <Link
                      to={`/checkout?courseId=${course._id}&tier=deposit`}
                      className="w-full py-4 px-6 rounded-2xl bg-[#9e4f8f] hover:bg-[#582c50] text-white font-extrabold text-base text-center shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      Register Now — $99 Deposit
                      <ArrowRight className="w-5 h-5" />
                    </Link>

                    <Link
                      to={`/checkout?courseId=${course._id}&tier=full`}
                      className="w-full py-3 px-6 rounded-2xl border-2 border-[#1a361d] hover:bg-[#1a361d] hover:text-white text-[#1a361d] font-bold text-sm text-center transition-all flex items-center justify-center gap-2"
                    >
                      Enroll Full Tuition (${course.pricing?.discountedPrice || 1899})
                    </Link>

                    <button
                      onClick={() => setIsLeadModalOpen(true)}
                      className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs text-center transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4 text-[#2d5c36]" />
                      Talk to an Admissions Advisor
                    </button>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5 text-[#2d5c36]" />
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
