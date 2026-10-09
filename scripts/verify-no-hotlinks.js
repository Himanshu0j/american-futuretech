#!/usr/bin/env node

/**
 * American FutureTech — refuse to build a site that hotlinks its artwork.
 *
 *   node scripts/verify-no-hotlinks.js        (also runs inside `client` prebuild)
 *   SKIP_IMAGE_GUARDS=1 npm run build         (emergency bypass, like SKIP_LOGO_VARIANTS)
 *
 * Why this exists
 * ---------------
 * The live CSP is `img-src 'self' data:`. The browser will not fetch an image
 * from any other origin, no matter how healthy that origin is — it refuses the
 * request and the visitor sees an empty tile. That is exactly what half the
 * site looked like: 53 alumni avatars on randomuser.me, 44 company logos on
 * signed LinkedIn CDN URLs, the tool stack on jsDelivr, blog photos on
 * Unsplash. All healthy URLs. All blank.
 *
 * The only defence that holds is refusing to ship such a URL in the first
 * place, which is what this script does: client/src, server and the HTML shell
 * are scanned, and any external URL that would be treated as an image by the
 * browser fails the build with the file, the line and the fix.
 *
 * What counts as a violation
 * --------------------------
 *   1. an external URL with an image extension (.png .jpg .svg .webp …), or
 *   2. an external URL on a known image/CDN host (the ones that bit us), or
 *   3. a value stored under an image-ish key (`logo`, `avatar`, `photo`,
 *      `cover`, `icon`, …) that points anywhere off-site — no extension needed,
 *      because a scraped logo URL often has none.
 *
 * Own-domain and relative paths are fine: `/images/...`, `/uploads/...` and
 * anything on americanfuturetechllc.com are served by this site, so the CSP
 * allows them. Ordinary links (apply pages, LinkedIn profiles, YouTube,
 * greenhouse) are NOT images and are deliberately left alone.
 *
 * Comments are stripped first: the records explaining *why* this rule exists
 * have to be able to name the hosts they forbid.
 *
 * Exit code is 0 only when no violation is found.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP = process.env.SKIP_IMAGE_GUARDS === '1';

/** Only this origin may serve images — it is `'self'` in the CSP. */
const OWN_ORIGIN = /americanfuturetechllc\.com/;

/** Hosts this site has been burned by. Any of them is a violation, extension or not. */
const IMAGE_CDNS = [
  'cdn.jsdelivr.net',
  'cdn.simpleicons.org',
  'images.unsplash.com',
  'randomuser.me',
  'media.licdn.com',
  'i.ytimg.com',
  'encrypted-tbn0.gstatic.com',
  'huggingface.co',
  'pngimg.com',
  'pngmart.com',
  'pngall.com',
  'freepnglogo.com',
  'freelogopng.com',
  'logos-world.net',
  'logodix.com',
  'companieslogo.com',
  'techdaily.com.au',
  'securepayments.com',
  'dredyson.com',
  'paloaltonetworks.com',
];

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)([?#].*)?$/i;
const IMAGE_KEY = /(logo|avatar|photo|image|picture|cover|banner|thumbnail|icon|artwork|asset|illustration)/i;

/** Directories worth scanning: the app source and the server that seeds it. */
const TARGETS = [
  ['client/src', /\.(jsx?|tsx?)$/],
  ['client/index.html', /\.html$/],
  ['server', /\.(js|jsx)$/],
];

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git']);

const walk = (rel, pattern, out = []) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return out;
  const stat = fs.statSync(abs);
  if (stat.isFile()) {
    if (pattern.test(rel)) out.push(rel);
    return out;
  }
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    walk(path.join(rel, entry.name), pattern, out);
  }
  return out;
};

/**
 * Remove comments without eating `https://`.
 * A `//` that follows a `:` is a protocol; everything else opens a comment.
 */
const stripComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])(\/\/[^\n]*)/gm, '$1');

/**
 * What the value is called, for rule 3 — the *same line* only. Looking further
 * back would blame a URL for sitting under the previous row's `companyLogo`.
 */
const contextBefore = (text, index) => {
  const lineStart = text.lastIndexOf('\n', index) + 1;
  return text.slice(lineStart, index);
};

const isViolation = (url, context) => {
  if (!/^(https?:)?\/\//i.test(url)) return false;          // relative paths are ours
  // Prose that happens to start with a scheme ("https://… or upload a photo")
  // is a placeholder, not a request the browser would ever make.
  if (/\s/.test(url)) return false;
  if (OWN_ORIGIN.test(url)) return false;                    // same origin is 'self'
  if (IMAGE_EXT.test(url)) return true;
  const host = (() => {
    try {
      return new URL(url.startsWith('//') ? `https:${url}` : url).host.toLowerCase();
    } catch {
      return '';
    }
  })();
  if (host && IMAGE_CDNS.some((cdn) => host === cdn || host.endsWith(`.${cdn}`))) return true;
  return IMAGE_KEY.test(context);
};

const scan = (rel) => {
  const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const text = stripComments(raw);
  const violations = [];

  // Quoted values first — that is where a URL actually reaches the browser.
  const quoted = /(['"`])((?:[^\'"\\]|\\.)*?)\1/g;
  let match;
  while ((match = quoted.exec(text)) !== null) {
    const value = match[2];
    if (!isViolation(value, contextBefore(text, match.index))) continue;
    const line = text.slice(0, match.index).split('\n').length;
    violations.push({ line, value });
  }

  // …plus any bare URL sitting next to an image-ish key in JSX/HTML attributes.
  const bare = /(src|href|poster|logo|logoUrl|avatar|photo|coverImage|companyLogo)\s*=\s*["{]([^"'}\s]*)/g;
  while ((match = bare.exec(text)) !== null) {
    const value = match[2];
    if (!isViolation(value, match[1])) continue;
    const line = text.slice(0, match.index).split('\n').length;
    if (!violations.some((v) => v.line === line && v.value === value)) {
      violations.push({ line, value });
    }
  }

  return violations;
};

const main = () => {
  if (SKIP) {
    console.log('verify-no-hotlinks: SKIPPED (SKIP_IMAGE_GUARDS=1)');
    return 0;
  }

  const files = TARGETS.flatMap(([dir, pattern]) => walk(dir, pattern));
  let checked = 0;
  let failed = 0;
  let clean = 0;

  for (const rel of files.sort()) {
    checked += 1;
    const violations = scan(rel);
    if (!violations.length) {
      clean += 1;
      continue;
    }
    failed += violations.length;
    console.log(`  FAIL  ${rel}`);
    for (const v of violations.slice(0, 5)) {
      console.log(`        line ${v.line}  ${v.value.slice(0, 100)}`);
    }
    if (violations.length > 5) console.log(`        …and ${violations.length - 5} more`);
  }

  if (failed) {
    console.log('');
    console.log(`verify-no-hotlinks: FAILED — ${failed} hotlinked image(s) in ${files.length - clean} file(s).`);
    console.log('  The live CSP is img-src \'self\' data:, so the browser will refuse every one of');
    console.log('  them and the visitor sees a blank tile. Download the artwork into');
    console.log('  client/public/images/ and reference it as a /images/... path instead.');
    return 1;
  }

  console.log(`verify-no-hotlinks: ok — ${checked} file(s) scanned, no third-party image URLs.`);
  return 0;
};

process.exit(main());
