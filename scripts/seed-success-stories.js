#!/usr/bin/env node
/**
 * American FutureTech — publish the curated alumni success stories.
 *
 * The public /success-stories page renders whatever `GET /api/content/
 * success-stories` returns, and that endpoint only ever returns rows that exist
 * in the database. A code deploy therefore cannot add stories: the dataset in
 * server/utils/successStoriesSeed.js has to be POSTed through the same admin API
 * the ContentCMS uses, so the records are validated exactly like a hand-entered
 * review.
 *
 * The run is idempotent: stories whose studentName is already present are
 * skipped, so it can be re-run after the seed list grows. Nothing is ever
 * deleted or overwritten — existing rows are left untouched.
 *
 * Usage:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seed-success-stories.js
 *     → dry run against https://americanfuturetechllc.com
 *
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seed-success-stories.js --apply
 *     → create the missing stories
 *
 *   API_URL=http://localhost:5050 ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *     node scripts/seed-success-stories.js --apply
 *     → same, against a local server
 *
 * Credentials are read from the environment on purpose: this file is tracked, so
 * no account secret lives inside it.
 */
const { successStoriesSeed } = require('../server/utils/successStoriesSeed');

const API = (process.env.API_URL || 'https://americanfuturetechllc.com').replace(/\/+$/, '');
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const APPLY = process.argv.includes('--apply');

const request = async (method, path, { token, body } = {}) => {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON error page */
  }
  return { status: res.status, json, text };
};

const normalized = (value) => String(value || '').trim().toLowerCase();

(async () => {
  if (!EMAIL || !PASSWORD) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.');
    process.exit(2);
  }

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — success stories → ${API}\n`);

  const login = await request('POST', '/api/auth/login', { body: { email: EMAIL, password: PASSWORD } });
  const token = login.json?.token;
  if (!token) {
    console.error(`Login failed (HTTP ${login.status}): ${login.json?.message || login.text.slice(0, 200)}`);
    process.exit(1);
  }
  console.log(`Authenticated as ${login.json?.user?.email || EMAIL} (${login.json?.user?.role || 'unknown role'})\n`);

  const before = await request('GET', '/api/content/success-stories');
  const existing = before.json?.stories || [];
  console.log(`Live stories before: ${existing.length}`);

  const seen = new Set(existing.map((story) => normalized(story.studentName)));
  const missing = successStoriesSeed.filter((story) => !seen.has(normalized(story.studentName)));
  const alreadyThere = successStoriesSeed.length - missing.length;

  console.log(`Seed list size:      ${successStoriesSeed.length}`);
  console.log(`Already present:     ${alreadyThere}`);
  console.log(`To create:           ${missing.length}\n`);

  if (!missing.length) {
    console.log('Nothing to do — every seeded story is already published.');
  } else {
    missing.forEach((story, index) => {
      console.log(`  ${String(index + 1).padStart(3)}. +${story.salaryHikePercent}%  ${story.studentName} — ${story.role} @ ${story.company}`);
    });
    console.log('');
  }

  let created = 0;
  const failures = [];

  if (APPLY) {
    for (const [index, story] of missing.entries()) {
      const res = await request('POST', '/api/content/success-stories', { token, body: story });
      if (res.status === 201 && res.json?.success) {
        created += 1;
        process.stdout.write(`\r  created ${created}/${missing.length}  (${story.studentName})`.padEnd(80));
      } else {
        failures.push({ story, status: res.status, message: res.json?.message || res.text.slice(0, 200) });
        process.stdout.write('\r'.padEnd(81) + '\r');
        console.error(`  FAILED ${story.studentName}: HTTP ${res.status} ${res.json?.message || ''}`);
      }
      // Keep well clear of the API rate limiter.
      if (index < missing.length - 1) await new Promise((resolve) => setTimeout(resolve, 150));
    }
    process.stdout.write('\n');
  } else {
    console.log('Dry run — pass --apply to create these stories.\n');
  }

  const after = await request('GET', '/api/content/success-stories');
  const finalCount = (after.json?.stories || []).length;
  console.log(`\nLive stories after: ${finalCount}${APPLY ? ` (created ${created})` : ''}`);
  if (finalCount < 50) {
    console.log(`NOTE: the page still renders fewer than 50 stories.`);
  }
  if (failures.length) {
    console.error(`${failures.length} story/stories failed to create.`);
    process.exit(1);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
