/**
 * Inline site editor verification.
 *
 *   node scripts/verify-site-editor.js
 *
 * Drives the real API on a throwaway database to prove that per-page text and
 * image overrides are stored, merged, validated and resettable — and that the
 * write endpoint is protected.
 */

const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const SERVER_DIR = path.join(__dirname, '..', 'server');
const PORT = 5196;
const BASE = `http://127.0.0.1:${PORT}`;
const DB_NAME = `aft_editortest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;
const ADMIN_PASSWORD = 'Vertex-Cohort-2026!z';

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  try { json = await res.json(); } catch (e) { json = null; }
  return { status: res.status, json };
};

const run = async () => {
  console.log(`\nBooting API on ${PORT} against ${DB_NAME}\n`);

  const server = spawn(process.execPath, [path.join(SERVER_DIR, 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'development',
      MONGODB_URI: MONGO_URI,
      JWT_SECRET: crypto.randomBytes(48).toString('hex'),
      SEED_ON_BOOT: 'true',
      SEED_ADMIN_PASSWORD: ADMIN_PASSWORD,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  server.stdout.on('data', (d) => { serverLog += d.toString(); });
  server.stderr.on('data', (d) => { serverLog += d.toString(); });

  const stop = async () => {
    server.kill();
    await sleep(600);
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch (e) { /* ignore */ }
  };

  try {
    let healthy = false;
    for (let i = 0; i < 30; i += 1) {
      try { if ((await request('GET', '/api/health')).status === 200) { healthy = true; break; } } catch (e) { /* wait */ }
      await sleep(1500);
    }
    check('API is reachable', healthy);
    if (!healthy) throw new Error('server never started');

    let token = '';
    for (let i = 0; i < 20; i += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: 'admin@americanfuturetech.com', password: ADMIN_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { token = res.json.token; break; }
      await sleep(1500);
    }
    check('Admin authenticated', Boolean(token));
    if (!token) throw new Error('login failed');

    const ROUTE = '/courses';

    check('Public read of a page with no edits returns empty maps',
      (await request('GET', `/api/settings/site-editor?route=${encodeURIComponent(ROUTE)}`)).json?.text &&
      Object.keys((await request('GET', `/api/settings/site-editor?route=${encodeURIComponent(ROUTE)}`)).json.text).length === 0);

    const payload = {
      route: ROUTE,
      text: {
        'main0>section1>h1#t0': { original: 'Master Applied Emerging Tech.', value: 'Build a Six-Figure Tech Career.' },
        'main0>section1>p#t0': { original: 'Live instructor-led fellowships.', value: 'Live, mentor-led cohorts built around real projects.' },
      },
      images: {
        'main0>section2>img0': { original: '/images/hero-desk.png', value: '/uploads/hero-new.png' },
      },
    };

    const saved = await request('PUT', '/api/settings/site-editor', { token, body: payload });
    check('Saving text + image overrides succeeds', saved.status === 200 && saved.json?.saved === 3,
      `status ${saved.status}, saved ${saved.json?.saved}`);
    check('No override was rejected', (saved.json?.rejected || []).length === 0, JSON.stringify(saved.json?.rejected));
    check('Server does not report schema-ignored paths for overrides',
      (saved.json?.ignoredPaths || []).length === 0);

    const readBack = await request('GET', `/api/settings/site-editor?route=${encodeURIComponent(ROUTE)}`);
    check('Overrides persist on re-read',
      readBack.json?.text?.['main0>section1>h1#t0']?.value === 'Build a Six-Figure Tech Career.',
      JSON.stringify(readBack.json?.text?.['main0>section1>h1#t0']));
    check('Original text is stored alongside the new value',
      readBack.json?.text?.['main0>section1>h1#t0']?.original === 'Master Applied Emerging Tech.');
    check('Image override persists', readBack.json?.images?.['main0>section2>img0']?.value === '/uploads/hero-new.png');
    check('Edits are scoped to their own route',
      Object.keys((await request('GET', '/api/settings/site-editor?route=/about')).json?.text || {}).length === 0);

    // Merge behaviour
    await request('PUT', '/api/settings/site-editor', {
      token,
      body: { route: ROUTE, text: { 'main0>section3>span#t0': { original: 'Only 3 seats', value: 'Only 2 seats left' } } },
    });
    const merged = await request('GET', `/api/settings/site-editor?route=${encodeURIComponent(ROUTE)}`);
    check('A later save merges instead of replacing', Object.keys(merged.json?.text || {}).length === 3,
      `${Object.keys(merged.json?.text || {}).length} text entries`);

    // Validation
    const badRoute = await request('PUT', '/api/settings/site-editor', {
      token,
      body: { route: '../../etc/passwd', text: {} },
    });
    check('An invalid route is rejected', badRoute.status === 400, `status ${badRoute.status}`);

    const badImage = await request('PUT', '/api/settings/site-editor', {
      token,
      body: { route: ROUTE, images: { 'main0>img0': { original: '', value: 'javascript:alert(1)' } } },
    });
    check('A javascript: image URL is rejected',
      badImage.status === 200 && (badImage.json?.rejected || []).includes('image.main0>img0'),
      JSON.stringify(badImage.json?.rejected));

    const longText = await request('PUT', '/api/settings/site-editor', {
      token,
      body: { route: ROUTE, text: { 'main0>h9#t0': { original: '', value: 'x'.repeat(900) } } },
    });
    check('An over-long text value is rejected',
      longText.status === 200 && (longText.json?.rejected || []).includes('text.main0>h9#t0'),
      JSON.stringify(longText.json?.rejected));

    const badKey = await request('PUT', '/api/settings/site-editor', {
      token,
      body: { route: ROUTE, text: { 'main with spaces': { original: '', value: 'x' } } },
    });
    check('An unsafe override key is rejected',
      badKey.status === 200 && (badKey.json?.rejected || []).includes('text.main with spaces'));

    const stillThree = await request('GET', `/api/settings/site-editor?route=${encodeURIComponent(ROUTE)}`);
    check('Rejected entries are not stored', Object.keys(stillThree.json?.text || {}).length === 3,
      `${Object.keys(stillThree.json?.text || {}).length} text entries`);

    // Auth
    const unauthed = await request('PUT', '/api/settings/site-editor', {
      body: { route: ROUTE, text: { 'a#t0': { original: '', value: 'hacked' } } },
    });
    check('Writes require authentication', unauthed.status === 401, `status ${unauthed.status}`);

    // The whole settings document must still round-trip with the new fields.
    const settingsDoc = await request('GET', '/api/settings');
    check('settings.textOverrides is exposed to the public site',
      Boolean(settingsDoc.json?.settings?.textOverrides?.[ROUTE]),
      Object.keys(settingsDoc.json?.settings?.textOverrides || {}).join(', '));

    const partial = await request('PUT', '/api/settings', { token, body: { depositPriceUSD: 99 } });
    check('A normal settings save still reports no ignored paths',
      (partial.json?.ignoredPaths || []).length === 0, JSON.stringify(partial.json?.ignoredPaths));
    const afterPartial = await request('GET', '/api/settings');
    check('A normal settings save does not wipe the editor overrides',
      Object.keys(afterPartial.json?.settings?.textOverrides?.[ROUTE] || {}).length === 3);

    // Admin overview: one call must list every edited page.
    const summary = await request('GET', '/api/settings/site-editor/summary', { token });
    const summaryPage = (summary.json?.pages || []).find((p) => p.route === ROUTE);
    check('Overview lists the edited page',
      summary.status === 200 && Boolean(summaryPage),
      `status ${summary.status}, routes: ${(summary.json?.pages || []).map((p) => p.route).join(', ')}`);
    check('Overview counts match what was saved',
      summaryPage?.textCount === 3 && summaryPage?.imageCount === 1,
      `${summaryPage?.textCount} text / ${summaryPage?.imageCount} image`);
    check('Overview totals add up',
      (summary.json?.totals?.text || 0) >= 3 && (summary.json?.totals?.pages || 0) >= 1,
      JSON.stringify(summary.json?.totals));
    check('Overview shows a before/after sample',
      Array.isArray(summaryPage?.samples) && summaryPage.samples.length > 0,
      JSON.stringify(summaryPage?.samples?.[0]));

    const summaryUnauthed = await request('GET', '/api/settings/site-editor/summary');
    check('Overview requires authentication', summaryUnauthed.status === 401, `status ${summaryUnauthed.status}`);

    // Reset
    const reset = await request('DELETE', `/api/settings/site-editor?route=${encodeURIComponent(ROUTE)}`, { token });
    check('Reset removes the page overrides',
      reset.status === 200 && reset.json?.removedText === 3 && reset.json?.removedImages === 1,
      `removed ${reset.json?.removedText} text / ${reset.json?.removedImages} image`);
    const afterReset = await request('GET', `/api/settings/site-editor?route=${encodeURIComponent(ROUTE)}`);
    check('Page is empty after reset',
      Object.keys(afterReset.json?.text || {}).length === 0 && Object.keys(afterReset.json?.images || {}).length === 0);

    const logs = await request('GET', '/api/settings/audit-logs', { token });
    const actions = (logs.json?.logs || []).map((l) => l.action);
    check('Text edits are recorded in the audit log', actions.includes('SITE_TEXT_EDITED'), actions.slice(0, 5).join(', '));
    check('Page resets are recorded in the audit log', actions.includes('SITE_TEXT_RESET'));
  } finally {
    await stop();
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`RESULT: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach((f) => console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`));
    process.exit(1);
  }
  console.log('All site editor checks passed ✅');
};

run().catch((error) => {
  console.error('\nVerification crashed:', error.message);
  process.exit(1);
});
