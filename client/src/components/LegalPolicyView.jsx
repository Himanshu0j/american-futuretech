import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSiteSettings } from '../context/SiteSettingsContext';
import useCompanyInfo from '../hooks/useCompanyInfo';
import { mergePolicy } from '../data/legalPolicies';

/**
 * Shared renderer for the four legal pages (privacy / refund / cookies / terms).
 *
 * Every word comes from Admin → Settings → Legal & Policies (`policies.<key>`),
 * with the coded copy in `data/legalPolicies.js` as the fallback, so the design
 * stays identical while the team owns the text.
 *
 * Bullet copy may wrap a label in **double asterisks** to keep it bold, e.g.
 * `**Personal Identifiers:** Name, email …`.
 */
const InlineBold = ({ text }) => {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={index} className="font-bold text-[#002060]">{part.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </>
  );
};

export default function LegalPolicyView({ policyKey, label, Icon }) {
  const { settings } = useSiteSettings() || {};
  const company = useCompanyInfo();
  const policy = mergePolicy(policyKey, settings?.policies?.[policyKey]);

  const footerEmails = (settings?.footer?.contactEmails || []).filter(Boolean);
  const emails = footerEmails.length > 0 ? footerEmails : [company.email];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const bodyParagraphs = (body) =>
    String(body || '')
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-800 font-sans antialiased selection:bg-[#F00000] selection:text-[#002060] relative">
      <Navbar />

      <main className="pt-28 pb-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-left">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 mb-6">
          <Link to="/" className="hover:text-[#002060] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{label || policy.title}</span>
        </div>

        {/* Header — title words centred + bold */}
        <div className="border-b border-slate-200 pb-8 mb-10 text-center">
          {policy.badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCE7E7] border border-[#F00000]/40 text-[#002060] text-xs font-bold mb-4">
              {Icon ? <Icon className="w-3.5 h-3.5 text-[#1D4ED8]" /> : null}
              <span>{policy.badge}</span>
            </div>
          )}
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#002060] text-center">
            {policy.title}
          </h1>
          {policy.lastUpdated && (
            <p className="text-slate-600 text-xs sm:text-sm font-mono font-bold mt-3 text-center">
              Last Updated: {policy.lastUpdated}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-8 text-slate-700">
          {policy.intro && (
            <p className="font-semibold text-[#002060]">{policy.intro}</p>
          )}

          {policy.sections.map((section, index) => (
            <section key={section._key || index} className="space-y-3">
              {section.heading && (
                <h2 className="text-lg sm:text-xl font-display font-bold text-[#002060]">
                  {section.heading}
                </h2>
              )}

              {bodyParagraphs(section.body).map((paragraph, pIndex) => (
                <p key={pIndex}>{paragraph}</p>
              ))}

              {section.bullets?.length > 0 && (
                <ul className="space-y-2.5 not-prose">
                  {section.bullets.map((bullet, bIndex) => (
                    <li
                      key={bIndex}
                      className="flex items-start gap-2.5 rounded-xl bg-[#FCE7E7]/40 border border-[#F00000]/30 px-3.5 py-2.5 text-xs sm:text-sm text-slate-700"
                    >
                      <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D4ED8]" />
                      <span className="leading-relaxed">
                        <InlineBold text={bullet} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Highlighted, bold contact card (privacy officer block) */}
              {section.contactBlock && (
                <div className="rounded-2xl bg-[#FCE7E7] border-2 border-[#F00000] px-4 py-4 space-y-1.5 font-mono text-xs font-bold text-[#002060] shadow-xs">
                  <p className="font-extrabold">{company.legalName}</p>
                  <p>{company.address}</p>
                  <p>
                    Email:{' '}
                    {emails.map((email, eIndex) => (
                      <React.Fragment key={email}>
                        {eIndex > 0 ? ', ' : ''}
                        <a href={`mailto:${email}`} className="text-[#1D4ED8] hover:underline font-bold">
                          {email}
                        </a>
                      </React.Fragment>
                    ))}
                  </p>
                  <p>Phone: {company.phone}</p>
                </div>
              )}
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
