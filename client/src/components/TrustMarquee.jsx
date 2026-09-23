import React from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { Building2, Sparkles } from 'lucide-react';

export default function TrustMarquee() {
  const { settings } = useSiteSettings();

  const heading = settings?.trustedCompanies?.heading || 'TRUSTED BY LEARNERS FROM LEADING GLOBAL COMPANIES';
  const subheading = settings?.trustedCompanies?.subheading || 'Our alumni engineer mission-critical systems across Fortune 500 technology leaders';

  const defaultCompanies = [
    { name: 'Google', logoUrl: '/images/companies/google.svg', height: 'h-6 sm:h-7' },
    { name: 'Microsoft', logoUrl: '/images/companies/microsoft.svg', height: 'h-5 sm:h-6' },
    { name: 'Amazon Web Services', logoUrl: '/images/companies/aws.svg', height: 'h-7 sm:h-8' },
    { name: 'IBM', logoUrl: '/images/companies/ibm.svg', height: 'h-5 sm:h-6' },
    { name: 'Infosys', logoUrl: '/images/companies/infosys.svg', height: 'h-5 sm:h-6' },
    { name: 'Accenture', logoUrl: '/images/companies/accenture.svg', height: 'h-5 sm:h-6' },
    { name: 'Intel', logoUrl: '/images/companies/intel.svg', height: 'h-5 sm:h-6' },
    { name: 'Meta', logoUrl: '/images/companies/meta.svg', height: 'h-5 sm:h-6' },
    { name: 'Google Cloud', logoUrl: '/images/companies/google-cloud.svg', height: 'h-6 sm:h-7' },
    { name: 'CrowdStrike', logoUrl: '/images/companies/crowdstrike.svg', height: 'h-5 sm:h-6' },
    { name: 'Palantir', logoUrl: '/images/companies/palantir.svg', height: 'h-5 sm:h-6' },
    { name: 'Snowflake', logoUrl: '/images/companies/snowflake.svg', height: 'h-5 sm:h-6' },
    { name: 'Databricks', logoUrl: '/images/companies/databricks.svg', height: 'h-5 sm:h-6' },
    { name: 'AWS', logoUrl: '/images/companies/aws-footer.svg', height: 'h-7 sm:h-8' },
    { name: 'Microsoft Azure', logoUrl: '/images/companies/microsoft-footer.svg', height: 'h-5 sm:h-6' },
  ];

  const companiesList = settings?.trustedCompanies?.companies?.length
    ? settings.trustedCompanies.companies.filter(c => c.active !== false)
    : defaultCompanies;

  // Duplicate for seamless 0-jump infinite loop
  const duplicatedCompanies = [...companiesList, ...companiesList];

  return (
    <section className="py-6 sm:py-8 bg-white/70 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800 backdrop-blur-md relative overflow-hidden">
      {/* Decorative background glow accents */}
      <div className="absolute top-0 left-1/4 w-96 h-24 bg-emerald-400/10 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-24 bg-indigo-400/10 dark:bg-indigo-400/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-[#4338CA] dark:text-[#E5C275]" />
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
          className="flex items-center gap-6 sm:gap-6 w-max animate-infinite-marquee hover:[animation-play-state:paused] cursor-pointer py-2"
          style={{
            animationDuration: '32s'
          }}
        >
          {duplicatedCompanies.map((comp, idx) => (
            <div
              key={`${comp.name}-${idx}`}
              className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500/50 transition-all duration-200 flex items-center justify-center shrink-0 group"
            >
              <img
                src={comp.logoUrl || `/images/companies/${comp.name.toLowerCase().replace(/\s+/g, '')}.svg`}
                alt={comp.name}
                className={`${comp.height || 'h-6 sm:h-8'} max-w-[140px] sm:max-w-[170px] w-auto object-contain group-hover:scale-105 transition-transform duration-200`}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className="hidden text-sm font-bold text-slate-900">
                {comp.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
