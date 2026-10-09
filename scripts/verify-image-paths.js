#!/usr/bin/env node

/**
 * American FutureTech — every image path the code references must exist.
 *
 *   node scripts/verify-image-paths.js        (also runs inside `client` prebuild)
 *   SKIP_IMAGE_GUARDS=1 npm run build         (emergency bypass)
 *
 * The site's whole fix for "aadhi images nahi dikh rhi" is that images are
 * served from this origin under /images. That trade only holds while the files
 * are actually there: a typo'd or forgotten asset is now a 404, and a 404 on an
 * image looks exactly like the blocked images this replaced — an empty tile.
 *
 * So the two halves are checked together: verify-no-hotlinks.js proves nothing
 * points off-site, this proves everything points at something real.
 *
 * Exit code is 0 only when every referenced file exists.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'client', 'public');
const SKIP = process.env.SKIP_IMAGE_GUARDS === '1';

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git']);
const SOURCES = ['client/src', 'server'];
const EXTENSIONS = /\.(jsx?|tsx?|cjs|json|html)$/;

const walk = (rel, out = []) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return out;
  const stat = fs.statSync(abs);
  if (stat.isFile()) {
    if (EXTENSIONS.test(rel)) out.push(rel);
    return out;
  }
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    walk(path.join(rel, entry.name), out);
  }
  return out;
};

const main = () => {
  if (SKIP) {
    console.log('verify-image-paths: SKIPPED (SKIP_IMAGE_GUARDS=1)');
    return 0;
  }

  const refs = new Map(); // '/images/x.webp' -> Set of files that ask for it

  for (const rel of SOURCES.flatMap((dir) => walk(dir))) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const match of text.matchAll(/(['"`])(\/images\/[A-Za-z0-9._@%/-]+)\1/g)) {
      const ref = match[2];
      if (!refs.has(ref)) refs.set(ref, new Set());
      refs.get(ref).add(rel);
    }
  }

  const missing = [...refs.entries()].filter(([ref]) => !fs.existsSync(path.join(PUBLIC, ref.replace(/^\//, ''))));

  if (missing.length) {
    console.log(`verify-image-paths: FAILED — ${missing.length} of ${refs.size} referenced image(s) do not exist.`);
    for (const [ref, owners] of missing) {
      console.log(`  FAIL  ${ref}`);
      console.log(`        referenced by ${[...owners].slice(0, 3).join(', ')}`);
    }
    console.log('');
    console.log('  Add the file under client/public/images/ or point the reference at one that exists.');
    return 1;
  }

  console.log(`verify-image-paths: ok — ${refs.size} referenced image path(s) all exist.`);
  return 0;
};

process.exit(main());
