import React from 'react';
import {
  Shield,
  Award,
  Users,
  CheckCircle2,
  Globe,
  Building2,
  Sparkles,
  Target,
  Laptop,
  BookOpen,
  ChevronRight,
  Check,
  Compass,
  ArrowRight,
  MapPin,
  FileCheck,
  Linkedin,
  Terminal,
  FileCode2,
  Handshake,
  BadgeCheck,
  Rocket,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import {
  DEFAULT_LEADERSHIP,
  DEFAULT_SISTER_COMPANY,
  DEFAULT_PEDAGOGY
} from '../data/siteContent';
import Navbar from '../components/Navbar';
import CompanyMarquee from '../components/CompanyMarquee';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import engineeringTeamSvg from '../assets/illustrations/about/engineering-team.svg';
import missionGrowthSvg from '../assets/illustrations/about/mission-growth.svg';
import visionGlobalSvg from '../assets/illustrations/about/vision-global.svg';
import {
  MissionIllustration,
  VisionIllustration
} from '../components/illustrations/VectorIllustrations';
import { useSiteSettings } from '../context/SiteSettingsContext';
import FaqAccordion from '../components/common/FaqAccordion';

export default function AboutPage() {
  const { settings } = useSiteSettings();
  const about = settings?.aboutCMS || {};

  // Leadership / pedagogy / sister-company content (admin override, static fallback)
  const leadership = (settings?.leadership?.length ? settings.leadership.filter(l => l.active !== false) : DEFAULT_LEADERSHIP);
  const pedagogy = { ...DEFAULT_PEDAGOGY, ...(settings?.pedagogy || {}) };
  const sisterCompany = { ...DEFAULT_SISTER_COMPANY, ...(settings?.sisterCompany || {}) };

  const pedagogyIcons = { Terminal, FileCode2, Award, Shield, Rocket, Target, BookOpen };
  const pillars = [
    {
      num: '01',
      title: 'Applied Engineering over Passive Theory',
      desc: 'No prerecorded monologues or toy demonstrations. Every curriculum unit is anchored around production-grade code: training LLM agents with LangChain, architecting multi-node Kubernetes clusters, or running penetration testing engagements against realistic virtual networks.',
      points: [
        'Direct source code reviews by senior practitioners',
        'Real telemetry and production CI/CD pipelines',
        'Open-source contribution integration'
      ]
    },
    {
      num: '02',
      title: 'US-Accredited Digital Mastery Credentials',
      desc: 'Graduates earn verifiable credentials registered in the public American FutureTech registry. Each certificate includes a unique verification identifier, cryptographic hash, and syllabus breakdown ready for direct recruiter review.',
      points: [
        'Permanent public verification registry',
        'Sheridan, Wyoming registered corporate seal',
        'Sharable on LinkedIn & candidate portfolios'
      ]
    },
    {
      num: '03',
      title: 'Live Interactive Masterclass Cohorts',
      desc: 'Our fellowship tracks are structured around small, selective cohorts meeting live each weekend. You engage directly with instructors in real-time debugging labs, architectural defenses, and collaborative peer programming sessions.',
      points: [
        'Weekend live 2-hour interactive sessions',
        'Dedicated private cohort Discord channels',
        'Office hours for 1-on-1 code walkthroughs'
      ]
    },
    {
      num: '04',
      title: 'Outcome-Obsessed Career Architecture',
      desc: 'Technical competence must translate into professional mobility. Every program includes dedicated career advising: algorithmic ATS resume rewrites, high-pressure technical mock interviews, and direct introductions across our vetted hiring network.',
      points: [
        'ATS resume overhaul with quantified metrics',
        'FAANG-caliber behavioral & system design mocks',
        'Direct referral network of 100+ hiring partners'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar />

      <main className="pt-28 pb-20">

        <CompanyMarquee />

        {/* Editorial Magazine Hero Header */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-6 pb-12 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-bold font-heading uppercase tracking-wider mb-6">
            <Building2 className="w-3.5 h-3.5 text-[#2d5c36]" />
            <span>US REGISTERED ACADEMIC INSTITUTE</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8 space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-[#1a361d] leading-[1.1]">
                Pioneering Applied <span className="highlight">Emerging Tech</span> Education for the Global Workforce.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
                Founded with a singular standard: technical excellence forged through hands-on production code, verified by accredited US credentials, and accelerated into elite technology careers.
              </p>
            </div>

            {/* Quick Badges Cluster */}
            <div className="lg:col-span-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-xs text-xs font-semibold text-gray-700">
                <MapPin className="w-4 h-4 text-[#10b981]" />
                <span>Incorporated: Sheridan, Wyoming, USA</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-xs text-xs font-semibold text-gray-700">
                <Shield className="w-4 h-4 text-[#10b981]" />
                <span>200+ Enterprise Hiring Network</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-xs text-xs font-semibold text-gray-700">
                <FileCheck className="w-4 h-4 text-[#9e4f8f]" />
                <span>Cryptographically Verifiable Diplomas</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* EDITORIAL 2-COLUMN STORY: STATEMENT (40%) vs CLIENT VERBATIM COPY (60%)     */}
        {/* ========================================================================= */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mb-16 text-left">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              
              {/* Left Column (40% - 5 cols): Bold Manifesto & Mission Visual */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-2xl bg-[#f8fafc] border border-gray-200/80 space-y-4">
                  <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#10b981]">
                    Institutional Statement
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#1a361d] leading-snug">
                    Building the next generation of applied technology leaders.
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
                    We combine the academic rigor of premier North American computer science curricula with the pragmatic urgency of Silicon Valley engineering sprints.
                  </p>
                </div>

                {/* Sourced Vector Illustration: Mission & Transformation */}
                <div className="p-4 rounded-2xl bg-[#fffff2] border border-[#2d5c36]/20 flex items-center justify-center">
                  <img src={missionGrowthSvg} alt="American FutureTech Mission & Growth" className="w-full max-w-xs h-auto object-contain" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="font-mono text-gray-400 text-[10px] uppercase">Governance</div>
                    <div className="font-bold text-[#1a361d] mt-0.5">Wyoming Charter</div>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="font-mono text-gray-400 text-[10px] uppercase">Delivery</div>
                    <div className="font-bold text-[#1a361d] mt-0.5">100% Live Masterclasses</div>
                  </div>
                </div>
              </div>

              {/* Right Column (60% - 7 cols): Client Verbatim Copy & Mission/Vision Bento */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] text-[#1a361d] font-bold text-xs mb-3">
                    <Globe className="w-3.5 h-3.5 text-[#2d5c36]" />
                    <span>ABOUT AMERICAN FUTURETECH</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black font-heading text-[#1a361d] mb-4">
                    {about.headline || 'Bridging the Divide Between Academia and Global Industry'}
                  </h3>
                  
                  {/* CLIENT VERBATIM TEXT - CMS BACKED WITH 100% PRESERVATION FALLBACK */}
                  <div className="space-y-4 text-sm sm:text-base text-gray-700 leading-relaxed font-sans">
                    {about.bodyParagraphs && about.bodyParagraphs.length > 0 ? (
                      about.bodyParagraphs.map((para, i) => (
                        <p key={i}>{para}</p>
                      ))
                    ) : (
                      <>
                        <p>
                          American FutureTech is a globally recognized professional education and workforce development institute offering industry-aligned certification programs designed to bridge the gap between academic learning and industry demands.
                        </p>
                        <p>
                          We partner with leading corporate enterprises, subject-matter experts, and top educators to deliver practical, career-defining learning experiences in high-growth domains including Data Science, Cybersecurity, Cloud & DevOps, Artificial Intelligence, and Product Management.
                        </p>
                        <p>
                          Our mission is to democratize high-quality, outcome-oriented tech education and empower individuals worldwide with verified job-ready skills, recognized certifications, and comprehensive placement support.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Mission & Vision Bento Cards with Sourced Vector SVGs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                  {/* Mission Card */}
                  <div className="p-6 rounded-2xl bg-[#fffff2] border border-[#2d5c36]/20 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center font-bold text-xs">
                            <Target className="w-4 h-4 text-[#2d5c36]" />
                          </div>
                          <span className="text-[10px] font-mono font-bold uppercase text-[#2d5c36] bg-[#d8ffd2] px-2 py-0.5 rounded-full">
                            Charter Goal
                          </span>
                        </div>
                        <div className="w-8 h-8 opacity-80">
                          <img src={missionGrowthSvg} alt="Mission Goal" className="w-full h-full object-contain" />
                        </div>
                      </div>
                      <h4 className="text-lg font-black font-heading text-[#1a361d] mb-2">
                        {about.missionTitle || 'Our Institutional Mission'}
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {about.missionText || 'To empower 100,000+ students, professionals, and career changers worldwide with hands-on technical skills, industry-recognized certifications, and direct pathways to high-paying tech careers by delivering affordable, practical, and mentor-guided education.'}
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-[#2d5c36] font-bold pt-2 border-t border-[#2d5c36]/10">
                      {about.missionTarget || 'Target: 100,000+ Certified Tech Leaders'}
                    </div>
                  </div>

                  {/* Vision Card */}
                  <div className="p-6 rounded-2xl bg-[#fdf8fc] border border-[#9e4f8f]/20 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#ffe6fa] text-[#582c50] flex items-center justify-center font-bold text-xs">
                            <Sparkles className="w-4 h-4 text-[#9e4f8f]" />
                          </div>
                          <span className="text-[10px] font-mono font-bold uppercase text-[#9e4f8f] bg-[#ffe6fa] px-2 py-0.5 rounded-full">
                            Global Standard
                          </span>
                        </div>
                        <div className="w-8 h-8 opacity-80">
                          <img src={visionGlobalSvg} alt="Global Vision" className="w-full h-full object-contain" />
                        </div>
                      </div>
                      <h4 className="text-lg font-black font-heading text-[#1a361d] mb-2">
                        {about.visionTitle || 'Our Global Vision'}
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {about.visionText || "To be the world's most trusted workforce transformation institute, bridging the gap between talent and technology, creating equal opportunities for global learners, and driving the future of work."}
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-[#9e4f8f] font-bold pt-2 border-t border-[#9e4f8f]/10">
                      {about.visionTagline || 'Global Workforce Transformation Standard'}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* Institutional 4-Pillar Academic Charter */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mb-20 text-left">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-black font-heading text-[#1a361d] tracking-tight">
              Our Academic & Engineering Charter
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              Four fundamental principles governing every fellowship curriculum, sandbox laboratory, and mentor interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((p) => (
              <div
                key={p.num}
                className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-left shadow-xs hover:border-[#1a361d]/30 hover:shadow-lg transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-[#1a361d] text-[#76ff8a]">
                      PILLAR {p.num}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">Academic Standard</span>
                  </div>

                  <h3 className="text-xl font-bold font-heading text-[#1a361d] mb-2.5 group-hover:text-[#2d5c36] transition-colors">
                    {p.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                    {p.desc}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    {p.points.map((pt, ptIdx) => (
                      <div key={ptIdx} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Build-First Pedagogy + Institutional Stats ─────────────────── */}
        {pedagogy.enabled !== false && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mb-16 text-left">
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-bold font-heading uppercase tracking-wider mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-[#2d5c36]" />
                    <span>{pedagogy.eyebrow || 'Pedagogy'}</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black font-heading text-[#1a361d] tracking-tight mb-3">
                    {pedagogy.title}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    {pedagogy.description}
                  </p>

                  {/* 70/30 split bar */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-mono font-bold text-[#1a361d]">{pedagogy.handsOnPercent}% Hands-On</span>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-gray-100 flex">
                      <div className="h-full bg-[#1a361d]" style={{ width: `${pedagogy.handsOnPercent}%` }} />
                      <div className="h-full bg-[#76ff8a]" style={{ width: `${pedagogy.theoryPercent}%` }} />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#2d5c36]">{pedagogy.theoryPercent}% Theory</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(pedagogy.pillars || []).map((pil, i) => {
                      const Icon = pedagogyIcons[pil.icon] || Terminal;
                      return (
                        <div key={i} className="p-4 rounded-2xl border border-gray-200 bg-[#fafbf9] hover:border-[#1a361d]/30 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-[#1a361d] text-[#76ff8a] flex items-center justify-center mb-3">
                            <Icon className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-bold text-[#1a361d] mb-1">{pil.title}</h3>
                          <p className="text-[11px] text-gray-600 leading-relaxed">{pil.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Institutional stats */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                  {(pedagogy.stats || []).map((st, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-gradient-to-br from-[#1a361d] to-[#132815] text-white text-center shadow-sm">
                      <div className="text-2xl sm:text-3xl font-black font-heading text-[#76ff8a]">{st.value}</div>
                      <div className="text-[11px] text-gray-300 mt-1 font-medium">{st.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Leadership & Faculty ──────────────────────────────────────── */}
        {leadership.length > 0 && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mb-16 text-left">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-bold font-heading uppercase tracking-wider mb-4">
                <Users className="w-3.5 h-3.5 text-[#2d5c36]" />
                <span>Leadership &amp; Faculty</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-heading text-[#1a361d] tracking-tight">
                Led by Industry Practitioners
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Learn directly from senior AI engineers, cybersecurity leaders, and data scientists who build production systems.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leadership.map((person, idx) => (
                <div key={idx} className="rounded-3xl bg-white border border-gray-200 shadow-xs hover:shadow-lg hover:border-[#1a361d]/25 transition-all p-6 flex flex-col">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {person.image ? (
                        <img src={person.image} alt={person.name} className="w-12 h-12 rounded-2xl object-cover border border-gray-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1a361d] to-[#2d5c36] text-[#76ff8a] font-black text-sm flex items-center justify-center">
                          {person.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-bold text-[#1a361d] leading-tight">{person.name}</h3>
                        <p className="text-[11px] font-semibold text-[#2d5c36]">{person.role}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d8ffd2] text-[#1a361d] whitespace-nowrap">
                      {person.badge || 'Leadership'}
                    </span>
                  </div>

                  {person.experience && (
                    <div className="text-[11px] font-mono text-gray-500 mb-3 flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-[#10b981]" />
                      {person.experience}
                    </div>
                  )}

                  <p className="text-[11px] text-gray-600 leading-relaxed flex-1 mb-4">
                    {person.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(person.skills || []).slice(0, 6).map((sk, si) => (
                      <span key={si} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        {sk}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    <span className="text-[#10b981] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Direct Cohort Mentor
                    </span>
                    {person.linkedin ? (
                      <a href={person.linkedin} target="_blank" rel="noreferrer" className="text-[#1a361d] font-bold hover:underline flex items-center gap-1">
                        <Linkedin className="w-3 h-3" /> Connect
                      </a>
                    ) : (
                      <span className="text-gray-400 font-mono">Faculty</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Sister Company / Staffing Alliance ────────────────────────── */}
        {sisterCompany.enabled !== false && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mb-16 text-left">
            <div className="rounded-3xl bg-gradient-to-br from-[#1a361d] via-[#132815] to-[#0d1c0e] text-white p-6 sm:p-10 shadow-2xl border border-[#2d5c36] relative overflow-hidden">
              <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#76ff8a]/10 blur-3xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#76ff8a]/15 border border-[#76ff8a]/40 text-[#76ff8a] text-xs font-bold font-heading uppercase tracking-wider mb-4">
                  <Handshake className="w-3.5 h-3.5" />
                  <span>{sisterCompany.eyebrow}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-5">
                    <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight mb-3">
                      {sisterCompany.headline}
                    </h2>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 font-bold text-sm">{sisterCompany.name}</div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#76ff8a]/20 text-[#76ff8a] border border-[#76ff8a]/40">
                        {sisterCompany.badge}
                      </span>
                    </div>

                    <p className="text-xs text-[#d8ffd2]/80 flex items-center gap-1.5 mb-4">
                      <MapPin className="w-3.5 h-3.5 text-[#76ff8a]" />
                      {sisterCompany.location}
                    </p>

                    <p className="text-sm text-gray-200 italic border-l-2 border-[#76ff8a] pl-4 mb-4">
                      &ldquo;{sisterCompany.tagline}&rdquo;
                    </p>

                    <p className="text-xs text-gray-300 leading-relaxed mb-6">
                      {sisterCompany.description}
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { v: sisterCompany.stats?.shortlistHours, l: sisterCompany.stats?.shortlistLabel },
                        { v: sisterCompany.stats?.vetted, l: sisterCompany.stats?.vettedLabel },
                        { v: sisterCompany.stats?.placement, l: sisterCompany.stats?.placementLabel },
                      ].map((s, i) => (
                        <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                          <div className="text-xl font-black font-heading text-[#76ff8a]">{s.v}</div>
                          <div className="text-[10px] text-gray-300 mt-0.5">{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-2.5">
                    {(sisterCompany.services || []).map((svc, i) => (
                      <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-[#76ff8a] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-white">{svc.title}</div>
                          <div className="text-[11px] text-gray-300 leading-relaxed">{svc.desc}</div>
                        </div>
                      </div>
                    ))}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-[#76ff8a]/10 border border-[#76ff8a]/30 flex items-center gap-2.5 text-xs text-[#d8ffd2]">
                        <Briefcase className="w-4 h-4 text-[#76ff8a] shrink-0" />
                        Direct internal referrals for certified graduates
                      </div>
                      <Link to="/careers" className="p-3.5 rounded-2xl bg-white text-[#1a361d] font-bold text-xs flex items-center justify-between gap-2 hover:bg-[#d8ffd2] transition-colors">
                        <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> View Live Partner Jobs</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Global Vision Visual Banner */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mb-16 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#1a361d] to-[#0f1b11] text-white shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#76ff8a] text-xs font-mono font-bold uppercase">
                Worldwide Impact
              </div>
              <h3 className="text-2xl sm:text-4xl font-black font-heading tracking-tight">
                Empowering Engineers Across 34+ Countries
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Whether you are pivoting from traditional software engineering to generative AI or breaking into ethical hacking, our structured US-accredited curriculum gives you the proven technical credentials employers trust.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-4">
                <Link to="/courses" className="elms-btn-primary !bg-[#76ff8a] !text-[#1a361d] hover:!bg-white">
                  <span>Explore Fellowship Tracks</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/careers" className="elms-btn-ghost !text-white border !border-white/30 hover:!bg-white/10">
                  <span>View Live Hiring Partners</span>
                </Link>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <img src={engineeringTeamSvg} alt="Worldwide Tech Engineering Cohort" className="w-full max-w-md h-auto object-contain drop-shadow-xl" />
            </div>
          </div>
        </section>

        {/* Institutional & Admissions FAQ */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mb-16">
          <FaqAccordion
            initialCategory="Admissions"
            title="Institutional & Admissions Questions"
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
