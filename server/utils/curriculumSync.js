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
 * Semantics: the incoming array IS the curriculum. Modules (and the lessons
 * built from their topics) are matched by id first, then by title, so the
 * lesson metadata the LMS depends on (video URL, duration, resources, preview
 * flag) survives a normal edit. Anything the admin removed is deleted.
 */

const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');

const norm = (value) => String(value || '').trim().toLowerCase();

/**
 * The shape the Course document mirrors (`moduleTitle` is required there, so a
 * half-filled composer row must not make the whole save fail validation).
 */
const normalizeCurriculumForEmbed = (curriculum) =>
  (Array.isArray(curriculum) ? curriculum : []).map((row, index) => ({
    moduleNumber: index + 1,
    moduleTitle: String(row?.moduleTitle || row?.title || `Module ${index + 1}`).trim(),
    topics: toTopicList(row) || [],
    hours: Number(row?.hours ?? row?.durationHours) || 20,
  }));

/** Topics come from the composer as `"A, B, C"` or as an array of strings. */
const toTopicList = (row) => {
  if (Array.isArray(row.topics)) return row.topics.map((t) => String(t).trim()).filter(Boolean);
  if (typeof row.topics === 'string') {
    return row.topics.split(',').map((t) => t.trim()).filter(Boolean);
  }
  return null; // undefined → "leave the lessons alone"
};

/**
 * Reconcile one course's Module/Lesson documents with `curriculum`.
 * Returns a summary so the API response can tell the admin what happened.
 */
const syncCourseCurriculum = async (courseId, curriculum) => {
  const incoming = Array.isArray(curriculum) ? curriculum : [];
  const summary = {
    modules: { created: 0, updated: 0, deleted: 0 },
    lessons: { created: 0, updated: 0, deleted: 0 },
  };

  const existingModules = await Module.find({ course: courseId }).sort({ order: 1, moduleNumber: 1 });
  const existingLessons = await Lesson.find({ course: courseId });

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

    const topics = toTopicList(row);
    if (topics === null) continue; // no topic list supplied → don't touch this module's lessons

    const moduleLessons = existingLessons.filter((l) => String(l.module) === String(mod._id));

    for (let t = 0; t < topics.length; t += 1) {
      const lessonTitle = topics[t];
      const existing = moduleLessons.find(
        (l) => !usedLessonIds.has(String(l._id)) && norm(l.title) === norm(lessonTitle)
      );

      if (existing) {
        existing.lessonNumber = t + 1;
        existing.order = t + 1;
        await existing.save();
        usedLessonIds.add(String(existing._id));
        summary.lessons.updated += 1;
      } else {
        const created = await Lesson.create({
          course: courseId,
          module: mod._id,
          title: lessonTitle,
          lessonNumber: t + 1,
          order: t + 1,
        });
        usedLessonIds.add(String(created._id));
        summary.lessons.created += 1;
      }
    }

    // Lessons the admin removed from this module.
    for (const lesson of moduleLessons) {
      if (usedLessonIds.has(String(lesson._id))) continue;
      await lesson.deleteOne();
      summary.lessons.deleted += 1;
    }
  }

  // Modules the admin removed (plus their lessons and assessment).
  for (const mod of existingModules) {
    if (usedModuleIds.has(String(mod._id))) continue;
    await Lesson.deleteMany({ module: mod._id });
    await Quiz.deleteMany({ module: mod._id });
    await mod.deleteOne();
    summary.modules.deleted += 1;
  }

  return summary;
};

module.exports = { syncCourseCurriculum, normalizeCurriculumForEmbed };
