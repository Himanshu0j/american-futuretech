import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Save, Video, FileText, Eye } from 'lucide-react';
import api from '../../lib/api';
import { parseVideoUrl } from '../../utils/videoEmbed';
import { Modal, Field, inputClass, btnPrimary, btnGhost, btnIcon, ErrorNote, Badge } from './ui';

const CONTENT_TYPES = [
  { id: 'video', label: 'Video lesson' },
  { id: 'text', label: 'Written / notes' },
  { id: 'pdf', label: 'PDF / reading' },
  { id: 'interactive', label: 'Interactive lab' },
];

const emptyResource = () => ({ title: '', url: '', fileType: 'PDF', fileSize: '' });

const emptyDraft = (defaults = {}) => ({
  title: '',
  contentType: 'video',
  videoUrl: '',
  videoDuration: defaults.defaultLessonDuration || '45m',
  description: '',
  textContent: '',
  pdfUrl: '',
  resources: [],
  isPreview: false,
  isPublished: true,
});

/**
 * Author one lesson: video link (auto-converted to the embed form the player
 * needs), notes, a PDF link, and downloadable resources.
 */
export default function LessonEditor({ open, lesson, courseId, moduleId, defaults = {}, onClose, onSaved }) {
  const isEdit = Boolean(lesson?._id);
  const [draft, setDraft] = useState(emptyDraft(defaults));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (isEdit) {
      setDraft({
        title: lesson.title || '',
        contentType: lesson.contentType || 'video',
        videoUrl: lesson.videoUrl || '',
        videoDuration: lesson.videoDuration || defaults.defaultLessonDuration || '45m',
        description: lesson.description || '',
        textContent: lesson.textContent || '',
        pdfUrl: lesson.pdfUrl || '',
        resources: Array.isArray(lesson.resources) ? lesson.resources.map((r) => ({ ...emptyResource(), ...r })) : [],
        isPreview: Boolean(lesson.isPreview),
        isPublished: lesson.isPublished !== false,
      });
    } else {
      setDraft(emptyDraft(defaults));
    }
  }, [open, lesson, isEdit, defaults]);

  const video = useMemo(() => parseVideoUrl(draft.videoUrl), [draft.videoUrl]);

  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const updateResource = (index, key, value) =>
    setDraft((prev) => {
      const resources = prev.resources.map((res, i) => (i === index ? { ...res, [key]: value } : res));
      return { ...prev, resources };
    });

  const addResource = () => setDraft((prev) => ({ ...prev, resources: [...prev.resources, emptyResource()] }));

  const removeResource = (index) =>
    setDraft((prev) => ({ ...prev, resources: prev.resources.filter((_, i) => i !== index) }));

  const handleSave = async () => {
    if (!draft.title.trim()) {
      setError('A lesson title is required.');
      return;
    }
    if (video.provider === 'Invalid') {
      setError(video.warning);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        course: courseId,
        module: moduleId,
        title: draft.title.trim(),
        contentType: draft.contentType,
        videoUrl: draft.videoUrl.trim() ? video.url : '',
        videoDuration: draft.videoDuration,
        description: draft.description,
        textContent: draft.textContent,
        pdfUrl: draft.pdfUrl.trim(),
        // Rows the admin left half-filled are dropped server-side; sending them
        // keeps the form honest about what will be kept.
        resources: draft.resources.filter((res) => res.title?.trim() && res.url?.trim()),
        isPreview: draft.isPreview,
        isPublished: draft.isPublished,
      };

      const res = isEdit
        ? await api.put(`/curriculum/lessons/${lesson._id}`, payload)
        : await api.post('/curriculum/lessons', payload);

      if (res.data?.success) {
        onSaved?.(res.data.lesson);
        onClose?.();
      } else {
        setError(res.data?.message || 'Could not save the lesson.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not save the lesson.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      wide
      title={isEdit ? 'Edit lesson' : 'New lesson'}
      subtitle="Video, notes and downloadable resources all render on the student's lesson page."
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={handleSave} disabled={saving}>
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : isEdit ? 'Save lesson' : 'Create lesson'}
          </button>
        </>
      }
    >
      <ErrorNote>{error}</ErrorNote>

      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Lesson title" required>
            <input
              className={inputClass}
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Setting up your analysis environment"
            />
          </Field>
          <Field label="Lesson type">
            <select className={inputClass} value={draft.contentType} onChange={(e) => set('contentType', e.target.value)}>
              {CONTENT_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* ── Video ─────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/[0.08] bg-[#111A2E]/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-200">
            <Video className="w-3.5 h-3.5 text-indigo-300" /> Video lesson
          </div>

          <Field
            label="Video link"
            hint="Paste a YouTube or Vimeo link — it is converted to the embed form automatically. Other https links work only if that site allows embedding."
          >
            <input
              className={inputClass}
              value={draft.videoUrl}
              onChange={(e) => set('videoUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…  or  https://vimeo.com/…"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={video.provider === 'Invalid' ? 'rose' : video.provider === 'External' ? 'amber' : 'emerald'}>
              {video.provider === 'None' ? 'No video yet' : video.provider}
            </Badge>
            {video.isEmbed && draft.videoUrl && <Badge tone="slate">stored as {video.url}</Badge>}
          </div>

          {video.warning && <p className="text-[10px] text-amber-200">{video.warning}</p>}

          <Field label="Displayed duration" hint="Shown next to the lesson in the curriculum list.">
            <input
              className={inputClass}
              value={draft.videoDuration}
              onChange={(e) => set('videoDuration', e.target.value)}
              placeholder="45m"
            />
          </Field>

          {video.isEmbed && draft.videoUrl ? (
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video">
              <iframe
                src={video.url}
                title="Video preview"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/40 aspect-video flex flex-col items-center justify-center text-slate-400">
              <Eye className="w-5 h-5 mb-1" />
              <span className="text-[10px]">Paste a link to preview the player</span>
            </div>
          )}
        </div>

        <Field label="Short description" hint="Appears above the notes as the lesson summary.">
          <textarea
            className={inputClass}
            rows={2}
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What this lesson covers"
          />
        </Field>

        <Field label="Lesson notes" hint="Blank lines start a new paragraph in the student's player.">
          <textarea
            className={inputClass}
            rows={6}
            value={draft.textContent}
            onChange={(e) => set('textContent', e.target.value)}
            placeholder="Write the notes the student reads alongside the video…"
          />
        </Field>

        <Field label="Reading / PDF link" hint="Optional external link to a slide deck or reading.">
          <input
            className={inputClass}
            value={draft.pdfUrl}
            onChange={(e) => set('pdfUrl', e.target.value)}
            placeholder="https://…/slides.pdf"
          />
        </Field>

        {/* ── Resources ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/[0.08] bg-[#111A2E]/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-200">
              <FileText className="w-3.5 h-3.5 text-indigo-300" /> Lab resources
            </div>
            <button type="button" className={btnGhost} onClick={addResource}>
              <Plus className="w-3.5 h-3.5" /> Add resource
            </button>
          </div>

          {draft.resources.length === 0 ? (
            <p className="text-[10px] text-slate-400">
              No resources yet. The student sees an empty state instead of placeholder files.
            </p>
          ) : (
            <div className="space-y-2">
              {draft.resources.map((res, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className={`${inputClass} col-span-5`}
                    value={res.title}
                    onChange={(e) => updateResource(index, 'title', e.target.value)}
                    placeholder="Resource title"
                    aria-label={`Resource ${index + 1} title`}
                  />
                  <input
                    className={`${inputClass} col-span-4`}
                    value={res.url}
                    onChange={(e) => updateResource(index, 'url', e.target.value)}
                    placeholder="https://…"
                    aria-label={`Resource ${index + 1} URL`}
                  />
                  <input
                    className={`${inputClass} col-span-1`}
                    value={res.fileType}
                    onChange={(e) => updateResource(index, 'fileType', e.target.value)}
                    placeholder="PDF"
                    aria-label={`Resource ${index + 1} file type`}
                  />
                  <input
                    className={`${inputClass} col-span-1`}
                    value={res.fileSize}
                    onChange={(e) => updateResource(index, 'fileSize', e.target.value)}
                    placeholder="2 MB"
                    aria-label={`Resource ${index + 1} file size`}
                  />
                  <button
                    type="button"
                    onClick={() => removeResource(index)}
                    className={`${btnIcon} col-span-1 justify-self-end text-rose-300`}
                    aria-label={`Remove resource ${index + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={draft.isPublished}
              onChange={(e) => set('isPublished', e.target.checked)}
              className="rounded border-white/20 bg-[#111A2E]"
            />
            Published to students
          </label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={draft.isPreview}
              onChange={(e) => set('isPreview', e.target.checked)}
              className="rounded border-white/20 bg-[#111A2E]"
            />
            Free preview (visible before enrollment)
          </label>
        </div>
      </div>
    </Modal>
  );
}
