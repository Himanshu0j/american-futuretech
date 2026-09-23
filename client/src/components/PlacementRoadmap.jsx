import React from 'react';
import {
  Compass,
  Code2,
  CheckSquare,
  Award,
  UserCheck,
  Rocket,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';
import BulletContent from './common/BulletContent';

const DEFAULT_STEPS = [
  {
    number: '01',
    title: 'Choose Your Program',
    description: 'Explore our industry-aligned programs and select the track that matches your career aspirations.',
    icon: 'Compass',
    tag: 'Orientation & Advisory'
  },
  {
    number: '02',
    title: 'Learn & Build',
    description: 'Gain hands-on experience through live mentor-led classes, real-world projects, and industry tools.',
    icon: 'Code2',
    tag: 'Hands-on Labs'
  },
  {
    number: '03',
    title: 'Practice & Assess',
    description: 'Validate your skills with quizzes, coding challenges, and capstone projects reviewed by experts.',
    icon: 'CheckSquare',
    tag: 'Peer & Expert Review'
  },
  {
    number: '04',
    title: 'Get Certified',
    description: 'Earn a globally recognized certificate from American FutureTech to showcase your expertise to employers.',
    icon: 'Award',
    tag: 'US Digital Credential'
  },
  {
    number: '05',
    title: 'Get Job Ready',
    description: 'Receive 1-on-1 resume reviews, LinkedIn optimization, mock interviews, and career coaching.',
    icon: 'UserCheck',
    tag: 'Career Architecture'
  },
  {
    number: '06',
    title: 'Launch Your Career',
    description: 'Access our exclusive hiring partner network, attend placement drives, and land your dream tech job.',
    icon: 'Rocket',
    tag: 'Direct Introductions'
  }
];

const ICON_MAP = {
  Compass,
  Code2,
  CheckSquare,
  Award,
  UserCheck,
  Rocket,
  ShieldCheck,
  Sparkles
};

export default function PlacementRoadmap({ onOpenLeadModal }) {
  const { settings } = useSiteSettings();
  const roadmap = settings?.roadmap || {};

  const activeSteps = (roadmap.steps && roadmap.steps.length > 0
    ? roadmap.steps.filter(s => s.active !== false)
    : DEFAULT_STEPS
  ).sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section id="placement-roadmap" className="py-12 bg-white border-t border-slate-200 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 -left-48 w-96 h-96 bg-[#EFE6D6]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-48 w-96 h-96 bg-[#ffe6fa]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Headers as specified by client */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE6D6] border border-[#E5C275]/40 text-[#0B1220] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>PROVEN CAREER TRANSFORMATION SYSTEM</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#0B1220] tracking-tight">
            {roadmap.title || `${activeSteps.length}-Step Roadmap to Your Dream Job`}
          </h2>

          <p className="text-lg sm:text-xl font-display font-semibold text-[#4338CA]">
            {roadmap.subtitle || `Follow ${activeSteps.length} Proven Steps to Career Transformation`}
          </p>

          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed pt-1">
            Our structured {activeSteps.length}-phase pedagogical framework accelerates your trajectory from foundational mastery to corporate tech placement.
          </p>
        </div>

        {/* Dynamic Step Visual Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {activeSteps.map((step, idx) => {
            const Icon = ICON_MAP[step.icon] || Compass;
            const stepNumber = step.number || String(idx + 1).padStart(2, '0');

            return (
              <div
                key={step._id || idx}
                className="p-6 sm:p-5 rounded-3xl bg-[#F7F7F5] border border-slate-200/90 hover:border-[#0B1220]/40 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-[#EFE6D6] text-[#0B1220] border border-[#E5C275]/40">
                      Step {stepNumber}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center text-[#0B1220] group-hover:scale-110 transition-transform shadow-2xs">
                      <Icon className="w-5 h-5 text-[#4338CA]" />
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider mb-1">
                    {step.tag || 'Phase Milestone'}
                  </div>

                  <h3 className="text-lg sm:text-xl font-display font-bold text-[#0B1220] mb-2">
                    {step.title}
                  </h3>

                  <BulletContent
                    content={step.description}
                    as="auto"
                    paragraphClassName="text-xs sm:text-sm text-slate-600 leading-relaxed"
                  />
                </div>

                <div className="pt-4 mt-6 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Phase {stepNumber} Deliverable</span>
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Placement Bottom Action Strip */}
        <div className="mt-12 p-6 sm:p-6 rounded-3xl bg-[#0B1220] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl text-left">
          <div className="space-y-1 max-w-xl">
            <div className="text-xs font-bold text-[#E5C275] uppercase tracking-wider">
              100% Placement Guidance Guaranteed
            </div>
            <h4 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Ready to Accelerate Your Career Transformation?
            </h4>
            <p className="text-xs text-[#EFE6D6]/80 leading-relaxed">
              Explore open positions on our Live Jobs Board or reserve your fellowship cohort seat today with only $99 deposit.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              to="/checkout?tier=deposit"
              className="px-5 py-2.5 rounded-full bg-[#E5C275] hover:bg-[#5be26f] text-[#0B1220] text-xs font-bold transition-colors shadow-sm"
            >
              Reserve Seat with $99
            </Link>
            <Link
              to="/careers"
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/20"
            >
              Browse Live Jobs
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
