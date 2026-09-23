import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  PhoneCall,
  ShieldCheck,
  Cpu,
  Sparkles,
  Activity,
  CheckCircle,
  Lock,
  Zap,
} from 'lucide-react';

export default function CyberHero({ onOpenLeadModal, onExploreCourses }) {
  const [liveStudentsCount, setLiveStudentsCount] = useState(148);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStudentsCount((prev) => prev + (Math.random() > 0.6 ? 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="relative pt-32 pb-14 md:pt-36 md:pb-20 overflow-hidden bg-[#070b14]">
      {/* Dynamic Animated Background Ambient Glows */}
      <div className="absolute top-7 left-1/4 w-[450px] h-[450px] bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-40 right-10 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none animate-float-slow" />
      <div className="absolute top-1/2 left-5 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none animate-float-delayed" />

      {/* Futuristic Cyber Tech Grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(56, 189, 248, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.4) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-6 items-center">
          
          {/* Left Column: Copywriting & High-Converting CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-7 text-left">
            
            {/* Pill Tag with pulsating neon radar indicator */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/50 shadow-[0_0_25px_rgba(14,165,233,0.3)] backdrop-blur-xl transition-all duration-300 hover:scale-105 group cursor-default">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
              </span>
              <span className="text-amber-400 text-xs">⚡</span>
              <span className="text-xs md:text-sm font-bold tracking-wide bg-gradient-to-r from-indigo-400 via-indigo-200 to-indigo-300 bg-clip-text text-transparent">
                Build In-Demand Skills • Shape Your Future
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-white leading-[1.12]">
              Build Skills. <br />
              Get Certified with <br />
              <span className="relative inline-block bg-gradient-to-r from-indigo-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(14,165,233,0.45)]">
                American FutureTech
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-400 via-indigo-300 to-blue-600 rounded-full shadow-[0_0_12px_#38bdf8]" />
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
              Learn Data Science with AI integration and Cyber Security with Ethical Hacking. 
              Get industry-relevant training, real-world projects, placement support and more — all in one program.
            </p>

            {/* Live Interactive Scarcity / Urgency Ticker */}
            <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-xs text-slate-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold text-emerald-300">
                {liveStudentsCount} Students Enrolling in 2026 Batches
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-amber-300 font-medium">Limited Seats Remaining</span>
            </div>

            {/* Dual CTAs with magnetic hover & ripple effects */}
            <div className="flex flex-wrap items-center gap-4 pt-1 w-full sm:w-auto">
              <button
                onClick={onExploreCourses}
                className="relative overflow-hidden w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm text-slate-950 bg-gradient-to-r from-indigo-400 via-indigo-400 to-indigo-300 hover:from-indigo-300 hover:to-indigo-200 shadow-[0_0_35px_rgba(14,165,233,0.5)] hover:shadow-[0_0_45px_rgba(14,165,233,0.8)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>

              <button
                onClick={onOpenLeadModal}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full font-semibold text-sm text-slate-200 bg-[#0B1220]/80 hover:bg-[#1e293b] border border-slate-700/80 hover:border-indigo-400/50 hover:text-white backdrop-blur-xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg hover:shadow-[0_0_25px_rgba(14,165,233,0.25)] group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all">
                  <PhoneCall className="w-3 h-3" />
                </div>
                <span>Talk to Counselor</span>
              </button>
            </div>

            {/* Trust badge icons */}
            <div className="flex items-center gap-6 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>US Industry Accredited</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-indigo-400" />
                <span>1-on-1 Mentor Doubt Clearing</span>
              </div>
            </div>

          </div>

          {/* Right Column: 3D-Perspective Laptop with Holographic Laser Scanner & Widgets */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Holographic Glowing Backdrop behind laptop */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/25 via-blue-600/20 to-transparent rounded-3xl blur-2xl -z-10 animate-pulse-slow" />

            {/* Laptop Chassis */}
            <div className="relative w-full max-w-lg mx-auto transform hover:scale-[1.02] transition-transform duration-500">
              
              {/* Laptop Screen Body */}
              <div className="rounded-t-2xl bg-[#090e1a] border-[3px] border-slate-700/80 shadow-[0_20px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(14,165,233,0.25)] p-2.5 sm:p-3 relative overflow-hidden">
                
                {/* Laser Scanning Beam moving vertically across laptop screen */}
                <div className="laser-line animate-laser-scan z-30" />

                {/* Laptop Camera dot */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-30">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <div className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                </div>

                {/* Inner Screen Display */}
                <div className="rounded-xl bg-[#040711] border border-white/10 p-5 sm:p-6 relative overflow-hidden min-h-[310px] flex flex-col justify-between">
                  
                  {/* Digital Radial Grid pattern */}
                  <div 
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(14,165,233,0.35) 0%, transparent 70%)',
                    }}
                  />

                  {/* Top Screen Bar */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-gradient-to-tr from-rose-500 to-indigo-400 p-0.5 shadow-[0_0_10px_#38bdf8]">
                        <div className="w-full h-full bg-[#040711] rounded flex items-center justify-center text-[9px] font-black text-white">A</div>
                      </div>
                      <span className="text-[10px] tracking-wider uppercase font-bold text-slate-300 font-heading">
                        American FutureTech
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/70 border border-indigo-700/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-[0_0_12px_rgba(14,165,233,0.3)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                      LIVE LMS SESSION
                    </span>
                  </div>

                  {/* Center Screen Graphics (AI Neural Brain + Cyber Shield + Equalizer) */}
                  <div className="my-auto py-3 z-10 flex flex-col items-center text-center">
                    
                    {/* Glowing Titles */}
                    <div className="space-y-1 mb-3">
                      <div className="text-lg sm:text-xl font-extrabold tracking-tight text-white font-heading drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                        Data Science <span className="text-indigo-400">+ AI</span>
                      </div>
                      <div className="text-base sm:text-lg font-bold tracking-tight text-slate-200 font-heading">
                        Cyber Security <span className="text-rose-400">+ Ethical Hacking</span>
                      </div>
                    </div>

                    {/* Holographic AI Neural Network & Cyber Shield Icons */}
                    <div className="flex items-center justify-center gap-5 my-2">
                      {/* AI Neural Network Graphic with Rotating Ring */}
                      <div className="relative w-12 h-12 rounded-2xl bg-indigo-950/50 border border-indigo-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.5)] group-hover:scale-105 transition-transform duration-300">
                        <div className="absolute inset-0 rounded-2xl border border-indigo-400/30 animate-spin-slow" />
                        <Cpu className="w-9 h-9 text-indigo-400 animate-pulse" />
                        <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-indigo-500 text-slate-950 font-black text-[8px] rounded font-mono shadow-[0_0_8px_#38bdf8]">
                          AI
                        </div>
                      </div>

                      {/* Cyber Shield Hologram with Pulse */}
                      <div className="relative w-12 h-12 rounded-2xl bg-rose-950/50 border border-rose-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.5)] group-hover:scale-105 transition-transform duration-300">
                        <Lock className="w-8 h-8 text-rose-400" />
                        <ShieldCheck className="w-4 h-4 text-rose-300 absolute bottom-1 right-1" />
                      </div>
                    </div>

                    {/* Dynamic Active Dancing Telemetry Soundwave Equalizer */}
                    <div className="flex items-end justify-center gap-1.5 h-10 mt-3 w-full max-w-[260px]">
                      <div className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 eq-bar-1 shadow-[0_0_8px_#38bdf8]" />
                      <div className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 eq-bar-2 shadow-[0_0_8px_#38bdf8]" />
                      <div className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 eq-bar-3 shadow-[0_0_8px_#38bdf8]" />
                      <div className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 eq-bar-4 shadow-[0_0_8px_#38bdf8]" />
                      <div className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 eq-bar-5 shadow-[0_0_8px_#38bdf8]" />
                      <div className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 eq-bar-6 shadow-[0_0_8px_#38bdf8]" />
                      <div className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 eq-bar-7 shadow-[0_0_8px_#38bdf8]" />
                      <div className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 eq-bar-8 shadow-[0_0_8px_#38bdf8]" />
                      <div className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 eq-bar-2 shadow-[0_0_8px_#38bdf8]" />
                      <div className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 eq-bar-5 shadow-[0_0_8px_#38bdf8]" />
                      <div className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 eq-bar-3 shadow-[0_0_8px_#38bdf8]" />
                      <div className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 eq-bar-1 shadow-[0_0_8px_#38bdf8]" />
                    </div>
                  </div>

                  {/* Bottom Screen Status Bar */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10 pt-2.5 z-10">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Lab Cluster Online
                    </span>
                    <span className="text-slate-400 font-mono">100% Practical Capstones</span>
                  </div>
                </div>
              </div>

              {/* Laptop Keyboard Base */}
              <div className="relative h-4 bg-gradient-to-b from-slate-600 to-slate-800 rounded-b-xl border-t border-slate-500 shadow-2xl flex justify-center">
                <div className="w-24 h-1 bg-slate-500/80 rounded-b-md" />
              </div>
              <div className="w-4/5 mx-auto h-3 bg-indigo-500/25 blur-lg rounded-full" />

              {/* Floating Holographic Card 1: AI Mentor badge */}
              <div className="hidden sm:flex absolute -top-5 -left-7 items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-indigo-400/50 backdrop-blur-xl shadow-[0_0_30px_rgba(14,165,233,0.35)] animate-float-slow z-20 hover:scale-105 transition-transform cursor-pointer">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-400 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-[0_0_12px_#38bdf8]">
                    MV
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>AI Mentor</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-[10px] text-slate-400">Dr. Marcus Vance • Active</div>
                </div>
              </div>

              {/* Floating Holographic Card 2: Interactive Telemetry */}
              <div className="hidden sm:flex absolute -bottom-6 -right-7 items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/90 border border-emerald-400/50 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.35)] animate-float-delayed z-20 hover:scale-105 transition-transform cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Learning Velocity</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">+98.4% Skill Mastery</div>
                </div>
              </div>

              {/* Floating Card 3: Cyber Shield Lock Box */}
              <div className="hidden sm:flex absolute top-1/2 -right-12 items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B1220]/95 border border-rose-500/50 backdrop-blur-xl shadow-[0_0_25px_rgba(244,63,94,0.35)] animate-float-fast z-20">
                <ShieldCheck className="w-4 h-4 text-rose-400 animate-pulse" />
                <span className="text-[11px] font-bold text-rose-200">Ethical Hacking Lab: Active</span>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
