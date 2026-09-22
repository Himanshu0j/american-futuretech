const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CLIENT_URL = 'http://localhost:5173';
const ARTIFACT_DIR = path.resolve('C:\\Users\\Hp\\.gemini\\antigravity\\brain\\e2147ade-c13a-4483-8cd7-bea107ee4422');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto(CLIENT_URL, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Find the marquee element
  const marqueeSection = await page.$('section:has(h2)');
  // Scroll down a bit to show the marquee clearly
  await page.evaluate(() => {
    const el = document.querySelector('h2');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07-marquee-vibrant-colorful-default.png') });

  await browser.close();
  console.log('Colorful Marquee screenshot captured successfully!');
})();
