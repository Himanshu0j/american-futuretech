import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Award, ShieldCheck, ZoomIn, Eye } from 'lucide-react';
import { usePublicCourses } from '../lib/publicCourses';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { formatDepositAmount, lowestSeatDeposit } from '../lib/seatDeposit';
import { MICROSOFT_CERTIFICATES } from '../data/microsoftCertificates';
import CertificateModal from './CertificateModal';
import CourseCard from './CourseCard';

export default function CourseSection({ onSelectCourse, onOpenSyllabusModal }) {
  /*
   * The catalogue comes from the shared loader: the HTML snapshot (or the last
   * API reply) paints immediately, and a failed request keeps that instead of
   * swapping in the demo programmes this section used to carry.
   */
  const { courses, loading, failed, refresh } = usePublicCourses();
  // Settings → Deposit. The card CTA and the fine print beside it print the
  // amount checkout charges, so the home page can never disagree with the
  // header menu (or with /courses).
  const { settings } = useSiteSettings() || {};
  // The lowest fee in the catalogue, for the intro sentence. Each card prints
  // its OWN program's fee: the four-month tracks (CISSP, AI Product Manager,
  // GRC) reserve at $499 while the six-month tracks keep the site default, so
  // one page-wide number would misquote most of the cards.
  const depositFrom = formatDepositAmount(lowestSeatDeposit(settings, courses));
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeCertIdx, setActiveCertIdx] = useState(0);
  const [selectedModalCert, setSelectedModalCert] = useState(null);

  const filterCategories = [
    'All Programs',
    'Artificial Intelligence',
    'Cyber Security',
    'Cloud & DevOps'
  ];

  const filteredCourses = courses.filter((c) => {
    if (activeFilter === 'All Programs' || activeFilter === 'All') return true;
    if (activeFilter === 'Artificial Intelligence') {
      return (
        c.category?.toLowerCase().includes('intelligence') ||
        c.title?.toLowerCase().includes('ai') ||
        c.title?.toLowerCase().includes('data')
      );
    }
    if (activeFilter === 'Cyber Security') {
      return (
        c.category?.toLowerCase().includes('security') ||
        c.title?.toLowerCase().includes('cyber') ||
        c.title?.toLowerCase().includes('hacking')
      );
    }
    if (activeFilter === 'Cloud & DevOps') {
      return (
        c.category?.toLowerCase().includes('cloud') ||
        c.title?.toLowerCase().includes('devops') ||
        c.title?.toLowerCase().includes('cloud')
      );
    }
    return true;
  });


  return (
    <section id="courses" className="aft-cloud py-12 sm:py-16 relative z-10 bg-white dark:bg-[rgb(var(--tw-ink-800))] text-slate-900 dark:text-slate-100 border-t border-slate-200/60 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-10 gap-6 text-left">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-bold font-heading uppercase tracking-wider mb-3.5 shadow-xs">
              <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>6-Month Career Training Programs · Dual US & Microsoft Credentials</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-slate-900 dark:text-white tracking-tight leading-tight">
              Fellowship Specializations
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {`Curriculums engineered with Silicon Valley engineering leads. Deploy production code, defend capstone architectures, and gain lifetime alumni placement support. Reserve any track from ${depositFrom}.`}
            </p>
          </div>

          {/* Track Filter Tabs (Refined Pill Style) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
            {filterCategories.map((cat) => {
              const isSelected = activeFilter === cat || (cat === 'All Programs' && activeFilter === 'All');
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* EVERY specialization uses the same full-width showcase layout the
            client picked from the home page: programme artwork on the left, the
            whole story (curriculum highlights, stack, tuition, CTAs) beside it.
            The map parameter is deliberately named `flagship` so every course
            renders through the card markup below unchanged. */}
        {/* Nothing real to show is stated plainly. The section used to answer
            a failed request with hardcoded demo programmes, which is how a
            phone ended up showing titles and artwork the admin had long since
            replaced — worse than an honest retry. */}
        {failed && !courses.length && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              The programme catalogue could not be loaded.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Check your connection and try again — nothing is being shown rather than out-of-date content.
            </p>
            <button
              type="button"
              onClick={() => refresh()}
              className="mt-4 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {loading && !courses.length && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            Loading the programme catalogue…
          </div>
        )}

        {filteredCourses.map((flagship) => (
          <CourseCard
            key={flagship._id || flagship.slug}
            course={flagship}
            settings={settings}
            className="mb-6 sm:mb-8"
          />
        ))}



        {/* Official Microsoft Partner Credential Showcase */}
        <div className="mt-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[rgb(var(--tw-ink-800))] to-[rgb(var(--tw-ink-800))] text-white border border-blue-500/30 shadow-2xl text-left">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-blue-500/20">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Dual Credential Framework &bull; US Institute + Microsoft Certified</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
                Official Microsoft Certified Partner Credentials
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Every American FutureTech fellow graduates with dual industry credentials: our accredited US Fellowship Diploma verified on our Wyoming Registry, plus official alignment with Microsoft Certified Professional certifications.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/certificate/AFT-CERT-AI9821"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-colors text-center shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Verify Sample Credential</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              {/* Deposit price removed from this credential panel at the
                  client's request — the CTA now reads "Reserve Seat" only. */}
              <Link
                to="/checkout?tier=deposit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors text-center shadow-md"
              >
                Reserve Seat
              </Link>
            </div>
          </div>

          {/* Certificate Selector Pills */}
          <div className="pt-6">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-300 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" />
              <span>Select Microsoft Certification to Inspect:</span>
            </div>

            <div className="flex flex-wrap gap-2 pb-2">
              {MICROSOFT_CERTIFICATES.map((cert, idx) => (
                <button
                  key={cert.id}
                  onClick={() => setActiveCertIdx(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                    activeCertIdx === idx
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700'
                  }`}
                >
                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 text-[10px]">
                    {cert.code}
                  </span>
                  <span>{cert.title.replace('Microsoft Certified: ', '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Certificate Spotlight Card */}
          {MICROSOFT_CERTIFICATES[activeCertIdx] && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-slate-950/60 p-6 sm:p-6 rounded-2xl border border-blue-500/20">
              {/* Certificate Image with Zoom Lightbox Trigger */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div
                  onClick={() => setSelectedModalCert(MICROSOFT_CERTIFICATES[activeCertIdx])}
                  className="group relative cursor-pointer rounded-xl overflow-hidden border-2 border-blue-400/40 shadow-2xl bg-white w-full max-w-md transition-all duration-300 hover:scale-[1.02] hover:border-blue-400"
                >
                  <img
                    src={MICROSOFT_CERTIFICATES[activeCertIdx].image}
                    alt={MICROSOFT_CERTIFICATES[activeCertIdx].title}
                    className="w-full h-auto max-h-[210px] sm:max-h-[240px] object-contain transition-transform duration-300 group-hover:contrast-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <span className="px-3.5 py-1.5 rounded-full bg-white/90 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                      <ZoomIn className="w-4 h-4 text-blue-600" />
                      <span>Inspect High-Res Certificate</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/95 border-t border-slate-800 text-center flex items-center justify-between text-[11px] font-mono text-blue-300 px-3">
                    <span className="font-bold text-white">{MICROSOFT_CERTIFICATES[activeCertIdx].code}</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-blue-400" /> Click to Enlarge
                    </span>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold uppercase border border-blue-400/30">
                    {MICROSOFT_CERTIFICATES[activeCertIdx].badge}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold uppercase border border-blue-400/30">
                    {MICROSOFT_CERTIFICATES[activeCertIdx].category}
                  </span>
                </div>

                <h4 className="text-xl sm:text-2xl font-bold font-heading text-white">
                  {MICROSOFT_CERTIFICATES[activeCertIdx].title}
                </h4>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {MICROSOFT_CERTIFICATES[activeCertIdx].description}
                </p>

                {/* Core Competencies Tested */}
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">
                    Core Technical Competencies Validated:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MICROSOFT_CERTIFICATES[activeCertIdx].skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3 text-blue-400" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Wyoming Institutional Registry Backed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-blue-400" />
                    Direct Verification Endpoint
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enterprise Group Training Discovery Banner */}
        <div className="mt-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white font-heading">
              Looking for corporate group training or customized enterprise cohorts?
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              We provide private cohorts with customized AI red teaming and LLM infrastructure curriculums for engineering teams.
            </div>
          </div>

          <Link
            to="/courses"
            className="elms-btn-secondary !text-xs !py-2.5 !px-5 whitespace-nowrap shrink-0"
          >
            <span>Browse Complete Catalog (8 Programs)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <CertificateModal
        isOpen={!!selectedModalCert}
        certificate={selectedModalCert}
        onClose={() => setSelectedModalCert(null)}
      />
    </section>
  );
}
