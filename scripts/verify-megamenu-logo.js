/**
 * Mega-menu logo (header CAREER PROGRAMS dropdown) — end-to-end contract test.
 *
 *   npm run verify:megamenu-logo
 *
 * The client asked for a per-course logo that they can set from the admin panel
 * and that shows up in the header dropdown. Three things have to hold for that
 * to be true in practice, and each one has been broken somewhere in this
 * codebase before:
 *
 *   1. the PUBLIC course feed the navbar reads must actually carry `menuLogo`
 *      (an admin-only field that never reaches /api/courses is a field the
 *      dropdown can never render),
 *   2. saving it must show up IMMEDIATELY — the public feed is cached for 30 s,
 *      so without an invalidation on write the client uploads a logo, reloads,
 *      and sees nothing change,
 *   3. it must be an admin-only write, and clearing it must go back to a real
 *      empty value (`''`, not `undefined`) so the navbar can fall back to the
 *      card image and then to the title monogram.
 *
 * The front-end half of the contract (which image renders in the tile) lives in
 * client/src/components/Navbar.jsx: `c.menuLogo || c.thumbnail || monogram`.
 *
 * The tile itself is one component — client/src/components/MenuLogoTile.jsx —
 * rendered by the header AND by the admin field's live preview, so the client
 * judges the artwork against the real thing before saving. Section 4 pins that
 * arrangement at the source level: a second, inlined copy of the tile in the
 * header would leave the preview rendering a tile the website no longer uses,
 * and nothing an API call can see would notice.
 *
 * Boots the API against a throwaway database and cleans up after itself.
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5221;
const BASE = `http://127.0.0.1:${PORT}`;
// The seeder gives every demo account the same password when this is set.
const SEED_ADMIN_PASSWORD = 'Vertex-Megamenu-Check-2026!z';
const DB_NAME = `aft_megamenutest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;

const SERVER_UPLOADS = path.join(__dirname, '..', 'server', 'uploads');
const CLIENT_UPLOADS = path.join(__dirname, '..', 'client', 'public', 'uploads');
const DIST_UPLOADS = path.join(__dirname, '..', 'client', 'dist', 'uploads');

// A real 1x1 PNG — the upload route validates the extension and the mime type.
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AGtC0mnAAAAAElFTkSuQmCC',
  'base64',
);

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const section = (title) => {
  console.log(`\n${'─'.repeat(64)}\n${title}\n${'─'.repeat(64)}`);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (method, url, { token, body } = {}) => {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch (error) {
    json = null;
  }
  return { status: res.status, json };
};

const uploadImage = async (filename, token) => {
  const form = new FormData();
  form.append('image', new Blob([PNG_BYTES], { type: 'image/png' }), filename);
  const res = await fetch(`${BASE}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
};

const run = async () => {
  console.log(`\nBooting API on port ${PORT} against ${DB_NAME}\n`);

  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGODB_URI: MONGO_URI,
      NODE_ENV: 'development',
      SEED_ON_BOOT: 'true',
      SEED_ADMIN_PASSWORD,
      JWT_SECRET: 'megamenu_logo_contract_secret_long_enough_0001',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  server.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
  server.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });

  const uploadedNames = [];

  const stopServer = async () => {
    server.kill();
    await sleep(600);
    // Leave no test files behind, even if a check failed mid-way.
    uploadedNames.forEach((name) => {
      [path.join(SERVER_UPLOADS, name), path.join(CLIENT_UPLOADS, name), path.join(DIST_UPLOADS, name)].forEach((candidate) => {
        try { if (fs.existsSync(candidate)) fs.unlinkSync(candidate); } catch (error) { /* ignore */ }
      });
    });
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch (error) {
      console.log(`  (cleanup note: ${error.message})`);
    }
  };

  try {
    let healthy = false;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const res = await request('GET', '/api/health');
        if (res.status === 200) { healthy = true; break; }
      } catch (error) { /* not up yet */ }
      await sleep(1200);
    }
    section('1. The dropdown\'s data feed');
    check('API boots on a throwaway database', healthy);
    if (!healthy) throw new Error('server never became reachable');

    let token = '';
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: 'admin@americanfuturetech.com', password: SEED_ADMIN_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { token = res.json.token; break; }
      await sleep(1200);
    }
    check('Admin can sign in', Boolean(token));
    if (!token) throw new Error('could not authenticate as admin');

    // The seeder writes the demo catalogue in the background: wait for it to
    // settle before reading the public feed, or the count is a moving target.
    let courses = [];
    let previous = -1;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const feed = await request('GET', '/api/courses');
      courses = feed.json?.courses || [];
      if (courses.length > 0 && courses.length === previous) break;
      previous = courses.length;
      await sleep(900);
    }
    check('The public feed lists the seeded programs', courses.length > 0, `${courses.length} course(s)`);

    // ── The field the navbar reads ──────────────────────────────────────────
    // Missing (rather than empty) would be a silent break: `c.menuLogo || …`
    // still works, but the admin form would load `undefined` and the CMS audit
    // reports the field as never delivered.
    const missingField = courses.filter((c) => c.menuLogo === undefined);
    check(
      'Every course in the public feed carries menuLogo',
      missingField.length === 0,
      missingField.length ? `${missingField.length} without the key` : 'all present',
    );
    check(
      'An unset logo is an empty string, so the fallback chain can run',
      courses.every((c) => typeof c.menuLogo === 'string'),
      JSON.stringify(courses[0]?.menuLogo),
    );

    const target = courses[0];
    const adminList = await request('GET', '/api/courses/admin/all', { token });
    const adminRow = (adminList.json?.courses || []).find((c) => c._id === target._id);
    check('The admin list carries the same field (CMS round trip)', adminRow?.menuLogo !== undefined);

    // ── The admin's own round trip: upload → save ───────────────────────────
    section('2. Upload a logo in the admin, save, and see it in the feed');
    const stamp = Date.now();
    const uploaded = await uploadImage(`megamenu-check-${stamp}.png`, token);
    if (uploaded.json?.filename) uploadedNames.push(uploaded.json.filename);
    check('The admin can upload a logo file', uploaded.status === 200 && uploaded.json?.success === true,
      uploaded.json?.url || `HTTP ${uploaded.status}`);
    check('The upload reports the stored path the dropdown will use',
      typeof uploaded.json?.url === 'string' && uploaded.json.url.startsWith('/uploads/'),
      uploaded.json?.url || '(none)');

    const logoUrl = uploaded.json?.url || '';
    const saved = await request('PUT', `/api/courses/${target._id}`, {
      token,
      body: { menuLogo: logoUrl },
    });
    check('Saving the course with the logo succeeds', saved.status === 200, `HTTP ${saved.status}`);
    check('The save response echoes the new logo', saved.json?.course?.menuLogo === logoUrl,
      JSON.stringify(saved.json?.course?.menuLogo));

    // The 30 s public cache is the trap here: no invalidation on write and the
    // client's own menu looks broken for half a minute after every save.
    const feedAfterSave = await request('GET', '/api/courses');
    const savedRow = (feedAfterSave.json?.courses || []).find((c) => c._id === target._id);
    check('The public feed shows the new logo immediately (cache invalidated on save)',
      savedRow?.menuLogo === logoUrl, JSON.stringify(savedRow?.menuLogo));

    const bySlug = await request('GET', `/api/courses/${target.slug}`);
    check('The single-course endpoint carries it too (admin + course page)',
      bySlug.json?.course?.menuLogo === logoUrl);

    const served = await fetch(`${BASE}${logoUrl}`);
    check('The uploaded file is really served at that path', served.status === 200,
      `HTTP ${served.status} ${served.headers.get('content-type') || ''}`);
    const onDisk = fs.existsSync(path.join(SERVER_UPLOADS, uploaded.json?.filename || ''));
    const inPublic = fs.existsSync(path.join(CLIENT_UPLOADS, uploaded.json?.filename || ''));
    check('Both disk copies exist (server/uploads + client/public/uploads)', onDisk && inPublic,
      `server=${onDisk} public=${inPublic}`);

    // ── Fallback + guards ───────────────────────────────────────────────────
    section('3. Clearing the logo, and who is allowed to write it');
    const cleared = await request('PUT', `/api/courses/${target._id}`, { token, body: { menuLogo: '' } });
    check('Clearing the logo saves', cleared.status === 200, `HTTP ${cleared.status}`);
    const feedAfterClear = await request('GET', '/api/courses');
    const clearedRow = (feedAfterClear.json?.courses || []).find((c) => c._id === target._id);
    check('The feed falls back to an empty logo (navbar then uses the card image, then the monogram)',
      clearedRow?.menuLogo === '', JSON.stringify(clearedRow?.menuLogo));

    const anonSave = await request('PUT', `/api/courses/${target._id}`, { body: { menuLogo: logoUrl } });
    check('A signed-out caller cannot set the logo', anonSave.status === 401, `HTTP ${anonSave.status}`);
    const anonUpload = await uploadImage(`megamenu-anon-${stamp}.png`, '');
    check('A signed-out caller cannot upload a logo file', anonUpload.status === 401, `HTTP ${anonUpload.status}`);

    let studentToken = '';
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: 'student@americanfuturetech.com', password: SEED_ADMIN_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { studentToken = res.json.token; break; }
      await sleep(900);
    }
    if (studentToken) {
      const studentSave = await request('PUT', `/api/courses/${target._id}`, {
        token: studentToken,
        body: { menuLogo: logoUrl },
      });
      check('A student cannot set the logo', studentSave.status === 403, `HTTP ${studentSave.status}`);
    } else {
      check('A student cannot set the logo', false, 'student demo account did not sign in (seeder race)');
    }

    check('No credentials or tokens leaked into the boot log',
      !serverLog.includes(SEED_ADMIN_PASSWORD) && !/eyJ[A-Za-z0-9_-]{10,}/.test(serverLog));

    // ── The tile the admin previews IS the tile the header draws ────────────
    // Admin → Courses now previews this tile beside the field, which only means
    // anything while both places render the same component. Give the header its
    // own inlined markup back and the preview keeps rendering happily while
    // silently no longer matching the website — the exact drift it exists to
    // prevent, and one no API-level check can see. Hence the source check.
    section('4. One tile component, rendered by both the header and the preview');
    const readSource = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
    const navbarSource = readSource('client/src/components/Navbar.jsx');
    const tileSource = readSource('client/src/components/MenuLogoTile.jsx');
    const fieldSource = readSource('client/src/admin/components/MenuLogoField.jsx');
    const coursesCmsSource = readSource('client/src/admin/CoursesCMS.jsx');
    const tileUsages = (navbarSource.match(/<MenuLogoTile\b/g) || []).length;

    check('The header renders the shared tile',
      /import MenuLogoTile from '\.\/MenuLogoTile'/.test(navbarSource) && tileUsages >= 2,
      `${tileUsages} usage(s) — desktop dropdown + mobile drawer`);
    check('The header keeps no copy of the tile markup of its own',
      !/object-contain p-0\.5/.test(navbarSource),
      'the tile lives in components/MenuLogoTile.jsx only');
    check('The admin Menu Logo field previews that same tile',
      /<MenuLogoTile\b/.test(fieldSource) && /from '\.\.\/\.\.\/components\/MenuLogoTile'/.test(fieldSource));
    check('Admin → Courses uses the field, and feeds it the fallback chain',
      /<MenuLogoField\b/.test(coursesCmsSource) && /cardImage=\{cardImage\}/.test(coursesCmsSource) && /title=\{title\}/.test(coursesCmsSource));
    check('The tile contains (never crops) the artwork and falls back to the monogram',
      /object-contain/.test(tileSource) && /programMonogram/.test(tileSource));
  } finally {
    section('Cleanup');
    await stopServer();
    console.log('  Throwaway database dropped, test uploads removed.');
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'═'.repeat(64)}`);
  console.log(`  ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    failed.forEach((f) => console.log(`  ❌ ${f.name}${f.detail ? ` — ${f.detail}` : ''}`));
    console.log(`${'═'.repeat(64)}\n`);
    process.exit(1);
  }
  console.log(`${'═'.repeat(64)}\n`);
  process.exit(0);
};

run().catch((error) => {
  console.error(`\nFatal: ${error.message}`);
  process.exit(1);
});
