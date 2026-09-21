import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock, Star, Award, CheckCircle2, FileText, ArrowRight, Play,
  ChevronDown, ChevronUp, Shield, Users, Sparkles, Download, PhoneCall,
  Calendar, Briefcase, Zap, Check, Lock, BookOpen, Layers, ZoomIn, Eye, ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LeadModal from '../components/LeadModal';
import { getAlignedMicrosoftCert } from '../data/microsoftCertificates';
import CertificateModal from '../components/CertificateModal';

export default function CourseDetailPage() {
  const { slug } = useParams();
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
      const found = res.data.courses?.find(c => c.slug === slug) || res.data.courses?.[0];
      setCourse(found);

      if (found) {
        const curRes = await axios.get(`/api/curriculum/courses/${found._id}`);
        setCurriculum(curRes.data.modules || []);
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

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased relative selection:bg-[#76ff8a] selection:text-[#1a361d]">
      <Navbar onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      <main className="pt-24 pb-20">
        {/* Breadcrumb strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link to="/" className="hover:text-[#1a361d]">Home</Link>
            <span>/</span>
            <Link to="/courses" className="hover:text-[#1a361d]">Academy Programs</Link>
            <span>/</span>
            <span className="text-[#1a361d] font-semibold truncate">{course.title}</span>
          </nav>
        </div>

        {/* Course Hero Banner Container */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="rounded-3xl bg-[#1a361d] text-white p-8 sm:p-12 lg:p-14 shadow-lg border border-[#2d5c36] relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10">
              {/* Left Column: Course Header Info */}
              <div className="lg:col-span-8">
                <div className="flex flex-wrap items-center gap-2.5 mb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1a361d] bg-[#d8ffd2] px-3 py-1 rounded-full">
                    {course.category}
                  </span>
                  {course.badge && (
                    <span className="text-xs font-semibold text-rose-200 bg-rose-900/40 px-3 py-1 rounded-full border border-rose-500/30">
                      {course.badge}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-[#76ff8a] bg-[#76ff8a]/10 px-3 py-1 rounded-full border border-[#76ff8a]/30">
                    Accredited US Certification
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-tight mb-5">
                  {course.title}
                </h1>

                <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed mb-8 max-w-3xl">
                  {course.description}
                </p>

                {/* Key Metrics / Highlights Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#132815] border border-[#2d5c36] text-center sm:text-left">
                  <div>
                    <div className="text-xs text-emerald-300/80 font-medium">Duration</div>
                    <div className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                      <Clock className="w-4 h-4 text-[#76ff8a]" />
                      {course.duration}
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
                    <div className="text-xs text-emerald-300/80 font-medium">Format</div>
                    <div className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                      <Zap className="w-4 h-4 text-[#76ff8a]" />
                      Live Cohort
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-300/80 font-medium">Career Assistance</div>
                    <div className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                      <Briefcase className="w-4 h-4 text-[#76ff8a]" />
                      Included
                    </div>
                  </div>
                </div>

                {/* Key Skills Tags */}
                <div className="mt-8">
                  <div className="text-xs font-bold text-emerald-300/90 uppercase tracking-wider mb-3">Skills You Will Master:</div>
                  <div className="flex flex-wrap gap-2">
                    {(course.skills || ['Machine Learning', 'Deep Learning', 'PyTorch', 'Vector DB', 'RAG Pipelines', 'MLOps']).map((skill, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-[#132815] text-emerald-100 text-xs font-medium border border-[#2d5c36]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Enrollment Card */}
              <div className="lg:col-span-4 lg:sticky lg:top-28">
                <div className="rounded-2xl bg-white text-slate-800 p-6 sm:p-7 shadow-xl border border-slate-200">
                  <div className="mb-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tuition Investment</div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-3xl font-display font-black text-[#1a361d]">${course.pricing?.discountedPrice || 1899}</span>
                      <span className="text-sm text-slate-400 line-through">${course.pricing?.basePrice || 2499}</span>
                    </div>
                    <div className="text-xs text-[#2d5c36] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#40844e]" />
                      Save ${(course.pricing?.basePrice || 2499) - (course.pricing?.discountedPrice || 1899)} with institutional grant
                    </div>
                  </div>

                  {/* Flexible Deposit Box */}
                  <div className="p-4 rounded-xl bg-[#f7fdf8] border border-[#76ff8a]/40 mb-5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1a361d]">
                        Flexible Seat Deposit
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#d8ffd2] text-[#1a361d] text-[10px] font-bold">
                        Most Popular
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      Reserve your seat in the upcoming cohort today with just <strong>$99 down</strong>. Pay remainder before cohort kickoff.
                    </p>
                    <Link
                      to={`/checkout?courseId=${course._id}&tier=deposit`}
                      className="w-full py-3 px-4 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white text-sm font-bold text-center shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      Reserve Seat for $99
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <Link
                    to={`/checkout?courseId=${course._id}&tier=full`}
                    className="w-full py-2.5 px-4 rounded-full border-2 border-[#1a361d] hover:bg-[#1a361d] hover:text-white text-[#1a361d] text-sm font-bold text-center transition-colors flex items-center justify-center gap-2 mb-3"
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
                  <div className="text-center py-2 px-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    {course.seatsUrgencyText || 'Only 3 seats remaining for this cohort'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum Modules Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#1a361d] mb-1">
                    Detailed Curriculum & Syllabus
                  </h2>
                  <p className="text-slate-600 text-sm">
                    {curriculum.length} comprehensive modules aligned with US enterprise engineering standards.
                  </p>
                </div>
                <a
                  href={course.brochureUrl || '/brochures/American_FutureTech_Syllabus.pdf'}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1a361d] text-xs font-semibold text-[#1a361d] hover:bg-[#1a361d] hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Syllabus PDF
                </a>
              </div>

              {/* Accordion List */}
              <div className="space-y-3">
                {curriculum.map((mod, index) => {
                  const isOpen = openModuleIndex === index;
                  return (
                    <div
                      key={mod._id || index}
                      className="rounded-xl bg-white border border-slate-200 overflow-hidden transition-all shadow-xs hover:border-[#1a361d]/40"
                    >
                      <button
                        onClick={() => setOpenModuleIndex(isOpen ? -1 : index)}
                        className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="w-10 h-10 rounded-lg bg-[#d8ffd2] text-[#1a361d] font-display font-bold text-sm flex items-center justify-center shrink-0">
                            0{mod.moduleNumber || index + 1}
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
                                  <span className="text-[#9e4f8f] font-semibold">1 Module Assessment</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
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
                                className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700"
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

                          {mod.quiz && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[#fcf4fa] border border-[#9e4f8f]/20 text-xs text-[#582c50] mt-2">
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-[#9e4f8f]" />
                                <span className="font-semibold">{mod.quiz.title}</span>
                              </div>
                              <span className="text-[11px] font-semibold text-[#9e4f8f]">Passing Grade: 70%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tools Stack */}
              <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <h3 className="text-lg font-display font-bold text-[#1a361d] mb-4">Enterprise Tools & Frameworks Covered</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(course.tools || ['PyTorch', 'Docker', 'FastAPI', 'Pinecone', 'HuggingFace', 'LangChain', 'AWS', 'Jupyter']).map((tool, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center font-semibold text-xs text-slate-700">
                      {tool}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructor Card */}
              <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <img
                  src={course.instructor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={course.instructor?.name || 'Instructor'}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[#76ff8a] shrink-0"
                />
                <div>
                  <div className="text-xs font-bold text-[#2d5c36] uppercase tracking-wider mb-1">Lead Program Instructor</div>
                  <h4 className="text-xl font-display font-bold text-[#1a361d] mb-1">{course.instructor?.name || 'Dr. Marcus Vance'}</h4>
                  <div className="text-xs text-slate-500 mb-3">{course.instructor?.role || 'Chief AI Architect & Ex-FAANG Lead'}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {course.instructor?.bio || '15+ years architecting enterprise distributed intelligence models. Guided over 1,200 engineers into top US technology careers.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column Value Adds */}
            <div className="lg:col-span-4 space-y-6">
              {/* Dual Verified Credentials Card */}
              {(() => {
                const alignedMs = getAlignedMicrosoftCert(course.slug || course.category || course.title);
                return (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center">
                        <Award className="w-6 h-6 text-[#2d5c36]" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-bold uppercase">
                        Dual Certification
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-display font-bold text-[#1a361d] mb-1">
                        Accredited US & Microsoft Credentials
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Graduates earn dual industry recognition: an accredited American FutureTech US Fellowship Diploma plus official alignment with Microsoft Certified Professional certifications.
                      </p>
                    </div>

                    {/* Aligned Microsoft Certificate Preview */}
                    <div
                      onClick={() => setSelectedModalCert(alignedMs)}
                      className="group cursor-pointer rounded-xl overflow-hidden border border-indigo-400/40 bg-slate-50 shadow-xs hover:border-indigo-500 transition-all"
                      title="Click to inspect certificate in 4K"
                    >
                      <div className="relative">
                        <img
                          src={alignedMs.image}
                          alt={alignedMs.title}
                          className="w-full h-36 object-contain bg-white transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="px-3 py-1 rounded-full bg-white text-slate-900 font-bold text-[11px] flex items-center gap-1 shadow-md">
                            <ZoomIn className="w-3.5 h-3.5 text-indigo-600" /> Inspect
                          </span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-900 text-white flex items-center justify-between text-[11px] font-mono px-3">
                        <span className="font-bold text-indigo-300">{alignedMs.code}</span>
                        <span className="text-slate-400 text-[10px]">Microsoft Certified</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-[#2d5c36] flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-[#40844e] shrink-0" />
                        <span className="truncate">Public Registry: americanfuturetech.com/certificate/ID</span>
                      </div>

                      <Link
                        to="/certificate/AFT-CERT-AI9821"
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1a361d] text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Verify Sample Credential</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })()}

              {/* Placement Guarantee Guarantee Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-[#2d5c36]" />
                </div>
                <h4 className="text-lg font-display font-bold text-[#1a361d] mb-2">Dedicated Career Support</h4>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#40844e] shrink-0 mt-0.5" />
                    <span>ATS-compliant tech resume rewrite by ex-FAANG recruiters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#40844e] shrink-0 mt-0.5" />
                    <span>1-on-1 technical mock interview sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#40844e] shrink-0 mt-0.5" />
                    <span>Direct referrals to 100+ vetted hiring partners</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

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
