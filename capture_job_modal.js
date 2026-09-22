const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CLIENT_URL = 'http://localhost:5173';
const SERVER_URL = 'http://localhost:5050';
const ARTIFACT_DIR = path.resolve('C:\\Users\\Hp\\.gemini\\antigravity\\brain\\e2147ade-c13a-4483-8cd7-bea107ee4422\\screenshots_rbac');

(async () => {
  const res = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@americanfuturetech.com', password: 'admin123' })
  });
  const { token, user } = await res.json();

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 1000 }
  });

  const page = await browser.newPage();
  await page.goto(`${CLIENT_URL}/admin/login`, { waitUntil: 'networkidle2' });

  await page.evaluate((t, u) => {
    localStorage.setItem('aft_admin_token', t);
    localStorage.setItem('token', t);
    localStorage.setItem('aft_admin_user', JSON.stringify(u));
  }, token, user);

  await page.goto(`${CLIENT_URL}/admin/jobs`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Post New Partner Job')) {
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-jobs-manager-modal-open.png') });

  // Now scroll inside modal to show ListItemsEditor
  await page.evaluate(() => {
    const modal = document.querySelector('div.overflow-y-auto');
    if (modal) {
      modal.scrollTop = 900;
    }
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-jobs-manager-list-items-editor-active.png') });

  await browser.close();
  console.log('Job modal captured with ListItemsEditor!');
})();
