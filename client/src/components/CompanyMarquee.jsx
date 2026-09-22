import React from 'react';

const DEFAULT_COMPANIES = [
  { name: 'Google', logoUrl: '/images/companies/google.svg' },
  { name: 'Microsoft', logoUrl: '/images/companies/microsoft.svg' },
  { name: 'Amazon Web Services', logoUrl: '/images/companies/aws.svg' },
  { name: 'IBM', logoUrl: '/images/companies/ibm.svg' },
  { name: 'Infosys', logoUrl: '/images/companies/infosys.svg' },
  { name: 'Accenture', logoUrl: '/images/companies/accenture.svg' },
  { name: 'Intel', logoUrl: '/images/companies/intel.svg' },
  { name: 'Meta', logoUrl: '/images/companies/meta.svg' },
  { name: 'Google Cloud', logoUrl: '/images/companies/google-cloud.svg' },
  { name: 'CrowdStrike', logoUrl: '/images/companies/crowdstrike.svg' },
  { name: 'Palantir', logoUrl: '/images/companies/palantir.svg' },
  { name: 'Snowflake', logoUrl: '/images/companies/snowflake.svg' },
  { name: 'Databricks', logoUrl: '/images/companies/databricks.svg' },
  { name: 'AWS', logoUrl: '/images/companies/aws-footer.svg' },
  { name: 'Microsoft Azure', logoUrl: '/images/companies/microsoft-footer.svg' },
];

/**
 * Reusable infinite-scrolling company logo marquee.
 * Shows 15+ partner company logos, pauses on hover.
 * Compact: py-6, single row, blends with any page background.
 */
export default function CompanyMarquee({ subtitle = 'Our alumni engineer mission-critical systems across Fortune 500 tech leaders' }) {
  const duplicated = [...DEFAULT_COMPANIES, ...DEFAULT_COMPANIES];

  return (
    <section className="py-6 bg-[#f8faf5] border-y border-slate-200/70 relative overflow-hidden">
      {subtitle && (
        <p className="text-center text-xs font-semibold text-slate-500 mb-4 px-4">
          {subtitle}
        </p>
      )}

      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div
          className="flex items-center gap-4 w-max animate-infinite-marquee hover:[animation-play-state:paused] py-1"
          style={{ animationDuration: '38s' }}
        >
          {duplicated.map((comp, idx) => (
            <div
              key={`${comp.name}-${idx}`}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0 hover:shadow-sm transition-all duration-200"
            >
              <img
                src={comp.logoUrl}
                alt={comp.name}
                className="h-6 w-auto max-w-[110px] object-contain"
                loading="lazy"
                onError={(e) => { e.target.style.opacity = '0.25'; }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
