#!/usr/bin/env node
/**
 * Set a program's seat reservation fee (Admin → Courses → Reservation fee)
 * without clicking through the panel.
 *
 *   npm run set:fee -- --fee=499 --match=cissp,ai-product-manager,governance
 *   MONGODB_URI=... npm run set:fee -- --fee=499 --match=... \
 *     --expect-db=<database> --apply
 *
 * Why this exists: the reservation amount used to be one site-wide number, so
 * the three four-month programs could not be quoted at $499 while the rest kept
 * $99. The fee now lives on each course (`pricing.reservationFee`), and this
 * script backfills existing rows.
 *
 * WHERE IT WRITES — and why this file is so fussy about it.
 *
 * This is the only script in the repo whose whole job is writing to whatever
 * database it is pointed at, which makes a wrong target both silent and
 * expensive: the run succeeds, prints a tidy summary, and the live catalogue is
 * untouched. Three situations produced exactly that, so all three now stop the
 * script instead of guessing:
 *
 *   1. A non-production target. `server/.env` is a local development file
 *      (`mongodb://127.0.0.1:27018/...`), so an unqualified run would "succeed"
 *      against a database nobody visits. Loopback databases are refused unless
 *      `--allow-local` is passed on purpose.
 *   2. An ambiguous target. Exporting one URI while `server/.env` holds another
 *      used to resolve silently in favour of the environment. Different values
 *      now require `--source=env` or `--source=file`, and the resolved host and
 *      database name are printed before anything happens.
 *   3. A target nobody confirmed. `--apply` needs `--expect-db=<database name>`
 *      so a copied command cannot land on the staging database (or a second
 *      cluster) because the shell happened to hold a different URI. The name in
 *      the URI must match the name in the flag exactly.
 *
 * It is a dry run unless `--apply` is given, and it never touches a course that
 * already carries the requested fee. Only 99 and 499 are accepted, because the
 * checkout only offers those two and the server ignores anything else.
 *
 * `--match` is a comma-separated list of case-insensitive fragments matched
 * against the slug AND the title, so "cissp" finds
 * "CISSP (Certified Information Systems Security Professional)".
 *
 * Credentials are never printed: only the host, the database name and where the
 * URI came from.
 */

const path = require('path');
const fs = require('fs');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));

const FEE_OPTIONS = [99, 499];
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]'];

const parseArgs = (argv) => {
  const args = {
    apply: false, fee: null, match: '', allowLocal: false, expectDb: '', source: '',
  };
  for (const arg of argv) {
    if (arg === '--apply') args.apply = true;
    else if (arg === '--allow-local') args.allowLocal = true;
    else if (arg.startsWith('--fee=')) args.fee = Number(arg.slice(6));
    else if (arg.startsWith('--match=')) args.match = arg.slice(8);
    else if (arg.startsWith('--expect-db=')) args.expectDb = arg.slice(12).trim();
    else if (arg.startsWith('--source=')) args.source = arg.slice(9).trim();
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

const fail = (message, hint = '') => {
  console.error(`\nRefusing to run: ${message}`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
};

/**
 * Host + database name of a connection string, without touching credentials.
 * `new URL` handles the `mongodb+srv://` form because the scheme is opaque to it.
 */
const describeTarget = (uri) => {
  let parsed;
  try {
    parsed = new URL(uri);
  } catch (error) {
    return null;
  }
  const host = parsed.host || '';
  const database = parsed.pathname.replace(/^\//, '').trim();
  const loopback = LOOPBACK_HOSTS.includes(parsed.hostname) || /\.localhost$/.test(parsed.hostname);
  return { host, database, loopback };
};

/**
 * Pick the ONE URI this run may use, or stop.
 *
 * `process.env.MONGODB_URI` and `server/.env` are both normal ways to configure
 * a local checkout, and they disagree easily. Rather than pick a winner, two
 * different values are treated as an ambiguity for the operator to resolve.
 */
const resolveUri = (args) => {
  const fromEnv = (process.env.MONGODB_URI || '').trim();
  const fromFile = readEnvUri();
  const conflict = Boolean(fromEnv && fromFile && fromEnv !== fromFile);

  let uri = '';
  let source = '';
  if (conflict) {
    if (args.source === 'env') { uri = fromEnv; source = 'the environment'; }
    else if (args.source === 'file') { uri = fromFile; source = 'server/.env'; }
    else {
      fail(
        'MONGODB_URI is set twice, with different values (the environment and server/.env).',
        'Re-run with --source=env or --source=file so the target is a decision, not a default.',
      );
    }
  } else if (fromEnv || fromFile) {
    uri = fromEnv || fromFile;
    source = fromEnv ? 'the environment' : 'server/.env';
  } else {
    fail(
      'no database target. Neither MONGODB_URI nor server/.env names one.',
      'Export MONGODB_URI for the database you mean, e.g. MONGODB_URI="mongodb+srv://…/american_futuretech_staging" npm run set:fee -- --fee=499 --match=cissp',
    );
  }

  const target = describeTarget(uri);
  if (!target) fail('MONGODB_URI cannot be parsed as a connection string.');
  if (!target.database) {
    fail(
      'MONGODB_URI names no database (the path after the host is empty).',
      'A driver would silently use a default database instead, so this is not a safe target.',
    );
  }
  if (target.loopback && !args.allowLocal) {
    fail(
      `the target is a loopback database (${target.host}/${target.database}), not a deployed one.`,
      'Nobody visits a local database, so this run would change nothing users see. Pass --allow-local if that is genuinely intended.',
    );
  }
  if (args.apply) {
    if (!args.expectDb) {
      fail(
        '--apply needs --expect-db=<database name> so the write is confirmed.',
        `Add --expect-db=${target.database} to confirm ${target.host}/${target.database}, or run without --apply for a dry run.`,
      );
    }
    if (args.expectDb !== target.database) {
      fail(
        `--expect-db=${args.expectDb} does not match the resolved database (${target.database}).`,
        'This mismatch is exactly how a production write lands on the wrong database.',
      );
    }
  } else if (args.expectDb && args.expectDb !== target.database) {
    fail(`--expect-db=${args.expectDb} does not match the resolved database (${target.database}).`);
  }

  return { uri, source, target };
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

  const { uri, source, target } = resolveUri(args);

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

  console.log(`\nTarget: ${target.host}/${target.database}  (from ${source})`);
  console.log(`Programs in target: ${courses.length}`);
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

  if (!args.apply) {
    console.log(`\n${targets.length - skipped} course(s) would change. Re-run with --apply --expect-db=${target.database} to save.`);
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
