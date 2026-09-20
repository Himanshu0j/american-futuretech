import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Award,
  Send,
  X,
  Share2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback Internal Application Modal State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/jobs/${id}`);
      if (res.data.success && res.data.job) {
        setJob(res.data.job);
      } else {
        setError('Job opening not found or has been closed.');
      }
    } catch (err) {
      console.error('Failed to load job details:', err);
      setError(err.response?.data?.message || 'Failed to retrieve job details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    // If job has a validated external apply link (http/https), open safely
    if (job?.applyLink && (job.applyLink.startsWith('http://') || job.applyLink.startsWith('https://'))) {
      window.open(job.applyLink, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback to internal application form
      setApplyModalOpen(true);
      setApplySuccess(false);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applicantName || !email || !phone) {
      alert('Please fill out full name, email, and phone number.');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`/api/jobs/${job._id}/apply`, {
        applicantName,
        email,
        phone,
        linkedinUrl,
        resumeUrl: resumeUrl || 'https://americanfuturetech.com/resumes/applicant_portfolio.pdf',
        coverNote,
      });
      setApplySuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased">
        <Navbar />
        <div className="pt-40 pb-32 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-3 border-[#1a361d]/20 border-t-[#1a361d] rounded-full animate-spin" />
          <div className="text-xs font-mono text-slate-500">Retrieving official position dossier...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased">
        <Navbar />
        <div className="pt-40 pb-32 container mx-auto px-4 text-center max-w-lg space-y-4">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-2xl font-display font-bold text-[#1a361d]">Position Not Found</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{error || 'This career opening may have been filled or unpublished.'}</p>
          <Link
            to="/careers"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1a361d] text-white text-xs font-bold shadow-md hover:bg-[#2d5c36] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Live Jobs</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Determine formatted salary string
  const salaryText = (job.salaryMin && job.salaryMax)
    ? `$${job.salaryMin.toLocaleString()} – $${job.salaryMax.toLocaleString()} / year`
    : job.salaryRange || '$95,000 – $135,000 / year';

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar />

      <main className="pt-28 pb-24 container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-left">
        
        {/* Back Link Breadcrumb */}
        <div className="flex items-center justify-between mb-8 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-[#1a361d] transition-colors">Home</Link>
            <span>/</span>
            <Link to="/careers" className="hover:text-[#1a361d] transition-colors">Live Jobs</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-none">{job.title}</span>
          </div>

          <Link
            to="/careers"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2d5c36] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Openings</span>
          </Link>
        </div>

        {/* Hero Header Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-lg relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#76ff8a]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            {/* Left: Logo & Core Identity */}
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-200 shadow-sm p-2 flex items-center justify-center overflow-hidden shrink-0">
                {job.companyLogo ? (
                  <img
                    src={job.companyLogo}
                    alt={job.company}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#1a361d] to-[#2d5c36] text-white font-bold text-xl flex items-center justify-center">
                    {job.company?.slice(0, 2).toUpperCase() || 'CP'}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-slate-900">{job.company}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified Employer Partner
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-[#1a361d] tracking-tight">
                  {job.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#1a361d] bg-[#d8ffd2] px-2.5 py-0.5 rounded-full">
                    <Building2 className="w-3 h-3 text-[#2d5c36]" />
                    {job.department}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {job.employmentType || job.type || 'Full-time'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-mono">Posted by Admissions Placement Office</span>
                </div>
              </div>
            </div>

            {/* Right: Apply Now Primary CTA */}
            <div className="w-full md:w-auto shrink-0 flex flex-col items-start md:items-end gap-2">
              <button
                onClick={handleApplyClick}
                className="w-full md:w-auto py-3 px-8 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:scale-[1.02]"
              >
                <span>Apply Now</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <div className="text-[11px] font-mono text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Actively Reviewing Candidates</span>
              </div>
            </div>
          </div>

          {/* Quick Specifications Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-0.5">COMPENSATION</span>
              <span className="text-xs sm:text-sm font-bold text-[#2d5c36] flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {salaryText}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-0.5">LOCATION</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {job.location}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-0.5">EMPLOYMENT TYPE</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                {job.employmentType || job.type || 'Full-time'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-0.5">EXPERIENCE LEVEL</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {job.experienceLevel}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Body: Detailed Specification + Recommended Course & Employer Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Specification Body (8 cols) */}
          <div className="lg:col-span-8 space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs text-slate-700">
            
            {/* 1. Job Description */}
            <section className="space-y-3">
              <h3 className="text-base sm:text-lg font-display font-bold text-[#1a361d] flex items-center gap-2 border-b border-slate-100 pb-2">
                <span>Job Description</span>
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {job.description}
              </p>
            </section>

            {/* 2. Role & Responsibilities */}
            {(job.responsibilities && job.responsibilities.length > 0) && (
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-display font-bold text-[#1a361d] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span>Role & Responsibilities</span>
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                  {job.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#d8ffd2] text-[#2d5c36] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</span>
                      <span className="leading-normal">{resp}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 3. Preferred Qualifications */}
            {(job.preferredQualifications && job.preferredQualifications.length > 0) && (
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-display font-bold text-[#1a361d] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span>Preferred Qualifications</span>
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                  {job.preferredQualifications.map((qual, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <ChevronRight className="w-4 h-4 text-[#2d5c36] shrink-0 mt-0.5" />
                      <span className="leading-normal">{qual}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 4. Key Requirements */}
            {((job.keyRequirements && job.keyRequirements.length > 0) || (job.requirements && job.requirements.length > 0)) && (
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-display font-bold text-[#1a361d] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span>Key Requirements</span>
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                  {(job.keyRequirements || job.requirements || []).map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <ChevronRight className="w-4 h-4 text-[#9e4f8f] shrink-0 mt-0.5" />
                      <span className="leading-normal">{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 5. Required Certificate */}
            {(job.requiredCertificates && job.requiredCertificates.length > 0) && (
              <section className="space-y-3 p-4 rounded-2xl bg-[#d8ffd2]/30 border border-[#76ff8a]/60">
                <h3 className="text-xs sm:text-sm font-display font-bold text-[#1a361d] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#2d5c36]" />
                  <span>Required / Preferred Institutional Credentials</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {job.requiredCertificates.map((cert, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{cert}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 6. Technical Skills & Technologies */}
            {((job.technicalSkills && job.technicalSkills.length > 0) || (job.skills && job.skills.length > 0)) && (
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-display font-bold text-[#1a361d] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span>Technical Skills & Technologies</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(job.technicalSkills || job.skills || []).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* 7. Soft Skills */}
            {(job.softSkills && job.softSkills.length > 0) && (
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-display font-bold text-[#1a361d] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span>Professional & Soft Skills</span>
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  {job.softSkills.map((soft, idx) => (
                    <li key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9e4f8f]" />
                      <span>{soft}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 8. Career Growth & Opportunities */}
            {job.careerGrowth && (
              <section className="space-y-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60">
                <h3 className="text-xs sm:text-sm font-display font-bold text-amber-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Career Growth & Promotion Pathway</span>
                </h3>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {job.careerGrowth}
                </p>
              </section>
            )}

            {/* Perks & Benefits (if present) */}
            {(job.benefits && job.benefits.length > 0) && (
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-display font-bold text-[#1a361d] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span>Benefits, Perks & Equity</span>
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  {job.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Bottom Apply Bar */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Interested in this opening? Submit your credentials directly to the partner employer.
              </div>
              <button
                onClick={handleApplyClick}
                className="w-full sm:w-auto py-3 px-8 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
              >
                <span>Apply Now</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Recommended Course & Institutional Guarantee (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            
            {/* Recommended Course Card */}
            {(job.recommendedCourse || job.recommendedCourseTitle) && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1a361d] to-[#2d5c36] text-white shadow-xl space-y-4 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#76ff8a]/20 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest font-bold text-[#76ff8a]">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Recommended Curriculum</span>
                </div>

                <h4 className="text-lg font-display font-bold text-white leading-tight">
                  {job.recommendedCourse?.title || job.recommendedCourseTitle || 'American FutureTech Fellowship'}
                </h4>

                <p className="text-xs text-[#d8ffd2]/80 leading-relaxed">
                  Completing this accredited program fulfills 100% of the technical prerequisites and capstone requirements for this role.
                </p>

                {job.recommendedCourse && (
                  <div className="pt-2">
                    <Link
                      to={`/courses/${job.recommendedCourse.slug}`}
                      className="w-full py-2.5 px-4 rounded-full bg-[#76ff8a] hover:bg-[#5ce671] text-[#1a361d] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <span>Explore Course Syllabus</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Verified Partner Employer Badge */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs text-left space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-[#2d5c36]" />
                <span>Verified Direct Placement</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                This position is offered through the American FutureTech Corporate Hiring Network. Certified alumni receive expedited technical review and interview priority.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Location</span>
                <span className="font-semibold text-slate-800">{job.location}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Total Applicants</span>
                <span className="font-semibold text-slate-800">{job.applicantCount || 0}</span>
              </div>
            </div>

            {/* Direct Talent Referral CTA */}
            <div className="p-5 rounded-3xl bg-slate-100 border border-slate-200 text-left space-y-2">
              <h5 className="text-xs font-bold text-slate-900">Need Career Counseling?</h5>
              <p className="text-xs text-slate-600">
                Speak directly with an Admissions Career Advisor regarding cohort readiness and prerequisite alignment.
              </p>
              <Link
                to="/contact"
                className="text-xs font-bold text-[#2d5c36] hover:underline flex items-center gap-1 pt-1"
              >
                <span>Book 1-on-1 Academic Call</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Internal Application Form Modal (Fallback if external link not supplied) */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto text-left">
            <button
              onClick={() => setApplyModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {applySuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center mx-auto mb-4 border border-[#76ff8a]">
                  <CheckCircle2 className="w-8 h-8 text-[#2d5c36]" />
                </div>
                <h3 className="text-xl font-display font-bold text-[#1a361d] mb-2">Application Transmitted!</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Your application for <strong className="text-slate-900">{job.title}</strong> has been transmitted directly to <strong className="text-slate-900">{job.company}</strong>. Our Placement Officer will follow up within 24 hours.
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
                  <div className="text-[11px] font-bold text-[#2d5c36] uppercase tracking-wider mb-1">Direct Application</div>
                  <h3 className="text-lg font-display font-bold text-[#1a361d]">{job.title}</h3>
                  <div className="text-xs text-slate-500">{job.company} • {job.location}</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d]"
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
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d]"
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
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn / Portfolio URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/janedoe"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d]"
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
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brief Note / Candidate Background</label>
                  <textarea
                    rows={3}
                    placeholder="Relevant capstone projects, certifications, and availability..."
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d]"
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
