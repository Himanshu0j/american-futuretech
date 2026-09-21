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
  Building2
} from 'lucide-react';

export default function JobCard({
  job,
  onOpenApply
}) {
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
      let s = String(job.salaryRange).trim().replace(/^\$\s*\$?\s*/, '$');
      s = s.replace(/(\d{2,3}),000/g, '$1K');
      return s;
    }
    return '$110K - $140K / yr';
  };

  const handleApplyClick = (e) => {
    if (job.applyLink && (job.applyLink.startsWith('http://') || job.applyLink.startsWith('https://'))) {
      window.open(job.applyLink, '_blank', 'noopener,noreferrer');
    } else if (onOpenApply) {
      onOpenApply(job);
    }
  };

  // Visible skills limit to 4-5
  const visibleSkills = (job.technicalSkills?.length ? job.technicalSkills : (job.skills || [])).slice(0, 5);
  const remainingSkillsCount = (job.technicalSkills?.length ? job.technicalSkills : (job.skills || [])).length - visibleSkills.length;

  const jobId = job.id || job._id;

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-5 group relative text-left">
      
      {/* 1. TOP ROW: Job Title on Top Left + Salary & Status on Top Right */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <Link
            to={`/jobs/${jobId}`}
            className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight block"
          >
            {job.title}
          </Link>

          {/* Subheader: Company Logo + Company Name + Employment Type (Department and Verified Partner REMOVED) */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* Company Logo Avatar */}
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.company}
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full rounded-lg bg-gradient-to-br from-indigo-600 to-slate-900 text-white font-bold text-xs flex items-center justify-center ${
                  job.companyLogo ? 'hidden' : 'flex'
                }`}
              >
                {job.company?.slice(0, 2).toUpperCase() || 'CP'}
              </div>
            </div>

            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{job.company}</span>

            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              {job.employmentType || job.type || 'Full-time'}
            </span>
          </div>
        </div>

        {/* Right: Salary badge + Actively Reviewing indicator */}
        <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1.5 shrink-0 pt-1 sm:pt-0">
          <div className="inline-flex items-center text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-300 font-mono tracking-tight bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-2xs">
            {formatSalary()}
          </div>
          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Actively Interviewing</span>
          </div>
        </div>
      </div>

      {/* 2. Recommended Course Track Banner */}
      {(job.recommendedCourseTitle || (job.recommendedCourse && job.recommendedCourse.title) || job.course) && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="font-semibold text-slate-500 dark:text-slate-400">Recommended Track:</span>
          {job.recommendedCourse?.slug ? (
            <Link
              to={`/courses/${job.recommendedCourse.slug}`}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline truncate"
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

      {/* 3. Role Summary Description */}
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
        {job.description}
      </p>

      {/* 4. Key Attributes Row (Location & Experience Level) */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>{job.experienceLevel}</span>
        </div>
      </div>

      {/* 5. Filtered Tools & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        {/* Skills: Showing 4 to 5 tools */}
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
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-mono">
              +{remainingSkillsCount} more
            </span>
          )}
        </div>

        {/* Action Buttons (View Details + Apply Now) */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <Link
            to={`/jobs/${jobId}`}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>View Details</span>
          </Link>

          <button
            onClick={handleApplyClick}
            className="flex-1 sm:flex-none py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Apply Now</span>
            {job.applyLink ? (
              <ExternalLink className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
