const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CLIENT_URL = 'http://localhost:5173';
const SERVER_URL = 'http://localhost:5050';
const ARTIFACT_DIR = path.resolve('C:\\Users\\Hp\\.gemini\\antigravity\\brain\\e2147ade-c13a-4483-8cd7-bea107ee4422\\screenshots_rbac');

async function capture() {
  const res = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@americanfuturetech.com', password: 'admin123' })
  });
  const data = await res.json();
  const token = data.token;
  const user = data.user;

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto(`${CLIENT_URL}/admin/login`, { waitUntil: 'networkidle2' });

  await page.evaluate((tok, usr) => {
    localStorage.setItem('aft_admin_token', tok);
    localStorage.setItem('token', tok);
    localStorage.setItem('aft_admin_user', JSON.stringify(usr));
  }, token, user);

  // 1. Settings CMS - Homepage Section Visibility
  await page.goto(`${CLIENT_URL}/admin/settings`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Click "Homepage Sections" tab
  const tabs = await page.$$('button');
  for (const b of tabs) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Homepage Sections')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-settings-cms-section-visibility.png'), fullPage: false });

  // 2. Jobs Manager - Open Create/Edit Job Modal with ListItemsEditor
  await page.goto(`${CLIENT_URL}/admin/jobs`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Click "+ Post New Position" button
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Post New Position') || text.includes('Create Job') || text.includes('Post Opening')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-jobs-manager-modal-list-editor.png'), fullPage: false });

  // 3. Courses CMS - Open Program Modal
  await page.goto(`${CLIENT_URL}/admin/courses`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  const cButtons = await page.$$('button');
  for (const b of cButtons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Create New Program') || text.includes('Add Program')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06-courses-cms-modal-list-editor.png'), fullPage: false });

  await browser.close();
  console.log('Admin CMS Screenshots captured successfully!');
}

capture().catch(console.error);
