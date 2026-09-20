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
  ArrowRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  const pillars = [
    {
      num: '01',
      title: 'Applied Engineering over Passive Theory',
      desc: 'No prerecorded monologues or toy demonstrations. Every curriculum unit is anchored around production-grade code: training LLM agents with LangChain, architecting multi-node Kubernetes clusters, or running penetration testing engagements against realistic virtual networks.',
      points: ['Direct source code reviews by senior practitioners', 'Real telemetry and production CI/CD pipelines', 'Open-source contribution integration']
    },
    {
      num: '02',
      title: 'US-Accredited Digital Mastery Credentials',
      desc: 'Graduates earn verifiable credentials registered in the public American FutureTech registry. Each certificate includes a unique verification identifier, cryptographic hash, and syllabus breakdown ready for direct recruiter review.',
      points: ['Permanent public verification registry', 'Sheridan, Wyoming registered corporate seal', 'Sharable on LinkedIn & candidate portfolios']
    },
    {
      num: '03',
      title: 'Live Interactive Masterclass Cohorts',
      desc: 'Our fellowship tracks are structured around small, selective cohorts meeting live each weekend. You engage directly with instructors in real-time debugging labs, architectural defenses, and collaborative peer programming sessions.',
      points: ['Weekend live 2-hour interactive sessions', 'Dedicated private cohort Discord channels', 'Office hours for 1-on-1 code walkthroughs']
    },
    {
      num: '04',
      title: 'Outcome-Obsessed Career Architecture',
      desc: 'Technical competence must translate into professional mobility. Every program includes dedicated career advising: algorithmic ATS resume rewrites, high-pressure technical mock interviews, and direct introductions across our vetted hiring network.',
      points: ['ATS resume overhaul with quantified metrics', 'FAANG-caliber behavioral & system design mocks', 'Direct referral network of 100+ hiring partners']
    }
  ];

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar />

      <main className="pt-28 pb-20">
        {/* Editorial Institutional Header */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center pt-8 pb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-semibold mb-4">
            <Building2 className="w-3.5 h-3.5 text-[#2d5c36]" />
            <span>US REGISTERED ACADEMIC INSTITUTE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-[#1a361d] mb-6">
            Pioneering Applied <span className="highlight">Emerging Tech</span> Education
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
            American FutureTech is a globally recognized professional education and workforce development institute offering industry-aligned certification programs designed to bridge the gap between academic learning and industry demands.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-700 font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#40844e]" />
              <span>Incorporated: Sheridan, Wyoming, USA</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
              <Shield className="w-3.5 h-3.5 text-[#2d5c36]" />
              <span>Enterprise Partner Registry</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
              <Award className="w-3.5 h-3.5 text-[#9e4f8f]" />
              <span>Accredited US Digital Credentials</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* OFFICIAL ABOUT US / MISSION / VISION (CLIENT VERBATIM COPY)               */}
        {/* ========================================================================= */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mb-16">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm space-y-8 text-left">
            
            {/* About Us Paragraphs */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] text-[#1a361d] font-bold text-xs mb-3">
                <Globe className="w-3.5 h-3.5 text-[#2d5c36]" />
                <span>ABOUT AMERICAN FUTURETECH</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#1a361d] mb-4">
                Bridging the Divide Between Academia and Global Industry
              </h2>
              <div className="space-y-3.5 text-sm sm:text-base text-slate-700 leading-relaxed">
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

            {/* Mission & Vision Bento Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              
              {/* Mission Card */}
              <div className="p-6 sm:p-7 rounded-2xl bg-[#fffff2] border border-slate-200/90 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center font-bold text-xs mb-3">
                    <Target className="w-5 h-5 text-[#2d5c36]" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-[#1a361d] mb-2">
                    Our Institutional Mission
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    To empower 100,000+ students, professionals, and career changers worldwide with hands-on technical skills, industry-recognized certifications, and direct pathways to high-paying tech careers by delivering affordable, practical, and mentor-guided education.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-[#2d5c36] font-bold">
                  Target: 100,000+ Certified Tech Leaders
                </div>
              </div>

              {/* Vision Card */}
              <div className="p-6 sm:p-7 rounded-2xl bg-[#fffff2] border border-slate-200/90 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#ffe6fa] text-[#582c50] flex items-center justify-center font-bold text-xs mb-3">
                    <Sparkles className="w-5 h-5 text-[#9e4f8f]" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-[#1a361d] mb-2">
                    Our Global Vision
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    To be the world&apos;s most trusted workforce transformation institute, bridging the gap between talent and technology, creating equal opportunities for global learners, and driving the future of work.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-[#9e4f8f] font-bold">
                  Global Workforce Transformation Standard
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Institutional Ledger */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mb-16">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-left divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              <div className="pt-4 lg:pt-0 lg:px-4 first:px-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Placement Rate</div>
                <div className="text-2xl sm:text-3xl font-display font-black text-[#1a361d] mt-1">94.2%</div>
                <div className="text-xs text-slate-500 mt-0.5">Within 180 days of graduation</div>
              </div>
              <div className="pt-4 lg:pt-0 lg:px-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Salary Uplift</div>
                <div className="text-2xl sm:text-3xl font-display font-black text-[#2d5c36] mt-1">+138%</div>
                <div className="text-xs text-slate-500 mt-0.5">Average compensation gain</div>
              </div>
              <div className="pt-4 lg:pt-0 lg:px-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hiring Network</div>
                <div className="text-2xl sm:text-3xl font-display font-black text-[#1a361d] mt-1">140+</div>
                <div className="text-xs text-slate-500 mt-0.5">Enterprise partners in US & EU</div>
              </div>
              <div className="pt-4 lg:pt-0 lg:px-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alumni Rating</div>
                <div className="text-2xl sm:text-3xl font-display font-black text-amber-500 mt-1">4.9 / 5.0</div>
                <div className="text-xs text-slate-500 mt-0.5">Verified third-party reviews</div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Pillars of Excellence */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#1a361d] tracking-tight">
              Our Academic & Engineering Charter
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Four fundamental principles that govern how every fellowship program, capstone laboratory, and mentor interaction is structured.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((p) => (
              <div key={p.num} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-left shadow-xs hover:border-[#1a361d]/30 hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-[#1a361d] px-2.5 py-1 rounded-full bg-[#d8ffd2]">
                      PILLAR {p.num}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-[#1a361d] tracking-tight mb-3">
                    {p.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {p.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {p.points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-[#40844e] shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* US Corporate Headquarters Info Banner */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="bg-[#1a361d] text-white border border-[#2d5c36] rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 text-left shadow-lg">
            <div>
              <span className="text-xs font-semibold text-[#76ff8a] uppercase tracking-wider block mb-1">
                Official Registered Entity
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
                American FutureTech LLC
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 mb-1">
                Incorporated under the laws of the State of Wyoming, USA
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#d8ffd2]/80 mt-3 font-mono">
                <span>Registration: Sheridan, WY</span>
                <span>•</span>
                <span>Address: 30 N Gould St, Sheridan, WY 82801</span>
                <span>•</span>
                <span>Contact: +1 (307) 201-9494</span>
              </div>
            </div>

            <Link
              to="/courses"
              className="px-6 py-3 rounded-full bg-[#76ff8a] hover:bg-[#5be26f] text-[#1a361d] text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-2"
            >
              <span>Explore Programs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
