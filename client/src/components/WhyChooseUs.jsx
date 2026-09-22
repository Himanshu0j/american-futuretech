import React from 'react';
import {
  Laptop,
  Clock,
  Target,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Check,
  Play,
  Award,
  Terminal,
  FileCode,
  Sparkles,
  Briefcase,
  Users,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import lmsDashboardSvg from '../assets/illustrations/lms/lms-dashboard.svg';
import lmsCodeReviewSvg from '../assets/illustrations/lms/lms-code-review.svg';
import lmsProgressDataSvg from '../assets/illustrations/lms/lms-progress-data.svg';
import lmsCertificateSvg from '../assets/illustrations/lms/lms-certificate.svg';

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="py-16 sm:py-24 bg-[#fffff2] text-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32">
        
        {/* Intro Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d8ffd2] text-[#1a361d] text-xs font-bold font-heading uppercase tracking-wider">
            <span>Product & Learning Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#1a361d] tracking-tight leading-tight">
            Turbocharge your engineering capabilities in record time
          </h2>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Easy LMS-inspired product discipline applied to deep technology education. Experience distraction-free classrooms, hands-on production codebases, verifiable US credentials, and dedicated career placement.
          </p>
        </div>

        {/* Feature Story 1: Dedicated Academy Portal (TEXT Left | PRODUCT UI Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center text-left">
          
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold tracking-widest text-[#40844e] uppercase font-heading">
              01 — The Dedicated Academy Portal
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a361d] font-heading leading-tight">
              A unified student portal tailored to your engineering fellowship
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Every enrolled fellow receives a dedicated personal academy workspace. Seamlessly resume current lessons, access synchronized cloud notebooks, review cohort schedules, and manage certifications from one central cockpit.
            </p>

            <ul className="space-y-4 pt-2">
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[#1a361d]">Live & Recorded Masterclasses</strong>
                  <span className="text-sm text-gray-600">Every weekend lab is recorded in 1080p and indexed with chapter timestamps.</span>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[#1a361d]">Real-Time Progress Tracking</strong>
                  <span className="text-sm text-gray-600">Visual progress bars and milestone checklists that keep your momentum consistent.</span>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[#1a361d]">Location & Step Awareness</strong>
                  <span className="text-sm text-gray-600">Never get lost. Always know: Where am I? What am I doing? What is next?</span>
                </div>
              </li>
            </ul>

            <div className="pt-2">
              <Link to="/courses" className="elms-btn-primary">
                <span>Explore Academy Tracks</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Product UI Mockup: Academy Cockpit */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden text-left p-6 space-y-4">
              
              {/* Contextual Academy Banner with Sourced Vector LMS Dashboard Illustration */}
              <div className="relative rounded-xl overflow-hidden min-h-[7rem] border border-gray-100 group flex items-center bg-gradient-to-r from-[#1a361d] via-[#152a17] to-[#2d5c36] p-4">
                <div className="flex-1 space-y-1 text-white z-10">
                  <span className="px-2 py-0.5 rounded-full bg-[#76ff8a] text-[#1a361d] text-[9px] font-mono font-bold uppercase">
                    Dedicated Student Cockpit
                  </span>
                  <div className="text-sm font-bold font-heading">American FutureTech Academy Space</div>
                  <div className="text-[#d8ffd2] text-[10px]">Real-time lesson synchronization & cloud notebooks</div>
                </div>
                <div className="w-20 h-20 shrink-0 ml-3 z-10 group-hover:scale-105 transition-transform">
                  <img src={lmsDashboardSvg} alt="Dedicated Academy Portal" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1a361d] text-[#fffff2] flex items-center justify-center font-bold text-xs">
                    EH
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1a361d]">Ethan Hunt</div>
                    <div className="text-[10px] text-gray-500 font-mono">Fellow ID: AFT-2026-8819</div>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#d8ffd2] text-[#1a361d] font-bold">
                  Active Term
                </span>
              </div>

              {/* Active Program Card */}
              <div className="p-4 rounded-xl bg-[#fffff2] border border-[#2d5c36]/20 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-[#40844e] uppercase tracking-wide font-heading">Primary Track</span>
                  <span className="text-[11px] font-mono text-[#1a361d] font-bold">68% Complete</span>
                </div>
                <div className="text-base font-bold text-[#1a361d]">Data Science with AI Integration</div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#40844e] rounded-full w-[68%]" />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                  <span>Current: Module 4 (Agentic RAG)</span>
                  <span className="text-[#9e4f8f] font-bold flex items-center gap-1">
                    Resume Lesson <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Micro Upcoming Milestones */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Next Live Lab</div>
                  <div className="font-bold text-[#1a361d] mt-1">Saturday, 10:00 AM EST</div>
                  <div className="text-[11px] text-gray-500">LangGraph Multi-Agent</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Office Hours</div>
                  <div className="font-bold text-[#1a361d] mt-1">1-on-1 Mentor Session</div>
                  <div className="text-[11px] text-[#2d5c36] font-semibold">Booked for Thursday</div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Feature Story 2: Distraction-Free Classroom (PRODUCT UI Left | TEXT Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center text-left">
          
          {/* Product UI Mockup: Video Classroom & Code Lab */}
          <div className="lg:col-span-6 order-2 lg:order-1 relative">
            {/* Floating 3D Laptop Asset */}
            <div className="hidden sm:block absolute -top-8 -right-6 z-20 w-24 h-24 animate-float-slow pointer-events-none drop-shadow-2xl">
              <img
                src="/images/floating-laptop-code.webp"
                alt="Floating 3D Neural Architecture"
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
            </div>

            <div className="rounded-2xl bg-[#0f1b11] border border-[#2d5c36] shadow-xl overflow-hidden text-left text-white relative z-10">
              
              <div className="px-4 py-3 bg-[#132315] border-b border-[#2d5c36]/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-mono text-[#d8ffd2]/80 ml-2">Classroom // PyTorch & LangChain</span>
                </div>
                <span className="text-[10px] bg-[#9e4f8f] px-2 py-0.5 rounded text-white font-bold">HD Live</span>
              </div>

              <div className="p-4 space-y-3">
                {/* Sourced Vector SVG: Code Review Engine */}
                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#142617] border border-[#2d5c36]/50">
                  <div className="w-12 h-12 shrink-0 p-1 bg-black/40 rounded-lg border border-[#2d5c36]/40">
                    <img src={lmsCodeReviewSvg} alt="Code Review Engine" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-[#76ff8a]">Automated Code Review Engine</div>
                    <div className="text-[10px] text-gray-300">Live linting, containerized tests, and instant faculty annotations.</div>
                  </div>
                </div>

                {/* Terminal / Code Editor Mockup */}
                <div className="p-3.5 rounded-xl bg-black/60 border border-[#2d5c36]/50 font-mono text-xs space-y-1.5 text-[#d8ffd2]">
                  <div className="text-[10px] text-gray-500">// production_agent.py</div>
                  <div className="text-[#76ff8a]">$ python -m pytest tests/test_rag_pipeline.py</div>
                  <div className="text-gray-300">================ test session starts ================</div>
                  <div className="text-emerald-400">PASSED tests/test_rag_pipeline.py::test_vector_similarity</div>
                  <div className="text-emerald-400">PASSED tests/test_rag_pipeline.py::test_langchain_agent_tools</div>
                  <div className="text-emerald-400">PASSED tests/test_rag_pipeline.py::test_pinecone_index_sync</div>
                  <div className="text-white font-bold pt-1">3 passed, 0 failed in 1.42s</div>
                </div>

                {/* Micro Lesson Progress Tracker */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#142617] border border-[#2d5c36]/50 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#76ff8a]" />
                    <span className="text-[#d8ffd2] font-semibold">Unit 4: LangGraph Tool Invocations</span>
                  </div>
                  <button className="text-[11px] bg-[#2d5c36] hover:bg-[#1a361d] text-white px-2.5 py-1 rounded-full font-bold transition-colors">
                    Mark Unit Complete
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Text Content */}
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <span className="text-xs font-bold tracking-widest text-[#40844e] uppercase font-heading">
              02 — Distraction-Free Classroom
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a361d] font-heading leading-tight">
              Create high-impact learning outcomes with zero clutter
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Your classroom puts the learning material center stage. Clean video players, synchronized code notebooks, and automated completion tracking keep you focused on real engineering rather than confusing navigational interfaces.
            </p>

            <ul className="space-y-4 pt-2">
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[#1a361d]">Real Code, Not Syntax Puzzles</strong>
                  <span className="text-sm text-gray-600">Work directly on GitHub repositories with Docker containers and vector databases.</span>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[#1a361d]">Synchronized Notes & Lab Artifacts</strong>
                  <span className="text-sm text-gray-600">Instant access to architectural slides, sample code, and downloadable notebooks.</span>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[#1a361d]">One-Click Progress Synchronization</strong>
                  <span className="text-sm text-gray-600">Mark complete with instant progress recalculation and animated celebration feedback.</span>
                </div>
              </li>
            </ul>

            <div className="pt-2">
              <Link to="/courses" className="elms-btn-secondary">
                <span>View Full Curriculum</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

        {/* Feature Story 3: Verifiable US Digital Credentials (TEXT Left | PRODUCT UI Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center text-left">
          
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold tracking-widest text-[#40844e] uppercase font-heading">
              03 — Verifiable US Credentials
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a361d] font-heading leading-tight">
              Demonstrate your achievements with cryptographically verified credentials
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Every certificate issued by American FutureTech includes an immutable verification ID registered in our public ledger. Prospective employers can inspect your syllabus completion, capstone defense, and academic honors in one click.
            </p>

            <ul className="space-y-4 pt-2">
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[#1a361d]">Public Verification Registry</strong>
                  <span className="text-sm text-gray-600">Live URL (/certificate/:id) with authentic double-bordered diploma presentation.</span>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[#1a361d]">LinkedIn & Resume Ready</strong>
                  <span className="text-sm text-gray-600">One-click export to LinkedIn credentials and PDF diploma download.</span>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[#1a361d]">Wyoming Registered Charter</strong>
                  <span className="text-sm text-gray-600">Accredited institutional governance ensuring long-term credential validity.</span>
                </div>
              </li>
            </ul>

            <div className="pt-2">
              <Link to="/certificate/AFT-CERT-AI9821" className="elms-btn-primary">
                <span>Inspect Verified Certificate</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Product UI Mockup: Diploma Card */}
          <div className="lg:col-span-6 relative">
            {/* Floating Official Gold Seal Asset */}
            <div className="hidden sm:block absolute -top-6 -right-4 z-20 w-20 h-20 animate-float-delayed pointer-events-none">
              <img
                src="/images/gold-seal-medal.webp"
                alt="Official Gold Accreditation Seal"
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
            </div>

            <div className="p-6 rounded-2xl bg-white border-2 border-[#1a361d]/15 shadow-xl text-left space-y-4 relative z-10 shimmer-active">
              <div className="border border-amber-400/40 p-6 rounded-xl space-y-3 bg-[#fffdfa]">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1a361d] text-[#fffff2] flex items-center justify-center font-bold text-xs font-heading">
                      AF
                    </div>
                    <div className="w-9 h-9 hidden sm:block">
                      <img src={lmsCertificateSvg} alt="Verified Certificate" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d8ffd2] text-[#1a361d] font-bold">
                    VERIFIED AUTHENTIC
                  </span>
                </div>

                <div className="text-center pt-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold">
                    The American Institute of Applied Emerging Technology
                  </div>
                  <div className="text-xs text-gray-500 mt-1">This certifies that</div>
                  <div className="text-xl sm:text-2xl font-bold font-heading text-[#1a361d] mt-1">
                    Ethan Hunt
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    has successfully completed the 6-Month Intensive Fellowship in
                  </div>
                  <div className="text-base font-bold text-[#2d5c36] mt-1">
                    Data Science with AI Integration
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-[11px] text-gray-500">
                  <div>
                    <div className="font-mono text-[10px] text-gray-400">CREDENTIAL ID</div>
                    <div className="font-mono font-bold text-[#1a361d]">AFT-CERT-AI9821</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] text-gray-400">STATUS</div>
                    <div className="font-bold text-[#40844e]">Graduated with Honors</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Feature Story 4: Career Acceleration & 1-on-1 Mentorship (PRODUCT UI Left | TEXT Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center text-left">
          
          {/* Product UI Mockup: Career Pipeline */}
          <div className="lg:col-span-6 order-2 lg:order-1 relative">
            {/* Floating 3D Graduation Cap Asset */}
            <div className="hidden sm:block absolute -top-7 -right-4 z-20 w-22 h-22 animate-float-drift pointer-events-none">
              <img
                src="/images/grad-cap-diploma.webp"
                alt="Graduation Cap & Diploma"
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xl space-y-4 text-left relative z-10">
              {/* Contextual Mentorship Banner with Sourced Vector LMS Progress Illustration */}
              <div className="relative rounded-xl overflow-hidden min-h-[7rem] border border-gray-100 group flex items-center bg-gradient-to-r from-[#1a361d] via-[#152a17] to-[#2d5c36] p-4">
                <div className="flex-1 space-y-1 text-white z-10">
                  <span className="px-2 py-0.5 rounded-full bg-[#76ff8a] text-[#1a361d] text-[9px] font-mono font-bold uppercase">
                    Dedicated Advisory Desk
                  </span>
                  <div className="text-sm font-bold font-heading">1-on-1 Faculty Interview Defense</div>
                  <div className="text-[#d8ffd2] text-[10px]">Mock panels, whiteboarding & direct partner referrals</div>
                </div>
                <div className="w-20 h-20 shrink-0 ml-3 z-10 group-hover:scale-105 transition-transform">
                  <img src={lmsProgressDataSvg} alt="Career Acceleration Pipeline" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-bold text-[#1a361d] font-heading uppercase">
                  Career Acceleration Pipeline
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#d8ffd2] text-[#1a361d] font-bold">
                  Phase 4 Active
                </span>
              </div>

              {/* Progress Milestones */}
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#40844e]" />
                    <span className="font-bold text-[#1a361d]">ATS Technical Resume Engineering</span>
                  </div>
                  <span className="font-mono font-bold text-[#40844e]">Score: 98/100</span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#40844e]" />
                    <span className="font-bold text-[#1a361d]">Executive LinkedIn & GitHub Audit</span>
                  </div>
                  <span className="text-gray-500 font-semibold">Approved</span>
                </div>

                <div className="p-3 rounded-xl bg-[#fffff2] border border-[#2d5c36]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#2d5c36]" />
                    <span className="font-bold text-[#1a361d]">Mock System Design & Code Panel</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#9e4f8f] text-white font-bold">
                    Scheduled
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 font-medium">Direct Partner Referrals</span>
                  </div>
                  <span className="text-xs text-gray-400">200+ Network</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-gray-500 text-center font-medium">
                Average graduate salary increase: +42% across US & global cohorts
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <span className="text-xs font-bold tracking-widest text-[#40844e] uppercase font-heading">
              04 — Career Placement Acceleration
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a361d] font-heading leading-tight">
              Dedicated Career Accelerator to Help You Land Your Next High-Impact Role
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              We do not leave career outcomes to chance. Each fellow is paired with an experienced technical career advisor who oversees ATS resume engineering, mock panel reviews, and direct introductions to hiring partners.
            </p>

            <ul className="space-y-4 pt-2">
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[#1a361d]">Dedicated Career Advisor</strong>
                  <span className="text-sm text-gray-600">Weekly 1-on-1 strategy sessions focused on interview prep and salary negotiation.</span>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[#1a361d]">200+ Employer Hiring Network</strong>
                  <span className="text-sm text-gray-600">Direct referrals bypassing applicant tracking system black holes.</span>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-[#1a361d]">Portfolio Code Audits</strong>
                  <span className="text-sm text-gray-600">Ensure your GitHub profile demonstrates clean CI/CD, unit tests, and production code.</span>
                </div>
              </li>
            </ul>

            <div className="pt-2">
              <Link to="/career-support" className="elms-btn-primary">
                <span>Learn More About Career Support</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
