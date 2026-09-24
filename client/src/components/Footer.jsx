import React from 'react';
import { ShieldCheck, Mail, Phone, MapPin, Award, ArrowRight, Linkedin, Youtube, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCompanyInfo from '../hooks/useCompanyInfo';
import { useSiteSettings } from '../context/SiteSettingsContext';

const HIRING_LOGOS = [
  { src: '/images/companies/google-cloud.svg', alt: 'Google Cloud' },
  { src: '/images/companies/microsoft-footer.svg', alt: 'Microsoft' },
  { src: '/images/companies/aws-footer.svg', alt: 'Amazon AWS' },
  { src: '/images/companies/crowdstrike.svg', alt: 'CrowdStrike' },
  { src: '/images/companies/palantir.svg', alt: 'Palantir' },
  { src: '/images/companies/snowflake.svg', alt: 'Snowflake' },
  { src: '/images/companies/databricks.svg', alt: 'Databricks' },
];

const CodedFallback = {
  enabled: true,
  logo: '/images/logo-horizontal-white.webp',
  logoWidth: 160,
  description:
    'An accredited US technology workforce institute providing rigorous cohort fellowships in applied AI engineering, offensive cybersecurity, and enterprise cloud architecture.',
  badgeText: 'Wyoming Registered Corporate Charter',
  copyrightText: '© 2026 American FutureTech LLC. All rights reserved. Registered in Wyoming, USA.',
  hiringStrip: {
    enabled: true,
    text: 'Alumni Engineering at Leading Enterprise & High-Growth Technology Companies',
  },
  cta: { enabled: true, label: 'Contact Admissions Advisor', url: '' },
  columns: [],
  legalLinks: [],
};

/** Sorted, active-only view of an admin list (order honoured, hidden items dropped). */
const visible = (items) =>
  (Array.isArray(items) ? items : [])
    .filter((item) => item && item.active !== false)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

export default function Footer({ onOpenLeadModal }) {
  const company = useCompanyInfo();
  const { settings } = useSiteSettings();
  const footer = { ...CodedFallback, ...(settings?.footer || {}) };

  if (footer.enabled === false) return null;

  const columns = visible(footer.columns);
  const legalLinks = visible(footer.legalLinks);
  const socials = [
    { key: 'linkedin', href: company.socials.linkedin, Icon: Linkedin, label: 'LinkedIn' },
    { key: 'youtube', href: company.socials.youtube, Icon: Youtube, label: 'YouTube' },
    { key: 'instagram', href: company.socials.instagram, Icon: Instagram, label: 'Instagram' },
    { key: 'twitter', href: company.socials.twitter, Icon: Twitter, label: 'X' },
  ].filter((s) => s.href);

  const logoWidth = Number(footer.logoWidth) || 160;

  const renderLink = (link, index) => {
    const isExternal = /^https?:\/\//i.test(link.url || '');
    const className = 'hover:text-white transition-colors';
    if (isExternal) {
      return (
        <a key={`${link.label}-${index}`} href={link.url} target="_blank" rel="noreferrer" className={className}>
          {link.label}
        </a>
      );
    }
    return (
      <Link key={`${link.label}-${index}`} to={link.url || '#'} className={className}>
        {link.label}
      </Link>
    );
  };

  return (
    <footer id="contact" className="border-t border-[#4338CA] bg-[#0B1220] pt-16 pb-12 text-[#EFE6D6]/80 text-sm relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Alumni Hiring Network Strip */}
        {footer.hiringStrip?.enabled !== false && (
          <div id="placement" className="pb-12 border-b border-[#4338CA]/80">
            <p className="text-[11px] uppercase tracking-widest font-mono font-bold text-[#E5C275] mb-6 text-center">
              {footer.hiringStrip?.text}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-6">
              {HIRING_LOGOS.map((logo) => (
                <div
                  key={logo.src}
                  className="flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xs hover:scale-105"
                >
                  <img src={logo.src} alt={logo.alt} loading="lazy" className="h-6 sm:h-7 w-auto object-contain filter-none" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Directory grid — brand column + admin-managed columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 py-12 text-left">
          <div className="space-y-4 md:col-span-1 lg:col-span-2">
            <Link to="/" className="inline-block mb-1">
              <img
                src={footer.logo}
                alt={company.name || 'American FutureTech'}
                style={{ width: `${logoWidth}px`, height: 'auto' }}
                className="max-w-full object-contain"
              />
            </Link>
            <p className="text-xs text-[#EFE6D6]/80 leading-relaxed font-normal max-w-md">{footer.description}</p>
            {footer.badgeText && (
              <div className="flex items-center gap-2 text-xs text-[#E5C275] font-semibold pt-1">
                <Award className="w-4 h-4 text-[#E5C275] shrink-0" />
                <span>{footer.badgeText}</span>
              </div>
            )}
          </div>

          {columns.map((column) => (
            <div key={column._id || column.title} className="space-y-3">
              <h4 className="text-xs font-bold text-[#E5C275] uppercase tracking-wider font-heading">
                {column.title}
              </h4>
              <ul className="space-y-2.5 text-xs text-[#EFE6D6]/80">
                {visible(column.links).map((link, index) => (
                  <li key={link._id || `${link.label}-${index}`}>{renderLink(link, index)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact block — address, phone, email, socials, CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-8 border-t border-[#4338CA]/60">
          <div className="space-y-2.5 text-xs text-[#EFE6D6]/80 lg:col-span-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#E5C275] shrink-0 mt-0.5" />
              <span>{company.address}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#E5C275] shrink-0" />
                <a href={company.phoneHref} className="hover:text-white transition-colors">{company.phone}</a>
              </span>
              <span className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#E5C275] shrink-0" />
                <a href={company.emailHref} className="hover:text-white transition-colors break-all">{company.email}</a>
              </span>
            </div>
            {socials.length > 0 && (
              <div className="flex items-center gap-2.5 pt-1">
                {socials.map(({ key, href, Icon, label }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#EFE6D6] hover:text-[#0B1220] hover:bg-[#E5C275] transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start lg:justify-end">
            {footer.cta?.enabled !== false && footer.cta?.label && (
              footer.cta.url ? (
                <a
                  href={footer.cta.url}
                  className="text-xs font-bold text-[#0B1220] bg-[#E5C275] hover:bg-white px-3.5 py-2 rounded-full transition-colors"
                >
                  {footer.cta.label}
                </a>
              ) : (
                <button
                  onClick={onOpenLeadModal}
                  className="text-xs font-bold text-[#0B1220] bg-[#E5C275] hover:bg-white px-3.5 py-2 rounded-full transition-colors cursor-pointer"
                >
                  {footer.cta.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Bottom copyright & legal links */}
        <div className="pt-8 border-t border-[#4338CA]/80 flex flex-col sm:flex-row items-center justify-between text-xs text-[#EFE6D6]/70 gap-4">
          <div>{footer.copyrightText}</div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {legalLinks.map((link, index) => (
              <React.Fragment key={link._id || `${link.label}-${index}`}>{renderLink(link, index)}</React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
