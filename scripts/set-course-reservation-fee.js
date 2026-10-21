#!/usr/bin/env node
/**
 * Set a program's seat reservation fee (Admin → Courses → Reservation fee)
 * without clicking through the panel.
 *
 *   npm run set:fee -- --fee=499 --match=cissp,ai-product-manager,governance
 *   npm run set:fee -- --fee=499 --match=... --apply
 *
 * Why this exists: the reservation amount used to be one site-wide number, so
 * the three four-month programs could not be quoted at $499 while the rest kept
 * $99. The fee now lives on each course (`pricing.reservationFee`), and this
 * script backfills existing rows in whatever database `MONGODB_URI` names —
 * the dev database by default, or a production URI passed in the environment.
 *
 * It is a dry run unless `--apply` is given, and it never touches a course that
 * already carries the requested fee. Only 99 and 499 are accepted, because the
 * checkout only offers those two and the server ignores anything else.
 *
 * `--match` is a comma-separated list of case-insensitive fragments matched
 * against the slug AND the title, so "cissp" finds
 * "CISSP (Certified Information Systems Security Professional)".
 */

const path = require('path');
const fs = require('fs');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));

const FEE_OPTIONS = [99, 499];

const parseArgs = (argv) => {
  const args = { apply: false, fee: null, match: '' };
  for (const arg of argv) {
    if (arg === '--apply') args.apply = true;
    else if (arg.startsWith('--fee=')) args.fee = Number(arg.slice(6));
    else if (arg.startsWith('--match=')) args.match = arg.slice(8);
  }
  return args;
};

/** Read MONGODB_URI from server/.env without printing it. */
const readEnvUri = () => {
  const envPath = path.join(__dirname, '..', 'server', '.env');
  if (!fs.existsSync(envPath)) return '';
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('MONGODB_URI='));
  if (!line) return '';
  return line.slice('MONGODB_URI='.length).trim().replace(/^['"]|['"]$/g, '');
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!FEE_OPTIONS.includes(args.fee)) {
    console.error(`--fee must be one of ${FEE_OPTIONS.join(' or ')} (got ${args.fee}).`);
    process.exit(1);
  }
  const matches = args.match
    .split(',')
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean);
  if (!matches.length) {
    console.error('--match is required, e.g. --match=cissp,ai-product-manager,governance');
    process.exit(1);
  }

  const uri = (process.env.MONGODB_URI || '').trim() || readEnvUri();
  if (!uri) {
    console.error('No MONGODB_URI in the environment or server/.env — nothing to update.');
    process.exit(1);
  }

  const mongoose = require('mongoose');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  const collection = mongoose.connection.db.collection('courses');
  const courses = await collection
    .find({}, { projection: { title: 1, slug: 1, pricing: 1, isPublished: 1 } })
    .sort({ displayOrder: 1, createdAt: 1 })
    .toArray();

  const targets = courses.filter((course) => {
    const haystack = `${course.slug || ''} ${course.title || ''}`.toLowerCase();
    return matches.some((needle) => haystack.includes(needle));
  });

  console.log(`\nDatabase: ${mongoose.connection.name} @ ${mongoose.connection.host}`);
  console.log(`Fee: $${args.fee}${args.apply ? '' : '  (dry run — pass --apply to write)'}\n`);

  if (!targets.length) {
    console.log('No course matched. Available programs:');
    courses.forEach((c) => console.log(`  - ${c.slug} — ${c.title}`));
    await mongoose.disconnect();
    process.exit(1);
  }

  let changed = 0;
  let skipped = 0;
  for (const course of targets) {
    const current = Number(course.pricing?.reservationFee) || 0;
    if (current === args.fee) {
      skipped += 1;
      console.log(`  = ${course.title} — already $${args.fee}`);
      continue;
    }
    console.log(`  ${args.apply ? '✓' : '→'} ${course.title} — $${current || 'site default'} → $${args.fee}`);
    if (args.apply) {
      await collection.updateOne(
        { _id: course._id },
        { $set: { 'pricing.reservationFee': args.fee } }
      );
      changed += 1;
    }
  }

  if (!targets.length) {
    console.log('Nothing to do.');
  } else if (!args.apply) {
    console.log(`\n${targets.length - skipped} course(s) would change. Re-run with --apply to save.`);
  } else {
    console.log(`\nUpdated ${changed} course(s); ${skipped} already correct.`);
    console.log('The public catalogue cache (30 s) drops within half a minute.');
  }

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(`Failed: ${error.message}`);
  process.exit(1);
});
