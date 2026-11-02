import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, Video, FileText, Eye, Upload, X, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { parseVideoUrl } from '../../utils/videoEmbed';
import { Modal, Field, inputClass, btnPrimary, btnGhost, btnIcon, ErrorNote, Badge } from './ui';
import UploadField from './UploadField';

// Kept in step with server/routes/uploadRoutes.js (VIDEO_MAX_BYTES).
const VIDEO_MAX_MB = 200;
const VIDEO_ACCEPT = '.mp4,.webm,.ogg,.ogv,.m4v';
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'ogv', 'm4v'];

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
  const [videoUpload, setVideoUpload] = useState({ uploading: false, progress: 0, error: '' });
  const videoFileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    setVideoUpload({ uploading: false, progress: 0, error: '' });
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

  /**
   * Upload the video file itself. The server stores it in MongoDB GridFS, so it
   * survives a deploy (the app directory is replaced on every Hostinger push);
   * the returned `/api/upload/video/<id>.mp4` URL is what the lesson keeps.
   */
  const handleVideoFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!VIDEO_EXTENSIONS.includes(ext)) {
      setVideoUpload({ uploading: false, progress: 0, error: 'Choose an MP4, WebM, OGG or M4V video file.' });
      event.target.value = '';
      return;
    }
    if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
      setVideoUpload({
        uploading: false,
        progress: 0,
        error: `That file is ${Math.round(file.size / (1024 * 1024))} MB. The limit is ${VIDEO_MAX_MB} MB — compress it or use a YouTube/Vimeo link.`,
      });
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    setVideoUpload({ uploading: true, progress: 0, error: '' });

    try {
      const token = localStorage.getItem('aft_admin_token') || localStorage.getItem('token');
      const res = await axios.post('/api/upload/video', formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || file.size;
          const percent = total ? Math.min(99, Math.round((progressEvent.loaded * 100) / total)) : 0;
          setVideoUpload((prev) => ({ ...prev, progress: percent }));
        },
      });

      if (res.data?.success && res.data.url) {
        set('videoUrl', res.data.url);
        setVideoUpload({ uploading: false, progress: 100, error: '' });
      } else {
        setVideoUpload({ uploading: false, progress: 0, error: res.data?.message || 'The upload did not finish.' });
      }
    } catch (err) {
      setVideoUpload({
        uploading: false,
        progress: 0,
        error: err.response?.data?.message || 'Upload failed. Check the file and try again.',
      });
    } finally {
      if (videoFileRef.current) videoFileRef.current.value = '';
    }
  };

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
        <div className="rounded-xl border border-white/[0.08] bg-[rgb(var(--tw-ink-800)/60%)] p-4 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-200">
            <Video className="w-3.5 h-3.5 text-blue-300" /> Video lesson
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
            {video.isEmbed && draft.videoUrl && (
              <Badge tone="slate">
                {video.provider === 'Uploaded' ? 'stored on this server' : `stored as ${video.url}`}
              </Badge>
            )}
          </div>

          {video.warning && <p className="text-[10px] text-red-200">{video.warning}</p>}

          {/* Direct file upload — no YouTube/Vimeo account needed for a recorded
              lecture. The file goes to MongoDB GridFS through the API, so it is
              still there after the next deploy (a deploy replaces this app's
              directory, so a disk-only upload would vanish). */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={videoFileRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/x-m4v,.mp4,.webm,.ogg,.ogv,.m4v"
                onChange={handleVideoFile}
                className="hidden"
              />
              <button
                type="button"
                className={btnGhost}
                onClick={() => videoFileRef.current?.click()}
                disabled={videoUpload.uploading || saving}
              >
                <Upload className="w-3.5 h-3.5" />
                {videoUpload.uploading
                  ? `Uploading ${videoUpload.progress}%`
                  : video.provider === 'Uploaded' && draft.videoUrl
                    ? 'Replace video file'
                    : 'Upload video file'}
              </button>
              <span className="text-[10px] text-slate-400">
                MP4 / WebM / OGG · max {VIDEO_MAX_MB} MB · stored durably, survives deploys
              </span>
              {draft.videoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    set('videoUrl', '');
                    setVideoUpload({ uploading: false, progress: 0, error: '' });
                  }}
                  disabled={videoUpload.uploading}
                  className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-red-300 hover:text-red-200"
                >
                  <X className="w-3 h-3" /> Remove video
                </button>
              )}
            </div>

            {videoUpload.uploading && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all"
                  style={{ width: `${videoUpload.progress}%` }}
                />
              </div>
            )}

            {videoUpload.error && (
              <p className="flex items-start gap-1 text-[10px] text-red-200">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                {videoUpload.error}
              </p>
            )}
          </div>

          <Field label="Displayed duration" hint="Shown next to the lesson in the curriculum list.">
            <input
              className={inputClass}
              value={draft.videoDuration}
              onChange={(e) => set('videoDuration', e.target.value)}
              placeholder="45m"
            />
          </Field>

          {video.provider === 'Uploaded' && draft.videoUrl ? (
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video">
              <video
                key={video.url}
                src={video.url}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              >
                This video could not be previewed.
              </video>
            </div>
          ) : video.isEmbed && draft.videoUrl ? (
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

        <Field label="Lesson notes" hint="Blank lines start a new paragraph. Markdown works too: ### headings, **bold**, - bullets, 1. lists, [links](https://…).">
          <textarea
            className={inputClass}
            rows={6}
            value={draft.textContent}
            onChange={(e) => set('textContent', e.target.value)}
            placeholder="Write the notes the student reads alongside the video…"
          />
        </Field>

        <Field label="Reading / PDF" hint="Upload a PDF or slides file, or paste an https link.">
          <input
            className={inputClass}
            value={draft.pdfUrl}
            onChange={(e) => set('pdfUrl', e.target.value)}
            placeholder="https://…/slides.pdf or upload below"
          />
          <div className="mt-2">
            <UploadField
              kind="document"
              label="Upload PDF / slides from computer"
              showHint
              onUploaded={(file) => set('pdfUrl', file.url)}
            />
          </div>
        </Field>

        {/* ── Resources ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/[0.08] bg-[rgb(var(--tw-ink-800)/60%)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-200">
              <FileText className="w-3.5 h-3.5 text-blue-300" /> Lab resources
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
                <div key={index} className="space-y-2 rounded-lg border border-white/[0.06] p-2">
                  <div className="grid grid-cols-12 gap-2 items-center">
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
                      className={`${btnIcon} col-span-1 justify-self-end text-red-300`}
                      aria-label={`Remove resource ${index + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <UploadField
                    kind="document"
                    label={`Upload file for resource ${index + 1}`}
                    onUploaded={(file) => {
                      updateResource(index, 'url', file.url);
                      if (!res.title?.trim()) {
                        updateResource(index, 'title', file.originalName || 'Resource');
                      }
                      updateResource(index, 'fileType', file.fileType || 'PDF');
                      const size = Number(file.size) || 0;
                      updateResource(
                        index,
                        'fileSize',
                        size >= 1024 * 1024
                          ? `${(size / (1024 * 1024)).toFixed(1)} MB`
                          : `${Math.max(1, Math.round(size / 1024))} KB`,
                      );
                    }}
                  />
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
              className="rounded border-white/20 bg-[rgb(var(--tw-ink-800))]"
            />
            Published to students
          </label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={draft.isPreview}
              onChange={(e) => set('isPreview', e.target.checked)}
              className="rounded border-white/20 bg-[rgb(var(--tw-ink-800))]"
            />
            Free preview (visible before enrollment)
          </label>
        </div>
      </div>
    </Modal>
  );
}
