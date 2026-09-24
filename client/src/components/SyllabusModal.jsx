import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, BookOpen, Clock, Download, ArrowRight, CheckCircle2, FileText } from 'lucide-react';

export default function SyllabusModal({ isOpen, onClose, course, onApplyNow }) {
  // Modules and lessons live in their own collection — that is what the course
  // page renders. The embedded copy on the course is only a mirror, so read the
  // real curriculum here; otherwise the syllabus looked empty for every course
  // the admin had edited.
  const [modules, setModules] = useState([]);

  useEffect(() => {
    setModules(Array.isArray(course?.curriculum) ? course.curriculum : []);
    if (!isOpen || !course?._id) return undefined;

    let cancelled = false;
    axios
      .get(`/api/curriculum/courses/${course._id}`)
      .then((res) => {
        const live = res.data?.modules;
        if (cancelled || !Array.isArray(live)) return;
        setModules(
          live.map((m, idx) => ({
            moduleNumber: m.moduleNumber || idx + 1,
            moduleTitle: m.title || `Module ${idx + 1}`,
            hours: m.durationHours || 20,
            topics: (m.lessons || []).map((l) => l.title).filter(Boolean),
          }))
        );
      })
      .catch(() => {
        /* keep the embedded mirror */
      });

    return () => { cancelled = true; };
  }, [isOpen, course?._id]);

  if (!isOpen || !course) return null;

  const isRose = course.cardTheme === 'rose' || course.title.toLowerCase().includes('cyber');

  // The public syllabus download was removed at the client's request: the
  // curriculum is reference material on screen only, and there is no public
  // file endpoint that hands out the course documents.

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-6 sm:p-6 border-b border-slate-200 bg-slate-50/50 relative text-left">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFE6D6] text-[#0B1220]">
              {course.badge || 'Official Curriculum'}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#047857]" />
              {course.duration || '6 Months'} Intensive
            </span>
          </div>

          <h3 className="text-2xl font-display font-bold tracking-tight text-[#0B1220]">
            {course.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Official curriculum specification, practical lab hours, and capstone roadmap.
          </p>
        </div>

        {/* Scrollable Curriculum Content */}
        <div className="p-6 sm:p-6 overflow-y-auto space-y-4 flex-1 text-left">
          {/* Key Highlights */}
          <div className="p-5 rounded-2xl bg-[#F5F7FF] border border-[#E5C275]/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1220] mb-3">
              Track Highlights
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {course.highlights?.map((h, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-[#047857] flex-shrink-0" />
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

            {modules.map((mod) => (
              <div
                key={mod.moduleNumber}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#0B1220]/30 transition-colors shadow-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#0B1220]">
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
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
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
          <span className="text-[11px] text-slate-500 font-mono">
            Curriculum shown for reference — contact admissions for the official document.
          </span>

          <button
            onClick={() => {
              onClose();
              onApplyNow(course);
            }}
            className="w-full sm:w-auto text-xs py-2.5 px-7 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <span>Register Now — $499 / Program</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
