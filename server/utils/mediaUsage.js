const Course = require('../models/Course');
const Job = require('../models/Job');
const BlogPost = require('../models/BlogPost');
const SuccessStory = require('../models/SuccessStory');
const IssueReport = require('../models/IssueReport');
const SiteSettings = require('../models/SiteSettings');
const LmsSetting = require('../models/LmsSetting');
const Announcement = require('../models/Announcement');

/**
 * "Where is this upload actually used?"
 *
 * The media library lets staff delete a file, and a delete button that happily
 * removes the logo the homepage is rendering is worse than no delete button at
 * all — the client only finds out when a visitor sees a broken image. So before
 * a file can be removed, every admin-visible place that references it is
 * looked up and reported.
 *
 * The scan is deliberately a fixed allowlist of the fields that can hold an
 * uploaded path (not "search every collection"): it is one narrow query per
 * source, it cannot accidentally match a unrelated document, and it stays cheap
 * as the real collections (leads, students, payments) grow.
 *
 * Two kinds of source:
 *   - FIELD_SOURCES: models with a known image field, matched in the database.
 *   - document sources: the singleton/small documents whose image paths live in
 *     free-form CMS blocks (Site Settings especially), matched in memory.
 */

const FIELD_SOURCES = [
  {
    model: Course,
    label: (doc) => `Course: ${doc.title || 'untitled'}`,
    select: 'title thumbnail banner heroImage advantageImages credentialLogo certificateImage',
    fields: ['thumbnail', 'banner', 'heroImage', 'advantageImages', 'credentialLogo', 'certificateImage'],
  },
  {
    model: Job,
    label: (doc) => `Job listing: ${doc.title || 'untitled'}`,
    select: 'title companyLogo',
    fields: ['companyLogo'],
  },
  {
    model: BlogPost,
    label: (doc) => `Blog post: ${doc.title || 'untitled'}`,
    select: 'title coverImage',
    fields: ['coverImage'],
  },
  {
    model: SuccessStory,
    label: (doc) => `Success story: ${doc.studentName || 'untitled'}`,
    select: 'studentName photo companyLogo',
    fields: ['photo', 'companyLogo'],
  },
  {
    model: IssueReport,
    // The screenshots on a client issue report are uploads too: deleting one
    // would empty the brief the client is about to paste.
    label: (doc) => `Issue report: ${doc.title || 'untitled'}`,
    select: 'title images',
    fields: ['images.url'],
  },
];

// Singleton-ish documents whose image paths sit inside free-form CMS blocks.
// They are small (one or two documents), so they are matched in memory and the
// matching top-level block is named in the label — "Settings › companyLogos"
// tells the admin exactly which screen to open.
const DOCUMENT_SOURCES = [
  { model: SiteSettings, label: 'Site Settings', blockLabels: true },
  { model: LmsSetting, label: 'LMS settings', blockLabels: false },
  { model: Announcement, label: 'Announcement banner', blockLabels: false },
];

const IGNORED_BLOCK_KEYS = ['_id', '__v', 'createdAt', 'updatedAt', 'id'];

const renderValue = (value) => {
  try {
    return JSON.stringify(value === undefined ? null : value).toLowerCase();
  } catch (error) {
    return '';
  }
};

/**
 * One pass over every source: returns `[{ label, haystack }]`.
 *
 * Built once per request and then matched against each filename in memory — the
 * alternative (a query per file) multiplied the cost of merely opening the
 * media library by the number of files in it.
 */
const buildUsageIndex = async () => {
  const entries = [];

  for (const source of FIELD_SOURCES) {
    // eslint-disable-next-line no-await-in-loop
    const docs = await source.model.find({}).select(source.select).lean();
    docs.forEach((doc) => {
      entries.push({ label: source.label(doc), haystack: renderValue(doc) });
    });
  }

  for (const source of DOCUMENT_SOURCES) {
    // eslint-disable-next-line no-await-in-loop
    const docs = await source.model.find({}).lean();
    docs.forEach((doc) => {
      if (!source.blockLabels) {
        entries.push({ label: source.label, haystack: renderValue(doc) });
        return;
      }
      // Name the block that matched, so the admin knows which tab to open.
      Object.entries(doc).forEach(([key, value]) => {
        if (IGNORED_BLOCK_KEYS.includes(key)) return;
        entries.push({
          label: `${source.label} › ${key}`,
          haystack: renderValue(value),
        });
      });
    });
  }

  return entries;
};

/** Short human labels for everywhere `filename` is referenced, de-duplicated. */
const usageFor = (index, filename) => {
  const needle = String(filename || '').trim().toLowerCase();
  if (!needle) return [];
  return [...new Set(index.filter((entry) => entry.haystack.includes(needle)).map((entry) => entry.label))];
};

/** Convenience for a single file (the delete path). */
const findAssetUsage = async (filename) => usageFor(await buildUsageIndex(), filename);

module.exports = { buildUsageIndex, usageFor, findAssetUsage };
