#!/usr/bin/env node
/**
 * Read-only content inventory for the production database.
 *
 *   node scripts/inspect-production-data.js                      # uses server/.env
 *   node scripts/inspect-production-data.js --uri "mongodb+srv://..."
 *
 * `npm run audit:testdata` answers "is anything in here recognisably test
 * data?". This answers the question that has to come first: "what is actually
 * in here, and does each row belong to the client or to a test run?".
 *
 * It NEVER writes. Deleting is deliberately left to the audit tool (which has
 * its own review step) or to the admin panel.
 */

const path = require('path');
const fs = require('fs');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const SERVER_DIR = path.join(__dirname, '..', 'server');

const readUri = () => {
  const flagIndex = process.argv.indexOf('--uri');
  if (flagIndex !== -1 && process.argv[flagIndex + 1]) return process.argv[flagIndex + 1];
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const envPath = path.join(SERVER_DIR, '.env');
  if (fs.existsSync(envPath)) {
    const line = fs.readFileSync(envPath, 'utf8').split('\n').find((l) => l.startsWith('MONGODB_URI='));
    if (line) return line.slice('MONGODB_URI='.length).trim();
  }
  return '';
};

const asText = (value) => {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 19);
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 48);
  return String(value).slice(0, 48);
};

// collection → the fields that identify a row to a human reviewer
const LAYOUT = {
  users: ['name', 'email', 'role', 'isActive', 'createdAt'],
  courses: ['title', 'slug', 'isPublished'],
  modules: ['title', 'course'],
  lessons: ['title'],
  batches: ['batchCode', 'startDate', 'status'],
  enrollments: ['student', 'course', 'status', 'createdAt'],
  progresses: ['student', 'course', 'progressPercent'],
  certificates: ['certificateNumber', 'studentName', 'courseTitle', 'status', 'issueDate'],
  payments: ['studentName', 'email', 'courseTitle', 'amount', 'status', 'invoiceNumber'],
  leads: ['fullName', 'email', 'status', 'marketingSource', 'createdAt'],
  jobs: ['title', 'companyName', 'isActive'],
  jobapplications: ['applicantName', 'email', 'jobTitle'],
  blogposts: ['title', 'isPublished'],
  faqs: ['question'],
  successstories: ['studentName', 'company', 'isPublished'],
  coupons: ['code', 'discountValue', 'isActive', 'usageCount'],
  supporttickets: ['ticketNumber', 'studentEmail', 'status'],
  sitesettings: ['siteName', 'updatedAt'],
  auditlogs: ['action', 'actorName', 'entity', 'createdAt'],
};

const run = async () => {
  const uri = readUri();
  if (!uri) {
    console.error('\nNo database URI. Pass --uri "mongodb+srv://..." or set MONGODB_URI.\n');
    process.exit(1);
  }

  console.log(`\nRead-only inventory of ${uri.replace(/:\/\/[^@]*@/, '://***@')}\n`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;

  const names = (await db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'))
    .sort();

  let total = 0;
  for (const name of names) {
    const count = await db.collection(name).countDocuments();
    total += count;
    const fields = LAYOUT[name];
    console.log(`\n=== ${name} — ${count} document(s) ===`);
    if (!fields) {
      console.log('  (no layout defined — counts only)');
      continue;
    }
    const rows = await db.collection(name).find({}).limit(25).toArray();
    for (const doc of rows) {
      const line = fields
        .map((f) => `${f}=${asText(f.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), doc))}`)
        .join('  ');
      console.log(`  ${line}`);
    }
    if (count > rows.length) console.log(`  … ${count - rows.length} more`);
  }

  console.log(`\nTotal documents across ${names.length} collections: ${total}\n`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(`\nFailed: ${error.message}\n`);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
