const Course = require('../models/Course');
const BlogPost = require('../models/BlogPost');

/**
 * The public sitemap, built from the same content the site actually serves.
 *
 * Why this exists: `/sitemap.xml` used to fall through to the SPA catch-all, so
 * a crawler asking for the sitemap received the website's HTML with a 200. That
 * is worse than a 404 — Google reads it as "this sitemap is an HTML page" and
 * drops the submission, while nothing in the logs looks broken.
 *
 * Two sources, one document:
 *   · the fixed public routes below (the site's real navigation),
 *   · every PUBLISHED program and blog post, read from the database so a new
 *     course or article appears without editing this file.
 *
 * The canonical origin is the primary production domain and never the host the
 * request arrived on: the same build is also served from `www`, from a Vercel
 * mirror and from a staging host, and a sitemap listing those duplicates would
 * ask Google to index them.
 */

const SITE_ORIGIN = (process.env.PUBLIC_SITE_URL || 'https://americanfuturetechllc.com').replace(/\/+$/, '');

/** route, changefreq, priority — ordered as the site's own navigation. */
const STATIC_ROUTES = [
  ['/', 'daily', '1.0'],
  ['/courses', 'weekly', '0.9'],
  ['/about', 'monthly', '0.6'],
  ['/careers', 'daily', '0.7'],
  ['/blog', 'weekly', '0.7'],
  ['/success-stories', 'monthly', '0.6'],
  ['/career-support', 'monthly', '0.6'],
  ['/faq', 'monthly', '0.5'],
  ['/contact', 'monthly', '0.5'],
  ['/privacy', 'yearly', '0.3'],
  ['/terms', 'yearly', '0.3'],
  ['/refund-policy', 'yearly', '0.3'],
  ['/cookie-policy', 'yearly', '0.3'],
];

/** The page types that must never be advertised to a search engine. */
const EXCLUDED_PREFIXES = ['/admin', '/student', '/checkout', '/api'];

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const urlEntry = ({ loc, lastmod, changefreq, priority }) => {
  const parts = [`    <loc>${escapeXml(`${SITE_ORIGIN}${loc}`)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
};

/**
 * The published programs and articles.
 *
 * A database that is not reachable must not turn the sitemap into a 500: the
 * fixed routes are still a correct (if shorter) answer, so a read failure is
 * logged and skipped.
 */
const loadDynamicEntries = async () => {
  const entries = [];
  try {
    const [courses, posts] = await Promise.all([
      Course.find({ isPublished: true }).select('slug updatedAt').lean(),
      BlogPost.find({ isPublished: true }).select('slug updatedAt').lean(),
    ]);
    courses
      .filter((course) => course && course.slug)
      .forEach((course) => entries.push({
        loc: `/courses/${course.slug}`,
        lastmod: course.updatedAt,
        changefreq: 'weekly',
        priority: '0.8',
      }));
    posts
      .filter((post) => post && post.slug)
      .forEach((post) => entries.push({
        loc: `/blog/${post.slug}`,
        lastmod: post.updatedAt,
        changefreq: 'monthly',
        priority: '0.6',
      }));
  } catch (error) {
    console.warn(`[Sitemap] Published content could not be read: ${error.message}`);
    // null, not [] — an unreadable database must not be cached as "this site
    // has no programs" for the next ten minutes.
    return null;
  }
  return entries;
};

const CACHE_MS = 10 * 60 * 1000;
let cache = { at: 0, xml: '' };

const buildSitemap = async () => {
  if (cache.xml && Date.now() - cache.at < CACHE_MS) return cache.xml;

  const dynamic = await loadDynamicEntries();
  const entries = [
    ...STATIC_ROUTES.map(([loc, changefreq, priority]) => ({ loc, changefreq, priority })),
    ...(dynamic || []),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(urlEntry),
    '</urlset>',
    '',
  ].join('\n');

  // Cache a real answer, not an empty one: a catalogue read that returns nothing
  // is either a database that has not been seeded yet or one that just failed,
  // and pinning "this site has no programs" for ten minutes helps nobody.
  if (dynamic && dynamic.length) cache = { at: Date.now(), xml };
  return xml;
};

module.exports = { buildSitemap, STATIC_ROUTES, SITE_ORIGIN, EXCLUDED_PREFIXES };
