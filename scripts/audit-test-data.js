#!/usr/bin/env node
/**
 * Read-only audit for leftover test / demo records.
 *
 * Every verification script in this folder is supposed to clean up after
 * itself, but a crashed or interrupted run can leave a row behind. Before the
 * site is handed over, this lists anything that looks like test data so it can
 * be reviewed and (deliberately) removed.
 *
 * By default it NEVER writes or deletes — removal is always a separate, explicit
 * step. Pass `--clean` to remove the rows it just listed; that mode refuses to
 * touch singleton documents (the settings row holds the entire website, so
 * deleting it would wipe everything the client owns), and it only ever deletes
 * documents that matched one of the narrow markers above.
 *
 * Usage:
 *   npm run audit:testdata                       # uses MONGODB_URI from the env
 *   MONGODB_URI="mongodb+srv://..." npm run audit:testdata
 *   npm run audit:testdata -- --clean            # remove the listed leftovers
 *   npm run audit:testdata -- --clean-orphans     # remove unreachable child rows
 *
 * Credentials and free-text notes are the one thing this script will not print,
 * so it stays safe to run against production. The connection string is masked.
 */

const path = require('path');

// The server owns these dependencies; this script deliberately does not add a
// second copy to the repo root just to read a connection string.
const serverModules = path.join(__dirname, '..', 'server', 'node_modules');
const mongoose = require(path.join(serverModules, 'mongoose'));

require(path.join(serverModules, 'dotenv')).config({ path: path.join(__dirname, '..', 'server', '.env') });

const URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/american_futuretech';

const CLEAN_HEADING = '\x1b[1m\x1b[33m';
const CLEAN_RESET = '\x1b[0m';

/**
 * Markers used by the QA tooling in this repo. Deliberately narrow: a false
 * positive here would point at a real client record, so every pattern has to be
 * something a human would never type into the CMS on purpose.
 */
const PATTERNS = [
  /QA-LIVE-\d+/,
  /qa-live-/i,
  /qa-delete-me/i,
  /delete me/i,
  /^QA Test /m,
  /automated acceptance-?test/i,
  /^proof[: ]/i,
  /pagination fixture/i,
  /CONTRACT-\d+/,
];

const looksLikeTestData = (doc) => PATTERNS.some((rx) => rx.test(JSON.stringify(doc)));

/**
 * Collections that hold a single configuration document. A marker can land
 * anywhere inside such a document (one stale editor override, say) and the
 * whole row would look like test data — but deleting it destroys every setting
 * the client has. These are reported and skipped, never deleted.
 */
const SINGLETON_COLLECTIONS = new Set(['sitesettings', 'systemconfigs', 'systemsettings']);

const CLEAN = process.argv.includes('--clean');
const CLEAN_ORPHANS = process.argv.includes('--clean-orphans');

/**
 * Child collections and the parent they must point at. A row here whose parent
 * is gone can never be shown to anyone — it is either a leftover from deleting a
 * student before cascade-delete existed, or a bug in a delete path.
 */
const REFERENCES = [
  { collection: 'enrollments', field: 'student', parent: 'users' },
  { collection: 'enrollments', field: 'course', parent: 'courses' },
  { collection: 'enrollments', field: 'batch', parent: 'batches' },
  { collection: 'progresses', field: 'student', parent: 'users' },
  { collection: 'progresses', field: 'course', parent: 'courses' },
  { collection: 'certificates', field: 'student', parent: 'users' },
  { collection: 'payments', field: 'student', parent: 'users' },
  { collection: 'quizattempts', field: 'student', parent: 'users' },
  { collection: 'lessons', field: 'module', parent: 'modules' },
  { collection: 'jobapplications', field: 'job', parent: 'jobs' },
  { collection: 'jobapplications', field: 'applicant', parent: 'users' },
];

/**
 * Walks every declared child→parent link and returns the rows that point at a
 * document which no longer exists.
 */
const findOrphans = async (db) => {
  const parentIds = new Map();
  const parentIdSet = async (name) => {
    if (!parentIds.has(name)) {
      const rows = await db.collection(name).find({}).project({ _id: 1 }).toArray();
      parentIds.set(name, new Set(rows.map((row) => String(row._id))));
    }
    return parentIds.get(name);
  };

  const orphans = [];
  for (const link of REFERENCES) {
    const exists = await db.listCollections({ name: link.collection }).hasNext();
    if (!exists) continue;
    const parentExists = await db.listCollections({ name: link.parent }).hasNext();
    if (!parentExists) continue;
    const valid = await parentIdSet(link.parent);
    const docs = await db.collection(link.collection).find({}).toArray();
    for (const doc of docs) {
      const value = doc[link.field];
      if (!value) continue;
      if (!valid.has(String(value))) {
        orphans.push({ collection: link.collection, id: String(doc._id), field: link.field, parent: link.parent, pointsAt: String(value) });
      }
    }
  }
  return orphans;
};

const label = (doc) =>
  doc.email || doc.title || doc.code || doc.batchCode || doc.name || doc.question || '';

const run = async () => {
  console.log(`\nTest-data audit against ${URI.replace(/:\/\/[^@]*@/, '://***@')}\n`);
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;

  const collections = (await db.listCollections().toArray()).map((c) => c.name).sort();
  let totalFlagged = 0;
  const flagged = [];

  for (const name of collections) {
    const docs = await db.collection(name).find({}).limit(1000).toArray();
    const hits = docs.filter(looksLikeTestData);
    const mark = hits.length ? `⚠  ${hits.length} flagged` : 'ok';
    console.log(`  ${name.padEnd(22)} ${String(docs.length).padStart(4)} docs   ${mark}`);
    for (const doc of hits) {
      console.log(`        → ${doc._id}  ${String(label(doc)).slice(0, 70)}`);
      flagged.push({ collection: name, id: String(doc._id), label: label(doc) });
    }
    totalFlagged += hits.length;
  }

  console.log(`\n${totalFlagged === 0 ? '✅ No test data found.' : `⚠  ${totalFlagged} record(s) flagged for review.`}`);

  // ── Referential integrity ────────────────────────────────────────────────
  const orphans = await findOrphans(db);
  if (orphans.length === 0) {
    console.log('✅ No unreachable records — every enrollment, progress row and application points at a document that exists.');
  } else {
    console.log(`⚠  ${orphans.length} unreachable record(s):`);
    for (const item of orphans) {
      console.log(`     ${item.collection}/${item.id} → ${item.field} ${item.pointsAt} (no such ${item.parent} row)`);
    }
    if (CLEAN_ORPHANS) {
      // One row can be reported under several broken links (a missing student
      // and a missing batch), so count distinct documents, not links.
      const distinct = [...new Map(orphans.map((o) => [`${o.collection}/${o.id}`, o])).values()];
      console.log(`\n${CLEAN_HEADING}REMOVING ${distinct.length} unreachable document(s)${CLEAN_RESET}`);
      let removed = 0;
      for (const item of distinct) {
        const res = await db.collection(item.collection).deleteOne({ _id: new mongoose.Types.ObjectId(item.id) });
        removed += res.deletedCount;
      }
      console.log(`  removed ${removed} of ${distinct.length}`);
    } else {
      console.log('  Re-run with `--clean-orphans` to remove them (they cannot be reached from any screen).');
    }
  }

  if (totalFlagged && !CLEAN) {
    console.log('\nNothing was deleted. Review the list above, then remove the rows you');
    console.log('recognise as test data (Admin panel, or a one-off script).');
    console.log('Or re-run with `--clean` to remove exactly the rows listed above.\n');
  }

  if (CLEAN && totalFlagged) {
    const blocked = flagged.filter((f) => SINGLETON_COLLECTIONS.has(f.collection));
    const deletable = flagged.filter((f) => !SINGLETON_COLLECTIONS.has(f.collection));

    console.log(`\n${CLEAN_HEADING}CLEANING ${deletable.length} flagged record(s)${CLEAN_RESET}`);
    let removed = 0;
    for (const item of deletable) {
      try {
        const res = await db.collection(item.collection).deleteOne({ _id: new mongoose.Types.ObjectId(item.id) });
        removed += res.deletedCount;
      } catch (error) {
        console.log(`  ✗ could not delete ${item.collection}/${item.id}: ${error.message}`);
      }
    }
    console.log(`  removed ${removed} of ${deletable.length}`);

    if (blocked.length) {
      console.log('\n  These live inside a configuration document and were NOT deleted:');
      for (const item of blocked) console.log(`    • ${item.collection}/${item.id}`);
      console.log('    Clear the offending value through the Admin editor instead — deleting');
      console.log('    the row would wipe every setting the client owns.\n');
    }
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (error) => {
  console.error(`\nAudit failed: ${error.message}\n`);
  try { await mongoose.disconnect(); } catch (e) { /* already closed */ }
  process.exit(1);
});
