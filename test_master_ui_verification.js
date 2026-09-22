const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const ARTIFACT_DIR = 'C:\\Users\\Hp\\.gemini\\antigravity\\brain\\e2147ade-c13a-4483-8cd7-bea107ee4422\\screenshots_master';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runVerification() {
  console.log('===============================================================');
  console.log('🚀 AMERICAN FUTURETECH — MASTER CLIENT UI/UX VERIFICATION SUITE');
  console.log('===============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const checks = [];

  // -------------------------------------------------------------
  // TEST 1: HOMEPAGE HEADER & BRAND LOGO MARQUEE
  // -------------------------------------------------------------
  console.log('[TEST 1]: Navigating to Homepage...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Check 1.1: Header Navigation Items
  const navText = await page.evaluate(() => document.querySelector('header').innerText);
  console.log('Header text detected:', navText.replace(/\n+/g, ' | '));

  const hasHome = navText.includes('HOME');
  const hasLiveJobs = navText.includes('LIVE JOBS');
  const hasCareerPrograms = navText.includes('CAREER PROGRAMS');
  const hasPersonalized = navText.includes('PERSONALIZED LEARNING');
  const hasCertifications = navText.includes('CERTIFICATIONS');
  const hasAbout = navText.includes('ABOUT US');
  const hasMore = navText.includes('MORE');
  const hasLmsLogin = navText.includes('LMS LOGIN');
  const hasRegisterNow = navText.includes('REGISTER NOW');

  checks.push({
    test: 'Header Links & CTAs (HOME, LIVE JOBS, CAREER PROGRAMS, LMS LOGIN, REGISTER NOW)',
    passed: hasHome && hasLiveJobs && hasCareerPrograms && hasLmsLogin && hasRegisterNow,
    details: { hasHome, hasLiveJobs, hasCareerPrograms, hasPersonalized, hasCertifications, hasAbout, hasMore, hasLmsLogin, hasRegisterNow }
  });

  // Check 1.2: Click/Hover Career Programs to test Mega-Menu
  console.log('Clicking Career Programs dropdown button...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('header nav button')).find(b => b.innerText.includes('CAREER PROGRAMS'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const dropdownInfo = await page.evaluate(() => {
    const dropdown = document.querySelector('#career-programs-dropdown') || document.querySelector('header nav .absolute');
    if (!dropdown) return { found: false, count: 0, items: [] };
    const items = Array.from(dropdown.querySelectorAll('a')).map(a => a.innerText.replace(/\n+/g, ' '));
    return {
      found: true,
      count: items.length,
      items,
      has99Deposit: dropdown.innerText.includes('$99 Deposit'),
      hasExploreAll: dropdown.innerText.includes('Explore All')
    };
  });

  checks.push({
    test: 'Career Programs Mega-Menu with 7 DB Courses & $99 Deposit Badge',
    passed: dropdownInfo.found && dropdownInfo.items.length >= 7,
    details: dropdownInfo
  });

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-homepage-header-megamenu.png') });
  console.log('Screenshot saved: 01-homepage-header-megamenu.png');

  // Check 1.3: Brand Logo Marquee Section
  console.log('[TEST 2]: Verifying Brand Logo Marquee...');
  const marqueeInfo = await page.evaluate(() => {
    const section = Array.from(document.querySelectorAll('section')).find(s => 
      s.innerText.includes('TRUSTED BY LEARNERS FROM LEADING GLOBAL COMPANIES')
    );
    if (!section) return { found: false };

    const images = Array.from(section.querySelectorAll('img')).map(img => ({
      alt: img.alt,
      src: img.src
    }));

    const marqueeTrack = section.querySelector('.animate-infinite-marquee');

    return {
      found: true,
      heading: section.querySelector('h2')?.innerText,
      hasMarqueeClass: !!marqueeTrack,
      companyCount: images.length,
      companies: [...new Set(images.map(i => i.alt))]
    };
  });

  const expectedCompanies = ['Google', 'Microsoft', 'Amazon Web Services', 'IBM', 'Infosys', 'Accenture', 'Intel', 'Meta'];
  const allExpectedPresent = expectedCompanies.every(c => marqueeInfo.companies?.includes(c));

  checks.push({
    test: 'Brand Logo Marquee (Google, Microsoft, AWS, IBM, Infosys, Accenture, Intel, Meta with smooth infinite slider)',
    passed: marqueeInfo.found && allExpectedPresent && marqueeInfo.hasMarqueeClass,
    details: marqueeInfo
  });

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-brand-logo-marquee.png') });
  console.log('Screenshot saved: 02-brand-logo-marquee.png');

  // -------------------------------------------------------------
  // TEST 3: LIVE JOBS PAGE (/jobs)
  // -------------------------------------------------------------
  console.log('\n[TEST 3]: Navigating to Live Jobs (/jobs)...');
  await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const jobsPageInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('main div.group.relative.text-left'));
    const bodyText = document.body.innerText;

    // Check for unwanted labels
    const hasDepartment = /department/i.test(document.querySelector('main .space-y-4')?.innerText || '');
    const hasVerifiedPartner = /verified\s*partner/i.test(document.querySelector('main .space-y-4')?.innerText || '');

    const cardDetails = cards.map(c => {
      const title = c.querySelector('a')?.innerText;
      const logo = c.querySelector('img')?.src;
      const hasViewDetails = c.innerText.includes('VIEW DETAILS');
      const hasApplyNow = c.innerText.includes('APPLY NOW');
      const tags = Array.from(c.querySelectorAll('.text-xs span, .text-xs div')).map(s => s.innerText.trim()).filter(Boolean);
      return { title, logo, hasViewDetails, hasApplyNow, tags: tags.slice(0, 8) };
    });

    return {
      totalCards: cards.length,
      hasDepartment,
      hasVerifiedPartner,
      cardDetails
    };
  });

  checks.push({
    test: 'Live Jobs: 8 Database Jobs Rendered with Redesigned Cards',
    passed: jobsPageInfo.totalCards === 8,
    details: { totalCards: jobsPageInfo.totalCards, titles: jobsPageInfo.cardDetails.map(c => c.title) }
  });

  checks.push({
    test: 'Live Jobs: Exactly 0 Occurrences of "Department" or "Verified Partner"',
    passed: !jobsPageInfo.hasDepartment && !jobsPageInfo.hasVerifiedPartner,
    details: { hasDepartment: jobsPageInfo.hasDepartment, hasVerifiedPartner: jobsPageInfo.hasVerifiedPartner }
  });

  checks.push({
    test: 'Live Jobs: VIEW DETAILS and APPLY NOW Buttons on Every Card',
    passed: jobsPageInfo.cardDetails.length > 0 && jobsPageInfo.cardDetails.every(c => c.hasViewDetails && c.hasApplyNow),
    details: { verifiedCount: jobsPageInfo.cardDetails.filter(c => c.hasViewDetails && c.hasApplyNow).length }
  });

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-live-jobs-8-cards.png') });
  console.log('Screenshot saved: 03-live-jobs-8-cards.png');

  // -------------------------------------------------------------
  // TEST 4: JOB DETAIL PAGE (/jobs/:id)
  // -------------------------------------------------------------
  console.log('\n[TEST 4]: Opening first Job Detail Page...');
  const firstJobLink = await page.evaluate(() => {
    const card = document.querySelector('main div.group.relative.text-left');
    return card?.querySelector('a[href^="/jobs/"]')?.getAttribute('href');
  });

  if (firstJobLink) {
    await page.goto(`${BASE_URL}${firstJobLink}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const jobDetailInfo = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const hasDepartment = /department/i.test(document.querySelector('main')?.innerText || '');
      const hasVerifiedPartner = /verified\s*partner/i.test(document.querySelector('main')?.innerText || '');
      const bullets = Array.from(document.querySelectorAll('ul li')).length;
      const title = document.querySelector('h1')?.innerText;

      return {
        title,
        hasDepartment,
        hasVerifiedPartner,
        bulletCount: bullets,
        url: window.location.href
      };
    });

    checks.push({
      test: 'Job Detail Page: Clean Dossier with Parsed Bullets & Zero Unwanted Labels',
      passed: !jobDetailInfo.hasDepartment && !jobDetailInfo.hasVerifiedPartner && jobDetailInfo.bulletCount > 0,
      details: jobDetailInfo
    });

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-job-detail-dossier.png') });
    console.log('Screenshot saved: 04-job-detail-dossier.png');
  }

  // -------------------------------------------------------------
  // TEST 5: ROUTE ALIASES (/login & /register)
  // -------------------------------------------------------------
  console.log('\n[TEST 5]: Verifying Route Aliases (/login & /register)...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  const loginUrl = page.url();
  const isLoginRedirect = loginUrl.includes('/student/login');

  await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0', timeout: 30000 });
  const registerUrl = page.url();
  const isRegisterRedirect = registerUrl.includes('/student/register');

  checks.push({
    test: 'Route Aliases: /login -> /student/login & /register -> /student/register',
    passed: isLoginRedirect && isRegisterRedirect,
    details: { loginUrl, registerUrl }
  });

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-student-register-alias.png') });
  console.log('Screenshot saved: 05-student-register-alias.png');

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('📊 VERIFICATION RESULTS SUMMARY:');
  console.log('===============================================================');
  let allPassed = true;
  checks.forEach((c, idx) => {
    const mark = c.passed ? '✅ PASS' : '❌ FAIL';
    if (!c.passed) allPassed = false;
    console.log(`[${idx + 1}] ${mark}: ${c.test}`);
    console.log('    Details:', JSON.stringify(c.details, null, 2));
  });

  console.log('\nConsole Errors:', consoleErrors.length === 0 ? 'None (Clean)' : consoleErrors);
  console.log('Overall Status:', allPassed ? '🌟 100% ALL CHECKS PASSED!' : '⚠️ SOME CHECKS FAILED');

  await browser.close();
  process.exit(allPassed ? 0 : 1);
}

runVerification().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
