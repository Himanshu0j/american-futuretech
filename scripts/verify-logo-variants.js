#!/usr/bin/env node

/**
 * American FutureTech — prove the derived logo variants are not stale.
 *
 *   npm run verify:logos
 *
 * The on-dark variant is not an image somebody maintains by hand: it is the
 * output of the recipe in scripts/lib/logo-variants.js. This script re-runs
 * that recipe over the master logo and compares the result, pixel by pixel,
 * against the files actually in the repo.
 *
 * That is the check which would have caught both stale copies. The second one
 * still had the right filename, the right dimensions and a crisp wordmark — it
 * only differed in the crest, which a human eye reads as "washed out" and a
 * pixel comparison reads as 41,000 wrong pixels.
 *
 * No browser and no dependencies, on purpose: client/package.json runs this
 * before `vite build`, so a logo edit that was never regenerated fails the build
 * instead of shipping. Set SKIP_LOGO_VARIANTS=1 to bypass it in an emergency.
 *
 * Exit code is 0 only when every variant matches the master it derives from.
 */

const fs = require('fs');

const {
  VARIANTS,
  abs,
  decodePng,
  readWebpSize,
  findMarkBoundary,
  deriveOnDark,
  compareDerived,
  readPng,
} = require('./lib/logo-variants');

const FIX = 'Regenerate them with:  npm run logos';

const relative = (file) => `client/public/images/${file}`;

let passed = 0;
let failed = 0;

const ok = (message) => {
  passed += 1;
  console.log(`  ok    ${message}`);
};

const fail = (message, ...detail) => {
  failed += 1;
  console.log(`  FAIL  ${message}`);
  for (const line of detail) console.log(`        ${line}`);
};

const checkVariant = (variant) => {
  if (!fs.existsSync(abs(variant.source))) {
    fail(`${relative(variant.source)} — master logo is missing`, FIX);
    return;
  }

  const master = readPng(variant.source);
  const boundary = findMarkBoundary(master);
  if (boundary === null) {
    fail(
      `${relative(variant.source)} — no transparent gap between the mark and the wordmark`,
      'The on-dark recipe needs that gap to know where the wordmark starts, so the',
      'variant cannot be derived or checked until the artwork has one.',
    );
    return;
  }

  const { data, recoloured } = deriveOnDark(master, boundary);

  /* --- the PNG copy: compared pixel for pixel ------------------------- */

  if (!fs.existsSync(abs(variant.png))) {
    fail(`${relative(variant.png)} — missing`, FIX);
  } else {
    let shipped = null;
    try {
      shipped = decodePng(fs.readFileSync(abs(variant.png)));
    } catch (error) {
      fail(`client/public/images/${variant.png} — unreadable (${error.message})`, FIX);
    }
    if (shipped) {
      const diff = compareDerived({ width: master.width, height: master.height, data }, shipped, boundary);
      if (diff.sizeMismatch) {
        fail(
          `${relative(variant.png)} — ${diff.sizeMismatch.actual}, but the master is ${diff.sizeMismatch.expected}`,
          'The variant is a different size from the logo it claims to be derived from.',
          FIX,
        );
      } else if (diff.total === 0) {
        ok(`${relative(variant.png)} — matches the recipe (${recoloured} wordmark pixels inked white)`);
      } else if (diff.mark > 0) {
        fail(
          `${relative(variant.png)} — ${diff.total} pixels differ; ${diff.mark} of them are in the mark`,
          `The mark (x < ${boundary}) must be carried over from ${variant.source} untouched.`,
          'A bleached or washed-out crest is exactly what this guard exists to catch.',
          FIX,
        );
      } else {
        fail(
          `${relative(variant.png)} — ${diff.total} pixels differ from the recipe (${diff.wordmark} in the wordmark)`,
          `Either ${variant.source} changed and the variant was never regenerated, or this`,
          'file was edited by hand. Known-good output takes seconds to rebuild.',
          FIX,
        );
      }
    }
  }

  /* --- the WebP copy: the one the site actually loads ------------------ */

  if (!fs.existsSync(abs(variant.webp))) {
    fail(`${relative(variant.webp)} — missing`, FIX);
  } else {
    try {
      const size = readWebpSize(fs.readFileSync(abs(variant.webp)));
      if (size.width === master.width && size.height === master.height) {
        ok(`${relative(variant.webp)} — ${size.width}x${size.height}, matches the master`);
      } else {
        fail(
          `${relative(variant.webp)} — ${size.width}x${size.height}, but the master is ${master.width}x${master.height}`,
          'A WebP cannot be decoded without a codec, so this guard checks its header —',
          'which is what catches a variant swapped out for a differently-sized one.',
          FIX,
        );
      }
    } catch (error) {
      fail(`client/public/images/${variant.webp} — unreadable (${error.message})`, FIX);
    }
  }
};

const main = () => {
  if (process.env.SKIP_LOGO_VARIANTS === '1') {
    console.log('logo variants: skipped (SKIP_LOGO_VARIANTS=1)');
    return;
  }

  console.log('Logo variants — derived brand assets\n');
  for (const variant of VARIANTS) {
    console.log(`${variant.id}  ·  ${variant.summary}`);
    checkVariant(variant);
    console.log('');
  }

  if (failed > 0) {
    console.log(`${passed} passed, ${failed} failed`);
    console.log(`\nlogo variants: FAILED — ${failed} stale or invalid asset${failed === 1 ? '' : 's'}\n${FIX}`);
    process.exit(1);
  }
  console.log(`${passed} passed, 0 failed`);
  console.log('\nlogo variants: OK');
};

main();
