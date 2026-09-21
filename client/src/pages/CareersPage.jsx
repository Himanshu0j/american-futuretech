import React, { useState, useEffect } from 'react';
import {
  Search,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  ArrowRight,
  CheckCircle2,
  X,
  Send,
  Sparkles,
  Building2,
  ChevronRight,
  Eye,
  Check,
  ShieldCheck,
  TrendingUp,
  Award,
  Users,
  ExternalLink,
  FileText,
  Zap,
  Star,
  Globe2,
  GraduationCap,
  Filter,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { Lottie } from 'lottie-react';
import liveRadarLottie from '../assets/animations/careers/live-radar.json';
import jobHuntSvg from '../assets/illustrations/careers/job-hunt.svg';
import interviewPrepSvg from '../assets/illustrations/careers/interview-prep.svg';
import resumeEngineeringSvg from '../assets/illustrations/careers/resume-engineering.svg';
import jobOffersSvg from '../assets/illustrations/careers/job-offers.svg';
import noDataSvg from '../assets/illustrations/misc/no-data.svg';
import approvedSuccessSvg from '../assets/illustrations/misc/approved-success.svg';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import JobCard from '../components/JobCard';
import BulletContent from '../components/common/BulletContent';
import FaqAccordion from '../components/common/FaqAccordion';

export default function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Working Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [selectedExp, setSelectedExp] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');

  // Modals state
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  // Job specific application form state
  const [applicantName, setApplicantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Fast-track sidebar form state
  const [fastTrackName, setFastTrackName] = useState('');
  const [fastTrackEmail, setFastTrackEmail] = useState('');
  const [fastTrackPhone, setFastTrackPhone] = useState('');
  const [fastTrackDomain, setFastTrackDomain] = useState('AI & Machine Learning');
  const [fastTrackExp, setFastTrackExp] = useState('Entry to Mid-Level');
  const [fastTrackResume, setFastTrackResume] = useState('');
  const [fastTrackLinkedin, setFastTrackLinkedin] = useState('');
  const [fastTrackSubmitting, setFastTrackSubmitting] = useState(false);
  const [fastTrackSuccess, setFastTrackSuccess] = useState(false);

  useEffect(() => {
    fetchJobs();
    fetchCourses();
    window.scrollTo(0, 0);
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/jobs');
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error('Failed to load courses for job filtering', err);
    }
  };

  const jobTypes = ['All', 'Full-time', 'Contract', 'Part-time', 'Internship'];
  const experienceLevels = ['All', 'Entry', 'Mid', 'Senior'];
  const locations = ['All', 'Remote', 'On-site', 'Hybrid'];

  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      job.title?.toLowerCase().includes(term) ||
      job.company?.toLowerCase().includes(term) ||
      job.location?.toLowerCase().includes(term) ||
      job.experienceLevel?.toLowerCase().includes(term) ||
      job.skills?.some(s => s.toLowerCase().includes(term)) ||
      job.technicalSkills?.some(s => s.toLowerCase().includes(term));

    const jobType = job.employmentType || job.type || 'Full-time';
    const matchesType = selectedJobType === 'All' || jobType === selectedJobType;

    const matchesExp = selectedExp === 'All' ||
      job.experienceLevel?.toLowerCase().includes(selectedExp.toLowerCase());

    const matchesLocation = selectedLocation === 'All' ||
      job.location?.toLowerCase().includes(selectedLocation.toLowerCase());

    const matchesCourse = selectedCourse === 'All' ||
      job.recommendedCourseTitle === selectedCourse ||
      job.recommendedCourse?._id === selectedCourse ||
      job.recommendedCourse?.title === selectedCourse;

    return matchesSearch && matchesType && matchesExp && matchesLocation && matchesCourse;
  });

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedJobType !== 'All' ||
    selectedExp !== 'All' ||
    selectedLocation !== 'All' ||
    selectedCourse !== 'All';

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedJobType('All');
    setSelectedExp('All');
    setSelectedLocation('All');
    setSelectedCourse('All');
  };

  const handleOpenDetails = (job) => {
    setSelectedJobForDetails(job);
    setDetailsModalOpen(true);
  };

  const handleOpenApply = (job) => {
    setSelectedJobForApply(job);
    setApplyModalOpen(true);
    setApplySuccess(false);
    setDetailsModalOpen(false);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applicantName || !email || !phone) {
      alert('Please fill out your full name, email, and phone number.');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`/api/jobs/${selectedJobForApply._id}/apply`, {
        applicantName,
        email,
        phone,
        linkedinUrl,
        resumeUrl: resumeUrl || 'https://americanfuturetech.com/resumes/applicant_portfolio.pdf',
        coverNote,
      });
      setApplySuccess(true);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFastTrackSubmit = async (e) => {
    e.preventDefault();
    if (!fastTrackName || !fastTrackEmail || !fastTrackPhone) {
      alert('Please fill out your name, email, and phone number.');
      return;
    }

    try {
      setFastTrackSubmitting(true);
      await axios.post('/api/jobs/talent-pool', {
        applicantName: fastTrackName,
        email: fastTrackEmail,
        phone: fastTrackPhone,
        targetDomain: fastTrackDomain,
        experienceLevel: fastTrackExp,
        linkedinUrl: fastTrackLinkedin,
        resumeUrl: fastTrackResume || 'https://americanfuturetech.com/resumes/talent_pool_cv.pdf',
      });
      setFastTrackSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit fast-track profile. Please try again.');
    } finally {
      setFastTrackSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-24 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        
        {/* ========================================================================= */}
        {/* 🌟 HERO SHOWCASE: HIGH-IMPACT 2-COLUMN PARTNER CAREER NETWORK BANNER      */}
        {/* ========================================================================= */}
        <section className="mb-14 rounded-3xl bg-gradient-to-br from-white via-[#f6faf4] to-[#eef7ec] border border-slate-200/90 shadow-lg p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#76ff8a]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#9e4f8f]/10 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/60 text-[#1a361d] text-xs font-bold tracking-wide shadow-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2d5c36]"></span>
                </span>
                <span>Corporate Employer Hiring Network • Active Placements</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-display font-extrabold tracking-tight text-[#1a361d] leading-[1.15]">
                Where Elite Tech Employers Hire{' '}
                <span className="highlight">Verified Graduate Talent</span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                Direct hiring partnerships connecting American FutureTech certified fellows with high-growth technology enterprises, defense contractors, and AI engineering studios.
              </p>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
                <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="text-xl sm:text-2xl font-black font-display text-[#1a361d]">$128K</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Avg Placement Comp</div>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="text-xl sm:text-2xl font-black font-display text-[#1a361d]">140+</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Corporate Partners</div>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="text-xl sm:text-2xl font-black font-display text-[#1a361d]">94%</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Placement Rate</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#openings"
                  className="py-3 px-7 rounded-full bg-[#1a361d] hover:bg-[#2d5c36] text-[#d8ffd2] font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer hover:shadow-lg"
                >
                  <span>Explore Open Positions</span>
                  <ChevronRight className="w-4 h-4 text-[#76ff8a]" />
                </a>
                <a
                  href="#fast-track"
                  className="py-3 px-6 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>Join Talent Pool</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </a>
              </div>
            </div>

            {/* Right Column: Visual Showcase */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="p-6 sm:p-8 rounded-3xl bg-[#1a361d] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[360px] border border-[#2d5c36]">
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#76ff8a] animate-ping" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#76ff8a]">Partner Network Active</span>
                    </div>
                    <div className="w-10 h-10">
                      <Lottie animationData={liveRadarLottie} loop autoplay className="w-10 h-10" />
                    </div>
                  </div>

                  <div className="my-auto py-3 flex justify-center z-10">
                    <img
                      src={jobHuntSvg}
                      alt="Career Placement"
                      className="w-full max-w-[240px] h-auto object-contain transform hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#76ff8a] text-[#1a361d] font-bold text-xs flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">Direct Talent Introductions</div>
                        <div className="text-[10px] text-slate-300 font-mono">140+ Partner Tech Employers</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2-COLUMN WORKSPACE: JOB SEARCH, FILTERS & LISTINGS + STICKY SIDEBAR        */}
        {/* ========================================================================= */}
        <div id="openings" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* MAIN COLUMN (8 COLS): SEARCH, WORKING FILTERS, 8+ JOB GRID */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search and Filters Bar */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 text-left">
              {/* Prominent Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search jobs by title, company, location, or skills (e.g. AWS, Python, Docker)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
                />
              </div>

              {/* Working Filters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {/* 1. Job Type */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Job Type</label>
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#1a361d]"
                  >
                    {jobTypes.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
                  </select>
                </div>

                {/* 2. Experience Level */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Experience</label>
                  <select
                    value={selectedExp}
                    onChange={(e) => setSelectedExp(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#1a361d]"
                  >
                    {experienceLevels.map(exp => <option key={exp} value={exp}>{exp === 'All' ? 'All Experience' : `${exp} Level`}</option>)}
                  </select>
                </div>

                {/* 3. Location */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#1a361d]"
                  >
                    {locations.map(loc => <option key={loc} value={loc}>{loc === 'All' ? 'All Locations' : loc}</option>)}
                  </select>
                </div>

                {/* 4. Recommended Course */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Course Track</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#1a361d] truncate"
                  >
                    <option value="All">All Tracks</option>
                    {courses.map(c => (
                      <option key={c._id} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Telemetry & Clear Filters Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="text-slate-500 font-mono">
                  Showing <strong className="text-slate-900">{filteredJobs.length}</strong> of {jobs.length} total partner positions
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Job Listings (Supports 8+ Jobs naturally in desktop/mobile) */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 border-3 border-[#1a361d]/20 border-t-[#1a361d] rounded-full animate-spin mb-3" />
                <div className="text-xs font-mono text-slate-500">Loading career network opportunities...</div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-4">
                <div className="w-36 h-36 mx-auto">
                  <img src={noDataSvg} alt="No matching jobs" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-base font-display font-bold text-[#1a361d]">No job openings match your criteria</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  Try adjusting your search terms, resetting filters, or submit your resume directly to our Corporate Talent Pool on the right.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2 rounded-full bg-[#1a361d] text-white text-xs font-bold cursor-pointer hover:bg-[#2d5c36]"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    onOpenDetails={handleOpenDetails}
                    onOpenApply={handleOpenApply}
                  />
                ))}
              </div>
            )}

            {/* Live Jobs FAQ Section */}
            <div className="pt-8">
              <FaqAccordion
                category="Live Jobs"
                title="Corporate Placement & Jobs FAQ"
                subtitle="Common questions regarding hiring partner interviews, compensation standards, and employer referrals."
              />
            </div>
          </div>

          {/* RIGHT SIDEBAR (4 COLS): FAST-TRACK APPLICATION & VETTED NETWORK */}
          <div id="fast-track" className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            
            {/* Widget 1: Fast-Track Direct Referral Application Form */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-lg relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#76ff8a]/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2 text-xs font-bold text-[#2d5c36] bg-[#d8ffd2] px-3 py-1 rounded-full w-fit mb-3">
                <Zap className="w-3.5 h-3.5 text-[#2d5c36]" />
                <span>Fast-Track Placement Concierge</span>
              </div>

              <h3 className="text-lg font-display font-bold text-[#1a361d] mb-1">
                Don't See Your Exact Role?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Submit your profile directly to our Corporate Placement Office. We match your portfolio with unlisted opportunities across 140+ tech partners.
              </p>

              {fastTrackSuccess ? (
                <div className="p-5 rounded-2xl bg-[#d8ffd2]/50 border border-[#76ff8a] text-center space-y-3 animate-fadeIn">
                  <div className="w-24 h-24 mx-auto">
                    <img src={approvedSuccessSvg} alt="Profile Submitted" className="w-full h-full object-contain" />
                  </div>
                  <h4 className="text-sm font-display font-bold text-[#1a361d]">Profile Submitted to Talent Pool!</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Our Enterprise Placement Officer will review your credentials within 24 hours.
                  </p>
                  <button
                    onClick={() => setFastTrackSuccess(false)}
                    className="text-xs font-bold text-[#2d5c36] underline cursor-pointer pt-1"
                  >
                    Submit Another Profile
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-2 bg-[#fffff2] rounded-xl border border-gray-100 flex justify-center">
                    <img src={interviewPrepSvg} alt="Fast-Track Concierge" className="w-32 h-20 object-contain" />
                  </div>
                  <form onSubmit={handleFastTrackSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Morgan"
                        value={fastTrackName}
                        onChange={(e) => setFastTrackName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="alex@example.com"
                        value={fastTrackEmail}
                        onChange={(e) => setFastTrackEmail(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 019-2834"
                        value={fastTrackPhone}
                        onChange={(e) => setFastTrackPhone(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Track</label>
                        <select
                          value={fastTrackDomain}
                          onChange={(e) => setFastTrackDomain(e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-[11px] focus:outline-none focus:border-[#1a361d]"
                        >
                          <option value="AI & Machine Learning">AI & Machine Learning</option>
                          <option value="Cyber Defense & SOC">Cyber Defense & SOC</option>
                          <option value="DevOps & Cloud SRE">DevOps & Cloud SRE</option>
                          <option value="AI Product Management">AI Product Management</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Experience</label>
                        <select
                          value={fastTrackExp}
                          onChange={(e) => setFastTrackExp(e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-[11px] focus:outline-none focus:border-[#1a361d]"
                        >
                          <option value="Entry Level (0-2 Yrs)">Entry Level (0-2 Yrs)</option>
                          <option value="Mid-Level (2-5 Yrs)">Mid-Level (2-5 Yrs)</option>
                          <option value="Senior (5+ Yrs)">Senior (5+ Yrs)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">LinkedIn / Portfolio URL</label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/alexmorgan"
                        value={fastTrackLinkedin}
                        onChange={(e) => setFastTrackLinkedin(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Resume Link (PDF / Cloud Drive)</label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/resume.pdf"
                        value={fastTrackResume}
                        onChange={(e) => setFastTrackResume(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={fastTrackSubmitting}
                      className="w-full py-3 rounded-full bg-[#1a361d] hover:bg-[#2d5c36] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:shadow-lg"
                    >
                      {fastTrackSubmitting ? 'Transmitting Profile...' : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit to 140+ Partner Network</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Widget 2: Vetted Employer Network Trust Box */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-[#122316] text-white shadow-xl relative overflow-hidden text-left space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#76ff8a]" />
                  <span className="text-xs font-mono text-[#76ff8a] font-bold uppercase tracking-wider">Hiring Partner Standards</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  US Registered
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#76ff8a] shrink-0 mt-0.5" />
                  <span className="text-slate-300">Direct interview scheduling with Tech Leads & CISOs</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#76ff8a] shrink-0 mt-0.5" />
                  <span className="text-slate-300">Verified institutional accreditation on graduation records</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#76ff8a] shrink-0 mt-0.5" />
                  <span className="text-slate-300">Salary transparency policy: All roles disclose minimum compensation</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 1. VIEW DETAILS MODAL: RICH OVERVIEW WITH BULLETCONTENT                   */}
      {/* ========================================================================= */}
      {detailsModalOpen && selectedJobForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto text-left space-y-5">
            
            <button
              onClick={() => setDetailsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header: Company Logo, Name & Title */}
            <div className="flex items-start gap-4 pr-8">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xs p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                {selectedJobForDetails.companyLogo ? (
                  <img
                    src={selectedJobForDetails.companyLogo}
                    alt={selectedJobForDetails.company}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#1a361d] to-[#2d5c36] text-white font-bold text-lg flex items-center justify-center">
                    {selectedJobForDetails.company?.slice(0, 2).toUpperCase() || 'CP'}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900">{selectedJobForDetails.company}</div>
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#1a361d] mt-1">
                  {selectedJobForDetails.title}
                </h2>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-mono text-[10px] block">COMPENSATION</span>
                <span className="font-bold text-[#2d5c36]">{selectedJobForDetails.salaryRange}</span>
              </div>
              <div>
                <span className="text-slate-400 font-mono text-[10px] block">LOCATION</span>
                <span className="font-semibold text-slate-800">{selectedJobForDetails.location}</span>
              </div>
              <div>
                <span className="text-slate-400 font-mono text-[10px] block">EMPLOYMENT TYPE</span>
                <span className="font-semibold text-slate-800">{selectedJobForDetails.employmentType || selectedJobForDetails.type || 'Full-time'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-mono text-[10px] block">EXPERIENCE</span>
                <span className="font-semibold text-slate-800">{selectedJobForDetails.experienceLevel}</span>
              </div>
            </div>

            {/* Role Overview with BulletContent */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Role Overview</h4>
              <BulletContent
                content={selectedJobForDetails.description}
                as="auto"
                paragraphClassName="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line"
              />
            </div>

            {/* Key Responsibilities */}
            {selectedJobForDetails.responsibilities && selectedJobForDetails.responsibilities.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Responsibilities</h4>
                <BulletContent
                  content={selectedJobForDetails.responsibilities}
                  as="list"
                  bulletType="check"
                />
              </div>
            )}

            {/* Candidate Requirements */}
            {(selectedJobForDetails.keyRequirements || selectedJobForDetails.requirements) && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Candidate Qualifications & Skills</h4>
                <BulletContent
                  content={selectedJobForDetails.keyRequirements || selectedJobForDetails.requirements}
                  as="list"
                  bulletType="chevron"
                />
              </div>
            )}

            {/* Perks & Benefits */}
            {selectedJobForDetails.benefits && selectedJobForDetails.benefits.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Perks, Equity & Benefits
                </h4>
                <BulletContent
                  content={selectedJobForDetails.benefits}
                  as="list"
                  bulletType="check"
                />
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleOpenApply(selectedJobForDetails)}
                className="px-6 py-2.5 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 hover:shadow-md"
              >
                <span>Apply for This Role</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. APPLY FOR ROLE MODAL: CANDIDATE SUBMISSION FORM                         */}
      {/* ========================================================================= */}
      {applyModalOpen && selectedJobForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto text-left">
            <button
              onClick={() => setApplyModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {applySuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-28 h-28 mx-auto">
                  <img src={jobOffersSvg} alt="Application Transmitted" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xl font-display font-bold text-[#1a361d]">Application Transmitted!</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4 max-w-sm mx-auto">
                  Your application for <strong className="text-slate-900">{selectedJobForApply.title}</strong> at <strong className="text-slate-900">{selectedJobForApply.company}</strong> has been received. Our Enterprise Placement Officer will contact you within 24 hours.
                </p>
                <button
                  onClick={() => setApplyModalOpen(false)}
                  className="w-full py-3 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <div className="text-[11px] font-bold text-[#2d5c36] uppercase tracking-wider mb-1">
                    Application For Position
                  </div>
                  <h3 className="text-lg font-display font-bold text-[#1a361d]">{selectedJobForApply.title}</h3>
                  <div className="text-xs text-slate-500 font-medium">
                    {selectedJobForApply.company} • {selectedJobForApply.location} • {selectedJobForApply.salaryRange}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 019-2834"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn or Portfolio URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/janedoe"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resume Link (PDF / Cloud Drive) *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/your-resume.pdf"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brief Pitch / Candidate Note</label>
                  <textarea
                    rows={3}
                    placeholder="Relevant American FutureTech capstone projects, certifications, and availability..."
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Transmitting Application...' : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Application to Partner Hiring Manager
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
