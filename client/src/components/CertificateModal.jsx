import React, { useEffect } from 'react';
import { X, Download, ExternalLink, ShieldCheck, ZoomIn, Award } from 'lucide-react';

export default function CertificateModal({ isOpen, onClose, certificate }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !certificate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  {certificate.code || 'AUTHENTIC CREDENTIAL'}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">&bull;</span>
                <span className="text-xs text-emerald-400 font-mono hidden sm:inline flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 inline" /> Verified Microsoft Partner Credential
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white truncate font-heading mt-0.5">
                {certificate.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={certificate.image}
              download={`${certificate.code || 'microsoft-certificate'}.png`}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Download high-resolution certificate"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Image Display */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/40">
          <div className="relative max-w-4xl w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-white">
            <img
              src={certificate.image}
              alt={certificate.title}
              className="w-full h-auto object-contain max-h-[70vh] mx-auto select-none"
            />
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">{certificate.category || 'Specialized Track'}</span>
            <span>&bull;</span>
            <span className="text-indigo-400 font-mono">{certificate.level || 'Official Certification'}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 text-center sm:text-right">
            Conferred upon completion of American FutureTech Fellowship Benchmarks
          </div>
        </div>
      </div>
    </div>
  );
}
