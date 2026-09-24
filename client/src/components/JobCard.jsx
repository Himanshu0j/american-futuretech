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
import { formatPostedLabel } from '../lib/relativeTime';

export default function JobCard({
  job,
  onOpenDetails,
  onOpenApply
}) {
  // Real posting timestamp from the database (never a hardcoded label).
  const postedLabel = formatPostedLabel(job.postedAt || job.createdAt);

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
    <div className="p-6 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-5 group relative text-left">
      
      {/* 1. TOP ROW: Prominent Company Logo (w-12 h-12 / w-12 h-12) + Title & Key Metadata Tags */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Company Logo Avatar: Size w-12 h-12 sm:w-14 sm:h-14 with SafeImage fallback */}
          <SafeImage
            src={job.companyLogo}
            alt={job.company}
            fallbackText={job.company || 'FT'}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 p-2 shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200"
            imageClassName="w-full h-full object-contain rounded-xl"
            fallbackClassName="w-full h-full rounded-xl bg-gradient-to-br from-[#0B1220] to-[#4338CA] text-[#E5C275] font-black text-sm flex items-center justify-center"
          />

          {/* Job Title & Structured Tags Row */}
          <div className="space-y-2 flex-1">
            <Link
              to={`/jobs/${jobId}`}
              className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-white group-hover:text-[#0B1220] dark:group-hover:text-[#E5C275] transition-colors leading-snug block"
            >
              {job.title}
            </Link>

            {/* Structure Tags: Company Name • Full-time • Remote • Entry Level to Mid Level */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                {job.company}
              </span>

              <span className="text-slate-300 dark:text-slate-600">•</span>

              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                {employmentType}
              </span>

              <span className="text-slate-300 dark:text-slate-600">•</span>

              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                <MapPin className="w-3 h-3 text-rose-500" />
                {locationText}
              </span>

              <span className="text-slate-300 dark:text-slate-600">•</span>

              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                <Clock className="w-3 h-3 text-amber-500" />
                {experience}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Compensation & Actively Hiring Badge */}
        <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-start gap-1.5 shrink-0 pt-1 md:pt-0">
          <div className="inline-flex items-center text-xs sm:text-sm font-bold text-[#0B1220] dark:text-[#E5C275] font-mono tracking-tight bg-[#EFE6D6]/70 dark:bg-emerald-950/60 px-3.5 py-1.5 rounded-xl border border-[#E5C275]/60 dark:border-emerald-800 shadow-2xs">
            {formatSalary() || 'Salary on request'}
          </div>
          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Actively Hiring</span>
          </div>
        </div>
      </div>

      {/* 2. Recommended Course Track Banner */}
      {(job.recommendedCourseTitle || (job.recommendedCourse && job.recommendedCourse.title) || job.course) && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
          <GraduationCap className="w-4 h-4 text-[#4338CA] dark:text-[#E5C275] shrink-0" />
          <span className="font-semibold text-slate-500 dark:text-slate-400">Recommended Track:</span>
          {job.recommendedCourse?.slug ? (
            <Link
              to={`/courses/${job.recommendedCourse.slug}`}
              className="font-bold text-[#0B1220] dark:text-[#E5C275] hover:underline truncate"
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

      {/* 3. Filtered Skills (Strictly 5 tools) + Posted Time & Action Buttons Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Skills/tools first, then the posting time sits right after them */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
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

          {postedLabel && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400"
              title={new Date(job.postedAt || job.createdAt).toLocaleString('en-US')}
            >
              <Clock className="w-3 h-3 text-slate-400" />
              {postedLabel}
            </span>
          )}
        </div>

        {/* Action Buttons: Distinct VIEW DETAILS and APPLY NOW */}
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
            className="flex-1 sm:flex-none py-2.5 px-6 rounded-xl bg-[#0B1220] hover:bg-[#4338CA] text-[#EFE6D6] font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>APPLY NOW</span>
            {job.applyLink ? (
              <ExternalLink className="w-3.5 h-3.5 text-[#E5C275]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#E5C275]" />
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
