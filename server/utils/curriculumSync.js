/**
 * Keeps the real curriculum (Module + Lesson collections) in step with what the
 * admin types in Courses → "Curriculum Module Composer".
 *
 * Why this exists: the composer edited an embedded `course.curriculum` array,
 * while the course page (and the student LMS) render modules and lessons from
 * the separate Module / Lesson collections. So an admin could add or rename a
 * module, get a 200 OK, and the website would keep showing the old curriculum —
 * the client's "curriculum update nahi hota" complaint.
 *
 * Semantics: the incoming array IS the curriculum. Modules (and their lessons)
 * are matched by id first, then by title, so the lesson metadata the LMS depends
 * on (video URL, duration, notes, resources, preview flag) survives a normal
 * edit.
 *
 * DATA-SAFETY RULE (added after a client-audit finding): the composer used to
 * delete any lesson it did not recognise. A lesson whose video, notes, PDF or
 * resources the admin had authored in the Curriculum Builder would be silently
 * destroyed the next time somebody renamed a module topic. Now:
 *   - a lesson that carries authored content, or that a student has already
 *     completed, is NEVER deleted by this sync — it is reported as `preserved`;
 *   - a module that still holds such a lesson (or any quiz) is not deleted
 *     either, for the same reason.
 * Deletion now only removes genuinely empty shell lessons/rows, and the summary
 * tells the admin what was kept and why.
 */

const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');

const norm = (value) => String(value || '').trim().toLowerCase();

/**
 * The shape the Course document mirrors (`moduleTitle` is required there, so a
 * half-filled composer row must not make the whole save fail validation).
 */
const normalizeCurriculumForEmbed = (curriculum) =>
  (Array.isArray(curriculum) ? curriculum : []).map((row, index) => ({
    moduleNumber: index + 1,
    moduleTitle: String(row?.moduleTitle || row?.title || `Module ${index + 1}`).trim(),
    topics: (toLessonList(row) || []).map((lesson) => lesson.title).filter(Boolean),
    hours: Number(row?.hours ?? row?.durationHours) || 20,
  }));

/**
 * The lessons the composer wants in a module.
 *
 * Preferred shape is `lessons: [{ _id, title }]` — the id keeps a renamed lesson
 * attached to its video. Legacy shapes (`lessonTitles: []`, `topics: 'A, B'`)
 * still work; without an id those lessons fall back to title matching.
 *
 * @returns {Array<{id: string, title: string}>|null} null → leave the lessons alone
 */
const toLessonList = (row) => {
  const clean = (list) =>
    list
      .map((entry) => {
        if (typeof entry === 'string') return { id: '', title: entry.trim() };
        return {
          id: String(entry?._id || entry?.id || '').trim(),
          title: String(entry?.title || '').trim(),
        };
      })
      .filter((lesson) => lesson.title || lesson.id);

  if (Array.isArray(row?.lessons)) return clean(row.lessons);
  if (Array.isArray(row?.lessonTitles)) return clean(row.lessonTitles);
  if (Array.isArray(row?.topics)) return clean(row.topics);
  if (typeof row?.topics === 'string') {
    return row.topics
      .split(',')
      .map((title) => ({ id: '', title: title.trim() }))
      .filter((lesson) => lesson.title);
  }
  return null; // undefined → "leave the lessons alone"
};

/** Does this lesson hold anything an admin actually authored? */
const hasAuthoredContent = (lesson) =>
  Boolean(String(lesson.videoUrl || '').trim()) ||
  Boolean(String(lesson.pdfUrl || '').trim()) ||
  Boolean(String(lesson.textContent || '').trim()) ||
  (Array.isArray(lesson.resources) && lesson.resources.length > 0);

/**
 * Reconcile one course's Module/Lesson documents with `curriculum`.
 * Returns a summary so the API response can tell the admin what happened.
 */
const syncCourseCurriculum = async (courseId, curriculum) => {
  const incoming = Array.isArray(curriculum) ? curriculum : [];
  const summary = {
    modules: { created: 0, updated: 0, deleted: 0, preserved: 0 },
    lessons: { created: 0, updated: 0, deleted: 0, preserved: 0 },
  };

  const existingModules = await Module.find({ course: courseId }).sort({ order: 1, moduleNumber: 1 });
  const existingLessons = await Lesson.find({ course: courseId });
  const existingQuizzes = await Quiz.find({ course: courseId });

  // Lessons a student has already completed are never removed underneath them.
  const progressRows = await Progress.find({ course: courseId }).select('completedLessons').lean();
  const completedLessonIds = new Set();
  progressRows.forEach((row) => {
    (row.completedLessons || []).forEach((id) => completedLessonIds.add(String(id)));
  });

  const usedModuleIds = new Set();
  const usedLessonIds = new Set();

  for (let i = 0; i < incoming.length; i += 1) {
    const row = incoming[i] || {};
    const moduleNumber = i + 1;
    const title = String(row.moduleTitle || row.title || `Module ${moduleNumber}`).trim();
    const hours = Number(row.hours ?? row.durationHours) || 20;

    let mod =
      existingModules.find((m) => row._id && String(m._id) === String(row._id)) ||
      existingModules.find((m) => !usedModuleIds.has(String(m._id)) && norm(m.title) === norm(title));

    if (mod) {
      mod.moduleNumber = moduleNumber;
      mod.order = moduleNumber;
      if (title) mod.title = title;
      mod.durationHours = hours;
      if (row.description !== undefined) mod.description = row.description;
      await mod.save();
      summary.modules.updated += 1;
    } else {
      mod = await Module.create({
        course: courseId,
        moduleNumber,
        order: moduleNumber,
        title,
        description: row.description || '',
        durationHours: hours,
      });
      summary.modules.created += 1;
    }
    usedModuleIds.add(String(mod._id));

    const lessonList = toLessonList(row);
    if (lessonList === null) continue; // no lesson information → don't touch this module's lessons

    const moduleLessons = existingLessons.filter((l) => String(l.module) === String(mod._id));

    for (let t = 0; t < lessonList.length; t += 1) {
      const { id, title: lessonTitle } = lessonList[t];

      // Id first (survives renames), then title as a fallback for legacy rows.
      let existing = id
        ? moduleLessons.find((l) => String(l._id) === id && !usedLessonIds.has(String(l._id)))
        : null;
      if (!existing && lessonTitle) {
        existing = moduleLessons.find(
          (l) => !usedLessonIds.has(String(l._id)) && norm(l.title) === norm(lessonTitle)
        );
      }

      if (existing) {
        existing.lessonNumber = t + 1;
        existing.order = t + 1;
        if (lessonTitle && norm(existing.title) !== norm(lessonTitle)) existing.title = lessonTitle;
        await existing.save();
        usedLessonIds.add(String(existing._id));
        summary.lessons.updated += 1;
      } else {
        const created = await Lesson.create({
          course: courseId,
          module: mod._id,
          title: lessonTitle || `Lesson ${t + 1}`,
          lessonNumber: t + 1,
          order: t + 1,
        });
        usedLessonIds.add(String(created._id));
        summary.lessons.created += 1;
      }
    }

    // Lessons the admin removed from this module — but never one that carries
    // authored content or that a student has already completed.
    for (const lesson of moduleLessons) {
      if (usedLessonIds.has(String(lesson._id))) continue;
      if (hasAuthoredContent(lesson) || completedLessonIds.has(String(lesson._id))) {
        summary.lessons.preserved += 1;
        continue;
      }
      await lesson.deleteOne();
      summary.lessons.deleted += 1;
    }
  }

  // Modules the admin removed — kept when they still hold authored lessons or a
  // quiz, otherwise deleted along with their (empty) shell lessons.
  for (const mod of existingModules) {
    if (usedModuleIds.has(String(mod._id))) continue;

    const remainingLessons = existingLessons.filter(
      (l) => String(l.module) === String(mod._id) && !usedLessonIds.has(String(l._id))
    );
    const hasProtectedLesson = remainingLessons.some(
      (l) => hasAuthoredContent(l) || completedLessonIds.has(String(l._id))
    );
    const hasQuiz = existingQuizzes.some((q) => q.module && String(q.module) === String(mod._id));

    if (hasProtectedLesson || hasQuiz) {
      summary.modules.preserved += 1;
      continue;
    }

    await Lesson.deleteMany({ module: mod._id });
    await Quiz.deleteMany({ module: mod._id });
    await mod.deleteOne();
    summary.modules.deleted += 1;
  }

  return summary;
};

module.exports = { syncCourseCurriculum, normalizeCurriculumForEmbed, toLessonList, hasAuthoredContent };
