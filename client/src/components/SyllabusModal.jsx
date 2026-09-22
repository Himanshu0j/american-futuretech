import React from 'react';
import { X, BookOpen, Clock, Download, ArrowRight, CheckCircle2, FileText } from 'lucide-react';

export default function SyllabusModal({ isOpen, onClose, course, onApplyNow }) {
  if (!isOpen || !course) return null;

  const isRose = course.cardTheme === 'rose' || course.title.toLowerCase().includes('cyber');

  const handleDownloadBrochure = () => {
    // Generate a downloadable syllabus text document as brochure simulation
    const content = `=====================================================
AMERICAN FUTURETECH - OFFICIAL SYLLABUS SPECIFICATION
Course: ${course.title}
Duration: ${course.duration || '6 Months'}
Accreditation: US Industry Standard Capstone & Placement Included
=====================================================

HIGHLIGHTS:
${course.highlights?.map((h) => `- ${h}`).join('\n')}

CURRICULUM BREAKDOWN:
${course.curriculum
  ?.map(
    (m) =>
      `MODULE ${m.moduleNumber}: ${m.moduleTitle} (${m.hours} Hours)\nTopics Covered:\n${m.topics
        ?.map((t) => `  * ${t}`)
        .join('\n')}`
  )
  .join('\n\n')}

ADMISSIONS & ENROLLMENT:
Visit https://americanfuturetech.com or contact info@americantechgloballlc.com
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${course.slug || 'syllabus'}_brochure.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50 relative text-left">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#d8ffd2] text-[#1a361d]">
              {course.badge || 'Official Curriculum'}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#40844e]" />
              {course.duration || '6 Months'} Intensive
            </span>
          </div>

          <h3 className="text-2xl font-display font-bold tracking-tight text-[#1a361d]">
            {course.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Official curriculum specification, practical lab hours, and capstone roadmap.
          </p>
        </div>

        {/* Scrollable Curriculum Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-left">
          {/* Key Highlights */}
          <div className="p-5 rounded-2xl bg-[#f7fdf8] border border-[#76ff8a]/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1a361d] mb-3">
              Track Highlights
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {course.highlights?.map((h, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-[#40844e] flex-shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Module List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Curriculum Modules
            </h4>

            {course.curriculum?.map((mod) => (
              <div
                key={mod.moduleNumber}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#1a361d]/30 transition-colors shadow-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1a361d]">
                    Module {mod.moduleNumber}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-medium">
                    {mod.hours}h Practical
                  </span>
                </div>
                <h5 className="text-sm font-semibold text-slate-900 mb-2">
                  {mod.moduleTitle}
                </h5>
                <div className="space-y-1">
                  {mod.topics?.map((topic, ti) => (
                    <div key={ti} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#40844e]" />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleDownloadBrochure}
            className="w-full sm:w-auto text-xs py-2.5 px-5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-[#40844e]" />
            <span>Download PDF Syllabus</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onApplyNow(course);
            }}
            className="w-full sm:w-auto text-xs py-2.5 px-7 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <span>Enroll in This Track</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
