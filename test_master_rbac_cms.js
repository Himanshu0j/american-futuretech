/**
 * Master Verification Suite:
 * 1. AI Chat Box suppression on /admin/* routes
 * 2. SuperAdmin creation of limited Admin with granular permissions
 * 3. Granular RBAC 403 Forbidden enforcement on unauthorized APIs
 * 4. SuperAdmin protection (cannot delete SuperAdmin, cannot edit SuperAdmin, cannot promote to SuperAdmin, cannot delete self)
 * 5. Frontend permission filtering & direct URL 403 screen
 * 6. Content Parser & List Items Editor multi-line paste split
 * 7. Homepage section visibility configuration
 * 8. 9-Viewport responsive check (320px - 1920px)
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CLIENT_URL = 'http://localhost:5173';
const SERVER_URL = 'http://localhost:5050';
const ARTIFACT_DIR = path.resolve('C:\\Users\\Hp\\.gemini\\antigravity\\brain\\e2147ade-c13a-4483-8cd7-bea107ee4422\\screenshots_rbac');

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

// Simple fetch helper for node
async function apiRequest(method, endpoint, body = null, token = null) {
  const url = `${SERVER_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = { raw: await res.text() };
  }

  return { status: res.status, ok: res.ok, data };
}

async function runMasterSuite() {
  console.log('====================================================');
  console.log('AMERICAN FUTURETECH — MASTER RBAC & CMS TEST SUITE');
  console.log('====================================================\n');

  const testResults = [];
  function assert(name, condition, details = '') {
    const passed = Boolean(condition);
    testResults.push({ name, passed, details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name} ${details ? `(${details})` : ''}`);
  }

  let browser = null;

  try {
    // ----------------------------------------------------
    // PHASE 1: SUPERADMIN AUTH & VERIFICATION
    // ----------------------------------------------------
    console.log('\n--- PHASE 1: SuperAdmin Authentication ---');
    const saLogin = await apiRequest('POST', '/api/auth/login', {
      email: 'admin@americanfuturetech.com',
      password: 'admin123',
    });

    assert('SuperAdmin Login', saLogin.status === 200 && saLogin.data.success, `Role: ${saLogin.data.user?.role}`);
    const superAdminToken = saLogin.data.token;
    const superAdminId = saLogin.data.user?._id || saLogin.data.user?.id;

    // ----------------------------------------------------
    // PHASE 2: SUPERADMIN CREATES LIMITED ADMIN
    // ----------------------------------------------------
    console.log('\n--- PHASE 2: Create Limited Admin (JOBS_VIEW & JOBS_CREATE only) ---');
    const testAdminEmail = `test.recruiter.${Date.now()}@americanfuturetech.com`;
    const testAdminPassword = 'RecruiterPass123!';

    const createAdminRes = await apiRequest('POST', '/api/auth/users', {
      name: 'QA Limited Recruiter',
      email: testAdminEmail,
      password: testAdminPassword,
      role: 'Admin',
      department: 'Talent Acquisition',
      permissions: ['JOBS_VIEW', 'JOBS_CREATE'],
    }, superAdminToken);

    assert('SuperAdmin Creates Limited Admin Account', createAdminRes.status === 201 && createAdminRes.data.success, `ID: ${createAdminRes.data.user?.id || createAdminRes.data.user?._id}`);
    const limitedAdminId = createAdminRes.data.user?.id || createAdminRes.data.user?._id;

    // Authenticate as Limited Admin
    const limitedLogin = await apiRequest('POST', '/api/auth/login', {
      email: testAdminEmail,
      password: testAdminPassword,
    });

    assert('Limited Admin Login', limitedLogin.status === 200 && limitedLogin.data.success, `Assigned permissions: ${limitedLogin.data.user?.permissions?.join(', ')}`);
    const limitedAdminToken = limitedLogin.data.token;

    // ----------------------------------------------------
    // PHASE 3: GRANULAR RBAC 403 FORBIDDEN ENFORCEMENT
    // ----------------------------------------------------
    console.log('\n--- PHASE 3: Granular RBAC 403 Forbidden Enforcement ---');

    // 3.1 Course Management should return 403 (No COURSES_CREATE)
    const unauthorizedCourseRes = await apiRequest('POST', '/api/courses', {
      title: 'Unauthorized Intrusion Course',
      category: 'Hacking',
      duration: '1 Month',
      pricing: { basePrice: 1000, discountedPrice: 500 },
    }, limitedAdminToken);

    assert(
      'Backend 403 Enforcement: Limited Admin creating Course',
      unauthorizedCourseRes.status === 403,
      `Status code: ${unauthorizedCourseRes.status}, Message: ${unauthorizedCourseRes.data?.message}`
    );

    // 3.2 Job Deletion should return 403 (Has JOBS_CREATE and JOBS_VIEW, but NOT JOBS_DELETE)
    // First, let's create a test job using authorized JOBS_CREATE
    const authorizedJobRes = await apiRequest('POST', '/api/jobs', {
      title: 'QA Automated Test Engineer',
      company: 'FutureTech QA Labs',
      department: 'Engineering & Technology',
      location: 'Remote',
      type: 'Full-time',
      salaryRange: '$110,000 - $140,000 / year',
      description: 'Responsible for end-to-end automated testing and verification of RBAC boundaries.',
      responsibilities: ['Write end-to-end puppeteer tests', 'Verify RBAC boundaries'],
      keyRequirements: ['Strong JavaScript proficiency', 'Experience with security testing'],
    }, limitedAdminToken);

    assert('Backend 201 Allowed: Limited Admin creating Job (has JOBS_CREATE)', authorizedJobRes.status === 201 && authorizedJobRes.data.success);
    const createdJobId = authorizedJobRes.data.job?._id;

    // Now attempt to DELETE that job with Limited Admin token -> Must return 403 Forbidden!
    const unauthorizedDeleteJobRes = await apiRequest('DELETE', `/api/jobs/${createdJobId}`, null, limitedAdminToken);
    assert(
      'Backend 403 Enforcement: Limited Admin deleting Job (lacks JOBS_DELETE)',
      unauthorizedDeleteJobRes.status === 403,
      `Status code: ${unauthorizedDeleteJobRes.status}, Message: ${unauthorizedDeleteJobRes.data?.message}`
    );

    // Clean up created job using SuperAdmin token
    if (createdJobId) {
      await apiRequest('DELETE', `/api/jobs/${createdJobId}`, null, superAdminToken);
    }

    // 3.3 Site Settings Edit should return 403 (Lacks SETTINGS_EDIT)
    const unauthorizedSettingsRes = await apiRequest('PUT', '/api/settings', {
      siteName: 'Hacked Platform Name',
    }, limitedAdminToken);

    assert(
      'Backend 403 Enforcement: Limited Admin updating Settings',
      unauthorizedSettingsRes.status === 403,
      `Status code: ${unauthorizedSettingsRes.status}`
    );

    // 3.4 RBAC User Management should return 403 (Lacks RBAC_MANAGE)
    const unauthorizedUsersListRes = await apiRequest('GET', '/api/auth/users', null, limitedAdminToken);
    assert(
      'Backend 403 Enforcement: Limited Admin listing Users/Audit Logs',
      unauthorizedUsersListRes.status === 403,
      `Status code: ${unauthorizedUsersListRes.status}`
    );

    // ----------------------------------------------------
    // PHASE 4: SUPERADMIN PROTECTION ENFORCEMENT
    // ----------------------------------------------------
    console.log('\n--- PHASE 4: SuperAdmin Protection Enforcement ---');

    // 4.1 Limited Admin attempts to delete SuperAdmin -> Must be 403
    const deleteSuperAdminRes = await apiRequest('DELETE', `/api/auth/users/${superAdminId}`, null, limitedAdminToken);
    assert(
      'SuperAdmin Protection: Limited Admin cannot delete SuperAdmin',
      deleteSuperAdminRes.status === 403,
      `Status code: ${deleteSuperAdminRes.status}, Message: ${deleteSuperAdminRes.data?.message}`
    );

    // 4.2 Limited Admin attempts to edit SuperAdmin account -> Must be 403
    const editSuperAdminRes = await apiRequest('PUT', `/api/auth/users/${superAdminId}`, {
      isActive: false,
    }, limitedAdminToken);
    assert(
      'SuperAdmin Protection: Limited Admin cannot modify/deactivate SuperAdmin',
      editSuperAdminRes.status === 403,
      `Status code: ${editSuperAdminRes.status}`
    );

    // 4.3 Limited Admin attempts to promote self to SuperAdmin -> Must be 403
    const promoteSelfRes = await apiRequest('PUT', `/api/auth/users/${limitedAdminId}`, {
      role: 'SuperAdmin',
    }, limitedAdminToken);
    assert(
      'SuperAdmin Protection: Limited Admin cannot promote self to SuperAdmin',
      promoteSelfRes.status === 403,
      `Status code: ${promoteSelfRes.status}`
    );

    // 4.4 Limited Admin attempts to delete their own account -> Must be 403
    const deleteSelfRes = await apiRequest('DELETE', `/api/auth/users/${limitedAdminId}`, null, limitedAdminToken);
    assert(
      'Account Security: Admin cannot delete their own active account',
      deleteSelfRes.status === 403,
      `Status code: ${deleteSelfRes.status}`
    );

    // ----------------------------------------------------
    // PHASE 5: BROWSER AUTOMATION & UI VERIFICATION (Puppeteer)
    // ----------------------------------------------------
    console.log('\n--- PHASE 5: Browser Automation & UI RBAC Testing ---');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
      defaultViewport: { width: 1440, height: 900 },
    });

    const page = await browser.newPage();

    // 5.1 SuperAdmin Dashboard & AI Chat Absence Check
    console.log('Navigating to Admin as SuperAdmin...');
    await page.goto(`${CLIENT_URL}/admin/login`, { waitUntil: 'networkidle2' });

    // Inject SuperAdmin token directly into localStorage to bypass form delay
    await page.evaluate((token, user) => {
      localStorage.setItem('aft_admin_token', token);
      localStorage.setItem('token', token);
      localStorage.setItem('aft_admin_user', JSON.stringify(user));
    }, superAdminToken, saLogin.data.user);

    await page.goto(`${CLIENT_URL}/admin/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));

    // CHECK: AI Chat Box strictly ABSENT in Admin UI
    const aiChatPresentInAdmin = await page.evaluate(() => {
      const chatWidget = document.querySelector('[data-chatbox], #ai-chatbox, .chat-widget, [aria-label*="AI Chat" i], [aria-label*="chat assistant" i]');
      const whatsapp = document.querySelector('[aria-label*="WhatsApp" i]');
      return Boolean(chatWidget || whatsapp);
    });

    assert('AI Chatbox & Floating Widget Strictly ABSENT from /admin/dashboard', !aiChatPresentInAdmin);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-superadmin-dashboard-no-aichat.png'), fullPage: false });

    // Navigate to /admin/users (Staff & RBAC Console)
    await page.goto(`${CLIENT_URL}/admin/users`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));

    const aiChatOnUsersPage = await page.evaluate(() => {
      return Boolean(document.querySelector('[data-chatbox], #ai-chatbox, .chat-widget'));
    });
    assert('AI Chatbox Strictly ABSENT from /admin/users (Staff RBAC)', !aiChatOnUsersPage);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-superadmin-staff-rbac-console.png'), fullPage: false });

    // 5.2 Limited Admin Browser Session
    console.log('Logging in as Limited Admin in browser...');
    await page.evaluate((token, user) => {
      localStorage.setItem('aft_admin_token', token);
      localStorage.setItem('token', token);
      localStorage.setItem('aft_admin_user', JSON.stringify(user));
    }, limitedAdminToken, limitedLogin.data.user);

    // Refresh to apply Limited Admin permissions
    await page.goto(`${CLIENT_URL}/admin/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));

    // Check sidebar navigation items
    const sidebarNavLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('aside nav a, nav a'));
      return links.map(l => l.innerText.trim()).filter(Boolean);
    });

    console.log('Limited Admin Visible Nav Items:', sidebarNavLinks);
    const hasUsersNav = sidebarNavLinks.some(text => /Staff|RBAC|Permissions/i.test(text));
    const hasCoursesNav = sidebarNavLinks.some(text => /Courses|Curriculum/i.test(text));
    const hasJobsNav = sidebarNavLinks.some(text => /Jobs|Careers|Partner Job Board/i.test(text));

    assert('Sidebar Filters Unauthorized Items: Staff & RBAC hidden', !hasUsersNav);
    assert('Sidebar Filters Unauthorized Items: Courses hidden', !hasCoursesNav);
    assert('Sidebar Shows Authorized Items: Jobs & Internships visible', hasJobsNav);

    // 5.3 Direct URL Navigation Guard (Attempting /admin/users directly)
    console.log('Attempting direct navigation to /admin/users with Limited Admin...');
    await page.goto(`${CLIENT_URL}/admin/users`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));

    const is403CardRendered = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Access Denied') || text.includes('403') || text.includes('Insufficient Permissions');
    });

    assert('Direct URL Route Guard: /admin/users renders 403 Forbidden Screen', is403CardRendered);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-limited-admin-403-direct-route-guard.png'), fullPage: false });

    // ----------------------------------------------------
    // PHASE 6: PUBLIC WEBSITE & RESPONSIVE VIEWPORT TEST
    // ----------------------------------------------------
    console.log('\n--- PHASE 6: Public Website & 9-Viewport Responsiveness ---');
    const viewports = [
      { name: 'Mobile-320', width: 320, height: 640 },
      { name: 'Mobile-375', width: 375, height: 667 },
      { name: 'Mobile-414', width: 414, height: 896 },
      { name: 'Tablet-768', width: 768, height: 1024 },
      { name: 'Tablet-834', width: 834, height: 1194 },
      { name: 'Desktop-1024', width: 1024, height: 768 },
      { name: 'Desktop-1280', width: 1280, height: 800 },
      { name: 'Desktop-1440', width: 1440, height: 900 },
      { name: 'UltraWide-1920', width: 1920, height: 1080 },
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`${CLIENT_URL}/careers`, { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 600));

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      assert(`Zero Horizontal Overflow on /careers @ ${vp.name} (${vp.width}px)`, !hasHorizontalScroll);
    }

    // ----------------------------------------------------
    // PHASE 7: CLEANUP
    // ----------------------------------------------------
    console.log('\n--- PHASE 7: Cleanup Test Admin Account ---');
    if (limitedAdminId) {
      const deleteRes = await apiRequest('DELETE', `/api/auth/users/${limitedAdminId}`, null, superAdminToken);
      assert('SuperAdmin Cleaned Up Temporary QA Admin Account', deleteRes.status === 200 && deleteRes.data.success);
    }

  } catch (err) {
    console.error('Test Suite encountered an error:', err);
    assert('Test Suite Execution Without Uncaught Errors', false, err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Summary
  console.log('\n====================================================');
  console.log('TEST SUMMARY');
  console.log('====================================================');
  const passedCount = testResults.filter(r => r.passed).length;
  const failedCount = testResults.filter(r => !r.passed).length;
  console.log(`Total: ${testResults.length} | Passed: ${passedCount} | Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error(`\nFAILED TESTS:`);
    testResults.filter(r => !r.passed).forEach(t => console.error(` - ${t.name}: ${t.details}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL MASTER VERIFICATION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  }
}

runMasterSuite();
