#!/usr/bin/env node
/**
 * Admin ↔ schema contract audit.
 *
 * The bug this exists for: the admin writes `settings.brandName`, the Mongoose
 * schema only declares `siteName`, `strict` mode drops the value, the API still
 * answers 200 "saved" — and the client is left thinking "save kiya, update nahi
 * hua". Nothing on screen ever tells them the field does not exist.
 *
 * So: every `settings.<key>` the admin writes must exist in the schema, and the
 * keys that carry company identity must actually be READ by the public client.
 *
 *   node scripts/audit-admin-fields.js          → report
 *   node scripts/audit-admin-fields.js --strict → exit 1 on any finding (used by npm run verify:admin-fields)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// Settings live in more than one model on purpose: marketing copy belongs to
// SiteSettings, LMS behaviour to LmsSetting. A key declared in ANY of them is
// persisted, so scan them all before calling a field dead.
const MODELS = [
  path.join(ROOT, 'server/models/SiteSettings.js'),
  path.join(ROOT, 'server/models/LmsSetting.js'),
];
const MODEL = MODELS[0];
const MODEL_LABELS = MODELS.map((p) => path.basename(p, '.js'));
const ADMIN_DIR = path.join(ROOT, 'client/src/admin');
const CLIENT_SRC = path.join(ROOT, 'client/src');

const STRICT = process.argv.includes('--strict');

const read = (p) => fs.readFileSync(p, 'utf8');

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
};

// ── 1. Every identifier declared anywhere in the settings schema ────────────
const modelSrc = read(MODEL);
// Anchor on the MAIN settings schema — `new mongoose.Schema(` alone also matches
// the small sub-schemas declared above it.
const schemaStart = modelSrc.indexOf('const SiteSettingsSchema = new mongoose.Schema(');
const schemaBlock = modelSrc.slice(
  schemaStart < 0 ? modelSrc.indexOf('new mongoose.Schema(') : schemaStart,
  modelSrc.indexOf('module.exports'),
);
// Fields may live in the main schema or in one of the sub-schemas declared above
// it (PedagogySchema, SisterCompanySchema, …), so scan the whole model file.
// Each key is remembered with the model that declares it, so the report can
// point at the right form when a key is genuinely absent everywhere.
const schemaKeys = new Set();
const schemaOwner = new Map();
for (const modelPath of MODELS) {
  if (!fs.existsSync(modelPath)) continue;
  const body = read(modelPath).split('module.exports')[0];
  for (const m of body.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/gm)) {
    schemaKeys.add(m[1]);
    if (!schemaOwner.has(m[1])) schemaOwner.set(m[1], path.basename(modelPath, '.js'));
  }
}

// ── 2. Every field the admin reads/writes on `settings` ─────────────────────
// Array/Object built-ins such as `settings.leadership.length` are not schema paths.
const JS_PROPS = new Set([
  'length', 'map', 'filter', 'find', 'some', 'every', 'slice', 'forEach', 'reduce',
  'join', 'split', 'includes', 'indexOf', 'toString', 'trim', 'push', 'keys', 'values',
  'entries', 'toUpperCase', 'toLowerCase', 'replace', 'concat', 'sort', 'reverse', 'flat',
]);

const findings = [];
const seen = new Map();

for (const file of walk(ADMIN_DIR)) {
  const src = read(file);
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const re = /settings\s*\??\.\s*([A-Za-z_][A-Za-z0-9_]*)(?:\s*\??\.\s*([A-Za-z_][A-Za-z0-9_]*))?/g;
  let m;
  while ((m = re.exec(src))) {
    const [, top, sub] = m;
    for (const key of [top, sub]) {
      if (!key || JS_PROPS.has(key)) continue;
      if (schemaKeys.has(key)) continue;
      const id = `${top}${sub ? '.' + sub : ''}`;
      if (!seen.has(id)) seen.set(id, { id, key, files: new Set() });
      seen.get(id).files.add(rel);
    }
  }
}

for (const entry of [...seen.values()].sort((a, b) => a.id.localeCompare(b.id))) {
  findings.push({
    kind: 'missing-in-schema',
    field: entry.id,
    detail: `“${entry.key}” is not declared in ${MODEL_LABELS.join(' or ')} — Mongoose will drop it silently`,
    files: [...entry.files].slice(0, 3),
  });
}

// ── 2b. Whole settings blocks nothing on the site reads ─────────────────────
// A tab where every control is inert is the worst case for the client: the
// admin says "saved", the website never changes.
const topLevelKeys = (() => {
  const open = schemaBlock.indexOf('{');
  const keys = [];
  let depth = 0;
  let inString = null;
  let line = '';
  const flush = () => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/);
    if (m) keys.push(m[1]);
    line = '';
  };
  for (let i = open; i < schemaBlock.length; i += 1) {
    const ch = schemaBlock[i];
    if (inString) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inString = ch; continue; }
    if (ch === '{' || ch === '[') {
      if (depth === 1) flush();   // the key name sits right before the opening brace
      depth += 1;
      continue;
    }
    if (ch === '}' || ch === ']') {
      depth -= 1;
      if (depth < 1) break;
      continue;
    }
    if (ch === ',') {
      if (depth === 1) flush();   // scalar field
      continue;
    }
    if (depth === 1) line += ch;
  }
  return [...new Set(keys)];
})();

// Blocks that exist for internal plumbing or are read by the server, not the UI.
const INTERNAL_BLOCKS = new Set(['textOverrides', 'imageOverrides']);

for (const key of topLevelKeys) {
  if (INTERNAL_BLOCKS.has(key)) continue;
  let readByPublic = false;
  for (const file of walk(CLIENT_SRC)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (rel.includes('/admin/')) continue;
    if (new RegExp(`\\b${key}\\b`).test(read(file))) { readByPublic = true; break; }
  }
  if (!readByPublic) {
    findings.push({
      kind: 'dead-block',
      field: key,
      detail: 'no public component reads this settings block — every control in its admin tab is inert',
      files: [],
    });
  }
}

// ── 3. Company identity fields must be read by the public client ────────────
const IDENTITY_KEYS = [
  'siteName', 'tagline', 'legalName', 'contactEmail', 'contactPhone',
  'headquartersAddress', 'socialLinks', 'isMaintenanceMode',
];

let clientBlob = '';
for (const file of walk(CLIENT_SRC)) clientBlob += read(file) + '\n';

for (const key of IDENTITY_KEYS) {
  const usedOutsideAdmin = /settings\s*\??\.\s*[A-Za-z0-9_]*\s*\??\.?\s*/.test('') // noop guard
    ? true : true;
  // Count reads that are NOT inside the admin folder.
  let used = false;
  for (const file of walk(CLIENT_SRC)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (rel.includes('/admin/')) continue;
    if (new RegExp(`\\b${key}\\b`).test(read(file))) { used = true; break; }
  }
  if (!used) {
    findings.push({
      kind: 'dead-public-field',
      field: key,
      detail: 'declared in the schema but no public component reads it — editing it changes nothing on the site',
      files: [],
    });
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
const byKind = findings.reduce((acc, f) => {
  acc[f.kind] = acc[f.kind] || [];
  acc[f.kind].push(f);
  return acc;
}, {});

console.log(
  `\nAdmin ↔ schema audit — ${schemaKeys.size} schema keys, `
  + `${topLevelKeys.length} top-level blocks, ${walk(ADMIN_DIR).length} admin files\n${'─'.repeat(72)}`,
);
if (process.argv.includes('--debug')) console.log('top-level blocks:', topLevelKeys.join(', '), '\n');

if (!findings.length) {      console.log('✅ Every admin field exists in the schema and every identity field is read by the site.');
      console.log(`   settings models scanned: ${MODEL_LABELS.join(', ')}`);
} else {
  if (byKind['missing-in-schema']) {
    console.log(`\n❌ ADMIN FIELDS THE DATABASE SILENTLY DROPS (${byKind['missing-in-schema'].length}):`);
    byKind['missing-in-schema'].forEach((f) => {
      console.log(`   • settings.${f.field}`);
      console.log(`     ${f.detail}`);
      console.log(`     in: ${f.files.join(', ')}`);
    });
  }
  if (byKind['dead-block']) {
    console.log(`\n❌ ADMIN BLOCKS NO PUBLIC COMPONENT READS (${byKind['dead-block'].length}):`);
    byKind['dead-block'].forEach((f) => console.log(`   • ${f.field} — ${f.detail}`));
  }
  if (byKind['dead-public-field']) {
    console.log(`\n❌ FIELDS NO PUBLIC COMPONENT READS (${byKind['dead-public-field'].length}):`);
    byKind['dead-public-field'].forEach((f) => console.log(`   • ${f.field} — ${f.detail}`));
  }
}

const missing = findings.filter((f) => f.kind === 'missing-in-schema').length;
console.log(
  `\nSummary: ${missing} dead admin field(s), `
  + `${(byKind['dead-block'] || []).length} dead settings block(s), `
  + `${(byKind['dead-public-field'] || []).length} unread identity field(s).`,
);

if (STRICT && findings.length) {
  console.log('\nSTRICT MODE: failing because the admin and the schema disagree.');
  process.exit(1);
}
