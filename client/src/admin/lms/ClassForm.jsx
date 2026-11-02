import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Field, inputClass, btnGhost } from './ui';
import { TIMEZONES } from './BatchForm';
import UploadField from './UploadField';

const humanSize = (bytes) => {
  const size = Number(bytes) || 0;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
};

export const emptyClass = (batchId = '', timezone = 'EST (UTC-5)') => ({
  batchId,
  title: '',
  description: '',
  sessionNumber: '',
  instructor: '',
  classDate: '',
  startTime: '10:00',
  endTime: '11:00',
  timezone,
  deliveryMode: 'Live',
  meetingPlatform: 'Zoom',
  meetingUrl: '',
  recordingUrl: '',
  thumbnail: '',
  status: 'Scheduled',
  visibleFrom: '',
  attendanceRequired: false,
  notifyStudents: true,
  materials: [],
});

const dateInput = (value) => (value ? String(value).slice(0, 10) : '');
const timeInput = (value) => (value ? String(value).slice(0, 5) : '');

export const toClassDraft = (session = {}, batchId = '') => ({
  ...emptyClass(batchId, session.timezone),
  title: session.title || '',
  description: session.description || '',
  sessionNumber: session.sessionNumber || '',
  instructor: session.instructor || '',
  classDate: dateInput(session.classDate),
  startTime: timeInput(session.startTime) || '10:00',
  endTime: timeInput(session.endTime) || '11:00',
  deliveryMode: session.deliveryMode || 'Live',
  meetingPlatform: session.meetingPlatform || 'Zoom',
  meetingUrl: session.meetingUrl || '',
  recordingUrl: session.recordingUrl || '',
  thumbnail: session.thumbnail || '',
  status: session.status || 'Scheduled',
  visibleFrom: dateInput(session.visibleFrom),
  attendanceRequired: Boolean(session.attendanceRequired),
  notifyStudents: session.notifyStudents !== false,
  materials: Array.isArray(session.materials) ? session.materials : [],
});

export default function ClassForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  const updateMaterial = (index, key, next) => {
    const materials = value.materials.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [key]: next } : row
    );
    set('materials', materials);
  };

  const addMaterial = () => set('materials', [...value.materials, { title: '', url: '', fileType: 'PDF', fileSize: '' }]);
  const removeMaterial = (index) => set('materials', value.materials.filter((_, rowIndex) => rowIndex !== index));

  return (
    <div className="space-y-4">
      <Field label="Class title" required>
        <input className={inputClass} value={value.title} onChange={(e) => set('title', e.target.value)} placeholder="Model evaluation & metrics" />
      </Field>

      <Field label="Description">
        <textarea
          rows={3}
          className={inputClass}
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="What this session covers…"
        />
      </Field>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Session number">
          <input
            type="number"
            min="1"
            className={inputClass}
            value={value.sessionNumber}
            onChange={(e) => set('sessionNumber', e.target.value)}
            placeholder="Auto"
          />
        </Field>
        <Field label="Instructor">
          <input className={inputClass} value={value.instructor} onChange={(e) => set('instructor', e.target.value)} placeholder="Defaults to batch instructor" />
        </Field>
        <Field label="Delivery">
          <select className={inputClass} value={value.deliveryMode} onChange={(e) => set('deliveryMode', e.target.value)}>
            {['Live', 'Recorded', 'Hybrid'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <Field label="Date" required>
          <input type="date" className={inputClass} value={value.classDate} onChange={(e) => set('classDate', e.target.value)} />
        </Field>
        <Field label="Start">
          <input type="time" className={inputClass} value={value.startTime} onChange={(e) => set('startTime', e.target.value)} />
        </Field>
        <Field label="End">
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
        <Field label="Platform">
          <select className={inputClass} value={value.meetingPlatform} onChange={(e) => set('meetingPlatform', e.target.value)}>
            {['Zoom', 'Google Meet', 'Microsoft Teams', 'YouTube Live', 'Other', 'None'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field
          label="Meeting link"
          hint="Released only during the live window. Jitsi and YouTube Live play inside the classroom; Zoom, Meet and Teams open in their own window."
        >
          <input
            className={inputClass}
            value={value.meetingUrl}
            onChange={(e) => set('meetingUrl', e.target.value)}
            placeholder="https://zoom.us/j/..."
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Recording link"
          hint="Shown after the class ends and plays inside the student portal — YouTube, Vimeo, Loom, Google Drive and MP4 links all embed here."
        >
          <input
            className={inputClass}
            value={value.recordingUrl}
            onChange={(e) => set('recordingUrl', e.target.value)}
            placeholder="https://…/recording.mp4"
          />
          <div className="mt-2">
            <UploadField
              kind="video"
              label="Upload recording from computer"
              showHint
              onUploaded={(file) => set('recordingUrl', file.url)}
            />
          </div>
        </Field>
        <Field label="Thumbnail URL">
          <input className={inputClass} value={value.thumbnail} onChange={(e) => set('thumbnail', e.target.value)} placeholder="/uploads/…" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Status">
          <select className={inputClass} value={value.status} onChange={(e) => set('status', e.target.value)}>
            {['Draft', 'Scheduled', 'Published', 'Completed', 'Cancelled'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Visible from" hint="Empty = immediately.">
          <input type="date" className={inputClass} value={value.visibleFrom} onChange={(e) => set('visibleFrom', e.target.value)} />
        </Field>
        <div className="flex flex-col justify-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={value.attendanceRequired}
              onChange={(e) => set('attendanceRequired', e.target.checked)}
            />
            Attendance required
          </label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={value.notifyStudents}
              onChange={(e) => set('notifyStudents', e.target.checked)}
            />
            Notify students
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <div className="text-[11px] font-bold text-slate-200">Learning material</div>
            <div className="text-[10px] text-slate-400">PDF, slides, datasets or external links.</div>
          </div>
          <button type="button" className={btnGhost} onClick={addMaterial}>
            <Plus className="w-3.5 h-3.5" /> Attach
          </button>
        </div>

        {value.materials.length === 0 ? (
          <div className="text-[10px] text-slate-500 py-2">Nothing attached yet.</div>
        ) : (
          <div className="space-y-2">
            {value.materials.map((row, index) => (
              <div key={index} className="space-y-2 rounded-lg border border-white/[0.06] p-2">
                <div className="grid sm:grid-cols-[1fr_1.4fr_auto] gap-2">
                  <input
                    className={inputClass}
                    value={row.title}
                    onChange={(e) => updateMaterial(index, 'title', e.target.value)}
                    placeholder="Title"
                    aria-label={`Material ${index + 1} title`}
                  />
                  <input
                    className={inputClass}
                    value={row.url}
                    onChange={(e) => updateMaterial(index, 'url', e.target.value)}
                    placeholder="https://… or upload a file"
                    aria-label={`Material ${index + 1} link`}
                  />
                  <button
                    type="button"
                    onClick={() => removeMaterial(index)}
                    className="p-2 rounded-lg bg-white/[0.06] hover:bg-red-500/20 text-slate-300"
                    aria-label={`Remove material ${index + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <UploadField
                  kind="document"
                  label={`Upload PDF / slides for material ${index + 1}`}
                  onUploaded={(file) => {
                    updateMaterial(index, 'url', file.url);
                    if (!row.title?.trim()) updateMaterial(index, 'title', file.originalName || 'Learning material');
                    updateMaterial(index, 'fileType', file.fileType || 'PDF');
                    updateMaterial(index, 'fileSize', humanSize(file.size));
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
