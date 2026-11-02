import React from 'react';
import { Field, inputClass } from './ui';
import ImageUploadInput from '../components/ImageUploadInput';

/**
 * Create a student account and enroll it in the selected batch in one step.
 *
 * Leaving the password blank makes the server generate a policy-compliant
 * temporary password and return it exactly once; the plaintext is never stored.
 */
export const emptyEnrollment = () => ({
  name: '',
  email: '',
  phone: '',
  enrollmentNumber: '',
  password: '',
  avatar: '',
  enrollmentDate: new Date().toISOString().slice(0, 10),
  accessUntil: '',
  targetCareer: '',
  isActive: true,
});

export default function EnrollStudentForm({ value, onChange, credentials }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name" required>
          <input className={inputClass} value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Aarav Mehta" />
        </Field>
        <Field label="Email" required hint="Used as the student's login.">
          <input type="email" className={inputClass} value={value.email} onChange={(e) => set('email', e.target.value)} placeholder="student@example.com" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Phone">
          <input className={inputClass} value={value.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555 010 2030" />
        </Field>
        <Field label="Student ID" hint="Leave blank to generate AFT-######">
          <input className={inputClass} value={value.enrollmentNumber} onChange={(e) => set('enrollmentNumber', e.target.value)} placeholder="Auto" />
        </Field>
      </div>

      <div>
        <div className="mb-1.5 text-[11px] font-bold text-slate-300">Profile photo</div>
        <ImageUploadInput
          label="Student photo"
          value={value.avatar}
          onChange={(next) => set('avatar', next)}
          placeholder="/images/avatars/default-avatar.webp"
          previewSize="w-14 h-14"
          previewShape="circle"
          endpoint="/api/upload/image"
          showPresets={false}
        />
        <p className="mt-1 text-[10px] text-slate-400">
          Upload a JPG/PNG from your computer — this is the photo the student sees in the portal.
        </p>
      </div>

      <Field label="Temporary password" hint="Leave blank to generate a secure one — it is shown once after creation.">
        <input
          type="text"
          autoComplete="new-password"
          className={inputClass}
          value={value.password}
          onChange={(e) => set('password', e.target.value)}
          placeholder="Auto-generate"
        />
      </Field>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Enrollment date">
          <input type="date" className={inputClass} value={value.enrollmentDate} onChange={(e) => set('enrollmentDate', e.target.value)} />
        </Field>
        <Field label="Access expires" hint="Empty = no expiry">
          <input type="date" className={inputClass} value={value.accessUntil} onChange={(e) => set('accessUntil', e.target.value)} />
        </Field>
        <Field label="Target career">
          <input className={inputClass} value={value.targetCareer} onChange={(e) => set('targetCareer', e.target.value)} placeholder="Data Scientist" />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-[11px] text-slate-300">
        <input type="checkbox" checked={value.isActive} onChange={(e) => set('isActive', e.target.checked)} />
        Account active immediately
      </label>

      {credentials && (
        <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-3">
          <div className="text-[11px] font-bold text-blue-100">Credentials created — share these once</div>
          <div className="mt-2 grid sm:grid-cols-2 gap-2 text-[11px] text-blue-50">
            <div>
              <span className="text-blue-200/80">Email</span>
              <div className="font-mono break-all">{credentials.email}</div>
            </div>
            <div>
              <span className="text-blue-200/80">Temporary password</span>
              <div className="font-mono break-all">{credentials.temporaryPassword}</div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-blue-200/80">
            Only the password hash is stored. Copy this now — it cannot be shown again.
          </p>
        </div>
      )}
    </div>
  );
}
