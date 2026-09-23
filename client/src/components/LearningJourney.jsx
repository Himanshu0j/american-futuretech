import React, { useState } from 'react';
import {
  Check,
  ArrowRight,
  Terminal,
  ShieldCheck,
  Briefcase,
  Play,
  Cpu,
  Sparkles,
  ExternalLink,
  Code2,
  Award,
  BookOpen,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AssessIllustration,
  LearnIllustration,
  PracticeIllustration,
  CertifyIllustration,
  CareerReadyIllustration
} from './illustrations/VectorIllustrations';
import { Lottie } from 'lottie-react';
import successLottie from '../assets/animations/learning/success-celebration.json';
import assessSvg from '../assets/illustrations/learning/01-assess-diagnostic.svg';
import learnSvg from '../assets/illustrations/learning/02-learn-masterclass.svg';
import practiceSvg from '../assets/illustrations/learning/03-practice-sandbox.svg';
import certifySvg from '../assets/illustrations/learning/04-certify-credential.svg';
import careerReadySvg from '../assets/illustrations/learning/05-job-ready-career.svg';

export default function LearningJourney() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'assess',
      number: '01',
      title: 'ASSESS',
      tagline: 'Skills Diagnostic & Tailored Roadmap',
      shortDesc: 'Comprehensive skill assessment to benchmark your technical proficiency.',
      description:
        'Before writing a single line of code, complete our diagnostic assessment measuring your algorithmic foundations, systems understanding, and career aspirations. We generate a custom 24-week curriculum roadmap calibrated to your target engineering compensation tier.',
      highlights: [
        'Algorithmic and systems engineering baseline evaluation',
        'Personalized track recommendation matching US tech market demand',
        'Dedicated 1-on-1 curriculum consultation with a faculty advisor'
      ],
      tag: 'Step 01 · Diagnostic',
      Illustration: AssessIllustration,
      sourcedSvg: assessSvg,
      ctaText: 'Explore Syllabus Tracks',
      ctaLink: '/courses'
    },
    {
      id: 'learn',
      number: '02',
      title: 'LEARN',
      tagline: 'Live Weekend Masterclasses with Silicon Valley Faculty',
      shortDesc: 'Rigorous engineering foundations taught by practicing tech leads.',
      description:
        'Engage directly with faculty from leading North American tech firms across 24 structured weeks. Every weekend interactive masterclass is paired with asynchronous micro-lessons, architectural diagrams, and comprehensive readings designed for production mastery.',
      highlights: [
        'Live weekend interactive lab sessions with Silicon Valley practitioners',
        'Asynchronous 1080p recorded video library indexed with chapter marks',
        'Deep theory combined with immediate practical implementation'
      ],
      tag: 'Step 02 · Mastery',
      Illustration: LearnIllustration,
      sourcedSvg: learnSvg,
      ctaText: 'View All Programs',
      ctaLink: '/courses'
    },
    {
      id: 'practice',
      number: '03',
      title: 'PRACTICE',
      tagline: 'Production Code in Real Repositories (Docker, PyTest, AWS)',
      shortDesc: 'Zero toy code. Real sandbox labs on cloud infrastructure.',
      description:
        'Zero multiple-choice trivia or toy exercises. You build, deploy, and debug on actual cloud infrastructure with Docker containers, LangChain vector indexes, and Kali Linux offensive testbeds with automated CI/CD pipelines.',
      highlights: [
        'Dedicated GitHub enterprise repositories with CI/CD pull request workflows',
        'Real-world capstone projects solving actual industry bottlenecks',
        'Automated test suites (PyTest, Jest) validating your code against standards'
      ],
      tag: 'Step 03 · Execution',
      Illustration: PracticeIllustration,
      sourcedSvg: practiceSvg,
      ctaText: 'Inspect Capstone Scope',
      ctaLink: '/courses'
    },
    {
      id: 'certify',
      number: '04',
      title: 'CERTIFY',
      tagline: 'Cryptographically Verifiable US Digital Credential',
      shortDesc: 'Permanent public verification URL and accredited transcript.',
      description:
        'Earn an accredited credential recognized by 200+ employer partners. Every certificate is backed by a permanent public verification URL and cryptographic registry ID verifying your capstone defense and academic honors.',
      highlights: [
        'Public verification link (/certificate/:id) verifying authentic completion',
        'Accredited US continuing education units (CEU) with official academic transcripts',
        'One-click digital credential export directly to your LinkedIn profile'
      ],
      tag: 'Step 04 · Credential',
      Illustration: CertifyIllustration,
      sourcedSvg: certifySvg,
      ctaText: 'Inspect Live Certificate',
      ctaLink: '/certificate/AFT-CERT-AI9821'
    },
    {
      id: 'career',
      number: '05',
      title: 'GET JOB READY',
      tagline: 'Dedicated 4-Month Technical Career Acceleration',
      shortDesc: 'ATS resume engineering, mock defense, and direct hiring intros.',
      description:
        'Education without placement is incomplete. We pair every fellow with a veteran career advisor for ATS resume engineering, whiteboarding interview defenses, and direct warm introductions to 200+ hiring partners.',
      highlights: [
        '1-on-1 technical interview defense panels and system design reviews',
        'ATS resume optimization achieving top percentile recruiter scores',
        'Direct referral pathways into our network of 200+ technology employers'
      ],
      tag: 'Step 05 · Placement',
      Illustration: CareerReadyIllustration,
      sourcedSvg: careerReadySvg,
      ctaText: 'View Career Placement',
      ctaLink: '/career-support'
    }
  ];

  const current = steps[activeStep];

  return (
    <section id="journey" className="py-12 sm:py-16 bg-[#F7F7F5] text-[#1b1b1b] relative z-10 overflow-hidden">
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E5C275]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE6D6] border border-[#10b981]/30 text-[#0B1220] text-xs font-bold font-heading uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Interactive 5-Step Story</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-[#0B1220] tracking-tight leading-tight">
            How You Evolve From Technologist to Leader
          </h2>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Our 5-step journey transforms raw ambition into validated, accredited, and hire-ready technical leadership through structured rigor.
          </p>
        </div>

        {/* 5-Step Interactive Stepper Bar with SVG Illustrations */}
        <div className="relative mb-10">
          {/* Connecting Track Line */}
          <div className="hidden lg:block absolute top-16 left-12 right-12 h-1 bg-gray-200 rounded-full z-0">
            <div
              className="h-full bg-gradient-to-r from-[#10b981] via-[#E5C275] to-[#0B1220] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Stepper Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 relative z-10">
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              const isPast = idx < activeStep;
              const StepSvg = step.Illustration;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(idx)}
                  className={`group text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative cursor-pointer ${
                    isActive
                      ? 'bg-white border-[#0B1220] shadow-xl ring-2 ring-[#10b981]/40 -translate-y-1'
                      : 'bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300 shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Step Top Bar: Number & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[#0B1220] text-[#E5C275]'
                          : isPast
                          ? 'bg-[#EFE6D6] text-[#0B1220]'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {step.number}
                    </span>

                    {isActive && (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]" />
                      </span>
                    )}
                  </div>

                  {/* Custom Vector SVG Thumbnail */}
                  <div className="w-12 h-12 mb-3 rounded-xl bg-[#f8fafc] border border-gray-100 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform overflow-hidden">
                    {step.sourcedSvg ? (
                      <img src={step.sourcedSvg} alt={step.title} className="w-full h-full object-contain" />
                    ) : (
                      <StepSvg className="w-full h-full object-contain" />
                    )}
                  </div>

                  {/* Title & Short Tag */}
                  <div className="space-y-1">
                    <div
                      className={`text-xs sm:text-sm font-black font-heading tracking-tight ${
                        isActive ? 'text-[#0B1220]' : 'text-gray-700'
                      }`}
                    >
                      {step.title}
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed hidden sm:block">
                      {step.shortDesc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Step Detailed Showcase Box */}
        <div className="rounded-3xl bg-white border border-gray-200/90 shadow-2xl p-5 sm:p-6 lg:p-7 text-left relative overflow-hidden transition-all duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-[#10b981] uppercase tracking-wider px-3 py-1 rounded-full bg-[#EFE6D6]/70 border border-[#10b981]/20">
                  {current.tag}
                </span>
                <span className="text-xs text-gray-500 font-medium">Step {current.number} of 05</span>
              </div>

              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0B1220] font-heading leading-tight tracking-tight">
                {current.tagline}
              </h3>

              <p className="text-base text-gray-600 leading-relaxed font-sans">
                {current.description}
              </p>

              {/* High-Impact Highlights Checklist */}
              <div className="space-y-3 pt-2">
                {current.highlights.map((item, hIdx) => (
                  <div key={hIdx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#EFE6D6] text-[#0B1220] flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium leading-normal">{item}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link to={current.ctaLink} className="elms-btn-primary group">
                  <span>{current.ctaText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  onClick={() => setActiveStep((activeStep + 1) % steps.length)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Rich Preview Pane */}
            <div className="lg:col-span-6">
              {/* STEP 01: ASSESS PREVIEW (Radar & Diagnostic Results) */}
              {activeStep === 0 && (
                <div className="p-6 rounded-2xl bg-[#f8fafc] border border-gray-200/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                      <span className="text-xs font-bold text-[#0B1220] font-heading uppercase">
                        Technical Skill Diagnostic Scorecard
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFE6D6] text-[#0B1220] font-bold">
                      Calibrated Tier 1
                    </span>
                  </div>

                  {/* Diagnostic Radar Graphic + Score Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div className="flex justify-center p-3 bg-white rounded-xl border border-gray-200">
                      <img src={assessSvg} alt="Skills Diagnostic" className="w-36 h-36 object-contain" />
                    </div>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-gray-700">Python & Algorithmic DSA</span>
                          <span className="font-mono font-bold text-[#0B1220]">92%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full bg-[#10b981] rounded-full" style={{ width: '92%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-gray-700">Distributed System Design</span>
                          <span className="font-mono font-bold text-[#0B1220]">88%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full bg-[#4338CA] rounded-full" style={{ width: '88%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-gray-700">Cloud Infrastructure (AWS/K8s)</span>
                          <span className="font-mono font-bold text-[#0B1220]">85%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full bg-[#4338CA] rounded-full" style={{ width: '85%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-gray-700">AI / LLM Architecture</span>
                          <span className="font-mono font-bold text-[#0B1220]">94%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full bg-[#f59e0b] rounded-full" style={{ width: '94%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-gray-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#10b981]" />
                      <span className="font-semibold text-[#0B1220]">Recommended Path:</span>
                      <span className="text-gray-600">Advanced AI & Systems Track (24 Wks)</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-emerald-700">Verified Fit</span>
                  </div>
                </div>
              )}

              {/* STEP 02: LEARN PREVIEW (Interactive Masterclass Player) */}
              {activeStep === 1 && (
                <div className="p-6 rounded-2xl bg-[#f8fafc] border border-gray-200/90 shadow-sm space-y-4">
                  {/* Contextual Masterclass Photo Header */}
                  <div className="relative rounded-xl overflow-hidden h-28 border border-gray-200 group">
                    <img
                      src="/images/classroom-lab.jpg"
                      alt="Curriculum & Masterclass Environment"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220]/85 via-[#0B1220]/60 to-transparent flex items-center p-4">
                      <div className="text-white space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E5C275] text-[#0B1220] text-[10px] font-mono font-bold uppercase">
                          Live Masterclass Studio
                        </span>
                        <div className="text-base font-bold font-heading">
                          Interactive Weekend Labs with Silicon Valley Faculty
                        </div>
                        <div className="text-[#EFE6D6] text-xs">Production scale architecture walkthroughs</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <span className="text-xs font-bold text-[#0B1220] font-heading uppercase">
                      Curriculum Syllabus Architecture
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFE6D6] text-[#0B1220] font-bold">
                      24 Weeks · Accredited
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#EFE6D6] text-[#0B1220] flex items-center justify-center font-bold text-[10px]">
                          M1
                        </div>
                        <span className="font-bold text-[#0B1220]">
                          Foundations: Vector Spaces, PyTorch & Linear Algebra
                        </span>
                      </div>
                      <span className="text-emerald-700 font-semibold text-[11px]">Completed</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#EFE6D6] text-[#0B1220] flex items-center justify-center font-bold text-[10px]">
                          M2
                        </div>
                        <span className="font-bold text-[#0B1220]">
                          Transformers, Multi-Head Attention & Fine-Tuning
                        </span>
                      </div>
                      <span className="text-emerald-700 font-semibold text-[11px]">Completed</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#4338CA]/40 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#0B1220] text-white flex items-center justify-center font-bold text-[10px]">
                          M3
                        </div>
                        <span className="font-bold text-[#0B1220]">
                          Production RAG Pipelines & Multi-Agent LangGraph
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#4338CA] text-white font-bold">
                        In Progress
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-[10px]">
                          M4
                        </div>
                        <span className="font-medium text-gray-600">
                          Enterprise Capstone Defense & Cloud Deployment
                        </span>
                      </div>
                      <span className="text-gray-400 font-medium text-[11px]">Weeks 21-24</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 03: PRACTICE PREVIEW (Docker, PyTest Terminal Sandbox) */}
              {activeStep === 2 && (
                <div className="relative">
                  <div className="hidden sm:block absolute -top-6 -right-6 z-20 w-16 h-16 animate-float-slow pointer-events-none drop-shadow-2xl">
                    <img
                      src="/images/floating-laptop-code.webp"
                      alt="Floating 3D Code Sandbox"
                      className="w-full h-full object-contain filter drop-shadow-xl"
                    />
                  </div>

                  <div className="rounded-2xl bg-[#0f1b11] border border-[#4338CA] shadow-xl p-5 sm:p-6 text-left text-white font-mono text-xs space-y-3 relative z-10">
                    <div className="flex items-center justify-between pb-2 border-b border-[#4338CA]/60 text-[11px] text-gray-400">
                      <span className="text-[#EFE6D6] font-semibold">// terminal: pytest production_suite</span>
                      <span className="text-[#E5C275]">Python 3.12 · Docker</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] leading-relaxed">
                      <div className="text-[#E5C275]">$ docker-compose -f docker-compose.prod.yml up -d</div>
                      <div className="text-gray-400">[+] Running 3/3: Container aft-vector-db Started</div>
                      <div className="text-[#E5C275]">$ pytest -v tests/test_agent_orchestrator.py</div>
                      <div className="text-emerald-400">
                        PASSED tests/test_agent.py::test_vector_store_retrieval (0.34s)
                      </div>
                      <div className="text-emerald-400">
                        PASSED tests/test_agent.py::test_langchain_agent_tools (0.82s)
                      </div>
                      <div className="text-emerald-400">
                        PASSED tests/test_agent.py::test_guardrails_latency (0.21s)
                      </div>
                      <div className="text-emerald-400">
                        PASSED tests/test_agent.py::test_jwt_rbac_authorization (0.15s)
                      </div>
                      <div className="pt-2 text-white font-bold flex items-center gap-2 border-t border-[#4338CA]/40 mt-3">
                        <span className="w-2 h-2 rounded-full bg-[#E5C275]" />
                        <span>4 passed, 0 warnings in 1.52s · Test Coverage: 99.1%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 04: CERTIFY PREVIEW (Official Verifiable Diploma) */}
              {activeStep === 3 && (
                <div className="relative">
                  <div className="hidden sm:block absolute -top-6 -right-5 z-20 w-14 h-14 animate-float-delayed pointer-events-none">
                    <img
                      src="/images/gold-seal-medal.webp"
                      alt="Accreditation Gold Seal Medal"
                      className="w-full h-full object-contain filter drop-shadow-xl"
                    />
                  </div>

                  <div className="p-6 rounded-2xl bg-[#fffdfa] border-2 border-[#0B1220]/30 shadow-xl text-center space-y-4 shimmer-active relative z-10">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-[#0B1220]">REGISTRY ID: AFT-CERT-AI9821</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EFE6D6] text-[#0B1220] font-bold text-[10px] border border-[#10b981]/30">
                        SHA-256 VERIFIED
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-3">
                        <img
                          src="/images/gold-seal-medal.webp"
                          alt="Gold Seal Medal"
                          className="w-12 h-12 object-contain drop-shadow-md shrink-0 animate-float-slow"
                        />
                        <div className="text-left">
                          <div className="text-xl sm:text-2xl font-black font-heading text-[#0B1220]">
                            Ethan Hunt
                          </div>
                          <div className="text-xs text-gray-600 font-medium">
                            6-Month Comprehensive Fellowship in Applied AI
                          </div>
                          <div className="text-xs font-bold text-[#10b981]">
                            Conferred with Highest Academic Honors · GPA 3.96
                          </div>
                        </div>
                      </div>
                      <div className="w-12 h-12 shrink-0 hidden sm:block">
                        <Lottie src={successLottie} loop autoplay className="w-12 h-12" />
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 font-mono text-[10px] text-gray-500 break-all text-left">
                      Hash: 0xe84a91b2c7f4e8832a8947b1df2847c94b293818e918c72834b928198f8271a4
                    </div>

                    <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
                      <span>30 N Gould St, Sheridan, WY</span>
                      <Link
                        to="/certificate/AFT-CERT-AI9821"
                        className="font-mono text-[#10b981] font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Open Public Registry</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 05: CAREER READY PREVIEW (Resume Scorecard & Hiring Pipeline) */}
              {activeStep === 4 && (
                <div className="relative">
                  <div className="hidden sm:block absolute -top-5 -right-5 z-20 w-22 h-22 animate-float-drift pointer-events-none">
                    <img
                      src="/images/grad-cap-diploma.webp"
                      alt="Graduation Cap & Diploma"
                      className="w-full h-full object-contain filter drop-shadow-xl"
                    />
                  </div>

                  <div className="p-6 rounded-2xl bg-[#f8fafc] border border-gray-200/90 shadow-sm space-y-4 relative z-10">
                    <div className="relative rounded-xl overflow-hidden min-h-[6rem] border border-gray-200 group flex items-center bg-gradient-to-r from-[#0B1220] via-[#152a17] to-[#4338CA] p-4">
                      <div className="flex-1 text-white space-y-0.5">
                        <span className="px-2 py-0.5 rounded-full bg-[#E5C275] text-[#0B1220] text-[9px] font-mono font-bold uppercase">
                          Phase 05: Placement
                        </span>
                        <div className="text-sm font-bold font-heading">
                          High-Impact Technical Career Outcomes
                        </div>
                        <div className="text-[#EFE6D6] text-[10px]">
                          Direct introductions across 200+ partner network
                        </div>
                      </div>
                      <div className="w-14 h-14 shrink-0 ml-3">
                        <img src={careerReadySvg} alt="Career Ready" className="w-full h-full object-contain" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <span className="text-xs font-bold text-[#0B1220] font-heading uppercase">
                        Career Acceleration Pipeline
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFE6D6] text-[#0B1220] font-bold">
                        Top 5% Talent Pool
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                        <div className="font-bold text-[#0B1220]">ATS Resume Engineering Score</div>
                        <span className="text-emerald-700 font-mono font-black text-sm">98 / 100</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                        <div className="font-bold text-[#0B1220]">1-on-1 System Design Mock Defense</div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#4338CA] text-white font-bold">
                          Passed · Exceeds Bar
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                        <div className="font-bold text-[#0B1220]">Direct Partner Referral Pipeline</div>
                        <span className="text-emerald-700 font-bold">3 Active Interview Loops</span>
                      </div>

                      <div className="pt-2 text-center text-[11px] text-gray-500 font-medium">
                        Average starting compensation: $124,000 across North America & remote roles
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
