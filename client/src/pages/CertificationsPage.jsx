import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Award, CheckCircle2, Clock, Signal, ArrowRight, ShieldCheck, BookOpen,
  Target, CreditCard, Sparkles, Download, PhoneCall, Briefcase, Cpu
} from 'lucide-react';
import Navbar from '../components/Navbar';
import CompanyMarquee from '../components/CompanyMarquee';
import Footer from '../components/Footer';
import LeadModal from '../components/LeadModal';

/**
 * Certification program pages (ported from the American Tech Global
 * certification landing pages) rendered with the American FutureTech UI.
 */
const CERTIFICATIONS = {
  'ai-certification': {
    slug: 'ai-certification',
    eyebrow: 'Artificial Intelligence',
    title: 'AI Certification Program',
    badge: 'Industry Recognized',
    subtitle: 'Earn your verifiable credentials in Artificial Intelligence, Deep Learning, and Generative AI.',
    duration: '4–6 Months',
    level: 'Intermediate to Advanced',
    highlights: [
      '100% Live Instructor-Led Classes with direct Q&A',
      'Production-Grade Capstones & Enterprise Datasets',
      '1-on-1 Technical Mock Interviews & Resume Optimization',
      'Verifiable Certificate of Completion with Unique ID',
      'Lifetime LMS Access with HD Session Recordings',
    ],
    overview:
      'The American FutureTech AI Certification provides formal, verifiable validation of your capability to design, train, and deploy production AI models. It demonstrates complete technical mastery across modern LLM frameworks, deep learning architectures, and scalable cloud deployments.',
    competencies: [
      'Python for AI', 'PyTorch & TensorFlow', 'LLM Architectures', 'RAG Systems',
      'Agentic AI Workflows', 'Vector Databases', 'FastAPI & Docker Deployment',
    ],
    roles: ['AI Engineer', 'Machine Learning Specialist', 'Applied AI Researcher', 'GenAI Solutions Architect'],
    linkedCourseSlug: 'advanced-generative-and-agentic-ai-master-program',
  },
  'data-science-certification': {
    slug: 'data-science-certification',
    eyebrow: 'Data Science & Analytics',
    title: 'Data Science Certification Program',
    badge: 'Industry Recognized',
    subtitle: 'Master statistics, machine learning, and modern analytics pipelines with verifiable credentials.',
    duration: '6 Months',
    level: 'Beginner to Advanced',
    highlights: [
      '100% Live Instructor-Led Classes with direct Q&A',
      'Real Enterprise Datasets & Production Capstones',
      'Power BI, Snowflake & SQL Analytics Engineering',
      'Verifiable Certificate of Completion with Unique ID',
      'Lifetime LMS Access with HD Session Recordings',
    ],
    overview:
      'The American FutureTech Data Science Certification validates end-to-end analytics capability: statistical modelling, feature engineering, production machine learning pipelines, and business intelligence delivery on modern data platforms.',
    competencies: [
      'Python & pandas', 'SQL & Data Modelling', 'Statistics & Experimentation',
      'Scikit-Learn & XGBoost', 'Power BI & Tableau', 'MLOps Fundamentals', 'Snowflake & Spark',
    ],
    roles: ['Data Scientist', 'Data Analyst', 'Analytics Engineer', 'ML Engineer'],
    linkedCourseSlug: 'data-science-with-ai-integration',
  },
};

export default function CertificationsPage() {
  const { slug } = useParams();
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const cert = CERTIFICATIONS[slug] || CERTIFICATIONS['ai-certification'];

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      <main className="pt-28 pb-10">
        <CompanyMarquee />

        {/* Hero */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-8 pb-10 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-bold uppercase tracking-wider mb-4">
            <Award className="w-3.5 h-3.5 text-[#2d5c36]" />
            <span>{cert.eyebrow}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight text-[#1a361d] mb-2">
                {cert.title}{' '}
                <span className="text-[#2d5c36] text-xl sm:text-2xl align-middle">({cert.badge})</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-5 max-w-2xl">
                {cert.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-[#2d5c36]" /> Duration: {cert.duration}
                </span>
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                  <Signal className="w-3.5 h-3.5 text-[#2d5c36]" /> Level: {cert.level}
                </span>
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" /> Verifiable Credential
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsLeadModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1a361d] hover:bg-[#2d5c36] text-[#d8ffd2] font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <span>Inquire About Certification</span>
                  <ArrowRight className="w-4 h-4 text-[#76ff8a]" />
                </button>
                <button
                  onClick={() => setIsLeadModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-[#2d5c36]" />
                  <span>Book Free Career Consultation</span>
                </button>
              </div>
            </div>

            {/* Program Highlights card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-white border border-slate-200 shadow-lg p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2d5c36] mb-4 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Program Highlights
                </div>
                <div className="space-y-2.5">
                  {cert.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>Supported Payment Methods: Cards • Klarna • Afterpay • Affirm</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Overview + competencies */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mb-12">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-8">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2d5c36] mb-3">
              <BookOpen className="w-3.5 h-3.5" /> Comprehensive Overview
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#1a361d] mb-3">About This Program</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl mb-8">{cert.overview}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#1a361d] mb-4">
                  <Cpu className="w-4 h-4 text-[#2d5c36]" /> Competencies You Will Build
                </div>
                <div className="flex flex-wrap gap-2">
                  {cert.competencies.map((c, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-[#f2f7f1] border border-slate-200 text-[11px] font-semibold text-slate-700">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#1a361d] mb-4">
                  <Target className="w-4 h-4 text-[#2d5c36]" /> Target Career Roles
                </div>
                <div className="space-y-2">
                  {cert.roles.map((r, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 p-2.5 rounded-xl bg-[#fafbf9] border border-slate-200">
                      <Briefcase className="w-3.5 h-3.5 text-[#10b981]" />
                      <span className="font-semibold">{r}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="rounded-3xl bg-gradient-to-br from-[#1a361d] via-[#132815] to-[#0d1c0e] text-white p-6 sm:p-10 text-center shadow-2xl border border-[#2d5c36]">
            <h3 className="text-2xl sm:text-3xl font-black font-heading mb-3">
              Advance Your Career with American FutureTech
            </h3>
            <p className="text-sm text-emerald-100/90 max-w-xl mx-auto mb-6">
              Live cohorts start soon. Secure your seat and get personalized career mentorship.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setIsLeadModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#76ff8a] hover:bg-white text-[#1a361d] font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Request Syllabus PDF</span>
              </button>
              <Link
                to={`/courses/${cert.linkedCourseSlug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 hover:bg-white/10 text-white font-bold text-xs transition-colors"
              >
                <span>View Full Program</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer onOpenLeadModal={() => setIsLeadModalOpen(true)} />
      <LeadModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
    </div>
  );
}
