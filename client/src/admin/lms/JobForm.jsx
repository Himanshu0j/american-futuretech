import React from 'react';
import { Field, inputClass } from './ui';

export const emptyJob = () => ({
  title: '',
  company: '',
  companyLogo: '',
  description: '',
  skills: '',
  qualifications: '',
  experienceLevel: 'Entry to Mid Level',
  location: 'Remote (US & Global)',
  salaryRange: '',
  employmentType: 'Full-time',
  applyLink: '',
  deadline: '',
  isPublished: true,
});

export const toJobDraft = (job = {}) => ({
  ...emptyJob(),
  title: job.title || '',
  company: job.company || '',
  companyLogo: job.companyLogo || '',
  description: job.description || '',
  skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || '',
  qualifications: Array.isArray(job.qualifications) ? job.qualifications.join(', ') : job.qualifications || '',
  experienceLevel: job.experienceLevel || 'Entry to Mid Level',
  location: job.location || 'Remote (US & Global)',
  salaryRange: job.salaryRange || '',
  employmentType: job.employmentType || 'Full-time',
  applyLink: job.applyLink || '',
  deadline: job.deadline ? String(job.deadline).slice(0, 10) : '',
  isPublished: job.isPublished !== false,
});

export default function JobForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Job title" required>
          <input className={inputClass} value={value.title} onChange={(e) => set('title', e.target.value)} placeholder="Junior Data Analyst" />
        </Field>
        <Field label="Company name">
          <input className={inputClass} value={value.company} onChange={(e) => set('company', e.target.value)} placeholder="Career Network Partner" />
        </Field>
      </div>

      <Field label="Company logo URL">
        <input className={inputClass} value={value.companyLogo} onChange={(e) => set('companyLogo', e.target.value)} placeholder="https://… or /uploads/…" />
      </Field>

      <Field label="Description" required>
        <textarea rows={4} className={inputClass} value={value.description} onChange={(e) => set('description', e.target.value)} placeholder="What the role involves, team context, day-to-day work…" />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Skills" hint="Comma separated">
          <input className={inputClass} value={value.skills} onChange={(e) => set('skills', e.target.value)} placeholder="SQL, Python, Tableau" />
        </Field>
        <Field label="Qualifications" hint="Comma separated">
          <input className={inputClass} value={value.qualifications} onChange={(e) => set('qualifications', e.target.value)} placeholder="Bachelor's degree, 1+ years experience" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Experience">
          <select className={inputClass} value={value.experienceLevel} onChange={(e) => set('experienceLevel', e.target.value)}>
            {['Entry Level', 'Entry to Mid Level', 'Mid Level', 'Senior Level'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Employment type">
          <select className={inputClass} value={value.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
            {['Full-time', 'Part-time', 'Contract', 'Internship'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <input className={inputClass} value={value.location} onChange={(e) => set('location', e.target.value)} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Salary range">
          <input className={inputClass} value={value.salaryRange} onChange={(e) => set('salaryRange', e.target.value)} placeholder="$70,000 - $95,000 / year" />
        </Field>
        <Field label="Application deadline">
          <input type="date" className={inputClass} value={value.deadline} onChange={(e) => set('deadline', e.target.value)} />
        </Field>
        <Field label="Application link" hint="Empty = apply through this portal">
          <input className={inputClass} value={value.applyLink} onChange={(e) => set('applyLink', e.target.value)} placeholder="https://…" />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-[11px] text-slate-300">
        <input type="checkbox" checked={value.isPublished} onChange={(e) => set('isPublished', e.target.checked)} />
        Publish this role to the selected batch
      </label>
    </div>
  );
}
