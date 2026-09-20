import React from 'react';
import { ArrowRight, ShieldCheck, PhoneCall, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CallToAction({ onOpenLeadModal }) {
  return (
    <section className="py-16 sm:py-24 relative z-10 bg-[#fffff2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Easy LMS Signature Final CTA Box */}
        <div className="rounded-3xl bg-[#1a361d] text-[#fffff2] border border-[#2d5c36] shadow-2xl p-8 sm:p-12 lg:p-16 relative overflow-hidden text-left">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[radial-gradient(circle,rgba(118,255,138,0.15),transparent_70%)] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Copy */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2d5c36] text-[#d8ffd2] text-xs font-bold font-heading uppercase tracking-wider">
                <span>Selective Admissions Active</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#d8ffd2] leading-tight tracking-tight">
                Take command of your engineering career
              </h2>

              <p className="text-base sm:text-lg text-[#d8ffd2]/90 max-w-2xl leading-relaxed">
                Cohorts are capped at 25 fellows per specialization to preserve high mentorship ratios. Schedule a 1-on-1 syllabus consultation with an admissions advisor or secure your cohort seat with a $99 deposit.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-[#d8ffd2]/80">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#76ff8a]" />
                  <span className="font-semibold">$99 Seat Deposit Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#76ff8a]" />
                  <span>No Upfront Full Tuition Required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#76ff8a]" />
                  <span>Direct Advisor Response Within 24h</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5 justify-center">
              <button
                onClick={onOpenLeadModal}
                className="elms-btn-primary !py-3.5 !px-6 !text-sm w-full justify-center group cursor-pointer"
              >
                <span>Schedule Admissions Call</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <Link
                to="/checkout"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-white hover:text-[#d8ffd2] font-bold text-sm transition-colors border-2 border-white/40 hover:border-white rounded-full text-center"
              >
                <span>Reserve Seat Online ($99)</span>
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
