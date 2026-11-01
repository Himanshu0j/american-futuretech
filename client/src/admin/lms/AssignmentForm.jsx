import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Field, inputClass, btnGhost, btnIcon } from './ui';

export const emptyAssignment = () => ({
  title: '',
  description: '',
  instructions: '',
  dueAt: '',
  totalMarks: 100,
  allowLateSubmission: true,
  status: 'Published',
  attachments: [],
});

const toDateTimeInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const toAssignmentDraft = (assignment = {}) => ({
  ...emptyAssignment(),
  title: assignment.title || '',
  description: assignment.description || '',
  instructions: assignment.instructions || '',
  dueAt: toDateTimeInput(assignment.dueAt),
  totalMarks: assignment.totalMarks ?? 100,
  allowLateSubmission: assignment.allowLateSubmission !== false,
  status: assignment.status || 'Published',
  attachments: Array.isArray(assignment.attachments)
    ? assignment.attachments.map((row) => ({ title: row.title || '', url: row.url || '', fileType: row.fileType || 'PDF' }))
    : [],
});

export default function AssignmentForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  const updateAttachment = (index, key, next) =>
    set('attachments', value.attachments.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: next } : row)));

  return (
    <div className="space-y-4">
      <Field label="Assignment title" required>
        <input className={inputClass} value={value.title} onChange={(e) => set('title', e.target.value)} placeholder="Build a churn prediction model" />
      </Field>

      <Field label="What students must do">
        <textarea rows={3} className={inputClass} value={value.description} onChange={(e) => set('description', e.target.value)} />
      </Field>

      <Field label="Instructions & grading rubric">
        <textarea rows={3} className={inputClass} value={value.instructions} onChange={(e) => set('instructions', e.target.value)} placeholder="Submit a notebook link. 40 marks for modelling, 30 for evaluation, 30 for the write-up." />
      </Field>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Due date">
          <input type="datetime-local" className={inputClass} value={value.dueAt} onChange={(e) => set('dueAt', e.target.value)} />
        </Field>
        <Field label="Total marks">
          <input type="number" min="0" className={inputClass} value={value.totalMarks} onChange={(e) => set('totalMarks', e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={value.status} onChange={(e) => set('status', e.target.value)}>
            {['Draft', 'Published', 'Closed'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-[11px] text-slate-300">
        <input
          type="checkbox"
          checked={value.allowLateSubmission}
          onChange={(e) => set('allowLateSubmission', e.target.checked)}
        />
        Accept late submissions (flagged as late)
      </label>

      <div className="rounded-xl border border-white/[0.08] p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <div className="text-[11px] font-bold text-slate-200">Reference files</div>
            <div className="text-[10px] text-slate-400">Datasets, templates or a brief link.</div>
          </div>
          <button
            type="button"
            className={btnGhost}
            onClick={() => set('attachments', [...value.attachments, { title: '', url: '', fileType: 'PDF' }])}
          >
            <Plus className="w-3.5 h-3.5" /> Attach
          </button>
        </div>

        {value.attachments.length === 0 ? (
          <div className="text-[10px] text-slate-500 py-1">Nothing attached.</div>
        ) : (
          <div className="space-y-2">
            {value.attachments.map((row, index) => (
              <div key={index} className="grid sm:grid-cols-[1fr_1.4fr_auto] gap-2">
                <input
                  className={inputClass}
                  value={row.title}
                  onChange={(e) => updateAttachment(index, 'title', e.target.value)}
                  placeholder="Title"
                  aria-label={`Attachment ${index + 1} title`}
                />
                <input
                  className={inputClass}
                  value={row.url}
                  onChange={(e) => updateAttachment(index, 'url', e.target.value)}
                  placeholder="https://…"
                  aria-label={`Attachment ${index + 1} link`}
                />
                <button
                  type="button"
                  className={btnIcon}
                  onClick={() => set('attachments', value.attachments.filter((_, rowIndex) => rowIndex !== index))}
                  aria-label={`Remove attachment ${index + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
