import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  PhoneCall,
  CheckCircle,
  Terminal,
  Layers,
  Sparkles,
  ShieldCheck,
  Cpu,
  Play,
  Award
} from 'lucide-react';

export default function AppleHero({ onOpenLeadModal, onExploreCourses }) {
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'curriculum'

  return (
    <section id="home" className="relative pt-24 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-black">
      {/* Apple Subtle Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(41,151,255,0.15),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Apple Copywriting & Restrained Affordances */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-left">
            
            {/* Apple Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-sans text-[#f5f5f7] backdrop-blur-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]" />
              <span className="font-semibold text-white">American FutureTech</span>
              <span className="text-white/20">•</span>
              <span className="text-[#86868b]">Accredited US Tech Academy</span>
            </div>

            {/* Apple Headline with Monochromatic Display Gradient */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-heading tracking-[-0.035em] leading-[1.08] text-white">
              Engineering the next generation of <br />
              <span className="apple-headline-gradient">
                technology leaders.
              </span>
            </h1>

            {/* Apple Sub-headline */}
            <p className="text-base sm:text-lg text-[#86868b] max-w-xl font-normal leading-relaxed tracking-[-0.015em]">
              Immersive specializations in Artificial Intelligence, Cybersecurity, and Cloud Systems. 
              Master live enterprise codebases, 1-on-1 mentorship, and guaranteed corporate placement pathways.
            </p>

            {/* Apple Dignified Cohort Notice */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#121214] border border-white/[0.08] text-xs text-[#86868b]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[#f5f5f7] font-medium">Spring 2026 Admissions Open</span>
              <span className="text-white/20">•</span>
              <span>Limited to 25 fellows per track</span>
            </div>

            {/* Apple Dual Buttons (High Affordance Solid White + Frosted Glass) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2 w-full sm:w-auto">
              <button
                onClick={onExploreCourses}
                className="apple-btn-primary !py-3.5 !px-7 !text-sm hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/5 cursor-pointer"
              >
                <span>Explore Specializations</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onOpenLeadModal}
                className="apple-btn-secondary !py-3.5 !px-6 !text-sm cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-[#2997ff]" />
                <span>Schedule Consultation</span>
              </button>
            </div>

            {/* Institutional Endorsements */}
            <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-[#86868b]">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#2997ff]" />
                <span>Wyoming Registered LLC</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#2997ff]" />
                <span>US Industry Standards</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#2997ff]" />
                <span>1-on-1 Faculty Mentorship</span>
              </div>
            </div>

          </div>

          {/* Right Column: Floating Apple Studio Display Canvas */}
          <div className="lg:col-span-5 relative w-full">
            
            {/* Ambient Ground Reflection */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-20 bg-[#2997ff]/10 blur-3xl rounded-full pointer-events-none" />

            {/* Apple Studio Display Chassis */}
            <motion.div
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
              className="relative w-full rounded-3xl bg-[#121214] border-t border-white/20 border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.95)] overflow-hidden"
            >
              {/* macOS Window Topbar */}
              <div className="h-11 px-4 bg-[#1c1c1e]/90 border-b border-white/[0.08] flex items-center justify-between backdrop-blur-xl">
                {/* Traffic light dots */}
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-black/20" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-black/20" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-black/20" />
                </div>

                {/* Tab Switcher */}
                <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/5">
                  <button
                    onClick={() => setActiveTab('terminal')}
                    className={`px-3 py-1 rounded-md text-[11px] font-sans font-medium transition-all ${
                      activeTab === 'terminal' ? 'bg-[#2c2c2e] text-white shadow-sm' : 'text-[#86868b] hover:text-white'
                    }`}
                  >
                    PyTorch Terminal
                  </button>
                  <button
                    onClick={() => setActiveTab('curriculum')}
                    className={`px-3 py-1 rounded-md text-[11px] font-sans font-medium transition-all ${
                      activeTab === 'curriculum' ? 'bg-[#2c2c2e] text-white shadow-sm' : 'text-[#86868b] hover:text-white'
                    }`}
                  >
                    AI Pipeline
                  </button>
                </div>

                <div className="text-[11px] text-[#86868b] font-mono hidden sm:block">
                  v2.6-prod
                </div>
              </div>

              {/* Display Content Area */}
              <div className="p-6 bg-[#0a0a0c] font-mono text-xs text-[#f5f5f7] min-h-[320px] flex flex-col justify-between">
                {activeTab === 'terminal' ? (
                  <div className="space-y-3 leading-relaxed">
                    <div className="text-[#86868b]"># American FutureTech AI Research Cluster</div>
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-[#2997ff]">$</span>
                      <span>python -m aft_agents.train --model llama-3.3-70b</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-1.5 text-[11px] text-[#86868b]">
                      <div className="flex justify-between text-white">
                        <span>Cluster: US-East-H100-SXM5</span>
                        <span className="text-emerald-400 font-semibold">ONLINE</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Throughput:</span>
                        <span className="text-white">4,820 tokens/sec</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Convergence Loss:</span>
                        <span className="text-emerald-400">0.0842 (Epoch 12/12)</span>
                      </div>
                      <div className="w-full bg-[#1c1c1e] h-1.5 rounded-full overflow-hidden mt-2">
                        <div className="bg-[#2997ff] h-full w-[94%] rounded-full" />
                      </div>
                    </div>

                    <div className="text-emerald-400 flex items-center gap-2 pt-1 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Model Weights Verified & Exported to Production Registry</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 font-sans text-xs">
                    <div className="text-[#86868b] uppercase tracking-wider text-[10px] font-semibold">
                      Enterprise Pipeline Architecture
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 rounded-xl bg-[#121214] border border-white/10">
                        <Cpu className="w-5 h-5 text-[#2997ff] mx-auto mb-1.5" />
                        <div className="font-semibold text-white">LLM Foundation</div>
                        <div className="text-[10px] text-[#86868b] mt-0.5">Quantized 4-Bit</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#121214] border border-white/10">
                        <Layers className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                        <div className="font-semibold text-white">RAG Vector DB</div>
                        <div className="text-[10px] text-[#86868b] mt-0.5">Pinecone Hybrid</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#121214] border border-white/10">
                        <ShieldCheck className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
                        <div className="font-semibold text-white">Guardrails</div>
                        <div className="text-[10px] text-[#86868b] mt-0.5">Zero Hallucination</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#121214] border border-white/10 flex items-center justify-between">
                      <span className="text-[#86868b]">Curriculum Capstone</span>
                      <span className="text-[#2997ff] font-medium">Autonomous Support Co-Pilot</span>
                    </div>
                  </div>
                )}

                {/* Floating Spec Bar */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-[#86868b] font-sans">
                  <span>Track: AI & Machine Learning</span>
                  <span className="text-white font-medium">Duration: 6 Months</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
