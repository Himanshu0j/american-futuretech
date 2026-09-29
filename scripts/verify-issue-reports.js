/**
 * Client issue-report board — end-to-end contract test.
 *
 *   npm run verify:issues
 *
 * Why this exists: the whole point of the board is that what the client records
 * comes back out unchanged — the note in their own words, every screenshot in
 * the order they attached it. A silent field drop or a partial-update wipe
 * would look perfectly fine in the panel ("saved!") while quietly destroying the
 * brief the client is about to paste to the developer. So this suite drives the
 * real API the way the panel does and checks the bytes that come back.
 *
 * It boots the API against a throwaway database and drops it afterwards, so it
 * is safe to run at any time and never touches the client's real reports.
 */

const path = require('path');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5214;
const BASE = `http://127.0.0.1:${PORT}`;
// Must satisfy the platform's own password policy (see utils/passwords.js).
const SEED_ADMIN_PASSWORD = 'Vertex-Issues-Check-2026!z';
const DB_NAME = `aft_issuetest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;

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
      JWT_SECRET: 'issue_reports_contract_secret_long_enough_0001',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  server.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
  server.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });

  const stopServer = async () => {
    server.kill();
    await sleep(600);
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

    /* ───────────────── 1. The board is not public ───────────────── */
    section('1. Access (internal board, signed-in staff only)');
    const anonList = await request('GET', '/api/issues');
    check('Listing reports without a token is refused', anonList.status === 401, `status ${anonList.status}`);
    const anonCreate = await request('POST', '/api/issues', { body: { title: 'Anonymous report' } });
    check('Filing a report without a token is refused', anonCreate.status === 401, `status ${anonCreate.status}`);
    const badToken = await request('GET', '/api/issues', { token: 'not.a.real.token' });
    check('A forged token is refused', badToken.status === 401, `status ${badToken.status}`);

    /* ───────────────── 2. Filing a report ───────────────── */
    section('2. Filing a report (screenshot + note)');
    const noTitle = await request('POST', '/api/issues', { token, body: { description: 'note only' } });
    check('A report without a title is refused', noTitle.status === 400,
      `status ${noTitle.status} ${noTitle.json?.message || ''}`);

    const stamp = Date.now();
    const created = await request('POST', '/api/issues', {
      token,
      body: {
        title: `Contract issue ${stamp}`,
        description: 'The reservation button reads $999 on the course page.\nShould be $499.',
        page: '/courses/devops-and-cloud-with-ai',
        category: 'Pricing / Payments',
        severity: 'High',
        images: [
          { url: '/uploads/contract-one.png', filename: 'contract-one.png', caption: 'desktop' },
          { url: '/uploads/contract-two.png', filename: 'contract-two.png', caption: 'mobile' },
        ],
        // Server-owned: a posted author must be ignored, or one staff account
        // could file notes under another's name.
        reportedBy: { name: 'Someone Else', email: 'nope@example.com' },
      },
    });
    const issue = created.json?.issue;
    check('Creating a report succeeds', created.status === 201 && Boolean(issue?._id), `status ${created.status}`);
    check('The note is stored exactly as written',
      issue?.description === 'The reservation button reads $999 on the course page.\nShould be $499.',
      JSON.stringify(issue?.description));
    check('Both screenshots are kept, in the order they were attached',
      issue?.images?.length === 2 && issue.images[0].url === '/uploads/contract-one.png'
        && issue.images[1].url === '/uploads/contract-two.png',
      `images ${(issue?.images || []).map((i) => i.url).join(', ')}`);
    check('Screenshot captions survive the round-trip',
      issue?.images?.[0]?.caption === 'desktop' && issue?.images?.[1]?.caption === 'mobile');
    check('The author is taken from the signed-in admin, not the request body',
      issue?.reportedBy?.name !== 'Someone Else' && /@/.test(issue?.reportedBy?.email || ''),
      `author "${issue?.reportedBy?.name}" <${issue?.reportedBy?.email}>`);
    check('A report is stamped with when it was filed', Boolean(issue?.reportedAt));

    // A browser-local handle would render for the admin who saved it and be
    // broken for everybody else (it is not fetchable from the brief either).
    const junkUrls = await request('POST', '/api/issues', {
      token,
      body: {
        title: `Junk urls ${stamp}`,
        images: [
          { url: 'data:image/png;base64,AAAA' },
          { url: 'blob:http://localhost:5273/9f2a' },
          { url: 'javascript:alert(1)' },
          { url: '/uploads/real-one.png' },
        ],
      },
    });
    check('Browser-local and javascript: image URLs are dropped, real paths kept',
      junkUrls.json?.issue?.images?.length === 1
        && junkUrls.json.issue.images[0].url === '/uploads/real-one.png',
      `kept ${(junkUrls.json?.issue?.images || []).map((i) => i.url).join(', ') || 'none'}`);
    if (junkUrls.json?.issue?._id) await request('DELETE', `/api/issues/${junkUrls.json.issue._id}`, { token });

    /* ───────────────── 3. Reading the board ───────────────── */
    section('3. The board (list, counts, filters)');
    const list = await request('GET', '/api/issues', { token });
    check('The report appears in the list',
      list.status === 200 && (list.json?.issues || []).some((row) => String(row._id) === String(issue?._id)),
      `rows ${(list.json?.issues || []).length}`);
    check('Newest first', (list.json?.issues || [])[0]?._id === issue?._id);
    check('The board reports per-status counts',
      list.json?.byStatus?.Open === 1 && typeof list.json.byStatus.Fixed === 'number',
      JSON.stringify(list.json?.byStatus));

    const openOnly = await request('GET', '/api/issues?status=Open', { token });
    check('Filtering by status works', (openOnly.json?.issues || []).length === 1);
    const fixedOnly = await request('GET', '/api/issues?status=Fixed', { token });
    check('Filtering by a status with no reports returns none', (fixedOnly.json?.issues || []).length === 0);
    const searched = await request('GET', `/api/issues?q=contract+issue+${stamp}`, { token });
    check('Searching by title finds the report', (searched.json?.issues || []).length === 1);
    const searchedNote = await request('GET', '/api/issues?q=reservation+button', { token });
    check('Searching by note text finds the report', (searchedNote.json?.issues || []).length === 1);
    // A regex metacharacter must be escaped, not handed to Mongo as a pattern.
    const searchedRegex = await request('GET', '/api/issues?q=%28%28', { token });
    check('A regex-looking search term is escaped, not executed',
      searchedRegex.status === 200 && (searchedRegex.json?.issues || []).length === 0,
      `status ${searchedRegex.status}`);

    const one = await request('GET', `/api/issues/${issue?._id}`, { token });
    check('Opening one report returns it', one.status === 200 && one.json?.issue?.title === `Contract issue ${stamp}`);
    const missing = await request('GET', '/api/issues/64b7f9c2f1a2b3c4d5e6f7a8', { token });
    check('A missing report answers 404, not 500', missing.status === 404, `status ${missing.status}`);
    const malformed = await request('GET', '/api/issues/not-an-id', { token });
    check('A malformed id answers 404, not a cast error', malformed.status === 404, `status ${malformed.status}`);

    /* ─────────────── 4. Changing a report without losing it ─────────────── */
    section('4. Status, resolution and partial edits');
    const statusChange = await request('PUT', `/api/issues/${issue?._id}`, { token, body: { status: 'In Progress' } });
    check('Status change persists', statusChange.status === 200 && statusChange.json?.issue?.status === 'In Progress',
      `status ${statusChange.json?.issue?.status}`);
    check('A status-only edit leaves the note untouched',
      statusChange.json?.issue?.description === 'The reservation button reads $999 on the course page.\nShould be $499.');
    check('A status-only edit leaves the screenshots untouched',
      statusChange.json?.issue?.images?.length === 2,
      `images ${statusChange.json?.issue?.images?.length}`);

    const resolution = await request('PUT', `/api/issues/${issue?._id}`, {
      token, body: { resolution: 'Put the $499 option back and re-checked both pages.', status: 'Fixed' },
    });
    check('The "what was done" note is stored',
      resolution.json?.issue?.resolution === 'Put the $499 option back and re-checked both pages.');
    check('It survives a later edit that does not mention it',
      (await request('GET', `/api/issues/${issue?._id}`, { token })).json?.issue?.resolution?.startsWith('Put the $499'));

    const addImage = await request('PUT', `/api/issues/${issue?._id}`, {
      token,
      body: {
        images: [
          ...issue.images,
          { url: '/uploads/contract-three.png', filename: 'contract-three.png', caption: 'after the fix' },
        ],
      },
    });
    check('A screenshot can be appended to an existing report',
      addImage.json?.issue?.images?.length === 3, `images ${addImage.json?.issue?.images?.length}`);

    // The dangerous case: a stale bundle posts a half-formed gallery.
    const brokenImages = await request('PUT', `/api/issues/${issue?._id}`, { token, body: { images: 'oops' } });
    check('A malformed images value never wipes the stored screenshots',
      brokenImages.status === 200 && brokenImages.json?.issue?.images?.length === 3,
      `images ${brokenImages.json?.issue?.images?.length}`);

    const notAnArray = await request('PUT', `/api/issues/${issue?._id}`, { token, body: { images: null } });
    check('A null images value never wipes the stored screenshots',
      notAnArray.json?.issue?.images?.length === 3, `images ${notAnArray.json?.issue?.images?.length}`);

    const tooMany = await request('PUT', `/api/issues/${issue?._id}`, {
      token,
      body: { images: Array.from({ length: 40 }, (unused, index) => ({ url: `/uploads/bulk-${index}.png` })) },
    });
    check('An oversized gallery is capped instead of accepted whole',
      tooMany.json?.issue?.images?.length === 12, `images ${tooMany.json?.issue?.images?.length}`);

    // Enum coercion: an unknown value must land on a safe default, never 500 and
    // never a value the panel cannot render.
    const badEnums = await request('PUT', `/api/issues/${issue?._id}`, {
      token,
      body: { category: 'Not A Real Category', severity: 'Apocalyptic' },
    });
    check('An unknown category falls back instead of failing the save',
      badEnums.status === 200 && badEnums.json?.issue?.category === 'Other',
      `category "${badEnums.json?.issue?.category}"`);
    check('An unknown severity falls back to Medium',
      badEnums.json?.issue?.severity === 'Medium', `severity "${badEnums.json?.issue?.severity}"`);

    const titleEdit = await request('PUT', `/api/issues/${issue?._id}`, { token, body: { title: `Contract issue ${stamp} (edited)` } });
    check('Editing the title persists', titleEdit.json?.issue?.title === `Contract issue ${stamp} (edited)`);
    const blankTitle = await request('PUT', `/api/issues/${issue?._id}`, { token, body: { title: '   ' } });
    check('An edit cannot blank the title', blankTitle.status === 400, `status ${blankTitle.status}`);

    /* ───────────────── 5. Audit trail ───────────────── */
    section('5. Audit trail');
    const audit = await request('GET', '/api/settings/audit-logs', { token });
    const auditText = JSON.stringify(audit.json || {});
    check('Filing a report is recorded in the audit log', /ISSUE_REPORTED/.test(auditText));
    check('Updating a report is recorded in the audit log', /ISSUE_UPDATED/.test(auditText));

    /* ───────────────── 6. Deleting ───────────────── */
    section('6. Deleting');
    const deleted = await request('DELETE', `/api/issues/${issue?._id}`, { token });
    check('Deleting a report works', deleted.status === 200, `status ${deleted.status}`);
    const afterDelete = await request('GET', `/api/issues/${issue?._id}`, { token });
    check('A deleted report is gone', afterDelete.status === 404, `status ${afterDelete.status}`);
    const deleteAgain = await request('DELETE', `/api/issues/${issue?._id}`, { token });
    check('Deleting twice answers 404, not 500', deleteAgain.status === 404, `status ${deleteAgain.status}`);
    check('Deleting is recorded in the audit log', /ISSUE_DELETED/.test(JSON.stringify((await request('GET', '/api/settings/audit-logs', { token })).json || {})));

    const emptyBoard = await request('GET', '/api/issues', { token });
    check('The board is empty again after cleanup',
      (emptyBoard.json?.issues || []).length === 0, `rows ${(emptyBoard.json?.issues || []).length}`);
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
  console.log('The issue board keeps every note and screenshot intact ✅');
};

run().catch((error) => {
  console.error('\nVerification crashed:', error.message);
  process.exit(1);
});
