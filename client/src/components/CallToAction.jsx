import React from 'react';
import { ArrowRight, ShieldCheck, PhoneCall, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import ctaLaunchSvg from '../assets/illustrations/misc/cta-launch.svg';
import { CTAIllustration } from './illustrations/VectorIllustrations';

export default function CallToAction({ onOpenLeadModal }) {
  return (
    <section className="py-20 sm:py-28 relative z-10 bg-[#fffff2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Asymmetrical High-Impact CTA Container */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1a361d] via-[#152a17] to-[#0d1c10] text-[#fffff2] border border-[#2d5c36] shadow-2xl p-8 sm:p-12 lg:p-16 relative overflow-hidden text-left">
          {/* Radial Ambient Glows */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(118,255,138,0.18),transparent_70%)] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(158,79,143,0.15),transparent_70%)] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
            {/* Copy Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2d5c36]/80 border border-[#76ff8a]/40 text-[#76ff8a] text-xs font-bold font-heading uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Selective Admissions · Spring 2027 Cohort Active</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black font-heading text-white leading-[1.15] tracking-tight">
                Take command of your engineering career today.
              </h2>

              <p className="text-base sm:text-lg text-[#d8ffd2]/90 max-w-2xl leading-relaxed">
                Cohorts are strictly capped at 25 fellows per specialization to maintain intensive 1-on-1 faculty code reviews. Schedule a consultation with an academic advisor or secure your cohort seat with a $99 deposit.
              </p>

              {/* High-Impact Guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-[#d8ffd2]">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-[#76ff8a] shrink-0" />
                  <span className="font-semibold">$99 Seat Deposit Guarantee</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-[#76ff8a] shrink-0" />
                  <span>No Upfront Full Tuition</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-[#76ff8a] shrink-0" />
                  <span>Direct Advisor Response &lt;24h</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={onOpenLeadModal}
                  className="elms-btn-primary !bg-[#76ff8a] !text-[#1a361d] hover:!bg-white !py-3.5 !px-7 !text-sm w-full sm:w-auto justify-center group cursor-pointer shadow-lg"
                >
                  <span>Schedule Admissions Call</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <Link
                  to="/checkout"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-white hover:text-[#d8ffd2] font-bold text-sm transition-all border-2 border-white/30 hover:border-white rounded-full text-center w-full sm:w-auto hover:bg-white/10"
                >
                  <span>Reserve Seat Online ($99)</span>
                </Link>
              </div>
            </div>

            {/* Visual Column (5 cols): Sourced Vector CTA Rocket Launch Illustration */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="w-full max-w-sm relative group">
                <img
                  src={ctaLaunchSvg}
                  alt="Launch Your Tech Career"
                  className="w-full h-auto drop-shadow-2xl animate-float-slow group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
