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
  FileCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import {
  MissionIllustration,
  VisionIllustration
} from '../components/illustrations/VectorIllustrations';

export default function AboutPage() {
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

                {/* Custom Vector Illustration: Mission & Transformation */}
                <div className="p-4 rounded-2xl bg-[#fffff2] border border-[#2d5c36]/20 flex items-center justify-center">
                  <MissionIllustration className="w-full max-w-xs h-auto" />
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
                    Bridging the Divide Between Academia and Global Industry
                  </h3>
                  
                  {/* CLIENT VERBATIM TEXT - 100% EXACT PRESERVATION */}
                  <div className="space-y-4 text-sm sm:text-base text-gray-700 leading-relaxed font-sans">
                    <p>
                      American FutureTech is a globally recognized professional education and workforce development institute offering industry-aligned certification programs designed to bridge the gap between academic learning and industry demands.
                    </p>
                    <p>
                      We partner with leading corporate enterprises, subject-matter experts, and top educators to deliver practical, career-defining learning experiences in high-growth domains including Data Science, Cybersecurity, Cloud & DevOps, Artificial Intelligence, and Product Management.
                    </p>
                    <p>
                      Our mission is to democratize high-quality, outcome-oriented tech education and empower individuals worldwide with verified job-ready skills, recognized certifications, and comprehensive placement support.
                    </p>
                  </div>
                </div>

                {/* Mission & Vision Bento Cards with Custom Vector SVGs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                  {/* Mission Card */}
                  <div className="p-6 rounded-2xl bg-[#fffff2] border border-[#2d5c36]/20 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center font-bold text-xs">
                          <Target className="w-4 h-4 text-[#2d5c36]" />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase text-[#2d5c36] bg-[#d8ffd2] px-2 py-0.5 rounded-full">
                          Charter Goal
                        </span>
                      </div>
                      <h4 className="text-lg font-black font-heading text-[#1a361d] mb-2">
                        Our Institutional Mission
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        To empower 100,000+ students, professionals, and career changers worldwide with hands-on technical skills, industry-recognized certifications, and direct pathways to high-paying tech careers by delivering affordable, practical, and mentor-guided education.
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-[#2d5c36] font-bold pt-2 border-t border-[#2d5c36]/10">
                      Target: 100,000+ Certified Tech Leaders
                    </div>
                  </div>

                  {/* Vision Card */}
                  <div className="p-6 rounded-2xl bg-[#fdf8fc] border border-[#9e4f8f]/20 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#ffe6fa] text-[#582c50] flex items-center justify-center font-bold text-xs">
                          <Sparkles className="w-4 h-4 text-[#9e4f8f]" />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase text-[#9e4f8f] bg-[#ffe6fa] px-2 py-0.5 rounded-full">
                          Global Standard
                        </span>
                      </div>
                      <h4 className="text-lg font-black font-heading text-[#1a361d] mb-2">
                        Our Global Vision
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        To be the world's most trusted workforce transformation institute, bridging the gap between talent and technology, creating equal opportunities for global learners, and driving the future of work.
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-[#9e4f8f] font-bold pt-2 border-t border-[#9e4f8f]/10">
                      Global Workforce Transformation Standard
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

            <div className="mt-8 flex justify-center opacity-80">
              <VisionIllustration className="w-full max-w-md h-auto" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
