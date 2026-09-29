/**
 * Media Library — end-to-end contract test.
 *
 *   npm run verify:media
 *
 * Why this exists: a delete button that removes a file the live site is still
 * pointing at breaks an image for visitors, silently and days later. So this
 * suite proves the three things that make the screen trustworthy:
 *
 *   1. the list is the union of the disk and the durable store (a file whose
 *      disk copy was wiped by a redeploy is still listed, and readable),
 *   2. a referenced file is refused with the list of references, and only
 *      deleted when that refusal is explicitly overridden,
 *   3. a delete removes BOTH copies — otherwise the "deleted" image keeps being
 *      served out of MongoDB, which is exactly how the app used to behave.
 *
 * It boots the API against a throwaway database and cleans up after itself.
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5217;
const BASE = `http://127.0.0.1:${PORT}`;
// The seeder gives every demo account the same password when this is set.
const SEED_ADMIN_PASSWORD = 'Vertex-Media-Check-2026!z';
const DB_NAME = `aft_mediatest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;

const SERVER_UPLOADS = path.join(__dirname, '..', 'server', 'uploads');
const CLIENT_UPLOADS = path.join(__dirname, '..', 'client', 'public', 'uploads');
const DIST_UPLOADS = path.join(__dirname, '..', 'client', 'dist', 'uploads');
const REPO_ROOT = path.join(__dirname, '..');

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
    headers: { Authorization: `Bearer ${token}` },
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
      JWT_SECRET: 'media_library_contract_secret_long_enough_0001',
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
      await sleep(1500);
    }
    check('API boots on a throwaway database', healthy);
    if (!healthy) throw new Error('server never became reachable');

    let token = '';
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: 'admin@americanfuturetech.com', password: SEED_ADMIN_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { token = res.json.token; break; }
      await sleep(1500);
    }
    check('Admin can sign in', Boolean(token));
    if (!token) throw new Error('could not authenticate as admin');

    /* ───────────────── 1. Access ───────────────── */
    section('1. Access (the asset list is not public)');
    const anonList = await request('GET', '/api/upload/media');
    check('Listing the library without a token is refused', anonList.status === 401, `status ${anonList.status}`);
    const anonDelete = await request('DELETE', '/api/upload/media/whatever.png');
    check('Deleting without a token is refused', anonDelete.status === 401, `status ${anonDelete.status}`);

    const counselorLogin = await request('POST', '/api/auth/login', {
      body: { email: 'counselor@americanfuturetech.com', password: SEED_ADMIN_PASSWORD },
    });
    const counselorToken = counselorLogin.json?.token || '';
    check('Demo counselor can sign in (to prove the permission gate)', Boolean(counselorToken));
    if (counselorToken) {
      const counselorList = await request('GET', '/api/upload/media', { token: counselorToken });
      check('An account without MEDIA_VIEW cannot list assets', counselorList.status === 403,
        `status ${counselorList.status}`);
      const counselorDelete = await request('DELETE', '/api/upload/media/whatever.png', { token: counselorToken });
      check('An account without MEDIA_DELETE cannot delete', counselorDelete.status === 403,
        `status ${counselorDelete.status}`);
    }

    /* ───────────────── 2. Uploading real files ───────────────── */
    section('2. Uploading real files');
    const stamp = Date.now();
    // The upload route stores a collision-free name (original + timestamp +
    // random suffix), so every later step has to use the name the API returns.
    const uploadA = await uploadImage(`media-check-inuse-${stamp}.png`, token);
    const uploadB = await uploadImage(`media-check-unused-${stamp}.png`, token);
    const nameA = uploadA.json?.filename || `media-check-inuse-${stamp}.png`;
    const nameB = uploadB.json?.filename || `media-check-unused-${stamp}.png`;
    uploadedNames.push(nameA, nameB);

    check('Uploading a file succeeds', uploadA.status === 200 && Boolean(uploadA.json?.url), `status ${uploadA.status}`);
    check('The upload is written to durable storage', uploadA.json?.persisted === true,
      `persisted ${uploadA.json?.persisted}`);
    check('The response names the stored file', Boolean(uploadA.json?.filename), nameA);
    check('The file is written to the uploads directory', fs.existsSync(path.join(SERVER_UPLOADS, nameA)));
    check('The second upload succeeds', uploadB.status === 200 && Boolean(uploadB.json?.url));

    const servedDirectly = await fetch(`${BASE}/uploads/${nameA}`);
    check('The uploaded file is served from /uploads', servedDirectly.status === 200,
      `status ${servedDirectly.status} type ${servedDirectly.headers.get('content-type')}`);

    /* ───────────────── 3. The listing merges both stores ───────────────── */
    section('3. Listing = disk ∪ durable storage');
    const list = await request('GET', '/api/upload/media', { token });
    const rowA = (list.json?.files || []).find((file) => file.filename === nameA);
    const rowB = (list.json?.files || []).find((file) => file.filename === nameB);
    check('Both uploads are listed', Boolean(rowA) && Boolean(rowB), `count ${list.json?.count}`);
    check('A listed file reports both copies', rowA?.onDisk === true && rowA?.persisted === true,
      `onDisk ${rowA?.onDisk} persisted ${rowA?.persisted}`);
    check('A listed file reports its size and mime type',
      rowA?.size === PNG_BYTES.length && rowA?.mimetype === 'image/png',
      `${rowA?.size} bytes · ${rowA?.mimetype}`);
    check('A listed file reports the public URL', rowA?.url === `/uploads/${nameA}`, rowA?.url);
    check('An unreferenced file reports no usage', rowA?.usedBy?.length === 0,
      `usedBy ${JSON.stringify(rowA?.usedBy)}`);
    check('The summary counts unused files',
      list.json?.summary?.total >= 2 && list.json?.summary?.unused >= 2,
      JSON.stringify(list.json?.summary));

    // Simulate the state a redeploy leaves behind: the disk copy is gone, the
    // durable copy remains. The file must still be listed (and still served).
    if (fs.existsSync(path.join(SERVER_UPLOADS, nameB))) fs.unlinkSync(path.join(SERVER_UPLOADS, nameB));
    const afterDiskWipe = await request('GET', '/api/upload/media', { token });
    const rowBAfter = (afterDiskWipe.json?.files || []).find((file) => file.filename === nameB);
    check('A file whose disk copy was wiped is still listed (durable copy)',
      Boolean(rowBAfter) && rowBAfter.persisted === true && rowBAfter.onDisk === false,
      `onDisk ${rowBAfter?.onDisk} persisted ${rowBAfter?.persisted}`);
    check('The summary flags durable-only files',
      (afterDiskWipe.json?.summary?.durableOnly || 0) >= 1,
      `durableOnly ${afterDiskWipe.json?.summary?.durableOnly}`);
    const servedAfterWipe = await fetch(`${BASE}/uploads/${nameB}`);
    check('A durable-only file is still served (from MongoDB)',
      servedAfterWipe.status === 200 && (await servedAfterWipe.arrayBuffer()).byteLength === PNG_BYTES.length,
      `status ${servedAfterWipe.status}`);

    /* ───────────────── 4. Usage is reported ───────────────── */
    section('4. Reporting where an asset is used');
    const course = await request('POST', '/api/courses', {
      token,
      body: {
        title: `Media usage probe ${stamp}`,
        category: 'Contract Testing',
        duration: '3 Months',
        pricing: { basePrice: 1000, discountedPrice: 900 },
        heroImage: `/uploads/${nameA}`,
        isPublished: false,
      },
    });
    check('A course referencing the asset is created', course.status === 201, `status ${course.status}`);
    const courseId = course.json?.course?._id;

    const usageList = await request('GET', '/api/upload/media', { token });
    const usedRowA = (usageList.json?.files || []).find((file) => file.filename === nameA);
    check('The asset reports the course that uses it',
      (usedRowA?.usedBy || []).some((label) => label.includes(`Media usage probe ${stamp}`)),
      JSON.stringify(usedRowA?.usedBy));
    check('The summary counts in-use files', (usageList.json?.summary?.inUse || 0) >= 1,
      `inUse ${usageList.json?.summary?.inUse}`);

    /* ───────────────── 5. An in-use file is protected ───────────────── */
    section('5. Deleting a file the site still uses');
    const blocked = await request('DELETE', `/api/upload/media/${nameA}`, { token });
    check('Deleting an in-use file is refused with 409',
      blocked.status === 409, `status ${blocked.status}`);
    check('The refusal lists the references', (blocked.json?.usedBy || []).length > 0,
      JSON.stringify(blocked.json?.usedBy));
    check('The refusal is explicitly overridable', blocked.json?.requiresForce === true);
    check('The refused file was not deleted from disk', fs.existsSync(path.join(SERVER_UPLOADS, nameA)));
    const stillListed = await request('GET', '/api/upload/media', { token });
    check('The refused file is still listed',
      (stillListed.json?.files || []).some((file) => file.filename === nameA));
    const stillServed = await fetch(`${BASE}/uploads/${nameA}`);
    check('The refused file is still served', stillServed.status === 200, `status ${stillServed.status}`);

    const forced = await request('DELETE', `/api/upload/media/${nameA}?force=1`, { token });
    check('An explicit override deletes the file', forced.status === 200, `status ${forced.status}`);
    check('The override warns that the site still points at it',
      forced.json?.usedBy?.length > 0 && /still|broken/i.test(forced.json?.message || ''),
      forced.json?.message);

    /* ───────────────── 6. Deletion removes BOTH copies ───────────────── */
    section('6. Deletion removes both copies');
    const deletedUnused = await request('DELETE', `/api/upload/media/${nameB}`, { token });
    check('Deleting an unused file succeeds', deletedUnused.status === 200, `status ${deletedUnused.status}`);
    check('The disk copy is gone', !fs.existsSync(path.join(SERVER_UPLOADS, nameB)));
    check('The client/public copy is gone', !fs.existsSync(path.join(CLIENT_UPLOADS, nameB)));
    check('A stale copy in the built client/ folder is gone too',
      !fs.existsSync(path.join(DIST_UPLOADS, nameB)));

    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    const leftover = await mongoose.connection.collection('uploadedassets')
      .countDocuments({ filename: { $in: [nameA, nameB] } });
    check('The durable copy is gone (no orphan keeps serving it)', leftover === 0,
      `documents left ${leftover}`);
    await mongoose.disconnect();

    const goneResponse = await fetch(`${BASE}/uploads/${nameA}`);
    check('A deleted file now answers 404', goneResponse.status === 404, `status ${goneResponse.status}`);
    const afterDelete = await request('GET', '/api/upload/media', { token });
    check('Deleted files leave the library',
      !(afterDelete.json?.files || []).some((file) => [nameA, nameB].includes(file.filename)));

    /* ───────────────── 7. Bad input and traversal ───────────────── */
    section('7. Bad input');
    const missing = await request('DELETE', '/api/upload/media/does-not-exist-1234.png', { token });
    check('Deleting a file that is not in the library answers 404', missing.status === 404, `status ${missing.status}`);
    const deleteAgain = await request('DELETE', `/api/upload/media/${nameB}`, { token });
    check('Deleting the same file twice answers 404, not 500', deleteAgain.status === 404, `status ${deleteAgain.status}`);

    const traversal = await request('DELETE', '/api/upload/media/..%2F..%2Fpackage.json', { token });
    check('A directory-traversal name is not deleted', traversal.status !== 200, `status ${traversal.status}`);
    check('package.json was not touched', fs.existsSync(path.join(REPO_ROOT, 'package.json')));
    const traversal2 = await request('DELETE', '/api/upload/media/..%2F..%2Fserver%2Fserver.js', { token });
    check('A traversal aimed at the server source is refused', traversal2.status !== 200,
      `status ${traversal2.status}`);
    check('server/server.js was not touched', fs.existsSync(path.join(REPO_ROOT, 'server', 'server.js')));
    const oddName = await request('DELETE', '/api/upload/media/..', { token });
    check('A name that is only dots is refused', oddName.status === 400 || oddName.status === 404,
      `status ${oddName.status}`);

    /* ───────────────── 8. Audit trail ───────────────── */
    section('8. Audit trail');
    const audit = await request('GET', '/api/settings/audit-logs', { token });
    const auditText = JSON.stringify(audit.json || {});
    check('Deleting media is recorded in the audit log', /MEDIA_DELETED/.test(auditText));
    check('An override delete records what was still pointing at it',
      /still referenced by/i.test(auditText));

    if (courseId) await request('DELETE', `/api/courses/${courseId}`, { token });
  } finally {
    await stopServer();
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`RESULT: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach((f) => console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`));
    const errorLines = serverLog.split('\n').filter((line) => /error|Error/.test(line)).slice(0, 12);
    if (errorLines.length) {
      console.log('\nServer log excerpt:');
      console.log(errorLines.join('\n'));
    }
    process.exit(1);
  }
  console.log('The media library lists both stores and deletes safely ✅');
};

run().catch((error) => {
  console.error('\nVerification crashed:', error.message);
  process.exit(1);
});
