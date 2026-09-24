import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw, X, Link as LinkIcon, Sparkles } from 'lucide-react';

const COMMON_PRESETS = [
  { name: 'Google Logo', url: '/images/companies/google.svg' },
  { name: 'Microsoft Logo', url: '/images/companies/microsoft.svg' },
  { name: 'AWS Logo', url: '/images/companies/aws.svg' },
  { name: 'IBM Logo', url: '/images/companies/ibm.svg' },
  { name: 'Intel Logo', url: '/images/companies/intel.svg' },
  { name: 'Meta Logo', url: '/images/companies/meta.svg' },
  { name: 'Infosys Logo', url: '/images/companies/infosys.svg' },
  { name: 'Accenture Logo', url: '/images/companies/accenture.svg' },
  { name: 'US Crest Gold Seal', url: '/images/gold-seal-medal.webp' },
  // Points at the crest that actually exists in /public — the previous path
  // (american-diploma-crest.svg) was never shipped, so picking this preset
  // produced a broken image on the public page.
  { name: 'Diploma Emblem', url: '/images/logo-crest.webp' },
  { name: 'Cockpit Lab', url: '/images/floating-laptop-code.webp' },
];

export default function ImageUploadInput({
  label = 'Asset Image / PNG',
  value = '',
  onChange,
  placeholder = 'Enter image URL or upload from local file...',
  className = '',
  previewSize = 'w-16 h-16',
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post('/api/upload', formData, { headers });
      if (res.data.success && res.data.url) {
        onChange(res.data.url);
        setPreviewError(false);
      } else {
        setUploadError(res.data.message || 'Upload failed.');
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadError(err.response?.data?.message || 'Server error during upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 text-left font-sans ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>{label}</span>
          </label>
          {uploading && (
            <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Uploading asset...</span>
            </span>
          )}
        </div>
      )}

      {/* Main Row: Thumbnail Preview + URL Input + Upload Button */}
      <div className="flex items-center gap-3">
        {/* Live Thumbnail Preview */}
        <div
          className={`${previewSize} rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group`}
        >
          {value && !previewError ? (
            <img
              src={value}
              alt="Asset Preview"
              className="w-full h-full object-contain rounded-lg"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-600">
              <ImageIcon className="w-5 h-5" />
            </div>
          )}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setPreviewError(false);
              }}
              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity cursor-pointer"
              title="Clear Image"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* URL Input & Upload Action */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  setPreviewError(false);
                }}
                placeholder={placeholder}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
              className="hidden"
            />

            {/* Upload Button */}
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Upload PNG, JPG, or SVG from computer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading...' : 'Upload Asset'}</span>
            </button>
          </div>

          {/* Quick Presets / Authentic Asset Selector */}
          <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
            <span className="font-mono text-slate-400 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-indigo-400" /> Presets:
            </span>
            {COMMON_PRESETS.slice(0, 6).map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  setPreviewError(false);
                }}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-mono ${
                  value === preset.url
                    ? 'bg-indigo-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1 pt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
