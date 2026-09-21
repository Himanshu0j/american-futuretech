import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  Eye,
  ChevronRight,
  ExternalLink,
  GraduationCap
} from 'lucide-react';

export default function JobCard({
  job,
  onOpenDetails,
  onOpenApply
}) {
  // Format salary cleanly into $110K - $140K / yr (no duplicate $)
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

  // Restrict displayed skills to 4-5 as requested by client
  const visibleSkills = (job.skills || []).slice(0, 5);
  const remainingSkillsCount = (job.skills || []).length - visibleSkills.length;

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-[#1a361d]/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group relative">
      
      {/* 1. TOP ROW: Job Title on Top Left + Salary & Actively Interviewing on Top Right */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Left: Job Title on TOP, then Company Name & Badges */}
        <div className="space-y-1.5 flex-1">
          <Link
            to={`/jobs/${job._id}`}
            className="text-xl sm:text-2xl font-display font-extrabold text-[#1a361d] hover:text-[#40844e] transition-colors leading-tight block"
          >
            {job.title}
          </Link>

          {/* Subheader: Company Logo + Company Name + Verified Partner + Department */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* Company Logo Avatar */}
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
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
                className={`w-full h-full rounded-lg bg-gradient-to-br from-[#1a361d] to-[#2d5c36] text-white font-bold text-xs flex items-center justify-center ${
                  job.companyLogo ? 'hidden' : 'flex'
                }`}
              >
                {job.company?.slice(0, 2).toUpperCase() || 'CP'}
              </div>
            </div>

            <span className="text-sm font-bold text-slate-900">{job.company}</span>

            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified Partner
            </span>

            {job.department && (
              <span className="text-[11px] font-semibold text-[#1a361d] bg-[#d8ffd2] px-2.5 py-0.5 rounded-full">
                {job.department}
              </span>
            )}

            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {job.employmentType || job.type || 'Full-time'}
            </span>
          </div>
        </div>

        {/* Right: Salary badge placed directly ABOVE Actively Interviewing */}
        <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1.5 shrink-0 pt-1 sm:pt-0">
          <div className="inline-flex items-center text-xs sm:text-sm font-bold text-[#1a361d] font-mono tracking-tight bg-[#d8ffd2]/80 px-3 py-1 rounded-xl border border-[#76ff8a]/60 shadow-2xs">
            {formatSalary()}
          </div>
          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Actively Interviewing</span>
          </div>
        </div>
      </div>

      {/* 2. Recommended Course Track Banner */}
      {(job.recommendedCourseTitle || (job.recommendedCourse && job.recommendedCourse.title)) && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900">
          <GraduationCap className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="font-semibold text-slate-600">Recommended Track:</span>
          {job.recommendedCourse?.slug ? (
            <Link
              to={`/courses/${job.recommendedCourse.slug}`}
              className="font-bold text-[#1a361d] hover:underline truncate"
            >
              {job.recommendedCourse.title || job.recommendedCourseTitle}
            </Link>
          ) : (
            <span className="font-bold text-[#1a361d] truncate">
              {job.recommendedCourseTitle || job.recommendedCourse?.title}
            </span>
          )}
        </div>
      )}

      {/* 3. Role Summary Description */}
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
        {job.description}
      </p>

      {/* 4. Key Attributes Row (Location & Experience Level - 0 applicants removed) */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>{job.experienceLevel}</span>
        </div>
        {Number(job.applicantCount) > 0 && (
          <div className="flex items-center gap-1.5 text-slate-500 font-mono">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{job.applicantCount} applied</span>
          </div>
        )}
      </div>

      {/* 5. Filtered Tools (Max 4-5) & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        {/* Skills: Showing only 4 to 5 tools */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {visibleSkills.map((skill, i) => (
            <span
              key={i}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
            >
              {skill}
            </span>
          ))}
          {remainingSkillsCount > 0 && (
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200 font-mono">
              +{remainingSkillsCount} more
            </span>
          )}
        </div>

        {/* Dual Action Buttons (View Details + Apply Now) */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <Link
            to={`/jobs/${job._id}`}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>View Details</span>
          </Link>

          <button
            onClick={handleApplyClick}
            className="flex-1 sm:flex-none py-2.5 px-6 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-md"
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
