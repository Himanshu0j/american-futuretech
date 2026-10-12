#!/usr/bin/env node

/**
 * One-off codemod — retire hardcoded brand hexes from Tailwind arbitrary values.
 *
 * `text-[#002060]` hardcodes the brand navy into the compiled CSS, so the CMS
 * Appearance tab (which rewrites the `--tw-*` channel variables at runtime)
 * could never recolour those elements. Every brand hex inside an arbitrary
 * value is mapped onto the matching channel variable instead:
 *
 *   text-[#002060]        →  text-[color:rgb(var(--tw-ink-900))]
 *   bg-[#F00000]/40       →  bg-[rgb(var(--tw-gold-500)/40%)]
 *
 * Alpha modifiers stay percentage-based inside the rgb() call. Raw SVG
 * presentation attributes (fill="#002060" in illustrations) are NOT touched —
 * var() does not resolve in presentation attributes, and artwork is allowed to
 * keep the shipped brand colours.
 *
 *   node scripts/sweep-theme-hexes.js          (apply)
 *   node scripts/sweep-theme-hexes.js --dry    (report only)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry');

const DIRS = ['client/src/components', 'client/src/pages', 'client/src/lms', 'client/src/admin', 'client/src/data'];
const EXT = /\.(jsx?|tsx?)$/;

/** Brand hex → channel variable (values match client/src/index.css :root). */
const HEX_TO_VAR = {
  '002060': 'tw-ink-900',
  '001845': 'tw-ink-950',
  '001C57': 'tw-ink-800',
  '0A2A63': 'tw-ink-700',
  '0B3A80': 'tw-ink-600',
  '2563EB': 'tw-blue-600',
  '1D4ED8': 'tw-blue-700',
  '1E40AF': 'tw-blue-800',
  '3B82F6': 'tw-blue-500',
  '60A5FA': 'tw-blue-400',
  'DBEAFE': 'tw-blue-100',
  'EFF6FF': 'tw-blue-50',
  'F00000': 'tw-gold-500',
  'C81E1E': 'tw-gold-600',
  'FF6B6B': 'tw-gold-400',
  'FDECEC': 'tw-gold-100',
  'F9C9C9': 'tw-gold-200',
  'FCE7E7': 'tw-sand-200',
  'FAF0F0': 'tw-sand-100',
};

const HEX = Object.keys(HEX_TO_VAR).join('|');

/**
 * Two passes:
 *  1. alpha form  [#AABBCC]/NN  →  [rgb(var(--tw-x)/NN%)]
 *  2. plain form   [#AABBCC]     →  [rgb(var(--tw-x))]  (text- gets the
 *     color: hint so Tailwind never mistakes it for a font size)
 */
const ALPHA_RE = new RegExp(`\\[#(${HEX})\\]/(\\d{1,3})`, 'gi');
const PLAIN_RE = new RegExp(`\\b(text|decoration|outline)-\\[#(${HEX})\\]`, 'gi');
const BARE_RE = new RegExp(`\\[#(${HEX})\\]`, 'gi');

const walk = (rel, out = []) => {
  const abs = path.join(ROOT, rel);
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'illustrations') continue;
    const child = path.join(rel, entry.name);
    if (entry.isDirectory()) walk(child, out);
    else if (EXT.test(entry.name)) out.push(child);
  }
  return out;
};

let touched = 0;
let replacements = 0;

for (const rel of DIRS.flatMap((d) => walk(d))) {
  const abs = path.join(ROOT, rel);
  const before = fs.readFileSync(abs, 'utf8');
  let after = before
    .replace(ALPHA_RE, (_m, hex, alpha) => `[rgb(var(--${HEX_TO_VAR[hex.toUpperCase()]})/${alpha}%)]`)
    .replace(PLAIN_RE, (_m, prefix, hex) => `${prefix}-[color:rgb(var(--${HEX_TO_VAR[hex.toUpperCase()]}))]`)
    .replace(BARE_RE, (_m, hex) => `[rgb(var(--${HEX_TO_VAR[hex.toUpperCase()]}))]`);
  if (after !== before) {
    const count = before.match(ALPHA_RE)?.length || 0;
    replacements += count;
    touched += 1;
    if (DRY) {
      console.log(`would edit ${rel}`);
    } else {
      fs.writeFileSync(abs, after);
      console.log(`edited   ${rel}`);
    }
  }
}

console.log(`\n${DRY ? 'dry run — ' : ''}${touched} file(s) touched.`);
