/**
 * Role matrix regression (RBAC + privilege escalation + JWT handling).
 *
 *   npm run verify:rbac
 *
 * Boots a real API process against a throwaway database and walks every
 * privilege tier the platform actually has:
 *
 *   SUPERADMIN              unconditional authority
 *   ADMIN + all perms       the "full admin" the client asked for
 *   ADMIN + COURSES_* only  "limited admin"  (write access to one module)
 *   ADMIN + *_VIEW only     "read-only admin"
 *   COUNSELOR               role-gated: leads, support queue, student list
 *   INSTRUCTOR              role-gated: curriculum authoring
 *   STUDENT                 no admin surface at all
 *
 * Note on naming: the live schema has no ADMIN_FULL / ADMIN_LIMITED /
 * ADMIN_READ_ONLY roles. `server/models/User.js` defines
 * SUPERADMIN | ADMIN | COUNSELOR | INSTRUCTOR | STUDENT, and a normal ADMIN is
 * scoped by its `permissions[]` array. The three admin tiers below are that
 * permission array, which is exactly what the Staff & RBAC panel edits.
 *
 * The enforced model (server/middleware/auth.js `authorizeScoped`):
 *   - SUPERADMIN unrestricted;
 *   - a non-ADMIN role keeps its documented scope (COUNSELOR on leads/support,
 *     INSTRUCTOR on curriculum);
 *   - ADMIN needs the module's permission from the matrix the admin panel
 *     itself uses (payments → SETTINGS_VIEW, dashboard → DASHBOARD_VIEW,
 *     leads → LEADS_*, support → STUDENTS_VIEW / STUDENTS_EDIT, curriculum →
 *     COURSES_CREATE / COURSES_EDIT / COURSES_DELETE).
 * Both sides are asserted: every un-granted tier is denied, and every granted
 * tier still gets 200/201 — no legitimate access was removed.
 *
 * Anything a tier is not granted must come back 401/403 — that is the whole
 * point of the suite. Permission expectations are derived from
 * `client/src/constants/permissions.js` rather than hardcoded, so the checks
 * stay honest when the catalogue changes.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5608;
const BASE = `http://127.0.0.1:${PORT}`;
const DB_NAME = `aft_rbactest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;

const ADMIN_EMAIL = 'admin@americanfuturetech.com';
const ADMIN_PASSWORD = 'Rbac-Matrix-2026!x7';

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const section = (title) => console.log(`\n${'─'.repeat(64)}\n${title}\n${'─'.repeat(64)}`);
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
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (error) { json = null; }
  return { status: res.status, text, json };
};

const DENIED = [401, 403];
const isDenied = (res) => DENIED.includes(res.status);
const describe = (res) => `HTTP ${res.status}`;

/** The permission catalogue the Staff panel actually renders. */
const readPermissionCatalogue = () => {
  const file = path.join(__dirname, '..', 'client', 'src', 'constants', 'permissions.js');
  const source = fs.readFileSync(file, 'utf8');
  return [...new Set((source.match(/'([A-Z][A-Z_]{2,})'/g) || []).map((s) => s.replace(/'/g, '')))];
};

const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

const run = async () => {
  const ALL_PERMISSIONS = readPermissionCatalogue();
  const coursesPerms = ALL_PERMISSIONS.filter((p) => p.startsWith('COURSES_'));
  const viewPerms = ALL_PERMISSIONS.filter((p) => p.endsWith('_VIEW'));
  console.log(`\nBooting API on port ${PORT} against ${DB_NAME}`);
  console.log(`Permission catalogue: ${ALL_PERMISSIONS.length} permissions`);
  console.log(`  full admin     : all ${ALL_PERMISSIONS.length}`);
  console.log(`  limited admin  : ${coursesPerms.join(', ') || '(none)'}`);
  console.log(`  read-only admin: ${viewPerms.length} *_VIEW permissions\n`);

  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGODB_URI: MONGO_URI,
      NODE_ENV: 'production',
      SEED_ON_BOOT: 'true',
      SEED_ADMIN_PASSWORD: ADMIN_PASSWORD,
      JWT_SECRET: 'rbac_matrix_secret_long_enough_00000001',
      CLIENT_URL: 'http://localhost:5173',
      NOTIFICATION_EMAIL: 'verify@example.com',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  server.stdout.on('data', (c) => { serverLog += c.toString(); });
  server.stderr.on('data', (c) => { serverLog += c.toString(); });

  const shutdown = async () => {
    server.kill();
    await sleep(700);
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
    for (let attempt = 0; attempt < 45; attempt += 1) {
      try {
        const res = await request('GET', '/api/health');
        if (res.status === 200) { healthy = true; break; }
      } catch (error) { /* booting */ }
      await sleep(1200);
    }
    check('API boots against a throwaway database', healthy);
    if (!healthy) throw new Error('server never became reachable');

    const login = async (email, password) => {
      const res = await request('POST', '/api/auth/login', { body: { email, password } });
      return { token: res.json?.token || '', id: res.json?.user?._id || res.json?.user?.id || '', status: res.status };
    };

    // The seeder runs alongside the health endpoint going green, so the first
    // login can legitimately arrive before the account exists.
    let superAdmin = { token: '', id: '', status: 0 };
    for (let attempt = 0; attempt < 30; attempt += 1) {
      superAdmin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      if (superAdmin.token) break;
      await sleep(1200);
    }
    check('SUPERADMIN can sign in', Boolean(superAdmin.token), describe(superAdmin));
    if (!superAdmin.token) throw new Error('could not authenticate as superadmin');

    // ── Provision one account per privilege tier ──────────────────────────
    const stamp = Date.now();
    const tiers = [
      // Passwords must not contain any name part of their own account (the
      // platform enforces that), hence the neutral wording.
      { key: 'full', name: 'Tier Full', email: `rbac.full.${stamp}@americanfuturetech.com`, role: 'ADMIN', permissions: ALL_PERMISSIONS, password: 'Kestrel-Harbor-19!' },
      { key: 'limited', name: 'Tier Limited', email: `rbac.limited.${stamp}@americanfuturetech.com`, role: 'ADMIN', permissions: coursesPerms, password: 'Quartz-Lantern-27!' },
      { key: 'readonly', name: 'Tier Readonly', email: `rbac.readonly.${stamp}@americanfuturetech.com`, role: 'ADMIN', permissions: viewPerms, password: 'Nimbus-Ridge-31!' },
      { key: 'counselor', name: 'Tier Four', email: `rbac.four.${stamp}@americanfuturetech.com`, role: 'COUNSELOR', permissions: [], password: 'Sable-Meadow-42!' },
      { key: 'instructor', name: 'Tier Five', email: `rbac.five.${stamp}@americanfuturetech.com`, role: 'INSTRUCTOR', permissions: [], password: 'Verdant-Pilot-53!' },
      { key: 'studentA', name: 'Tier Six', email: `rbac.six.${stamp}@example.com`, role: 'STUDENT', permissions: [], password: 'Amber-Falcon-64!' },
      { key: 'studentB', name: 'Tier Seven', email: `rbac.seven.${stamp}@example.com`, role: 'STUDENT', permissions: [], password: 'Cobalt-Tundra-75!' },
    ];

    const actors = {};
    for (const tier of tiers) {
      const created = await request('POST', '/api/auth/users', {
        token: superAdmin.token,
        body: { name: tier.name, email: tier.email, role: tier.role, permissions: tier.permissions, password: tier.password },
      });
      const id = created.json?.user?.id || created.json?.user?._id || '';
      const session = created.status === 201 ? await login(tier.email, tier.password) : { token: '', id, status: 0 };
      actors[tier.key] = {
        ...tier,
        id,
        token: session.token,
        createStatus: created.status,
        createMessage: created.json?.message || created.text?.slice(0, 120) || '',
        loginStatus: session.status,
      };
    }
    const provisioned = tiers.every((t) => actors[t.key].token);
    check(
      'Every privilege tier can be provisioned and sign in',
      provisioned,
      tiers.map((t) => `${t.key}:${actors[t.key].token ? 'ok' : 'FAIL'}`).join(' '),
    );
    if (!provisioned) {
      for (const tier of tiers) {
        const a = actors[tier.key];
        if (!a.token) console.log(`    · ${tier.key}: create HTTP ${a.createStatus} ${a.createMessage} | login HTTP ${a.loginStatus}`);
      }
    }
    if (!provisioned) throw new Error('could not provision the role matrix');

    // ── Fixtures the permission checks act on ────────────────────────────
    // A real lead and a real ticket, so "can this tier edit it / change its
    // status" is answered against a live document rather than a fake id.
    const leadRes = await request('POST', '/api/leads', {
      body: {
        fullName: 'Rbac Fixture Lead',
        email: `rbac.lead.${stamp}@example.com`,
        phone: '+15550002222',
        courseInterest: 'Data Science with AI Integration',
      },
    });
    // The public submission endpoint answers `{ success, message, leadId }`.
    const leadId = leadRes.json?.leadId || leadRes.json?.lead?._id || leadRes.json?.lead?.id;
    const ticketRes = await request('POST', '/api/support/tickets', {
      token: actors.studentA.token,
      body: { subject: `Rbac fixture ticket ${stamp}`, message: 'Created by the role-matrix suite.', category: 'General' },
    });
    const ticketId = ticketRes.json?.ticket?._id || ticketRes.json?.ticket?.id;
    check(
      'Fixtures created for the permission checks (one lead, one ticket)',
      Boolean(leadId) && Boolean(ticketId),
      `lead HTTP ${leadRes.status} ${leadId ? 'ok' : 'missing'} · ticket HTTP ${ticketRes.status} ${ticketId ? 'ok' : 'missing'}`,
    );
    if (!leadId || !ticketId) throw new Error('could not create the fixtures');

    /* ══════════════════════════════════════════════════════════════════════
       1. Anonymous callers
       ══════════════════════════════════════════════════════════════════════ */
    section('1. Anonymous callers get nothing');
    const anonTargets = [
      ['GET', '/api/auth/users'],
      ['GET', '/api/payments'],
      ['GET', '/api/students/admin'],
      ['GET', '/api/courses/admin/all'],
      ['GET', '/api/jobs/admin/applications'],
      ['GET', '/api/support/admin/tickets'],
      ['GET', '/api/coupons'],
      ['GET', '/api/leads'],
      ['GET', '/api/analytics/dashboard'],
      ['PUT', '/api/settings'],
      ['DELETE', '/api/courses/000000000000000000000000'],
    ];
    for (const [method, url] of anonTargets) {
      const res = await request(method, url, { body: method === 'PUT' ? {} : undefined });
      check(`Anonymous ${method} ${url} is denied`, isDenied(res), describe(res));
    }

    /* ══════════════════════════════════════════════════════════════════════
       2. Student: no admin surface, but full use of their own portal
       ══════════════════════════════════════════════════════════════════════ */
    section('2. STUDENT — admin surface closed, own portal open');
    const studentToken = actors.studentA.token;
    const studentTargets = [
      ['GET', '/api/auth/users'],
      ['POST', '/api/auth/users', { name: 'Sneaky', email: `sneaky.${stamp}@example.com`, role: 'ADMIN', password: 'Matrix-Pass-Sneaky-98!' }],
      ['PUT', '/api/settings', { footer: {} }],
      ['GET', '/api/payments'],
      ['GET', '/api/students/admin'],
      ['GET', '/api/students'],
      ['GET', '/api/courses/admin/all'],
      ['PUT', '/api/courses/000000000000000000000000', { title: 'nope' }],
      ['GET', '/api/jobs/admin/applications'],
      ['GET', '/api/support/admin/tickets'],
      ['GET', '/api/coupons'],
      ['POST', '/api/coupons', { code: 'HACKED', discountType: 'percent', discountValue: 100 }],
      ['GET', '/api/leads'],
      ['GET', '/api/analytics/dashboard'],
      ['GET', '/api/settings/audit-logs'],
      ['POST', '/api/curriculum/modules', { courseId: '000000000000000000000000', title: 'nope' }],
      ['PATCH', '/api/students/000000000000000000000000/000000000000000000000000/payment', { status: 'Paid' }],
      ['GET', '/api/support/admin/tickets'],
    ];
    for (const [method, url, body] of studentTargets) {
      const res = await request(method, url, { token: studentToken, body });
      check(`STUDENT ${method} ${url} is denied`, isDenied(res), describe(res));
    }
    const lmsDashboard = await request('GET', '/api/lms/dashboard', { token: studentToken });
    check('STUDENT can load their own LMS dashboard', lmsDashboard.status === 200, describe(lmsDashboard));
    const myCourses = await request('GET', '/api/lms/my-courses', { token: studentToken });
    check('STUDENT can load their own course list', myCourses.status === 200, describe(myCourses));
    const myCerts = await request('GET', '/api/lms/certificates', { token: studentToken });
    check('STUDENT can load their own certificates', myCerts.status === 200, describe(myCerts));
    const myPayments = await request('GET', '/api/payments/my-payments', { token: studentToken });
    check('STUDENT can load their own receipts', myPayments.status === 200, describe(myPayments));

    /* ══════════════════════════════════════════════════════════════════════
       3. Read-only admin: *_VIEW only
       ══════════════════════════════════════════════════════════════════════ */
    section('3. ADMIN (read-only) — reads yes, writes no');
    const ro = actors.readonly;
    const hasRo = (perm) => ro.permissions.includes(perm);
    const courseId = (await request('GET', '/api/courses')).json?.courses?.[0]?._id;

    const roCourses = await request('GET', '/api/courses/admin/all', { token: ro.token });
    check(`Read-only admin can read the course admin list (COURSES_VIEW${hasRo('COURSES_VIEW') ? '' : ' absent'})`,
      hasRo('COURSES_VIEW') ? roCourses.status === 200 : isDenied(roCourses), describe(roCourses));

    const roStaffList = await request('GET', '/api/auth/users', { token: ro.token });
    check('Staff list access follows ADMIN_MANAGEMENT_VIEW exactly',
      hasRo('ADMIN_MANAGEMENT_VIEW') ? roStaffList.status === 200 : isDenied(roStaffList), describe(roStaffList));

    const roWrites = [
      ['POST', '/api/courses', { title: `RO write ${stamp}`, category: 'Rbac', duration: '1 Month', pricing: { basePrice: 100, discountedPrice: 90 } }],
      ['PUT', `/api/courses/${courseId}`, { title: 'Read-only admin should not be able to rename this' }],
      ['DELETE', `/api/courses/${courseId}`],
      ['PATCH', `/api/courses/${courseId}/badge`],
      ['PUT', '/api/settings', { footer: {} }],
      ['POST', '/api/coupons', { code: `RO${stamp}`.slice(0, 12), discountType: 'percent', discountValue: 5 }],
      ['POST', '/api/auth/users', { name: 'RO Staff', email: `ro.staff.${stamp}@example.com`, role: 'COUNSELOR', password: 'Matrix-Pass-ROStaff-99!' }],
      ['PUT', '/api/auth/users/000000000000000000000000', { isActive: false }],
      ['POST', '/api/students/admin', { name: 'RO Student', email: `ro.student.${stamp}@example.com` }],
      ['POST', '/api/jobs', { title: 'RO job', company: 'X', location: 'Remote' }],
      ['POST', '/api/content/blogs', { title: 'RO blog', content: 'nope' }],
    ];
    for (const [method, url, body] of roWrites) {
      const res = await request(method, url, { token: ro.token, body });
      check(`Read-only admin ${method} ${url} is denied`, isDenied(res), describe(res));
    }

    // A read-only auditor must KEEP the reads its *_VIEW grants entitle it to.
    // This is the "did the fix remove legitimate access?" side of the change.
    const roReads = [
      ['GET', '/api/payments', 'SETTINGS_VIEW'],
      ['GET', '/api/analytics/dashboard', 'DASHBOARD_VIEW'],
      ['GET', '/api/leads', 'LEADS_VIEW'],
      ['GET', '/api/support/admin/tickets', 'STUDENTS_VIEW'],
      ['GET', '/api/students', 'STUDENTS_VIEW'],
      ['GET', '/api/students/admin', 'STUDENTS_VIEW'],
    ];
    for (const [method, url, permission] of roReads) {
      const res = await request(method, url, { token: ro.token });
      check(`Read-only admin keeps ${method} ${url} (holds ${permission})`, res.status === 200, describe(res));
    }

    // The write side of the same modules: a *_VIEW grant must not authorise a
    // write, and curriculum authoring needs COURSES_CREATE/DELETE.
    const roScopedWrites = [
      ['GET', '/api/leads/export/csv', undefined, 'needs LEADS_EXPORT'],
      ['POST', `/api/leads/${leadId}/call-logs`, { note: 'read-only admin should not log calls' }, 'needs LEADS_EDIT'],
      ['PATCH', `/api/leads/${leadId}/status`, { status: 'Contacted' }, 'needs LEADS_EDIT'],
      ['PATCH', `/api/support/admin/tickets/${ticketId}/status`, { status: 'Closed' }, 'needs STUDENTS_EDIT'],
      ['POST', '/api/curriculum/modules', { course: courseId, moduleNumber: 1, title: `RO module ${stamp}` }, 'needs COURSES_CREATE'],
      ['POST', '/api/curriculum/lessons', { module: '000000000000000000000000', title: 'RO lesson' }, 'needs COURSES_CREATE'],
      ['DELETE', '/api/curriculum/modules/000000000000000000000000', undefined, 'needs COURSES_DELETE'],
    ];
    for (const [method, url, body, why] of roScopedWrites) {
      const res = await request(method, url, { token: ro.token, body });
      check(`Read-only admin ${method} ${url} is denied (${why})`, isDenied(res), describe(res));
    }

    /* ══════════════════════════════════════════════════════════════════════
       4. Limited admin: COURSES_* only
       ══════════════════════════════════════════════════════════════════════ */
    section('4. ADMIN (limited) — one module writable, everything else closed');
    const lim = actors.limited;
    const limCreate = await request('POST', '/api/courses', {
      token: lim.token,
      body: {
        title: `Rbac temp course ${stamp}`,
        category: 'Rbac Matrix',
        duration: '1 Month',
        pricing: { basePrice: 500, discountedPrice: 400 },
        highlights: ['created by the rbac suite'],
        isPublished: false,
      },
    });
    const tempCourseId = limCreate.json?.course?._id || limCreate.json?.course?.id || limCreate.json?.data?._id;
    check('Limited admin can create a course (COURSES_CREATE)', limCreate.status === 201 && Boolean(tempCourseId), describe(limCreate));

    if (tempCourseId) {
      const limEdit = await request('PUT', `/api/courses/${tempCourseId}`, { token: lim.token, body: { title: `Rbac temp course edited ${stamp}` } });
      check('Limited admin can edit a course (COURSES_EDIT)', limEdit.status === 200, describe(limEdit));
    }

    const limOutside = [
      ['PUT', '/api/settings', { footer: {} }],
      ['GET', '/api/auth/users'],
      ['POST', '/api/auth/users', { name: 'Lim Staff', email: `lim.staff.${stamp}@example.com`, role: 'COUNSELOR', password: 'Matrix-Pass-LimStaff-00!' }],
      ['POST', '/api/coupons', { code: `LIM${stamp}`.slice(0, 12), discountType: 'percent', discountValue: 5 }],
      ['GET', '/api/students/admin'],
      ['GET', '/api/courses/admin/all'],
    ];
    for (const [method, url, body] of limOutside) {
      const res = await request(method, url, { token: lim.token, body });
      const permission = url === '/api/courses/admin/all' ? 'COURSES_VIEW' : '';
      const expectedOpen = permission && lim.permissions.includes(permission);
      check(`Limited admin ${method} ${url} is ${expectedOpen ? 'allowed by its grant' : 'denied'}`,
        expectedOpen ? res.status === 200 : isDenied(res), describe(res));
    }

    // A courses-only admin must not reach the other modules, even though its
    // ROLE is 'ADMIN' — this was the actual over-exposure.
    const limOtherModules = [
      ['GET', '/api/payments', 'SETTINGS_VIEW'],
      ['GET', '/api/leads', 'LEADS_VIEW'],
      ['GET', '/api/support/admin/tickets', 'STUDENTS_VIEW'],
      ['GET', '/api/analytics/dashboard', 'DASHBOARD_VIEW'],
      ['GET', '/api/students', 'STUDENTS_VIEW'],
      ['GET', '/api/settings/audit-logs', 'AUDIT_LOG_VIEW'],
    ];
    for (const [method, url, permission] of limOtherModules) {
      const res = await request(method, url, { token: lim.token });
      check(`Courses-only admin ${method} ${url} is denied (lacks ${permission})`, isDenied(res), describe(res));
    }

    // ...while its own module stays fully usable (no legitimate access removed).
    if (tempCourseId) {
      const limCurriculum = await request('POST', '/api/curriculum/modules', {
        token: lim.token,
        body: { course: tempCourseId, moduleNumber: 1, title: `Limited admin module ${stamp}` },
      });
      check('Courses-only admin can still author curriculum (holds COURSES_CREATE)',
        limCurriculum.status === 201, describe(limCurriculum));
    }

    /* ══════════════════════════════════════════════════════════════════════
       5. Full admin: every permission
       ══════════════════════════════════════════════════════════════════════ */
    section('5. ADMIN (full) — the whole admin surface works');
    const full = actors.full;
    const settingsDoc = (await request('GET', '/api/settings')).json?.settings || {};
    const fullChecks = [
      ['GET', '/api/auth/users'],
      ['GET', '/api/payments'],
      ['GET', '/api/students/admin'],
      ['GET', '/api/courses/admin/all'],
      ['GET', '/api/jobs/admin/applications'],
      ['GET', '/api/support/admin/tickets'],
      ['GET', '/api/coupons'],
      ['GET', '/api/settings/audit-logs'],
      ['GET', '/api/leads'],
    ];
    for (const [method, url] of fullChecks) {
      const res = await request(method, url, { token: full.token });
      check(`Full admin ${method} ${url} returns 200`, res.status === 200, describe(res));
    }
    const fullSettingsSave = await request('PUT', '/api/settings', {
      token: full.token,
      body: { footer: settingsDoc.footer },
    });
    check('Full admin can save settings (SETTINGS_EDIT)', fullSettingsSave.status === 200, describe(fullSettingsSave));

    const fullCoupon = await request('POST', '/api/coupons', {
      token: full.token,
      body: { code: `RBAC${stamp}`.slice(0, 14), discountType: 'percent', discountValue: 7, description: 'rbac suite' },
    });
    const fullCouponId = fullCoupon.json?.coupon?._id || fullCoupon.json?.coupon?.id;
    check('Full admin can create a coupon (COUPONS_CREATE)', fullCoupon.status === 201 && Boolean(fullCouponId), describe(fullCoupon));
    if (fullCouponId) {
      const fullCouponDelete = await request('DELETE', `/api/coupons/${fullCouponId}`, { token: full.token });
      check('Full admin can delete that coupon (COUPONS_DELETE)', fullCouponDelete.status === 200, describe(fullCouponDelete));
    }
    const fullAnalytics = await request('GET', '/api/analytics/dashboard', { token: full.token });
    check('Full admin can load dashboard analytics', fullAnalytics.status === 200, describe(fullAnalytics));

    // The permission-scoped modules must stay fully usable when the grants are
    // actually held — this is the "nothing legitimate was removed" proof.
    const fullLeadLog = await request('POST', `/api/leads/${leadId}/call-logs`, {
      token: full.token,
      body: { note: 'Full admin call log.', callOutcome: 'Answered' },
    });
    check('Full admin can log a lead call (LEADS_EDIT)', fullLeadLog.status === 201, describe(fullLeadLog));
    const fullLeadExport = await request('GET', '/api/leads/export/csv', { token: full.token });
    check('Full admin can export the lead CSV (LEADS_EXPORT)', fullLeadExport.status === 200, describe(fullLeadExport));
    const fullTicketStatus = await request('PATCH', `/api/support/admin/tickets/${ticketId}/status`, {
      token: full.token,
      body: { status: 'In Progress' },
    });
    check('Full admin can change a ticket status (STUDENTS_EDIT)', fullTicketStatus.status === 200, describe(fullTicketStatus));

    if (tempCourseId) {
      const fullCurriculum = await request('POST', '/api/curriculum/modules', {
        token: full.token,
        body: { course: tempCourseId, moduleNumber: 2, title: `Full admin module ${stamp}` },
      });
      const fullModuleId = fullCurriculum.json?.module?._id || fullCurriculum.json?.module?.id;
      check('Full admin can author curriculum (COURSES_CREATE)',
        fullCurriculum.status === 201 && Boolean(fullModuleId), describe(fullCurriculum));
      if (fullModuleId) {
        const fullModuleDelete = await request('DELETE', `/api/curriculum/modules/${fullModuleId}`, { token: full.token });
        check('Full admin can delete a curriculum module (COURSES_DELETE)', fullModuleDelete.status === 200, describe(fullModuleDelete));
      }
    }

    if (tempCourseId) {
      const cleanupDelete = await request('DELETE', `/api/courses/${tempCourseId}`, { token: full.token });
      check('Full admin can delete the throwaway course (COURSES_DELETE)', cleanupDelete.status === 200, describe(cleanupDelete));
    }

    /* ══════════════════════════════════════════════════════════════════════
       6. Counselor and Instructor: role-gated tiers
       ══════════════════════════════════════════════════════════════════════ */
    section('6. COUNSELOR and INSTRUCTOR — role-gated, not permission-gated');
    const counselor = actors.counselor;
    const counselorAllowed = [
      ['GET', '/api/leads'],
      ['GET', '/api/support/admin/tickets'],
      ['GET', '/api/students'],
      ['GET', '/api/analytics/dashboard'],
    ];
    for (const [method, url] of counselorAllowed) {
      const res = await request(method, url, { token: counselor.token });
      check(`COUNSELOR ${method} ${url} is allowed (own role scope)`, res.status === 200, describe(res));
    }
    // The counselor's job is to WORK the queue, not just read it — the fix must
    // not have turned a working counselor read-only.
    const counselorLeadLog = await request('POST', `/api/leads/${leadId}/call-logs`, {
      token: counselor.token,
      body: { note: 'Counselor call log.', callOutcome: 'Answered' },
    });
    check('COUNSELOR can log a lead call (documented role scope)', counselorLeadLog.status === 201, describe(counselorLeadLog));
    const counselorTicket = await request('PATCH', `/api/support/admin/tickets/${ticketId}/status`, {
      token: counselor.token,
      body: { status: 'Resolved' },
    });
    check('COUNSELOR can work the support queue (documented role scope)', counselorTicket.status === 200, describe(counselorTicket));
    const counselorDenied = [
      ['GET', '/api/payments'],
      ['PUT', '/api/settings', { footer: {} }],
      ['POST', '/api/auth/users', { name: 'C Staff', email: `c.staff.${stamp}@example.com`, role: 'COUNSELOR', password: 'Matrix-Pass-CStaff-01!' }],
      ['POST', '/api/courses', { title: 'Counselor course', category: 'X', duration: '1 Month', pricing: { basePrice: 1, discountedPrice: 1 } }],
      ['POST', '/api/curriculum/modules', { courseId, title: 'Counselor module' }],
      ['GET', '/api/courses/admin/all'],
    ];
    for (const [method, url, body] of counselorDenied) {
      const res = await request(method, url, { token: counselor.token, body });
      check(`COUNSELOR ${method} ${url} is denied`, isDenied(res), describe(res));
    }

    const instructor = actors.instructor;
    const instructorCurriculum = await request('POST', '/api/curriculum/modules', {
      token: instructor.token,
      body: { course: courseId, moduleNumber: 90, title: `Instructor module ${stamp}` },
    });
    check('INSTRUCTOR can still author curriculum (documented role scope)',
      instructorCurriculum.status === 201, describe(instructorCurriculum));

    const instructorDenied = [
      ['DELETE', '/api/curriculum/modules/000000000000000000000000'],
      ['DELETE', '/api/curriculum/lessons/000000000000000000000000'],
      ['GET', '/api/auth/users'],
      ['GET', '/api/payments'],
      ['PUT', '/api/settings', { footer: {} }],
      ['GET', '/api/coupons'],
      ['GET', '/api/leads'],
      ['GET', '/api/analytics/dashboard'],
    ];
    for (const [method, url, body] of instructorDenied) {
      const res = await request(method, url, { token: instructor.token, body });
      check(`INSTRUCTOR ${method} ${url} is denied`, isDenied(res), describe(res));
    }

    /* ══════════════════════════════════════════════════════════════════════
       7. Privilege escalation attempts
       ══════════════════════════════════════════════════════════════════════ */
    section('7. Privilege escalation attempts');
    const sneakyEmail = `sneaky.super.${stamp}@example.com`;
    const escalate = await request('POST', '/api/auth/users', {
      token: full.token,
      body: { name: 'Sneaky Super', email: sneakyEmail, role: 'SUPERADMIN', password: 'Kestrel-Harbor-19-extra!' },
    });
    const escalatedUser = (await request('GET', '/api/auth/users', { token: superAdmin.token })).json?.users
      ?.find((u) => u.email === sneakyEmail);
    check('Full admin cannot create a SUPERADMIN (refused, and no account exists)',
      !escalatedUser && [400, 401, 403].includes(escalate.status), `${describe(escalate)} · account created: ${Boolean(escalatedUser)}`);

    const selfPromote = await request('PUT', `/api/auth/users/${full.id}`, {
      token: full.token,
      body: { role: 'SUPERADMIN' },
    });
    check('Full admin cannot promote themselves to SUPERADMIN', isDenied(selfPromote), describe(selfPromote));

    const editSuper = await request('PUT', `/api/auth/users/${superAdmin.id}`, {
      token: full.token,
      body: { name: 'Owned' },
    });
    check('Full admin cannot edit the SUPERADMIN account', isDenied(editSuper), describe(editSuper));

    const resetSuper = await request('POST', `/api/auth/users/${superAdmin.id}/reset-password`, {
      token: full.token,
      body: { newPassword: 'Matrix-Pass-Takeover-03!' },
    });
    check('Full admin cannot reset the SUPERADMIN password', isDenied(resetSuper), describe(resetSuper));

    const deleteSuper = await request('DELETE', `/api/auth/users/${superAdmin.id}`, { token: full.token });
    check('Full admin cannot delete the SUPERADMIN', isDenied(deleteSuper), describe(deleteSuper));
    const superStillWorks = await request('GET', '/api/auth/me', { token: superAdmin.token });
    check('The SUPERADMIN session survived those attempts', superStillWorks.status === 200, describe(superStillWorks));

    const limitedEscalate = await request('PUT', `/api/auth/users/${lim.id}`, {
      token: lim.token,
      body: { permissions: ALL_PERMISSIONS },
    });
    check('Limited admin cannot grant itself every permission', isDenied(limitedEscalate), describe(limitedEscalate));

    const limitedPromoteSelf = await request('PUT', `/api/auth/users/${lim.id}`, {
      token: lim.token,
      body: { role: 'SUPERADMIN' },
    });
    check('Limited admin cannot promote itself to SUPERADMIN', isDenied(limitedPromoteSelf), describe(limitedPromoteSelf));

    const counselorPromoteSelf = await request('PUT', `/api/auth/users/${counselor.id}`, {
      token: counselor.token,
      body: { role: 'SUPERADMIN' },
    });
    check('COUNSELOR cannot promote itself to SUPERADMIN', isDenied(counselorPromoteSelf), describe(counselorPromoteSelf));

    const studentChangeRole = await request('PUT', `/api/auth/users/${actors.studentA.id}`, {
      token: studentToken,
      body: { role: 'ADMIN' },
    });
    check('STUDENT cannot change any role', isDenied(studentChangeRole), describe(studentChangeRole));

    /* ══════════════════════════════════════════════════════════════════════
       8. JWT handling
       ══════════════════════════════════════════════════════════════════════ */
    section('8. Token handling');
    const noToken = await request('GET', '/api/auth/me');
    check('No token is 401', noToken.status === 401, describe(noToken));
    const garbage = await request('GET', '/api/auth/me', { token: 'not.a.jwt' });
    check('A malformed token is 401', garbage.status === 401, describe(garbage));
    const wrongSecret = await request('GET', '/api/auth/me', {
      token: require('jsonwebtoken').sign({ id: superAdmin.id, role: 'SUPERADMIN' }, 'an-attacker-secret-that-is-long-enough'),
    });
    check('A token signed with the wrong secret is 401', wrongSecret.status === 401, describe(wrongSecret));
    const noneToken = `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ id: superAdmin.id, role: 'SUPERADMIN' })}.`;
    const algNone = await request('GET', '/api/auth/me', { token: noneToken });
    check('An alg=none token is 401', algNone.status === 401, describe(algNone));
    const tampered = `${studentToken.split('.')[0]}.${base64url({ id: superAdmin.id, role: 'SUPERADMIN' })}.${studentToken.split('.')[2]}`;
    const tamperedRes = await request('GET', '/api/auth/me', { token: tampered });
    check('A token with a rewritten payload is 401', tamperedRes.status === 401, describe(tamperedRes));
    const validMe = await request('GET', '/api/auth/me', { token: superAdmin.token });
    check('A valid token still resolves the session', validMe.status === 200 && validMe.json?.user?.role === 'SUPERADMIN', describe(validMe));
    check('The server log never contains a token or a password',
      !serverLog.includes(ADMIN_PASSWORD) && !/eyJ[A-Za-z0-9_-]{10,}/.test(serverLog));
  } finally {
    await shutdown();
  }

  const passed = results.filter((r) => r.passed).length;
  console.log(`\n${'═'.repeat(64)}`);
  console.log(`RESULT: ${passed}/${results.length} checks passed`);
  const failures = results.filter((r) => !r.passed);
  if (failures.length) {
    console.log(`\nFailures:`);
    for (const f of failures) console.log(`  ❌ ${f.name}${f.detail ? ` — ${f.detail}` : ''}`);
  }
  console.log(`${'═'.repeat(64)}\n`);
  process.exit(failures.length ? 1 : 0);
};

run().catch(async (error) => {
  console.error(`\nSuite crashed: ${error.message}\n`);
  process.exit(1);
});
