import React, { useState } from 'react';
import {
  BookOpen,
  Terminal,
  Award,
  TrendingUp,
  Check,
  ArrowRight,
  Code2,
  ShieldCheck,
  Briefcase,
  Play,
  Cpu,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LearningJourney() {
  const [activePhase, setActivePhase] = useState(0);

  const phases = [
    {
      id: 'learn',
      number: '01',
      title: 'LEARN',
      subtitle: 'Rigorous Academic Foundation & Live Masterclasses',
      description: 'Engage with industry faculty across 24 structured weeks. Every weekend lab is paired with asynchronous micro-lessons, architectural diagrams, and comprehensive readings designed to prepare you for production complexity.',
      highlights: [
        'Live weekend interactive lab sessions with Silicon Valley practitioners',
        'Asynchronous 1080p recorded video library indexed with chapter marks',
        'Deep theory combined with immediate practical implementation'
      ],
      tag: 'Phase 1: Foundation',
      visualType: 'curriculum',
      ctaText: 'Explore Syllabus Tracks',
      ctaLink: '/courses'
    },
    {
      id: 'practice',
      number: '02',
      title: 'PRACTICE',
      subtitle: 'Production GitHub Repositories & Real Sandbox Labs',
      description: 'Zero toy code or multiple-choice trivia. You build, break, and debug on real cloud infrastructure with Docker containers, LangChain vector indexes, and Kali Linux offensive environments.',
      highlights: [
        'Dedicated GitHub enterprise repositories with CI/CD pull request workflows',
        'Real-world capstone projects solving actual industry bottlenecks',
        'Automated test suites (PyTest, Jest) validating your code against standards'
      ],
      tag: 'Phase 2: Execution',
      visualType: 'code',
      ctaText: 'View Capstone Architecture',
      ctaLink: '/courses'
    },
    {
      id: 'certify',
      number: '03',
      title: 'CERTIFY',
      subtitle: 'Cryptographically Verifiable US Digital Credentials',
      description: 'Earn an accredited credential recognized by 200+ employer partners. Every certificate is backed by a permanent public verification URL and cryptographic registry ID verifying your capstone defense.',
      highlights: [
        'Public verification link (/certificate/:id) verifying authentic completion',
        'Accredited US continuing education units (CEU) with official academic transcripts',
        'One-click digital credential export directly to your LinkedIn profile'
      ],
      tag: 'Phase 3: Verification',
      visualType: 'certificate',
      ctaText: 'Inspect Live Certificate',
      ctaLink: '/certificate/AFT-CERT-AI9821'
    },
    {
      id: 'advance',
      number: '04',
      title: 'ADVANCE',
      subtitle: 'Dedicated 4-Month Technical Career Acceleration',
      description: 'Education without placement is incomplete. We pair every fellow with an experienced career advisor for ATS resume engineering, whiteboarding interview defenses, and direct introductions to hiring partners.',
      highlights: [
        '1-on-1 technical interview defense panels and system design reviews',
        'ATS resume optimization achieving top percentile recruiter scores',
        'Direct referral pathways into our network of 200+ technology employers'
      ],
      tag: 'Phase 4: Outcomes',
      visualType: 'career',
      ctaText: 'Learn About Career Support',
      ctaLink: '/career-support'
    }
  ];

  const currentPhase = phases[activePhase];

  return (
    <section id="journey" className="py-16 sm:py-24 bg-[#fffff2] text-[#1b1b1b] relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d8ffd2] text-[#1a361d] text-xs font-bold font-heading uppercase tracking-wider">
            <span>Pedagogical Architecture</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#1a361d] tracking-tight leading-tight">
            How You Evolve From Technologist to Leader
          </h2>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Our 4-phase learning journey combines theoretical rigor, production coding, verifiable certification, and dedicated career placement.
          </p>
        </div>

        {/* Phase Selector Tabs (Pill Buttons) */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex flex-wrap items-center gap-2 p-1.5 rounded-full bg-white border border-gray-200 shadow-sm max-w-full overflow-x-auto">
            {phases.map((phase, idx) => (
              <button
                key={phase.id}
                onClick={() => setActivePhase(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activePhase === idx
                    ? 'bg-[#1a361d] text-[#fffff2] shadow-sm'
                    : 'text-[#1a361d]/80 hover:text-[#1a361d] hover:bg-gray-100'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">{phase.number}</span>
                <span>{phase.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Phase Content Showcase Box */}
        <div className="rounded-3xl bg-white border border-gray-200 shadow-lg p-6 sm:p-10 lg:p-12 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Content Side */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-bold text-[#40844e] uppercase tracking-wider">
                  {currentPhase.tag}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-500 font-semibold">Step {currentPhase.number} of 04</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a361d] font-heading leading-tight">
                {currentPhase.subtitle}
              </h3>

              <p className="text-base text-gray-600 leading-relaxed">
                {currentPhase.description}
              </p>

              <div className="space-y-3 pt-2">
                {currentPhase.highlights.map((item, hIdx) => (
                  <div key={hIdx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Link to={currentPhase.ctaLink} className="elms-btn-primary">
                  <span>{currentPhase.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => setActivePhase((activePhase + 1) % phases.length)}
                  className="elms-btn-ghost text-xs"
                >
                  Next Phase →
                </button>
              </div>
            </div>

            {/* Right Visual Representation Side */}
            <div className="lg:col-span-6">
              
              {/* Visual 1: Curriculum / Learn */}
              {currentPhase.visualType === 'curriculum' && (
                <div className="p-6 rounded-2xl bg-[#f8fafc] border border-gray-200/90 shadow-sm space-y-4">
                  {/* Contextual Curriculum Photo */}
                  <div className="relative rounded-xl overflow-hidden h-24 border border-gray-200 group">
                    <img
                      src="/images/classroom-lab.jpg"
                      alt="Curriculum & Masterclass Environment"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1a361d]/85 via-[#1a361d]/60 to-transparent flex items-center p-3.5">
                      <div className="text-white space-y-0.5">
                        <span className="px-2 py-0.5 rounded-full bg-[#76ff8a] text-[#1a361d] text-[9px] font-mono font-bold uppercase">
                          Phase 01: Foundation
                        </span>
                        <div className="text-sm font-bold font-heading">Interactive Masterclasses & Code Labs</div>
                        <div className="text-[#d8ffd2] text-[10px]">Silicon Valley standard engineering curriculum</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <span className="text-xs font-bold text-[#1a361d] font-heading uppercase">Curriculum Architecture</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d8ffd2] text-[#1a361d] font-bold">24 Weeks</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center font-bold text-[10px]">M1</div>
                        <span className="font-bold text-[#1a361d]">Foundations: Linear Algebra, PyTorch & Vector Spaces</span>
                      </div>
                      <span className="text-emerald-700 font-semibold text-[11px]">Completed</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center font-bold text-[10px]">M2</div>
                        <span className="font-bold text-[#1a361d]">Transformers, Attention Mechanisms & Fine-Tuning</span>
                      </div>
                      <span className="text-emerald-700 font-semibold text-[11px]">Completed</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#fffff2] border border-[#2d5c36]/40 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#1a361d] text-white flex items-center justify-center font-bold text-[10px]">M3</div>
                        <span className="font-bold text-[#1a361d]">Production RAG Pipelines & Multi-Agent LangGraph</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#9e4f8f] text-white font-bold">In Progress</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-[10px]">M4</div>
                        <span className="font-medium text-gray-600">Enterprise Capstone Defense & Cloud Deployment</span>
                      </div>
                      <span className="text-gray-400 font-medium text-[11px]">Weeks 21-24</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual 2: Code / Practice */}
              {currentPhase.visualType === 'code' && (
                <div className="relative">
                  {/* Floating 3D Laptop Visual */}
                  <div className="hidden sm:block absolute -top-8 -right-6 z-20 w-24 h-24 animate-float-slow pointer-events-none drop-shadow-2xl">
                    <img
                      src="/images/floating-laptop-code.webp"
                      alt="Floating 3D Neural Architecture"
                      className="w-full h-full object-contain filter drop-shadow-xl"
                    />
                  </div>

                  <div className="rounded-2xl bg-[#0f1b11] border border-[#2d5c36] shadow-md p-5 text-left text-white font-mono text-xs space-y-3 relative z-10">
                    <div className="flex items-center justify-between pb-2 border-b border-[#2d5c36]/60 text-[11px] text-gray-400">
                      <span className="text-[#d8ffd2] font-semibold">// terminal: pytest production_suite</span>
                      <span className="text-[#76ff8a]">Python 3.12 · Docker</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] leading-relaxed">
                      <div className="text-[#76ff8a]">$ docker-compose -f docker-compose.prod.yml up -d</div>
                      <div className="text-gray-400">[+] Running 3/3: Container aft-vector-db Started</div>
                      <div className="text-[#76ff8a]">$ pytest -v tests/test_agent_orchestrator.py</div>
                      <div className="text-emerald-400">PASSED tests/test_agent.py::test_vector_store_retrieval (0.34s)</div>
                      <div className="text-emerald-400">PASSED tests/test_agent.py::test_langchain_agent_tools (0.82s)</div>
                      <div className="text-emerald-400">PASSED tests/test_agent.py::test_guardrails_latency (0.21s)</div>
                      <div className="pt-2 text-white font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#76ff8a]" />
                        <span>3 passed, 0 warnings in 1.37s · Coverage: 98.4%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual 3: Certificate / Certify */}
              {currentPhase.visualType === 'certify' && (
                <div className="relative">
                  {/* Floating Gold Seal Asset */}
                  <div className="hidden sm:block absolute -top-6 -right-5 z-20 w-20 h-20 animate-float-delayed pointer-events-none">
                    <img
                      src="/images/gold-seal-medal.webp"
                      alt="Accreditation Gold Seal Medal"
                      className="w-full h-full object-contain filter drop-shadow-xl"
                    />
                  </div>

                  <div className="p-6 rounded-2xl bg-[#fffdfa] border-2 border-[#1a361d]/20 shadow-md text-center space-y-3 shimmer-active relative z-10">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-[#1a361d]">AFT-CERT-AI9821</span>
                      <span className="px-2 py-0.5 rounded bg-[#d8ffd2] text-[#1a361d] font-bold text-[10px]">
                        REGISTRY VERIFIED
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-1">
                      <img
                        src="/images/gold-seal-medal.webp"
                        alt="Gold Seal Medal"
                        className="w-12 h-12 object-contain drop-shadow-md shrink-0 animate-float-slow"
                      />
                      <div className="text-left">
                        <div className="text-xl font-bold font-heading text-[#1a361d]">Ethan Hunt</div>
                        <div className="text-xs text-gray-600">6-Month Comprehensive Fellowship in Applied AI</div>
                        <div className="text-xs font-semibold text-[#2d5c36]">Conferred with Highest Academic Honors</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
                      <span>30 N Gould St, Sheridan, WY</span>
                      <span className="font-mono text-[#40844e] font-bold">Public Registry ID</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual 4: Career / Advance */}
              {currentPhase.visualType === 'career' && (
                <div className="relative">
                  {/* Floating Graduation Asset */}
                  <div className="hidden sm:block absolute -top-7 -right-5 z-20 w-22 h-22 animate-float-drift pointer-events-none">
                    <img
                      src="/images/grad-cap-diploma.webp"
                      alt="Graduation Cap & Diploma"
                      className="w-full h-full object-contain filter drop-shadow-xl"
                    />
                  </div>

                  <div className="p-6 rounded-2xl bg-[#f8fafc] border border-gray-200/90 shadow-sm space-y-4 relative z-10">
                  {/* Contextual Career Acceleration Photo */}
                  <div className="relative rounded-xl overflow-hidden h-24 border border-gray-200 group">
                    <img
                      src="/images/career-acceleration.jpg"
                      alt="Career Acceleration & Tech Leadership"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1a361d]/85 via-[#1a361d]/60 to-transparent flex items-center p-3.5">
                      <div className="text-white space-y-0.5">
                        <span className="px-2 py-0.5 rounded-full bg-[#76ff8a] text-[#1a361d] text-[9px] font-mono font-bold uppercase">
                          Phase 04: Placement
                        </span>
                        <div className="text-sm font-bold font-heading">High-Impact Career Outcomes</div>
                        <div className="text-[#d8ffd2] text-[10px]">Direct introductions across 200+ partner network</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <span className="text-xs font-bold text-[#1a361d] font-heading uppercase">Career Placement Ledger</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d8ffd2] text-[#1a361d] font-bold">200+ Network</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                      <div className="font-bold text-[#1a361d]">Technical Resume Engineering</div>
                      <span className="text-emerald-700 font-mono font-bold">Score 98/100</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                      <div className="font-bold text-[#1a361d]">1-on-1 System Design Mock Defense</div>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#9e4f8f] text-white font-bold">Completed</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                      <div className="font-bold text-[#1a361d]">Direct Partner Referral Pipeline</div>
                      <span className="text-emerald-700 font-bold">3 Active Interviews</span>
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
