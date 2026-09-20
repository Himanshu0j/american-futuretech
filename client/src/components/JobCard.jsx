import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  DollarSign,
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
  const formatSalary = () => {
    if (job.salaryMin && job.salaryMax) {
      return `$${Number(job.salaryMin).toLocaleString()} - $${Number(job.salaryMax).toLocaleString()} / yr`;
    }
    return job.salaryRange || '$100,000 - $140,000 / yr';
  };

  const handleApplyClick = (e) => {
    if (job.applyLink && (job.applyLink.startsWith('http://') || job.applyLink.startsWith('https://'))) {
      window.open(job.applyLink, '_blank', 'noopener,noreferrer');
    } else if (onOpenApply) {
      onOpenApply(job);
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 hover:border-[#1a361d]/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group relative">
      {/* Top Row: Company Logo + Badges + Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Company Logo & Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs p-1.5 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[#1a361d]/30 transition-all">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-full h-full rounded-xl bg-gradient-to-br from-[#1a361d] to-[#2d5c36] text-white font-bold text-sm flex items-center justify-center shadow-inner ${
                job.companyLogo ? 'hidden' : 'flex'
              }`}
            >
              {job.company?.slice(0, 2).toUpperCase() || 'CP'}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{job.company}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified Partner
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-[11px] font-semibold text-[#1a361d] bg-[#d8ffd2] px-2.5 py-0.5 rounded-full">
                {job.department}
              </span>
              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {job.employmentType || job.type || 'Full-time'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Interview Pulse Badge */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold self-start sm:self-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Actively Interviewing</span>
        </div>
      </div>

      {/* Recommended Course Pill if present */}
      {(job.recommendedCourseTitle || (job.recommendedCourse && job.recommendedCourse.title)) && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900">
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

      {/* Job Title & Summary */}
      <div className="space-y-2">
        <Link
          to={`/jobs/${job._id}`}
          className="text-lg sm:text-xl font-display font-bold text-[#1a361d] group-hover:text-[#40844e] transition-colors inline-block"
        >
          {job.title}
        </Link>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
          {job.description}
        </p>
      </div>

      {/* Key Attributes Row */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-[#2d5c36] bg-[#d8ffd2]/60 px-2.5 py-1 rounded-lg">
          <DollarSign className="w-3.5 h-3.5 text-[#2d5c36]" />
          <span>{formatSalary()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>{job.experienceLevel}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 font-mono">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{job.applicantCount || 0} applicants</span>
        </div>
      </div>

      {/* Skills Pills & Dual Action Buttons (View Details + Apply Now) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {(job.skills || []).map((skill, i) => (
            <span
              key={i}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* TWO DISTINCT BUTTONS */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          {/* Button 1: View Details */}
          <Link
            to={`/jobs/${job._id}`}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>View Details</span>
          </Link>

          {/* Button 2: Apply for Role */}
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
