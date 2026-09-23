#!/usr/bin/env node
/**
 * Live content backup — dumps everything the client has created through the
 * admin panel into a single local JSON file.
 *
 *   node scripts/export-live-content.js
 *   API_BASE=https://american-futuretech-api.onrender.com node scripts/export-live-content.js
 *
 * Credentials: tries the seeded staff accounts, or pass your own:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret node scripts/export-live-content.js
 *
 * Output: backups/live-content-<timestamp>.json
 * The backups/ folder is gitignored because it contains student/lead data.
 */

const fs = require('fs');
const path = require('path');

const BASE = (process.env.API_BASE || 'https://american-futuretech-api.onrender.com').replace(/\/$/, '');
const OUT_DIR = path.join(__dirname, '..', 'backups');

// Pass real credentials once the seeded defaults have been rotated:
//   ADMIN_EMAIL=admin@... ADMIN_PASSWORD=... node scripts/export-live-content.js
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.warn(
    '\n⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set — falling back to the legacy seeded credentials.\n' +
    '   These stop working after the credential rotation.\n',
  );
}

const CREDENTIALS = process.env.ADMIN_EMAIL
  ? [{ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD || '' }]
  : [
      { email: 'admin@americanfuturetech.com', password: 'admin123' },
      { email: 'counselor@americanfuturetech.com', password: 'admin123' },
    ];

const PUBLIC_ENDPOINTS = [
  ['settings', '/api/settings'],
  ['coursesPublic', '/api/courses'],
  ['jobs', '/api/jobs'],
  ['batches', '/api/batches'],
  ['blogs', '/api/content/blogs'],
  ['faqs', '/api/content/faqs'],
  ['successStories', '/api/content/success-stories'],
];

const ADMIN_ENDPOINTS = [
  ['coursesAll', '/api/courses/admin/all'],
  ['users', '/api/auth/users'],
  ['leads', '/api/leads'],
  ['students', '/api/students'],
  ['payments', '/api/payments'],
  ['jobApplications', '/api/jobs/admin/applications'],
  ['supportTickets', '/api/support/admin/tickets'],
  ['auditLogs', '/api/settings/audit-logs'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Render's free tier sleeps — retry patiently on cold starts. */
async function request(url, { token, retries = 4 } = {}) {
  let lastError = 'unknown error';
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 75000);
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      clearTimeout(timer);
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text.slice(0, 500) };
      }
      if (res.ok) return { ok: true, status: res.status, body };
      lastError = `HTTP ${res.status}: ${body.message || text.slice(0, 160)}`;
      // Auth/permission problems will not fix themselves by retrying.
      if (res.status === 401 || res.status === 403 || res.status === 404) break;
    } catch (err) {
      lastError = err.name === 'AbortError' ? 'request timed out (cold start?)' : err.message;
    }
    if (attempt < retries) {
      const wait = 4000 * attempt;
      process.stdout.write(`    retry ${attempt}/${retries - 1} in ${wait / 1000}s (${lastError})\n`);
      await sleep(wait);
    }
  }
  return { ok: false, error: lastError };
}

/** Unwrap `{ success, count, <key>: [...] }`, `{ data: { <key>: [...] } }` and bare arrays. */
const unwrap = (body, key) => {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body[key])) return body[key];
  if (body.data) {
    if (Array.isArray(body.data[key])) return body.data[key];
    if (Array.isArray(body.data)) return body.data;
  }
  if (Array.isArray(body.results)) return body.results;
  return [];
};

async function login() {
  for (const cred of CREDENTIALS) {
    if (!cred.email || !cred.password) continue;
    const attempt = await (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 75000);
        const r = await fetch(`${BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cred.email, password: cred.password }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        return { status: r.status, body: await r.json().catch(() => ({})) };
      } catch (err) {
        return { status: 0, body: { message: err.message } };
      }
    })();

    if (attempt.status === 200 && attempt.body.token) {
      return { token: attempt.body.token, user: attempt.body.user || null, email: cred.email };
    }
    console.log(`  ✗ ${cred.email} → ${attempt.status} ${attempt.body.message || ''}`);
  }
  return null;
}

(async () => {
  console.log(`\nLive content backup → ${BASE}\n`);
  const backup = {
    meta: {
      baseUrl: BASE,
      exportedAt: new Date().toISOString(),
      exportedBy: null,
      failures: [],
    },
  };

  console.log('[auth] Signing in…');
  const session = await login();
  if (session) {
    backup.meta.exportedBy = session.user?.email || session.email;
    console.log(`  ✓ signed in as ${backup.meta.exportedBy}\n`);
  } else {
    console.log('  ! Could not sign in — public content will still be exported.\n');
  }
  const token = session?.token;

  console.log('[public] Exporting published content…');
  for (const [key, endpoint] of PUBLIC_ENDPOINTS) {
    const res = await request(`${BASE}${endpoint}`);
    if (res.ok) {
      backup[key] = res.body.settings || res.body.data || res.body;
      console.log(`  ✓ ${key.padEnd(16)} ${endpoint}`);
    } else {
      backup.meta.failures.push({ key, endpoint, error: res.error });
      console.log(`  ✗ ${key.padEnd(16)} ${endpoint} → ${res.error}`);
    }
  }

  if (token) {
    console.log('\n[admin] Exporting admin-managed content…');
    for (const [key, endpoint] of ADMIN_ENDPOINTS) {
      const res = await request(`${BASE}${endpoint}`, { token });
      if (res.ok) {
        backup[key] = res.body[key] || res.body.data || res.body;
        const len = Array.isArray(backup[key]) ? ` (${backup[key].length})` : '';
        console.log(`  ✓ ${key.padEnd(16)} ${endpoint}${len}`);
      } else {
        backup.meta.failures.push({ key, endpoint, error: res.error });
        console.log(`  ✗ ${key.padEnd(16)} ${endpoint} → ${res.error}`);
      }
    }

    // Curriculum lives per course — walk every course.
    const courses = unwrap(backup.coursesAll, 'courses');
    if (courses.length) {
      console.log(`\n[curriculum] Exporting modules, lessons and quizzes for ${courses.length} courses…`);
      backup.curriculum = {};
      for (const course of courses) {
        const res = await request(`${BASE}/api/curriculum/courses/${course._id}`);
        if (res.ok) {
          backup.curriculum[course.slug] = res.body;
          const modules = unwrap(res.body, 'modules').length;
          console.log(`  ✓ ${course.slug} (${modules} modules)`);
        } else {
          backup.meta.failures.push({ key: `curriculum:${course.slug}`, error: res.error });
          console.log(`  ✗ ${course.slug} → ${res.error}`);
        }
      }
    }
  }

  const summary = {
    settings: backup.settings ? 1 : 0,
    courses: unwrap(backup.coursesAll, 'courses').length,
    coursesPublished: unwrap(backup.coursesPublic, 'courses').length,
    curriculumCourses: Object.keys(backup.curriculum || {}).length,
    curriculumModules: Object.values(backup.curriculum || {}).reduce(
      (total, entry) => total + unwrap(entry, 'modules').length,
      0
    ),
    jobs: unwrap(backup.jobs, 'jobs').length,
    blogs: unwrap(backup.blogs, 'blogs').length,
    faqs: unwrap(backup.faqs, 'faqs').length,
    successStories: unwrap(backup.successStories, 'stories').length,
    users: unwrap(backup.users, 'users').length,
    leads: unwrap(backup.leads, 'leads').length,
    students: unwrap(backup.students, 'students').length,
    payments: unwrap(backup.payments, 'payments').length,
    jobApplications: unwrap(backup.jobApplications, 'applications').length,
    supportTickets: unwrap(backup.supportTickets, 'tickets').length,
    batches: unwrap(backup.batches, 'batches').length,
    auditLogs: unwrap(backup.auditLogs, 'logs').length,
  };
  backup.meta.summary = summary;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = path.join(OUT_DIR, `live-content-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(backup, null, 2), 'utf8');

  console.log('\n──────────── summary ────────────');
  for (const [key, value] of Object.entries(summary)) {
    console.log(`  ${key.padEnd(20)} ${value}`);
  }
  if (backup.meta.failures.length) {
    console.log(`\n  failures: ${backup.meta.failures.length}`);
    for (const f of backup.meta.failures) console.log(`    - ${f.key}: ${f.error}`);
  }
  const bytes = fs.statSync(file).size;
  console.log(`\nSaved: ${path.relative(process.cwd(), file)} (${(bytes / 1024).toFixed(1)} KB)\n`);
})().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
