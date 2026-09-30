#!/usr/bin/env node

/**
 * American FutureTech — regenerate the derived brand logo variants.
 *
 *   npm run logos
 *   CHROME_PATH=/path/to/chrome npm run logos
 *
 * The recipe itself (which pixels change, and why) is documented in
 * scripts/lib/logo-variants.js. This file is the machinery around it: derive
 * the pixels in Node, write the PNG, and hand the result to Chrome — the only
 * WebP encoder on hand — for the WebP copy.
 *
 * Chrome is not required to *verify* the result; that is deliberate, so the
 * guard can run as a build gate on a machine with no browser installed
 * (see verify-logo-variants.js).
 *
 * The run finishes by verifying what it just wrote, so a generator bug surfaces
 * here rather than in a footer six weeks later.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('node:child_process');

module.paths.push(path.join(__dirname, '..', 'node_modules'));
const puppeteer = require('puppeteer-core');

const {
  VARIANTS,
  abs,
  encodePng,
  findMarkBoundary,
  deriveOnDark,
  readPng,
} = require('./lib/logo-variants');

const CHROME =
  process.env.CHROME_PATH ||
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].find((candidate) => fs.existsSync(candidate));

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

/** Re-encode a PNG buffer to WebP inside the page, at its natural size. */
async function pngToWebp(page, png, width, height, quality) {
  const source = `data:image/png;base64,${png.toString('base64')}`;
  const dataUrl = await page.evaluate(
    (src, w, h, q) =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          // Drawn 1:1, so no resampling creeps into the derived asset.
          ctx.drawImage(image, 0, 0);
          resolve(canvas.toDataURL('image/webp', q));
        };
        image.onerror = () => reject(new Error('the browser could not decode the derived PNG'));
        image.src = src;
      }),
    source,
    width,
    height,
    quality,
  );
  if (!dataUrl.startsWith('data:image/webp')) {
    throw new Error('the browser did not return a WebP (canvas webp encoding unavailable)');
  }
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

const main = async () => {
  if (!CHROME) {
    throw new Error('Chrome not found — set CHROME_PATH to a chrome/chromium executable');
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    protocolTimeout: 180000,
  });

  try {
    const page = await browser.newPage();
    await page.goto('about:blank');

    for (const variant of VARIANTS) {
      const master = readPng(variant.source);
      const boundary = findMarkBoundary(master);
      if (boundary === null) {
        throw new Error(
          `${variant.source} has no transparent gap between the mark and the wordmark, ` +
            'so the on-dark recipe cannot be applied. Check the artwork.',
        );
      }

      const { data, recoloured } = deriveOnDark(master, boundary);
      const png = encodePng({ width: master.width, height: master.height, data });
      const webp = await pngToWebp(page, png, master.width, master.height, variant.webpQuality);

      fs.writeFileSync(abs(variant.png), png);
      fs.writeFileSync(abs(variant.webp), webp);

      console.log(`${variant.id}`);
      console.log(`  master     ${variant.source}  ${master.width}x${master.height}`);
      console.log(`  mark ends  x=${boundary}  (${recoloured} wordmark pixels inked white)`);
      console.log(`  wrote      ${variant.png.padEnd(30)} ${kb(png.length).padStart(9)}`);
      console.log(`  wrote      ${variant.webp.padEnd(30)} ${kb(webp.length).padStart(9)}`);
    }
  } finally {
    await browser.close();
  }

  // Prove the files just written are what the recipe says they are.
  execFileSync(process.execPath, [path.join(__dirname, 'verify-logo-variants.js')], { stdio: 'inherit' });
};

main().catch((error) => {
  console.error(`\nlogo variants: FAILED — ${error.message}`);
  process.exit(1);
});
