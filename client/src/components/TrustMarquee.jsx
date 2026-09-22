import React from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { Building2, Sparkles } from 'lucide-react';

export default function TrustMarquee() {
  const { settings } = useSiteSettings();

  const heading = settings?.trustedCompanies?.heading || 'TRUSTED BY LEARNERS FROM LEADING GLOBAL COMPANIES';
  const subheading = settings?.trustedCompanies?.subheading || 'Our alumni engineer mission-critical systems across Fortune 500 technology leaders';

  const defaultCompanies = [
    { name: 'Google', logoUrl: '/images/companies/google.svg', height: 'h-7 sm:h-8' },
    { name: 'Microsoft', logoUrl: '/images/companies/microsoft.svg', height: 'h-6 sm:h-7' },
    { name: 'Amazon Web Services', logoUrl: '/images/companies/aws.svg', height: 'h-8 sm:h-9' },
    { name: 'IBM', logoUrl: '/images/companies/ibm.svg', height: 'h-6 sm:h-7' },
    { name: 'Infosys', logoUrl: '/images/companies/infosys.svg', height: 'h-6 sm:h-7' },
    { name: 'Accenture', logoUrl: '/images/companies/accenture.svg', height: 'h-6 sm:h-7' },
    { name: 'Intel', logoUrl: '/images/companies/intel.svg', height: 'h-6 sm:h-7' },
    { name: 'Meta', logoUrl: '/images/companies/meta.svg', height: 'h-6 sm:h-7' },
  ];

  const companiesList = settings?.trustedCompanies?.companies?.length
    ? settings.trustedCompanies.companies.filter(c => c.active !== false)
    : defaultCompanies;

  // Duplicate for seamless 0-jump infinite loop
  const duplicatedCompanies = [...companiesList, ...companiesList];

  return (
    <section className="py-10 sm:py-14 bg-white/70 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800 backdrop-blur-md relative overflow-hidden">
      {/* Decorative background glow accents */}
      <div className="absolute top-0 left-1/4 w-96 h-24 bg-emerald-400/10 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-24 bg-indigo-400/10 dark:bg-indigo-400/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-[#2d5c36] dark:text-[#76ff8a]" />
          <span>Global Enterprise Alumni Network</span>
        </div>

        <h2 className="text-xs sm:text-sm font-display font-extrabold tracking-widest uppercase text-slate-900 dark:text-slate-100">
          {heading}
        </h2>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          {subheading}
        </p>
      </div>

      {/* Infinite Scrolling Marquee Track with Pause on Hover */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div
          className="flex items-center gap-8 sm:gap-12 w-max animate-infinite-marquee hover:[animation-play-state:paused] cursor-pointer py-2"
          style={{
            animationDuration: '32s'
          }}
        >
          {duplicatedCompanies.map((comp, idx) => (
            <div
              key={`${comp.name}-${idx}`}
              className="px-5 py-3.5 sm:px-7 sm:py-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-200 flex items-center justify-center shrink-0 group"
            >
              <img
                src={comp.logoUrl || `/images/companies/${comp.name.toLowerCase().replace(/\s+/g, '')}.svg`}
                alt={comp.name}
                className="h-6 sm:h-8 max-w-[140px] sm:max-w-[170px] w-auto object-contain grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className="hidden text-sm font-bold text-slate-800 dark:text-slate-200">
                {comp.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
