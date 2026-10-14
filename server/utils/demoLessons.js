/**
 * Recognising the demo curriculum.
 *
 * `npm run seed` (and the LMS curriculum sync it feeds) writes placeholder
 * lessons for every course so the admin screens are never empty: generated
 * titles, a boilerplate body, the same sample PDF and a stock YouTube embed.
 * None of it is the client's course material, and on the public course page the
 * generated names read exactly like a real syllabus (\"Working with Lists,
 * Dictionaries, Tuples & Files\").
 *
 * The client asked for those default points to come off the public page without
 * deleting anything, so the public curriculum read skips demo lessons while the
 * admin builder and the student player keep them.
 *
 * Two ways a lesson is recognised:
 *
 *   1. `source: 'seed'` — written by the seeder after this field existed.
 *   2. The seeder's own placeholder body — rows created before the field
 *      existed. Two shapes are recognised: the full generated body
 *      server/utils/seeder.js writes, and a bare "Hands-on lesson." stub with no
 *      notes, PDF or resources at all. Both are matched on the body, never on
 *      the title alone.
 *
 * An explicit `source: 'admin'` always wins over the body check, which is how a
 * lesson leaves the demo set: the first admin save (Curriculum Builder, or a
 * real edit through the Courses CMS) marks it authored.
 */

const SEEDED_DESCRIPTION = /^Hands-on lesson covering .+ with production code walkthroughs and downloadable lab files\.$/;
const SEEDED_OVERVIEW = /^### Overview: .+\n\nIn this lesson, you will master production principles and real-world architectures\./;
// The generic stub description, alone ("Hands-on lesson.") — the shape the demo
// curriculum takes when a row was created as a placeholder and never filled in.
const STUB_DESCRIPTION = /^hands-on lesson\.?$/i;

/**
 * A row whose whole body is the stub text: no notes, no PDF, no resources. The
 * negative checks matter — a lesson that legitimately carries a video link plus
 * authored notes, handouts or a lab PDF is real content and is never hidden
 * just because its description is short.
 */
const isStubBody = (lesson) => {
  const description = String(lesson.description || '').trim();
  const textContent = String(lesson.textContent || '').trim();
  const pdfUrl = String(lesson.pdfUrl || '').trim();
  const resources = Array.isArray(lesson.resources) ? lesson.resources : [];
  return STUB_DESCRIPTION.test(description) && !textContent && !pdfUrl && resources.length === 0;
};

/** Does this lesson still carry the seeder's untouched placeholder body? */
const hasSeededBody = (lesson) => {
  if (!lesson) return false;
  const description = String(lesson.description || '').trim();
  const textContent = String(lesson.textContent || '').trim();
  if (SEEDED_DESCRIPTION.test(description) && SEEDED_OVERVIEW.test(textContent)) return true;
  return isStubBody(lesson);
};

/** True when a lesson is demo content the public syllabus should not print. */
const isDemoLesson = (lesson) => {
  if (!lesson) return false;
  if (lesson.source === 'seed') return true;
  if (lesson.source === 'admin') return false;
  return hasSeededBody(lesson);
};

/**
 * Split lessons into what the public may see and what only the admin sees.
 * Mongoose documents and plain objects both work, so this is safe to call in a
 * controller that mixes `find()` results with `.lean()` rows.
 */
const splitDemoLessons = (lessons = []) => {
  const visible = [];
  const demo = [];
  lessons.forEach((lesson) => (isDemoLesson(lesson) ? demo : visible).push(lesson));
  return { visible, demo };
};

module.exports = {
  SEEDED_DESCRIPTION,
  SEEDED_OVERVIEW,
  STUB_DESCRIPTION,
  isStubBody,
  hasSeededBody,
  isDemoLesson,
  splitDemoLessons,
};
