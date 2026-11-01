import React from 'react';
import { Field, inputClass } from './ui';

export const TIMEZONES = [
  'EST (UTC-5)',
  'EDT (UTC-4)',
  'CST (UTC-6)',
  'MST (UTC-7)',
  'PST (UTC-8)',
  'GMT (UTC+0)',
  'IST (UTC+5:30)',
  'GST (UTC+4)',
  'AEST (UTC+10)',
];

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const emptyBatch = (courseId = '') => ({
  courseId,
  name: '',
  batchCode: '',
  startDate: '',
  endDate: '',
  days: [],
  startTime: '',
  endTime: '',
  timezone: 'EST (UTC-5)',
  instructor: '',
  assistantInstructor: '',
  description: '',
  meetingPlatform: 'Zoom',
  meetingLink: '',
  maxCapacity: 25,
  status: 'Upcoming',
  visibility: 'Published',
  enrollmentStart: '',
  enrollmentEnd: '',
});

const dateInput = (value) => (value ? String(value).slice(0, 10) : '');

export const toBatchDraft = (batch = {}) => ({
  ...emptyBatch(String(batch.course?._id || batch.course || '')),
  name: batch.name || '',
  batchCode: batch.batchCode || '',
  startDate: dateInput(batch.startDate),
  endDate: dateInput(batch.endDate),
  days: Array.isArray(batch.days) ? batch.days : [],
  startTime: batch.startTime || '',
  endTime: batch.endTime || '',
  timezone: batch.timezone || 'EST (UTC-5)',
  instructor: batch.instructor || '',
  assistantInstructor: batch.assistantInstructor || '',
  description: batch.description || '',
  meetingPlatform: batch.meetingPlatform || 'Zoom',
  meetingLink: batch.meetingLink || '',
  maxCapacity: batch.maxCapacity || 25,
  status: batch.status || 'Upcoming',
  visibility: batch.visibility || 'Published',
  enrollmentStart: dateInput(batch.enrollmentStart),
  enrollmentEnd: dateInput(batch.enrollmentEnd),
});

const toggleDay = (days, day) =>
  days.includes(day) ? days.filter((value) => value !== day) : [...days, day];

export default function BatchForm({ value, onChange, showCode = true }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Batch name" hint="What students see, e.g. Batch 7–8 AM.">
          <input className={inputClass} value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Batch 7–8 AM" />
        </Field>
        {showCode && (
          <Field label="Batch code" required hint="Unique, printed on invoices.">
            <input
              className={inputClass}
              value={value.batchCode}
              onChange={(e) => set('batchCode', e.target.value.toUpperCase())}
              placeholder="DS-7AM-2026"
            />
          </Field>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Start date" required>
          <input type="date" className={inputClass} value={value.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </Field>
        <Field label="End date">
          <input type="date" className={inputClass} value={value.endDate} onChange={(e) => set('endDate', e.target.value)} />
        </Field>
      </div>

      <Field label="Class days" hint="Pick every day this cohort meets.">
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((day) => {
            const active = value.days.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={active}
                onClick={() => set('days', toggleDay(value.days, day))}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                  active
                    ? 'bg-[rgb(var(--tw-blue-700))] border-blue-400 text-white'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.09]'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Start time">
          <input type="time" className={inputClass} value={value.startTime} onChange={(e) => set('startTime', e.target.value)} />
        </Field>
        <Field label="End time">
          <input type="time" className={inputClass} value={value.endTime} onChange={(e) => set('endTime', e.target.value)} />
        </Field>
        <Field label="Timezone">
          <select className={inputClass} value={value.timezone} onChange={(e) => set('timezone', e.target.value)}>
            {TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Instructor">
          <input className={inputClass} value={value.instructor} onChange={(e) => set('instructor', e.target.value)} placeholder="Lead instructor" />
        </Field>
        <Field label="Assistant instructor">
          <input className={inputClass} value={value.assistantInstructor} onChange={(e) => set('assistantInstructor', e.target.value)} placeholder="Optional" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Capacity">
          <input
            type="number"
            min="1"
            className={inputClass}
            value={value.maxCapacity}
            onChange={(e) => set('maxCapacity', e.target.value)}
          />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={value.status} onChange={(e) => set('status', e.target.value)}>
            {['Upcoming', 'In Progress', 'Completed', 'Closed', 'Archived'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Visibility">
          <select className={inputClass} value={value.visibility} onChange={(e) => set('visibility', e.target.value)}>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Meeting platform">
          <select className={inputClass} value={value.meetingPlatform} onChange={(e) => set('meetingPlatform', e.target.value)}>
            {['Zoom', 'Google Meet', 'Microsoft Teams', 'Other', 'None'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Meeting link" hint="Only enrolled students ever receive this link.">
          <input
            className={inputClass}
            value={value.meetingLink}
            onChange={(e) => set('meetingLink', e.target.value)}
            placeholder="https://zoom.us/j/..."
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Enrollment opens">
          <input type="date" className={inputClass} value={value.enrollmentStart} onChange={(e) => set('enrollmentStart', e.target.value)} />
        </Field>
        <Field label="Enrollment closes">
          <input type="date" className={inputClass} value={value.enrollmentEnd} onChange={(e) => set('enrollmentEnd', e.target.value)} />
        </Field>
      </div>

      <Field label="Batch description">
        <textarea
          rows={3}
          className={inputClass}
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Who this cohort is for, prerequisites, what it covers…"
        />
      </Field>
    </div>
  );
}
