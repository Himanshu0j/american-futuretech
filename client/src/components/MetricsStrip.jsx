import React from 'react';
import { BookOpen, Award, TrendingUp, CheckCircle2, ShieldCheck, Users, Calendar, Briefcase } from 'lucide-react';

export default function MetricsStrip() {
  const valueProps = [
    {
      label: 'LEARN',
      icon: BookOpen,
      title: 'Build practical skills through structured programs.',
      description: 'Engage in instructor-led weekend labs, production codebases on GitHub, and asynchronous LMS coursework engineered to Silicon Valley standards.',
      tag: '24 Cohort Weeks',
    },
    {
      label: 'CERTIFY',
      icon: Award,
      title: 'Demonstrate verifiable engineering achievement.',
      description: 'Graduate with accredited US credentials and cryptographic registry IDs that prove your applied competence to hiring managers.',
      tag: 'Accredited Credential',
    },
    {
      label: 'ADVANCE',
      icon: TrendingUp,
      title: 'Build toward accelerated tech opportunities.',
      description: 'Access dedicated 1-on-1 mentorship, technical interview defense panels, and direct referral pathways into our 200+ employer network.',
      tag: 'Career Acceleration',
    },
  ];

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#fffff2]">
      <div className="max-w-7xl mx-auto">
        
        {/* Easy LMS Signature 3-Value Typography Section */}
        <div className="rounded-2xl bg-white border border-gray-200/90 shadow-sm p-6 sm:p-10 lg:p-12 text-left">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 md:divide-x md:divide-gray-200/80">
            {valueProps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className={`${idx > 0 ? 'md:pl-8 lg:pl-12' : ''} space-y-4 flex flex-col justify-between`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold tracking-widest text-[#40844e] font-heading uppercase">
                        {item.label}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#d8ffd2] text-[#1a361d] font-semibold">
                        {item.tag}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-[#1a361d] font-heading leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-sm text-gray-600 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#2d5c36]">
                    <CheckCircle2 className="w-4 h-4 text-[#40844e]" />
                    <span>Included in all cohort tracks</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Institutional Telemetry Ledger */}
          <div className="mt-10 pt-8 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1a361d] font-heading">6 Months</div>
              <div className="text-xs text-gray-600 mt-0.5">Comprehensive Fellowship</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1a361d] font-heading">200+</div>
              <div className="text-xs text-gray-600 mt-0.5">Corporate Hiring Partners</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1a361d] font-heading">1-on-1</div>
              <div className="text-xs text-gray-600 mt-0.5">Faculty Office Hours</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1a361d] font-heading">$99</div>
              <div className="text-xs text-gray-600 mt-0.5">Seat Deposit Guarantee</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
