import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Save,
  Pencil,
  Copy,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Video,
  FileText,
  ListChecks,
  EyeOff,
  Eye,
  Layers,
} from 'lucide-react';
import api from '../../lib/api';
import LessonEditor from './LessonEditor';
import QuizEditor from './QuizEditor';
import {
  PageHeader,
  Card,
  inputClass,
  btnPrimary,
  btnGhost,
  btnDanger,
  btnIcon,
  Badge,
  EmptyState,
  Loading,
  ErrorNote,
} from './ui';

const contentTypeLabel = {
  video: 'Video',
  text: 'Notes',
  pdf: 'PDF',
  interactive: 'Interactive',
};

/**
 * Author a course's curriculum: modules, lessons (video link, notes, PDF,
 * resources) and the per-module quiz.
 *
 * This is the authoritative lesson editor. Saving a course in the Courses CMS
 * cannot destroy a lesson authored here — see server/utils/curriculumSync.js.
 */
export default function CurriculumBuilder() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [curriculum, setCurriculum] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [lmsDefaults, setLmsDefaults] = useState({});
  const [dragging, setDragging] = useState(null);

  const [lessonEditor, setLessonEditor] = useState({ open: false, lesson: null, moduleId: '' });
  const [quizEditor, setQuizEditor] = useState({ open: false, quiz: null, moduleId: '' });

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // /courses/admin/all also returns unpublished courses; a staff account
        // without COURSES_VIEW falls back to the published list.
        let list = [];
        try {
          const res = await api.get('/courses/admin/all');
          list = res.data?.courses || [];
        } catch {
          const res = await api.get('/courses');
          list = res.data?.courses || [];
        }
        setCourses(list);
        if (list.length) setCourseId((prev) => prev || list[0]._id);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load courses.');
      }

      try {
        const res = await api.get('/admin/lms/settings');
        if (res.data?.success) setLmsDefaults(res.data.settings || {});
      } catch {
        /* defaults are optional */
      }
    })();
  }, []);

  const loadCurriculum = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/curriculum/admin/courses/${id}`);
      if (res.data?.success) {
        setCurriculum({ course: res.data.course, counts: res.data.counts });
        setModules(
          (res.data.modules || []).map((mod) => ({
            ...mod,
            lessons: mod.lessons || [],
            quiz: mod.quiz || null,
          }))
        );
      } else {
        setError(res.data?.message || 'Could not load the curriculum.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load the curriculum.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurriculum(courseId);
  }, [courseId, loadCurriculum]);

  const flash = (message) => {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 3000);
  };

  const totalLessons = useMemo(
    () => modules.reduce((sum, mod) => sum + (mod.lessons?.length || 0), 0),
    [modules]
  );

  // ── Modules ───────────────────────────────────────────────────────────────
  const addModule = async () => {
    if (!courseId) return;
    try {
      const nextNumber = modules.length + 1;
      const res = await api.post('/curriculum/modules', {
        course: courseId,
        moduleNumber: nextNumber,
        title: `Module ${nextNumber}`,
        durationHours: lmsDefaults.defaultModuleHours || 20,
      });
      if (res.data?.success) await loadCurriculum(courseId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add the module.');
    }
  };

  const patchModuleLocal = (moduleId, patch) =>
    setModules((prev) => prev.map((mod) => (String(mod._id) === String(moduleId) ? { ...mod, ...patch } : mod)));

  const saveModule = async (mod) => {
    try {
      await api.put(`/curriculum/modules/${mod._id}`, {
        title: mod.title,
        durationHours: Number(mod.durationHours) || 20,
        description: mod.description || '',
        isPublished: mod.isPublished !== false,
      });
      flash('Module saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the module.');
    }
  };

  const deleteModule = async (mod) => {
    const hasContent = (mod.lessons?.length || 0) > 0 || Boolean(mod.quiz);
    const warning = hasContent
      ? `"${mod.title}" holds ${mod.lessons?.length || 0} lesson(s) and its quiz. Deleting it removes them permanently. Continue?`
      : `Delete "${mod.title}"?`;
    if (!window.confirm(warning)) return;
    try {
      await api.delete(`/curriculum/modules/${mod._id}`);
      await loadCurriculum(courseId);
      flash('Module deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the module.');
    }
  };

  // ── Ordering ──────────────────────────────────────────────────────────────
  const persistOrder = async (list) => {
    try {
      await api.put(`/curriculum/courses/${courseId}/reorder`, {
        modules: list.map((mod) => ({ id: mod._id })),
        lessons: list.flatMap((mod) => mod.lessons.map((lesson) => ({ id: lesson._id }))),
      });
      flash('New order saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the new order.');
      await loadCurriculum(courseId);
    }
  };

  const moveModule = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const next = [...modules];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setModules(next);
    await persistOrder(next);
  };

  const moveLesson = async (targetModuleId, targetIndex) => {
    if (!dragging) return;
    const next = modules.map((mod) => ({ ...mod, lessons: [...(mod.lessons || [])] }));

    let moved = null;
    let fromModule = null;
    for (const mod of next) {
      const idx = mod.lessons.findIndex((lesson) => String(lesson._id) === String(dragging.lessonId));
      if (idx >= 0) {
        moved = mod.lessons.splice(idx, 1)[0];
        fromModule = mod;
        break;
      }
    }
    if (!moved) {
      setDragging(null);
      return;
    }

    const target = next.find((mod) => String(mod._id) === String(targetModuleId));
    if (!target) {
      setDragging(null);
      return;
    }

    // A drop onto an earlier row of the same list must not count the removed
    // lesson when computing the insert position.
    const insertAt = targetIndex == null ? target.lessons.length : targetIndex;
    target.lessons.splice(insertAt, 0, moved);
    setModules(next);
    setDragging(null);

    try {
      // Moving across modules also changes the lesson's parent.
      if (String(fromModule._id) !== String(target._id)) {
        await api.put(`/curriculum/lessons/${moved._id}`, { module: target._id });
      }
      await persistOrder(next);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not move the lesson.');
      await loadCurriculum(courseId);
    }
  };

  // ── Lessons ───────────────────────────────────────────────────────────────
  const duplicateLesson = async (lesson) => {
    try {
      await api.post(`/curriculum/lessons/${lesson._id}/duplicate`);
      await loadCurriculum(courseId);
      flash('Lesson duplicated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not duplicate the lesson.');
    }
  };

  const deleteLesson = async (lesson) => {
    if (!window.confirm(`Delete "${lesson.title}"? Its video link, notes and resources go with it.`)) return;
    try {
      await api.delete(`/curriculum/lessons/${lesson._id}`);
      await loadCurriculum(courseId);
      flash('Lesson deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the lesson.');
    }
  };

  const toggleLessonPublish = async (lesson) => {
    try {
      await api.put(`/curriculum/lessons/${lesson._id}`, { isPublished: lesson.isPublished === false });
      await loadCurriculum(courseId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the lesson.');
    }
  };

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="Curriculum Builder"
        subtitle="Author every lesson — video link, notes, PDF and downloadable resources — and the quiz that closes each module."
        actions={
          <>
            <select
              aria-label="Select course"
              className={`${inputClass} w-64`}
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">Select a course…</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                  {course.isPublished === false ? ' (draft)' : ''}
                </option>
              ))}
            </select>
            <button type="button" className={btnPrimary} onClick={addModule} disabled={!courseId}>
              <Plus className="w-3.5 h-3.5" /> Add module
            </button>
          </>
        }
      />

      <ErrorNote>{error}</ErrorNote>
      {status && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-[11px] text-emerald-200">
          {status}
        </div>
      )}

      {curriculum && (
        <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] text-slate-400">
          <span className="font-bold text-white">{curriculum.course?.title}</span>
          <Badge tone="indigo">{modules.length} modules</Badge>
          <Badge tone="slate">{totalLessons} lessons</Badge>
          <Badge tone="slate">{modules.filter((m) => m.quiz).length} quizzes</Badge>
          {curriculum.counts?.draftLessons > 0 && <Badge tone="amber">{curriculum.counts.draftLessons} drafts</Badge>}
        </div>
      )}

      {loading ? (
        <Card>
          <Loading label="Loading curriculum…" />
        </Card>
      ) : !courseId ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="Pick a course"
            message="Choose a certification track above to edit its modules, lessons and quizzes."
          />
        </Card>
      ) : modules.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="No modules yet"
            message="Add the first module, then add lessons inside it with a video link, notes and resources."
            action={
              <button type="button" className={btnPrimary} onClick={addModule}>
                <Plus className="w-3.5 h-3.5" /> Add first module
              </button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((mod, modIndex) => (
            <Card key={mod._id} className="overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={btnIcon}
                    onClick={() => moveModule(modIndex, -1)}
                    disabled={modIndex === 0}
                    aria-label={`Move ${mod.title} up`}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className={btnIcon}
                    onClick={() => moveModule(modIndex, 1)}
                    disabled={modIndex === modules.length - 1}
                    aria-label={`Move ${mod.title} down`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-[10px] font-mono text-slate-400">#{modIndex + 1}</span>

                <input
                  aria-label={`Module ${modIndex + 1} title`}
                  className={`${inputClass} flex-1 min-w-[200px]`}
                  value={mod.title || ''}
                  onChange={(e) => patchModuleLocal(mod._id, { title: e.target.value })}
                />

                <input
                  aria-label={`Module ${modIndex + 1} hours`}
                  type="number"
                  min="1"
                  className={`${inputClass} w-20`}
                  value={mod.durationHours ?? 20}
                  onChange={(e) => patchModuleLocal(mod._id, { durationHours: e.target.value })}
                />

                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => patchModuleLocal(mod._id, { isPublished: mod.isPublished === false })}
                  title={mod.isPublished === false ? 'Publish module' : 'Hide module from students'}
                >
                  {mod.isPublished === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {mod.isPublished === false ? 'Draft' : 'Live'}
                </button>

                <button type="button" className={btnGhost} onClick={() => saveModule(mod)}>
                  <Save className="w-3.5 h-3.5" /> Save
                </button>

                <button
                  type="button"
                  className={btnGhost}
                  onClick={() =>
                    setQuizEditor({ open: true, quiz: mod.quiz || null, moduleId: mod._id })
                  }
                >
                  <ListChecks className="w-3.5 h-3.5" /> {mod.quiz ? 'Edit quiz' : 'Add quiz'}
                </button>

                <button type="button" className={btnDanger} onClick={() => deleteModule(mod)} aria-label={`Delete ${mod.title}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div
                className="divide-y divide-white/[0.04]"
                onDragOver={(e) => dragging && e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragging) moveLesson(mod._id, null);
                }}
              >
                {(mod.lessons || []).map((lesson, lessonIndex) => (
                  <div
                    key={lesson._id}
                    draggable
                    onDragStart={() => setDragging({ lessonId: lesson._id, moduleId: mod._id })}
                    onDragEnd={() => setDragging(null)}
                    onDragOver={(e) => dragging && e.preventDefault()}
                    onDrop={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (dragging) moveLesson(mod._id, lessonIndex);
                    }}
                    className={`px-4 py-2.5 flex flex-wrap items-center gap-3 hover:bg-white/[0.02] ${
                      dragging?.lessonId === lesson._id ? 'opacity-40' : ''
                    }`}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-slate-400 cursor-grab shrink-0" />
                    <span className="text-[10px] font-mono text-slate-400 w-10 shrink-0">
                      {lesson.lessonNumber ?? lessonIndex + 1}
                    </span>

                    <div className="flex-1 min-w-[220px]">
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        {lesson.title}
                        {lesson.isPublished === false && <Badge tone="amber">draft</Badge>}
                        {lesson.isPreview && <Badge tone="indigo">preview</Badge>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                        <Badge tone="slate">{contentTypeLabel[lesson.contentType] || lesson.contentType}</Badge>
                        {lesson.videoUrl ? (
                          <span className="inline-flex items-center gap-1 text-emerald-300">
                            <Video className="w-3 h-3" /> {lesson.videoDuration || 'video linked'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-200">
                            <Video className="w-3 h-3" /> no video
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {lesson.resources?.length || 0} resources
                        </span>
                        {lesson.textContent ? <span className="text-slate-400">notes ✓</span> : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={btnIcon}
                      onClick={() => setLessonEditor({ open: true, lesson, moduleId: mod._id })}
                      aria-label={`Edit ${lesson.title}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className={btnIcon}
                      onClick={() => toggleLessonPublish(lesson)}
                      aria-label={`${lesson.isPublished === false ? 'Publish' : 'Unpublish'} ${lesson.title}`}
                    >
                      {lesson.isPublished === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      className={btnIcon}
                      onClick={() => duplicateLesson(lesson)}
                      aria-label={`Duplicate ${lesson.title}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className={`${btnIcon} text-rose-300`}
                      onClick={() => deleteLesson(lesson)}
                      aria-label={`Delete ${lesson.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="px-4 py-2.5">
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => setLessonEditor({ open: true, lesson: null, moduleId: mod._id })}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add lesson
                  </button>
                  {dragging && <span className="ml-3 text-[10px] text-indigo-300">Drop here to move the lesson into this module</span>}
                </div>
              </div>

              {mod.quiz && (
                <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-300 inline-flex items-center gap-2">
                    <ListChecks className="w-3.5 h-3.5 text-indigo-300" />
                    {mod.quiz.title}
                    <Badge tone="slate">{mod.quiz.questions?.length || 0} questions</Badge>
                    <Badge tone="slate">pass {mod.quiz.passingScorePercent ?? 70}%</Badge>
                  </span>
                  <button
                    type="button"
                    className={btnIcon}
                    aria-label={`Delete quiz ${mod.quiz.title}`}
                    onClick={async () => {
                      if (!window.confirm(`Delete the quiz "${mod.quiz.title}"?`)) return;
                      try {
                        await api.delete(`/curriculum/quizzes/${mod.quiz._id}`);
                        await loadCurriculum(courseId);
                      } catch (err) {
                        setError(err.response?.data?.message || 'Could not delete the quiz.');
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <LessonEditor
        open={lessonEditor.open}
        lesson={lessonEditor.lesson}
        moduleId={lessonEditor.moduleId}
        courseId={courseId}
        defaults={lmsDefaults}
        onClose={() => setLessonEditor({ open: false, lesson: null, moduleId: '' })}
        onSaved={() => {
          loadCurriculum(courseId);
          flash('Lesson saved.');
        }}
      />

      <QuizEditor
        open={quizEditor.open}
        quiz={quizEditor.quiz}
        moduleId={quizEditor.moduleId}
        courseId={courseId}
        defaults={lmsDefaults}
        onClose={() => setQuizEditor({ open: false, quiz: null, moduleId: '' })}
        onSaved={() => {
          loadCurriculum(courseId);
          flash('Quiz saved.');
        }}
      />
    </div>
  );
}
