import React, { useRef, useState } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { btnGhost } from './ui';

/**
 * One small "pick a file from this computer" control for the LMS authoring
 * screens. It uploads to the durable API endpoint and hands the stored URL back
 * to the parent form, so the same control works for a class handout, a lesson
 * PDF, a batch resource or a recorded class.
 */

const KINDS = {
  document: {
    endpoint: '/api/upload/document',
    field: 'document',
    accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.zip',
    label: 'Upload file',
    hint: 'PDF, DOC, PPT, XLS, CSV, TXT or ZIP · max 50 MB',
  },
  video: {
    endpoint: '/api/upload/video',
    field: 'video',
    accept: 'video/mp4,video/webm,video/ogg,video/x-m4v,.mp4,.webm,.ogg,.ogv,.m4v',
    label: 'Upload video',
    hint: 'MP4 / WebM / OGG · max 200 MB',
  },
  image: {
    endpoint: '/api/upload/image',
    field: 'image',
    accept: 'image/png,image/jpeg,image/jpg,image/webp,image/gif',
    label: 'Upload image',
    hint: 'PNG / JPG / WEBP / GIF · max 10 MB',
  },
};

export default function UploadField({
  kind = 'document',
  label,
  onUploaded,
  disabled = false,
  className = '',
  showHint = false,
}) {
  const config = KINDS[kind] || KINDS.document;
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedName, setUploadedName] = useState('');

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError('');
    setUploadedName('');

    const formData = new FormData();
    formData.append(config.field, file);

    try {
      const token = localStorage.getItem('aft_admin_token') || localStorage.getItem('token');
      const res = await axios.post(config.endpoint, formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || file.size;
          const percent = total ? Math.min(99, Math.round((progressEvent.loaded * 100) / total)) : 0;
          setProgress(percent);
        },
      });

      if (res.data?.success && res.data.url) {
        setUploadedName(res.data.originalName || file.name);
        setProgress(100);
        onUploaded?.(res.data, file);
      } else {
        setError(res.data?.message || 'The upload did not finish.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Check the file and try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept={config.accept}
        onChange={handleFile}
        className="hidden"
        aria-label={label || config.label}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={btnGhost}
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? `Uploading ${progress}%` : label || config.label}
        </button>
        {uploadedName && !uploading && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> {uploadedName} uploaded
          </span>
        )}
        {showHint && <span className="text-[10px] text-slate-400">{config.hint}</span>}
      </div>
      {uploading && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && (
        <p className="flex items-start gap-1 text-[10px] text-red-300">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
