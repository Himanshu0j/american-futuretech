/**
 * Live Jobs board contract test.
 *
 *   npm run verify:jobs
 *
 * The client's requirement is exact: 8 postings per page, and the page count
 * must be recalculated from the FILTERED result set (search "Cloud" + Remote on
 * a 100-job board → 13 matches → 2 pages, never "2 of 100"). It also covers the
 * posted-time field, admin CRUD, duplicate-as-draft and active/inactive hiding.
 *
 * Runs against a throwaway database, so production client content is untouched.
 */

const path = require('path');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5203;
const BASE = `http://127.0.0.1:${PORT}`;
const SEED_ADMIN_PASSWORD = 'Vertex-Jobs-Check-2026!z';
const DB_NAME = `aft_jobstest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;
const PAGE_SIZE = 8;

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

const makeJob = (index, overrides = {}) => ({
  title: `QA Test Job ${index}`,
  company: 'QA Test Partner',
  location: 'Remote (US & Global)',
  employmentType: 'Full-time',
  experienceLevel: 'Entry to Mid Level',
  salaryMin: 90000 + index * 1000,
  salaryMax: 120000 + index * 1000,
  description: `Automated pagination fixture ${index}. Delete me.`,
  responsibilities: ['Fixture duty one', 'Fixture duty two'],
  technicalSkills: ['Python', 'Docker'],
  tools: ['GitHub Actions'],
  languages: ['English (fluent)'],
  benefits: ['Remote-first', 'Learning stipend'],
  ...overrides,
});

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
      JWT_SECRET: 'jobs_board_contract_secret_long_enough_0001',
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
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        const res = await request('GET', '/api/health');
        if (res.status === 200) { healthy = true; break; }
      } catch (error) { /* not up yet */ }
      await sleep(1200);
    }
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

    // ── Start from an empty board so the counts are exact ────────────────────
    // The seeder writes demo postings in the background, so wait until the
    // board stops changing before clearing it — otherwise late fixtures leak in.
    const countBoard = async () => (await request('GET', '/api/jobs?includeAll=true')).json?.count ?? -1;
    let previous = -2;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const current = await countBoard();
      if (current > 0 && current === previous) break;
      previous = current;
      await sleep(900);
    }

    for (let pass = 0; pass < 3; pass += 1) {
      const board = await request('GET', '/api/jobs?includeAll=true');
      for (const job of board.json?.jobs || []) {
        await request('DELETE', `/api/jobs/${job._id}`, { token });
      }
      if ((await countBoard()) === 0) break;
      await sleep(1200);
    }
    const emptied = await request('GET', '/api/jobs?includeAll=true');
    check('Test board starts empty', emptied.json?.count === 0, `count=${emptied.json?.count}`);
    section('1. EXACTLY 8 POSTINGS PER PAGE');

    const createJobs = async (count, overridesFor = () => ({})) => {
      const created = [];
      for (let i = 1; i <= count; i += 1) {
        const res = await request('POST', '/api/jobs', {
          token,
          body: makeJob(i, overridesFor(i)),
        });
        if (res.status !== 201) throw new Error(`job create failed: ${res.status} ${JSON.stringify(res.json)}`);
        created.push(res.json.job);
      }
      return created;
    };

    const createAll = await createJobs(25);
    check('Admin can publish jobs through the API', createAll.length === 25);

    const expectedPages = (total) => Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const scenarios = [
      { total: 1, pages: 1 },
      { total: 8, pages: 1 },
      { total: 9, pages: 2 },
      { total: 16, pages: 2 },
      { total: 17, pages: 3 },
      { total: 24, pages: 3 },
      { total: 25, pages: 4 },
    ];

    for (const scenario of scenarios) {
      // Publish exactly `total` jobs, park the rest as drafts. The board is
      // re-read every scenario so this never acts on a stale publish flag.
      const snapshot = await request('GET', '/api/jobs?includeAll=true');
      const ordered = (snapshot.json?.jobs || []).slice(0, 25);
      for (let i = 0; i < ordered.length; i += 1) {
        const shouldPublish = i < scenario.total;
        const current = ordered[i];
        const isLive = current.isPublished !== false && current.isActive !== false;
        if (isLive !== shouldPublish) {
          const put = await request('PUT', `/api/jobs/${current._id}`, {
            token,
            body: { isPublished: shouldPublish, isActive: shouldPublish },
          });
          if (put.status !== 200) throw new Error(`publish toggle failed: ${put.status} ${JSON.stringify(put.json)}`);
        }
      }

      const page1 = await request('GET', `/api/jobs?limit=${PAGE_SIZE}&page=1`);
      const p = page1.json?.pagination || {};
      const pageCountOk = p.totalPages === expectedPages(scenario.total);
      const sizeOk = page1.json?.count === Math.min(scenario.total, PAGE_SIZE);
      const totalOk = p.total === scenario.total;
      check(
        `${scenario.total} live jobs → page 1 shows ${Math.min(scenario.total, PAGE_SIZE)} and ${expectedPages(scenario.total)} page(s)`,
        sizeOk && pageCountOk && totalOk,
        `count=${page1.json?.count} total=${p.total} pages=${p.totalPages}`,
      );

      if (scenario.pages > 1) {
        const lastPage = await request('GET', `/api/jobs?limit=${PAGE_SIZE}&page=${scenario.pages}`);
        const lastCount = scenario.total - (scenario.pages - 1) * PAGE_SIZE;
        check(
          `${scenario.total} live jobs → last page (${scenario.pages}) holds ${lastCount}`,
          lastPage.json?.count === lastCount,
          `count=${lastPage.json?.count}`,
        );
        const nextDisabled = await request('GET', `/api/jobs?limit=${PAGE_SIZE}&page=${scenario.pages}`);
        check(
          `${scenario.total} live jobs → Next is disabled on the last page`,
          nextDisabled.json?.pagination?.hasNext === false,
        );
        const prevOnFirst = await request('GET', `/api/jobs?limit=${PAGE_SIZE}&page=1`);
        check(
          `${scenario.total} live jobs → Previous is disabled on page 1`,
          prevOnFirst.json?.pagination?.hasPrev === false,
        );
      }
    }

    // A stale page number must never render an empty board.
    const beyondLast = await request('GET', '/api/jobs?limit=8&page=99');
    check(
      'A page number past the end clamps to the last real page',
      beyondLast.json?.count > 0 && beyondLast.json?.pagination?.page <= beyondLast.json?.pagination?.totalPages,
      `page=${beyondLast.json?.pagination?.page} count=${beyondLast.json?.count}`,
    );

    section('2. SEARCH + FILTER + PAGINATION TOGETHER');

    // Publish everything again, then shape the board: 13 remote Cloud roles
    // buried inside 25 postings — exactly the client's example.
    const allJobs2 = await request('GET', '/api/jobs?includeAll=true');
    for (const job of allJobs2.json?.jobs || []) {
      await request('DELETE', `/api/jobs/${job._id}`, { token });
    }

    const cloudJobs = await createJobs(13, (i) => ({
      title: `Cloud Platform Engineer ${i}`,
      location: 'Remote (US & Global)',
      employmentType: 'Full-time',
    }));
    const otherJobs = await createJobs(12, (i) => ({
      title: `Quantitative Data Analyst ${i}`,
      location: 'Austin, TX',
      employmentType: 'Contract',
    }));
    check('Board prepared with 13 Cloud + 12 other postings', cloudJobs.length === 13 && otherJobs.length === 12);

    const filtered = await request('GET', '/api/jobs?limit=8&page=1&search=Cloud&remoteOnly=true');
    const fp = filtered.json?.pagination || {};
    check(
      'Search "Cloud" + Remote recalculates pagination from the 13 matches',
      fp.total === 13 && fp.totalPages === 2 && filtered.json?.count === 8,
      `total=${fp.total} pages=${fp.totalPages} count=${filtered.json?.count}`,
    );

    const filteredPage2 = await request('GET', '/api/jobs?limit=8&page=2&search=Cloud&remoteOnly=true');
    check(
      'Filtered page 2 holds the remaining 5 matches',
      filteredPage2.json?.count === 5 && filteredPage2.json?.pagination?.hasNext === false,
      `count=${filteredPage2.json?.count}`,
    );

    const noMatch = await request('GET', '/api/jobs?limit=8&page=1&search=zzzz-no-such-role');
    check(
      'A search with no matches returns 0 rows and 1 page (never a crash)',
      noMatch.json?.count === 0 && noMatch.json?.pagination?.total === 0 && noMatch.json?.pagination?.totalPages === 1,
      `count=${noMatch.json?.count} pages=${noMatch.json?.pagination?.totalPages}`,
    );

    const typeFilter = await request('GET', '/api/jobs?limit=8&page=1&employmentType=Contract');
    check(
      'Employment-type filter paginates its own result set',
      typeFilter.json?.pagination?.total === 12 && typeFilter.json?.pagination?.totalPages === 2,
      `total=${typeFilter.json?.pagination?.total} pages=${typeFilter.json?.pagination?.totalPages}`,
    );

    const cleared = await request('GET', '/api/jobs?limit=8&page=1');
    check(
      'Clearing every filter returns the full board again',
      cleared.json?.pagination?.total === 25 && cleared.json?.pagination?.totalPages === 4,
      `total=${cleared.json?.pagination?.total} pages=${cleared.json?.pagination?.totalPages}`,
    );

    const salaryFiltered = await request('GET', '/api/jobs?limit=8&page=1&salaryMin=100000');
    const salaryTotal = salaryFiltered.json?.pagination?.total ?? 0;
    const everyRowAboveFloor = (salaryFiltered.json?.jobs || []).every((job) => Number(job.salaryFloor) >= 100000);
    check(
      'Salary band filter runs in the database (no in-memory rows leak in)',
      salaryTotal > 0 && salaryTotal < 25 && everyRowAboveFloor,
      `total=${salaryTotal}`,
    );

    const facets = cleared.json?.facets?.departments || [];
    check('Department facets come from the whole board, not one page', facets.length >= 1, facets.join(', '));

    section('3. POSTED TIME');

    const fresh = await request('GET', '/api/jobs?limit=1&page=1&sort=newest');
    const newestJob = fresh.json?.jobs?.[0];
    check(
      'Every posting carries a real posted timestamp',
      Boolean(newestJob?.postedAt || newestJob?.createdAt),
      String(newestJob?.postedAt || newestJob?.createdAt),
    );

    const futureDated = await request('POST', '/api/jobs', {
      token,
      body: makeJob(99, { postedAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() }),
    });
    check(
      'A future Posted Date is rejected with 400',
      futureDated.status === 400,
      `status=${futureDated.status} message=${futureDated.json?.message}`,
    );

    const backDated = await request('POST', '/api/jobs', {
      token,
      body: makeJob(98, {
        title: 'Back-dated Cloud Architect',
        postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    check(
      'A back-dated posting keeps the admin-chosen date',
      backDated.status === 201 && Boolean(backDated.json?.job?.postedAt),
      String(backDated.json?.job?.postedAt),
    );

    const orderedByNewest = await request('GET', '/api/jobs?limit=8&page=1&sort=newest');
    check(
      'Newest-first ordering uses the posted date',
      new Date(orderedByNewest.json?.jobs?.[0]?.postedAt || 0) >=
        new Date(orderedByNewest.json?.jobs?.[1]?.postedAt || 0),
    );

    section('4. ADMIN CRUD + POINTER FIELDS');

    const created = await request('POST', '/api/jobs', {
      token,
      body: makeJob(77, {
        title: 'QA Pointer Editor Role',
        tools: ['Terraform', 'Datadog'],
        languages: ['English (fluent)'],
        benefits: ['401k', 'Remote-first'],
        order: 5,
        isFeatured: true,
      }),
    });
    const jobId = created.json?.job?._id;
    check('Create returns the saved posting', created.status === 201 && Boolean(jobId));

    const readBack = await request('GET', `/api/jobs/admin/${jobId}`, { token });
    const savedJob = readBack.json?.job || {};
    check(
      'Pointer lists (tools / languages / benefits) persist exactly',
      JSON.stringify(savedJob.tools) === JSON.stringify(['Terraform', 'Datadog']) &&
        JSON.stringify(savedJob.benefits) === JSON.stringify(['401k', 'Remote-first']) &&
        JSON.stringify(savedJob.languages) === JSON.stringify(['English (fluent)']),
      `tools=${JSON.stringify(savedJob.tools)}`,
    );
    check('Display order and featured flag persist', savedJob.order === 5 && savedJob.isFeatured === true);

    const edited = await request('PUT', `/api/jobs/${jobId}`, {
      token,
      body: { title: 'QA Pointer Editor Role (edited)', tools: ['Terraform', 'Datadog', 'PagerDuty'], order: 1, isFeatured: false },
    });
    const afterEdit = await request('GET', `/api/jobs/admin/${jobId}`, { token });
    check(
      'Editing updates the title and replaces the tool list',
      edited.status === 200 &&
        afterEdit.json?.job?.title === 'QA Pointer Editor Role (edited)' &&
        afterEdit.json?.job?.tools?.length === 3 &&
        afterEdit.json?.job?.order === 1 &&
        afterEdit.json?.job?.isFeatured === false,
      JSON.stringify(afterEdit.json?.job?.tools),
    );

    const salaryFloorRecalculated = await request('PUT', `/api/jobs/${jobId}`, {
      token,
      body: { salaryMin: 151000, salaryMax: 190000 },
    });
    const floorCheck = await request('GET', `/api/jobs/admin/${jobId}`, { token });
    check(
      'Editing salary recalculates the filterable salary floor',
      salaryFloorRecalculated.status === 200 && Number(floorCheck.json?.job?.salaryFloor) === 151000,
      `salaryFloor=${floorCheck.json?.job?.salaryFloor}`,
    );

    const duplicated = await request('POST', `/api/jobs/${jobId}/duplicate`, { token, body: {} });
    check(
      'Duplicate creates a separate draft copy',
      duplicated.status === 201 &&
        duplicated.json?.job?._id !== jobId &&
        duplicated.json?.job?.isPublished === false &&
        String(duplicated.json?.job?.title).includes('(Copy)'),
      duplicated.json?.job?.title,
    );

    section('5. ACTIVE / INACTIVE HIDING');

    await request('PUT', `/api/jobs/${jobId}`, { token, body: { isPublished: false, isActive: false } });
    const publicAfterHide = await request('GET', '/api/jobs?limit=8&page=1&search=QA Pointer Editor Role');
    check(
      'Deactivating a job removes it from the public board',
      publicAfterHide.json?.count === 0,
      `count=${publicAfterHide.json?.count}`,
    );

    await request('PUT', `/api/jobs/${jobId}`, { token, body: { isPublished: true, isActive: true } });
    const publicAfterShow = await request('GET', '/api/jobs?limit=8&page=1&search=QA Pointer Editor Role (edited)');
    check(
      'Reactivating it brings it straight back',
      publicAfterShow.json?.count === 1,
      `count=${publicAfterShow.json?.count}`,
    );

    section('6. SECURITY');

    const anonCreate = await request('POST', '/api/jobs', { body: makeJob(1) });
    check('Anonymous job creation is rejected', anonCreate.status === 401, `status=${anonCreate.status}`);

    const anonDuplicate = await request('POST', `/api/jobs/${jobId}/duplicate`, { body: {} });
    check('Anonymous duplicate is rejected', anonDuplicate.status === 401, `status=${anonDuplicate.status}`);

    const anonAdminList = await request('GET', '/api/jobs/admin/applications');
    check('Applicant data needs a token', anonAdminList.status === 401, `status=${anonAdminList.status}`);

    const scriptLink = await request('POST', '/api/jobs', {
      token,
      body: makeJob(55, { applyLink: 'javascript:alert(1)' }),
    });
    check('A javascript: apply link is rejected', scriptLink.status === 400, `status=${scriptLink.status}`);

    const salarySwap = await request('POST', '/api/jobs', {
      token,
      body: makeJob(56, { salaryMin: 200000, salaryMax: 100000 }),
    });
    check('Min salary above max salary is rejected', salarySwap.status === 400, `status=${salarySwap.status}`);

    // A malformed id used to be swallowed by /:id and come back as a 500 with the
    // raw mongoose CastError text attached to the response.
    const malformed = await request('GET', '/api/jobs/filters');
    check('A malformed job id returns 404, never a 500 leaking an internal error',
      malformed.status === 404, `status=${malformed.status}`);
    check('The malformed-id response carries no internal error text',
      !/cast|objectid|mongoose/i.test(JSON.stringify(malformed.json || {})),
      JSON.stringify(malformed.json || {}).slice(0, 90));

    const cleanupList = await request('GET', '/api/jobs?includeAll=true');
    for (const job of cleanupList.json?.jobs || []) {
      await request('DELETE', `/api/jobs/${job._id}`, { token });
    }
    const finalCount = await request('GET', '/api/jobs?includeAll=true');
    check('All test fixtures removed after the run', finalCount.json?.count === 0);
  } catch (error) {
    check('Suite ran to completion', false, error.message);
  } finally {
    await stopServer();
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'═'.repeat(64)}`);
  console.log(`RESULT: ${passed}/${results.length} checks passed${failed.length ? ` — ${failed.length} FAILED` : ' ✅'}`);
  failed.forEach((f) => console.log(`   ❌ ${f.name}${f.detail ? ` — ${f.detail}` : ''}`));
  console.log('═'.repeat(64));
  if (failed.length) {
    console.log('\nServer log tail:');
    console.log(serverLog.split('\n').slice(-25).join('\n'));
  }
  process.exit(failed.length ? 1 : 0);
};

run();
