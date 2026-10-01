import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Clock,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Eye,
  Building2,
  Sparkles
} from 'lucide-react';
import SafeImage from './common/SafeImage';
import { formatRelativeTime } from '../lib/relativeTime';

export default function JobCard({
  job,
  onOpenDetails,
  onOpenApply
}) {
  // Real posting timestamp from the database (never a hardcoded label). The card
  // shows only the age — "3 days ago" — the word "Posted" was dropped on the
  // client's request, and the clock icon already says what it is.
  const postedLabel = formatRelativeTime(job.postedAt || job.createdAt);

  // Normalize any stored salary string so there is never a doubled "$" (e.g. "$ $100K")
  const normalizeSalary = (raw) => {
    if (!raw) return '';
    let s = String(raw).trim();
    // collapse repeated $ signs and any spaces between them
    s = s.replace(/\$\s*(\$\s*)+/, '$ ');
    // collapse "100,000" -> "100K"
    s = s.replace(/(\d{1,3}),000\b/g, '$1K');
    // remove a second $ inside the range ("$100K - $130K" is fine, "$100K - $$130K" is not)
    s = s.replace(/-\s*\$\$/g, '- $');
    return s.trim();
  };

  // Format salary cleanly into $110K - $140K / yr
  const formatSalary = () => {
    const min = Number(job.salaryMin);
    const max = Number(job.salaryMax);
    if (!isNaN(min) && !isNaN(max) && min > 0 && max > 0) {
      const minK = min >= 1000 ? `${Math.round(min / 1000)}K` : min;
      const maxK = max >= 1000 ? `${Math.round(max / 1000)}K` : max;
      return `$${minK} - $${maxK} / yr`;
    }
    if (job.salaryRange) {
      return normalizeSalary(job.salaryRange);
    }
    return '';
  };

  const handleApplyClick = (e) => {
    e.stopPropagation();
    if (job.applyLink && (job.applyLink.startsWith('http://') || job.applyLink.startsWith('https://'))) {
      window.open(job.applyLink, '_blank', 'noopener,noreferrer');
    } else if (onOpenApply) {
      onOpenApply(job);
    }
  };

  const handleDetailsClick = (e) => {
    if (onOpenDetails) {
      // If modal detail handler is provided, we can allow direct navigation or modal
      // We will provide a direct Link button to /jobs/${jobId} for dedicated page
    }
  };

  // Visible skills limit to 4-5 (technical skills first, then tools, then skills)
  const skillPool = [
    ...(job.technicalSkills?.length ? job.technicalSkills : []),
    ...(job.tools?.length ? job.tools : []),
    ...(!job.technicalSkills?.length && !job.tools?.length ? (job.skills || []) : []),
  ];
  const visibleSkills = skillPool.slice(0, 5);
  const remainingSkillsCount = skillPool.length - visibleSkills.length;

  const jobId = job.id || job._id;
  const employmentType = job.employmentType || job.type || 'Full-time';
  const experience = job.experienceLevel || 'Entry to Mid Level';
  const locationText = job.location || 'Remote (US & Global)';

  return (
    <div className="p-6 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-5 group relative text-left">
      
      {/* 1. TOP ROW: Prominent Company Logo + Title & Key Metadata Tags */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Company Logo Avatar: enlarged so a partner brand is readable at a glance */}
          <SafeImage
            src={job.companyLogo}
            alt={job.company}
            fallbackText={job.company || 'FT'}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 p-2.5 shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200"
            imageClassName="w-full h-full object-contain rounded-xl"
            fallbackClassName="w-full h-full rounded-xl bg-gradient-to-br from-[#002060] to-[#1D4ED8] text-[#FF6B6B] font-black text-lg flex items-center justify-center"
          />

          {/* Job Title & Structured Tags Row */}
          <div className="space-y-2 flex-1">
            <Link
              to={`/jobs/${jobId}`}
              className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-white group-hover:text-[#002060] dark:group-hover:text-[#FF6B6B] transition-colors leading-snug block"
            >
              {job.title}
            </Link>

            {/* Structure Tags: Company Name • Full-time • Remote • Level.
                The posting age is deliberately NOT here — the client wants it in
                the card's bottom-left corner, next to the action buttons. */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                {job.company}
              </span>

              <span className="text-slate-300 dark:text-slate-600">•</span>

              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                {employmentType}
              </span>

              <span className="text-slate-300 dark:text-slate-600">•</span>

              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                <MapPin className="w-3 h-3 text-red-500" />
                {locationText}
              </span>

              <span className="text-slate-300 dark:text-slate-600">•</span>

              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                <Clock className="w-3 h-3 text-red-500" />
                {experience}
              </span>

            </div>
          </div>
        </div>

        {/* Right: Compensation & Actively Hiring Badge */}
        <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-start gap-1.5 shrink-0 pt-1 md:pt-0">
          <div className="inline-flex items-center text-xs sm:text-sm font-bold text-[#002060] dark:text-[#FF6B6B] font-mono tracking-tight bg-[#FCE7E7]/70 dark:bg-blue-950/60 px-3.5 py-1.5 rounded-xl border border-[#F00000]/60 dark:border-blue-800 shadow-2xs">
            {formatSalary() || 'Salary on request'}
          </div>
          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-blue-800 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            <span>Actively Hiring</span>
          </div>
        </div>
      </div>

      {/* 2. Recommended Course Track Banner */}
      {(job.recommendedCourseTitle || (job.recommendedCourse && job.recommendedCourse.title) || job.course) && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
          <GraduationCap className="w-4 h-4 text-[#1D4ED8] dark:text-[#FF6B6B] shrink-0" />
          <span className="font-semibold text-slate-500 dark:text-slate-400">Recommended Track:</span>
          {job.recommendedCourse?.slug ? (
            <Link
              to={`/courses/${job.recommendedCourse.slug}`}
              className="font-bold text-[#002060] dark:text-[#FF6B6B] hover:underline truncate"
            >
              {job.recommendedCourse.title || job.recommendedCourseTitle}
            </Link>
          ) : (
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {job.recommendedCourseTitle || job.recommendedCourse?.title || job.course}
            </span>
          )}
        </div>
      )}

      {/* 3. Skill and tool chips — sit directly under the "Recommended Track"
          line. */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleSkills.map((skill, i) => (
            <span
              key={i}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              {skill}
            </span>
          ))}
          {remainingSkillsCount > 0 && (
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              +{remainingSkillsCount} more
            </span>
          )}
        </div>

      </div>

      {/* 4. Action Bar: posting age on the LEFT, the distinct VIEW DETAILS and
          APPLY NOW buttons on the right. The age used to sit in the details row
          under the job title; the client moved it to this lower-left corner. */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
        {postedLabel ? (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 w-full sm:w-auto"
            title={new Date(job.postedAt || job.createdAt).toLocaleString('en-US')}
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {postedLabel}
          </span>
        ) : (
          <span aria-hidden="true" className="hidden sm:block" />
        )}

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <Link
            to={`/jobs/${jobId}`}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>VIEW DETAILS</span>
          </Link>

          <button
            onClick={handleApplyClick}
            className="flex-1 sm:flex-none py-2.5 px-6 rounded-xl bg-[#002060] hover:bg-[#1D4ED8] text-[#FFD9D9] font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>APPLY NOW</span>
            {job.applyLink ? (
              <ExternalLink className="w-3.5 h-3.5 text-[#FF6B6B]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#FF6B6B]" />
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
