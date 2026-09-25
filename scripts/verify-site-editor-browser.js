/**
 * Website Editor draft-survival regression — real Chrome, real admin session.
 *
 *   node scripts/verify-site-editor-browser.js                       # dev server :5273
 *   SB_BASE=http://127.0.0.1:5274 node scripts/verify-site-editor-browser.js
 *
 * The bug this exists for: an admin staged a text change, left the page or simply
 * refreshed, came back and the editor showed "0 draft" with a disabled Publish
 * button — the staged work had been silently wiped by the applier's background
 * refetch. The client read that as "my saves never appear after refresh".
 *
 * The API test (verify:editor) proves the server stores what it is sent. This one
 * proves the *editor's* promise, which is what the client actually touched:
 *
 *   1. a staged draft keeps its count across a background refetch
 *   2. …across a hard refresh of the same page
 *   3. …and across navigating to another page and back
 *   4. an unpublished draft is a draft: a different visitor never sees it
 *   5. Publish reports what went live — and says WHICH entry it refused and WHY
 *   6. a refused entry stays staged so it can be fixed, not silently lost
 *
 * Everything it writes is removed again before it exits.
 */

const fs = require('fs');
const path = require('path');

module.paths.push(path.join(__dirname, '..', 'node_modules'));
const puppeteer = require('puppeteer-core');

const BASE = (process.env.SB_BASE || 'http://127.0.0.1:5273').replace(/\/$/, '');
const API = `${BASE}/api`;
const CHROME =
  process.env.CHROME_PATH ||
  ['C:/Program Files/Google/Chrome/Application/chrome.exe',
   'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));

const ADMIN = {
  email: process.env.SB_EMAIL || 'admin@americanfuturetech.com',
  password: process.env.SB_PASSWORD || 'Qa-Local-Only-2026!k',
};

const EDIT_ROOT = '[data-site-editor-ui="true"]';
const EDIT_PAGE = '/';            // the page the draft is staged on
const OTHER_PAGE = '/about';      // somewhere to navigate away to
const MARKER = `QA draft survives navigation ${Date.now()}`;

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  \u2705' : '  \u274C'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const request = async (method, url, { token, body } = {}) => {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try { json = await res.json(); } catch (e) { json = null; }
  return { status: res.status, json };
};

/* ── In-page readers ─────────────────────────────────────────────────────── */

const readEditor = (page) => page.evaluate((rootSel) => {
  const root = document.querySelector(rootSel);
  if (!root) return null;
  const badgeEl = Array.from(root.querySelectorAll('span'))
    .find((s) => /·\s*\d+\s*draft/.test(s.textContent || ''));
  const badge = badgeEl ? badgeEl.textContent.replace(/\s+/g, ' ').trim() : null;
  const publishBtn = Array.from(root.querySelectorAll('button'))
    .find((b) => /^Publish/.test((b.textContent || '').trim()));
  return {
    badge,
    publishLabel: publishBtn ? publishBtn.textContent.trim() : null,
    publishDisabled: publishBtn ? publishBtn.disabled : null,
    text: root.innerText || '',
  };
}, EDIT_ROOT);

const badgeDraftCount = (badge) => {
  const match = /·\s*(\d+)\s*draft/.exec(badge || '');
  return match ? Number(match[1]) : null;
};

const badgeLiveCount = (badge) => {
  const match = /(\d+)\s*live/.exec(badge || '');
  return match ? Number(match[1]) : null;
};

const markerOnPage = (page) => page.evaluate(
  (m) => document.body.innerText.includes(m),
  MARKER,
);

/** Wait until the editor panel reports at least `n` staged changes. */
const waitForDrafts = async (page, n, timeout = 20000) => {
  await page.waitForFunction(
    (rootSel, wanted) => {
      const root = document.querySelector(rootSel);
      if (!root) return false;
      const el = Array.from(root.querySelectorAll('span'))
        .find((s) => /·\s*\d+\s*draft/.test(s.textContent || ''));
      if (!el) return false;
      const match = /·\s*(\d+)\s*draft/.exec(el.textContent);
      return match && Number(match[1]) >= wanted;
    },
    { timeout },
    EDIT_ROOT, n,
  );
};

/** Click the first editable text element on the page (never the editor's own UI). */
const clickFirstEditableText = async (page) => {
  const handle = await page.evaluateHandle(() => {
    const candidates = [];
    document.querySelectorAll('.se-editable').forEach((el) => {
      if (el.closest('[data-site-editor-ui="true"]')) return;
      if (el.tagName === 'IMG') return;
      const text = (el.textContent || '').trim();
      if (text.length < 4 || text.length > 200) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 8) return;
      candidates.push({ el, inLink: Boolean(el.closest('a')) });
    });
    // Prefer a plain text block so a stray link cannot navigate away.
    const plain = candidates.find((c) => !c.inLink);
    return (plain || candidates[0] || {}).el || null;
  });

  const target = handle.asElement();
  if (!target) throw new Error('no editable text element found on the page');
  await target.scrollIntoView();
  await target.click();
  await sleep(250);
  const opened = await page.$eval(EDIT_ROOT, (root) => /Stage change/.test(root.innerText));
  if (!opened) {
    // The overlay swallowed the real click — fall back to a dispatched event,
    // which still travels through the editor's document-level capture listener.
    await page.evaluate((el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })), target);
  }
  await page.waitForFunction(
    (rootSel) => {
      const root = document.querySelector(rootSel);
      return Boolean(root) && /Stage change/.test(root.innerText);
    },
    { timeout: 10000 },
    EDIT_ROOT,
  );
};

/** Type a value into the editor's open textarea through React's own onChange. */
const setEditorText = async (page, value) => page.evaluate((rootSel, text) => {
  const root = document.querySelector(rootSel);
  const area = root.querySelector('textarea');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(area, text);
  area.dispatchEvent(new Event('input', { bubbles: true }));
}, EDIT_ROOT, value);

const clickEditorButton = async (page, label) => page.evaluate((rootSel, wanted) => {
  const root = document.querySelector(rootSel);
  const btn = Array.from(root.querySelectorAll('button'))
    .find((b) => new RegExp(wanted).test((b.textContent || '').trim()));
  if (!btn) return false;
  btn.click();
  return true;
}, EDIT_ROOT, label);

/* ── The run ─────────────────────────────────────────────────────────────── */

const run = async () => {
  if (!CHROME) throw new Error('Chrome not found — set CHROME_PATH');
  console.log(`\nWebsite Editor draft regression against ${BASE}\n`);

  const login = await request('POST', `${API}/auth/login`, { body: ADMIN });
  const token = login.json?.token;
  check('Admin authenticated against the local API', Boolean(token), `status ${login.status}`);
  if (!token) throw new Error('login failed — check SB_EMAIL / SB_PASSWORD');

  // Start from a clean page so the run is repeatable.
  const preClean = await request('DELETE', `${API}/settings/site-editor?route=${encodeURIComponent(EDIT_PAGE)}`, { token });
  const leftovers = (preClean.json?.removedText || 0) + (preClean.json?.removedImages || 0);
  console.log(`  \u2139\uFE0F  cleared ${leftovers} pre-existing override(s) on ${EDIT_PAGE} for a clean run`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    protocolTimeout: 180000,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
  });

  try {
    /* ── Admin context: stage a draft ───────────────────────────────────── */
    const adminContext = await browser.createBrowserContext();
    const page = await adminContext.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluateOnNewDocument((t) => {
      try {
        window.localStorage.setItem('aft_admin_token', t);
        window.localStorage.setItem('token', t);
      } catch (e) { /* ignore */ }
    }, token);

    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e.message)));

    const editorUrl = (route) => `${BASE}${route}${route.includes('?') ? '&' : '?'}edit=1`;

    await page.goto(editorUrl(EDIT_PAGE), { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(EDIT_ROOT, { timeout: 30000 });
    await page.waitForSelector('.se-editable', { timeout: 30000 });
    check('Editor activates on ?edit=1 for the signed-in admin', true);

    await clickFirstEditableText(page);
    await setEditorText(page, MARKER);
    await clickEditorButton(page, 'Stage change');

    await waitForDrafts(page, 1);
    const staged = await readEditor(page);
    check('Staging a change shows 1 draft and enables Publish',
      badgeDraftCount(staged.badge) === 1 && staged.publishDisabled === false,
      `badge "${staged.badge}", publish disabled=${staged.publishDisabled}`);
    check('The staged text is previewed on the page immediately',
      await markerOnPage(page));

    // The applier refetches this route in the background right after mount; the
    // old code let that reset state.staged to empty.
    await sleep(2500);
    const afterRefetch = await readEditor(page);
    check('The draft survives the background refetch',
      badgeDraftCount(afterRefetch.badge) === 1 && afterRefetch.publishDisabled === false,
      `badge "${afterRefetch.badge}"`);

    // A plain refresh is what the client described as "saves do not appear".
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector(EDIT_ROOT, { timeout: 30000 });
    await waitForDrafts(page, 1);
    const afterReload = await readEditor(page);
    check('The draft survives a hard refresh of the same page',
      badgeDraftCount(afterReload.badge) === 1 && afterReload.publishDisabled === false,
      `badge "${afterReload.badge}"`);
    check('The editor says the draft was restored',
      /Restored 1 unsaved draft/.test(afterReload.text));
    check('The restored draft is still previewed on the page',
      await markerOnPage(page));

    // Navigate away and back — the exact path that reproduced the loss.
    await page.goto(editorUrl(OTHER_PAGE), { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(EDIT_ROOT, { timeout: 30000 });
    await sleep(1500);
    const onOtherPage = await readEditor(page);
    check('A draft is held per page — another page shows none of it',
      badgeDraftCount(onOtherPage.badge) === 0, `badge "${onOtherPage.badge}"`);

    // Publish with nothing staged must still answer, not sit there dead.
    await clickEditorButton(page, '^Publish');
    await page.waitForFunction(
      (rootSel) => {
        const root = document.querySelector(rootSel);
        return Boolean(root) && /Nothing is staged on \/about yet/.test(root.innerText);
      },
      { timeout: 10000 },
      EDIT_ROOT,
    );
    check('Publish with nothing staged explains itself instead of doing nothing', true);

    await page.goto(editorUrl(EDIT_PAGE), { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(EDIT_ROOT, { timeout: 30000 });
    await waitForDrafts(page, 1);
    const afterNavigation = await readEditor(page);
    check('The draft survives navigating away and coming back',
      badgeDraftCount(afterNavigation.badge) === 1 && afterNavigation.publishDisabled === false,
      `badge "${afterNavigation.badge}"`);
    check('Only the page that owns the draft previews it', await markerOnPage(page));

    /* ── A different visitor must NOT see the unpublished draft ─────────── */
    const visitorContext = await browser.createBrowserContext();
    const visitor = await visitorContext.newPage();
    await visitor.setViewport({ width: 1440, height: 900 });
    await visitor.goto(`${BASE}${EDIT_PAGE}`, { waitUntil: 'domcontentloaded' });
    await sleep(2500);   // let the applier fetch and apply whatever is published
    check('An unpublished draft is invisible to a visitor',
      !(await markerOnPage(visitor)));
    check('No editor UI appears for a signed-out visitor',
      (await visitor.$(EDIT_ROOT)) === null);

    /* ── Publish ────────────────────────────────────────────────────────── */
    await clickEditorButton(page, '^Publish');
    await page.waitForFunction(
      (rootSel) => {
        const root = document.querySelector(rootSel);
        return Boolean(root) && /published live/.test(root.innerText);
      },
      { timeout: 20000 },
      EDIT_ROOT,
    );
    const published = await readEditor(page);
    check('Publish reports what went live',
      /1 change\(s\) published live on \//.test(published.text), published.text.split('\n').filter(Boolean).slice(-1)[0]);
    check('The staged count drops to 0 after a successful publish',
      badgeDraftCount(published.badge) === 0 && badgeLiveCount(published.badge) === 1,
      `badge "${published.badge}"`);

    await visitor.reload({ waitUntil: 'domcontentloaded' });
    await visitor.waitForFunction(
      (m) => document.body.innerText.includes(m),
      { timeout: 20000 },
      MARKER,
    );
    check('A visitor now sees the published text', true);

    /* ── A refused entry: named, explained, and still staged ────────────── */
    await clickFirstEditableText(page);
    await setEditorText(page, 'x'.repeat(650));
    await clickEditorButton(page, 'Stage change');
    await waitForDrafts(page, 1);
    const oversized = await readEditor(page);
    check('The editor warns BEFORE Publish that the entry cannot be stored',
      /cannot be stored and will be refused on Publish/.test(oversized.text)
      && /600/.test(oversized.text));

    await clickEditorButton(page, '^Publish');
    await page.waitForFunction(
      (rootSel) => {
        const root = document.querySelector(rootSel);
        return Boolean(root) && /Nothing was published/.test(root.innerText);
      },
      { timeout: 20000 },
      EDIT_ROOT,
    );
    const refused = await readEditor(page);
    check('Publish says nothing was published instead of failing silently',
      /Nothing was published — all 1 staged change\(s\) were rejected/.test(refused.text));
    check('Publish names the reason the entry was refused',
      /over the 600-character limit/.test(refused.text),
      (refused.text.match(/Text [^\n]*limit/) || [''])[0].slice(0, 160));
    check('The refused entry stays staged so it can be fixed',
      badgeDraftCount(refused.badge) === 1, `badge "${refused.badge}"`);

    check('The editor produced no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));

    /* ── Clean up ───────────────────────────────────────────────────────── */
    const cleanup = await request('DELETE', `${API}/settings/site-editor?route=${encodeURIComponent(EDIT_PAGE)}`, { token });
    check('Cleanup removed the test override',
      cleanup.status === 200 && cleanup.json?.removedText === 1,
      `removed ${cleanup.json?.removedText} text`);

    await visitor.goto(`${BASE}${EDIT_PAGE}`, { waitUntil: 'domcontentloaded' });
    await visitor.waitForFunction(
      (m) => !document.body.innerText.includes(m),
      { timeout: 20000 },
      MARKER,
    );
    check('The page is back to its original content for visitors', true);

    /* ── Wording that arrives late from the CMS ───────────────────────────
     * The homepage headline is CMS-backed: the page paints the coded default
     * ("BUILD HIGH-VALUE SKILLS.") and swaps in settings.hero.headline when
     * /api/settings lands. The editor used to cache that first render as the
     * element's "original" forever, so a published edit was compared against
     * text that no longer existed and silently never appeared. Delaying the CMS
     * response forces exactly that ordering.
     */
    await request('DELETE', `${API}/settings/site-editor?route=${encodeURIComponent(EDIT_PAGE)}`, { token });

    const racePage = await adminContext.newPage();
    await racePage.setViewport({ width: 1440, height: 900 });
    await racePage.evaluateOnNewDocument((t) => {
      try {
        window.localStorage.setItem('aft_admin_token', t);
        window.localStorage.setItem('token', t);
      } catch (e) { /* ignore */ }
    }, token);

    await racePage.goto(editorUrl(EDIT_PAGE), { waitUntil: 'domcontentloaded' });
    await racePage.waitForSelector('h1', { timeout: 30000 });
    // Read the headline as early as possible. The page paints its coded default
    // ("BUILD HIGH-VALUE SKILLS.") before /api/settings swaps in the CMS wording,
    // and an editor snapshot taken in that window is what used to poison the edit.
    const earlyHeadline = await racePage.evaluate(() => document.querySelector('h1').textContent.trim());
    await racePage.waitForSelector(EDIT_ROOT, { timeout: 30000 });
    await racePage.waitForFunction(
      () => /Master/i.test(document.querySelector('h1')?.textContent || ''),
      { timeout: 30000 },
    );
    const liveHeadline = await racePage.evaluate(() => document.querySelector('h1').textContent.trim());
    console.log(`  \u2139\uFE0F  headline: first paint "${earlyHeadline.slice(0, 30)}…" → cms "${liveHeadline.slice(0, 30)}…"`);

    await racePage.evaluate(() => {
      document.querySelector('h1').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await racePage.waitForFunction(
      (rootSel) => /Stage change/.test(document.querySelector(rootSel).innerText),
      { timeout: 10000 },
      EDIT_ROOT,
    );
    const raceCard = await racePage.evaluate((rootSel) => document.querySelector(rootSel).innerText, EDIT_ROOT);
    const capturedOriginal = ((raceCard.match(/Original: (.*)/) || [])[1] || '').trim();
    check('The editor captures the wording on screen, not a stale first render',
      capturedOriginal.length > 0 && liveHeadline.startsWith(capturedOriginal.slice(0, 20)),
      `on screen "${liveHeadline.slice(0, 34)}" vs captured "${capturedOriginal.slice(0, 34)}"`);

    const HEADLINE_VALUE = liveHeadline.replace('Master', 'Masters');
    await racePage.evaluate((rootSel, value) => {
      const area = document.querySelector(`${rootSel} textarea`);
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(area, value);
      area.dispatchEvent(new Event('input', { bubbles: true }));
    }, EDIT_ROOT, HEADLINE_VALUE);
    await clickEditorButton(racePage, 'Stage change');
    await waitForDrafts(racePage, 1);
    await clickEditorButton(racePage, '^Publish');
    await racePage.waitForFunction(
      (rootSel) => /published live/.test(document.querySelector(rootSel).innerText),
      { timeout: 20000 },
      EDIT_ROOT,
    );

    const raceVisitor = await visitorContext.newPage();
    await raceVisitor.goto(`${BASE}${EDIT_PAGE}`, { waitUntil: 'domcontentloaded' });
    await raceVisitor.waitForFunction(
      (expected) => (document.querySelector('h1')?.textContent || '').trim().startsWith(expected),
      { timeout: 20000 },
      'Masters',
    );
    const visitorHeadline = await raceVisitor.evaluate(() => document.querySelector('h1').textContent.trim());
    check('An edit to a CMS-driven headline really reaches visitors',
      visitorHeadline.startsWith('Masters'), `visitor h1 "${visitorHeadline.slice(0, 40)}"`);
    await raceVisitor.close();

    /* The headline edit is published. Now prove the applier still renders it when
     * the stored "original" no longer exists on the page — the shape a stale
     * capture leaves behind, and the reason a published edit used to be skipped.
     * Written straight through the API so the ordering is deterministic. */
    const stored = await request('GET', `${API}/settings/site-editor?route=${encodeURIComponent(EDIT_PAGE)}`);
    const headlineKey = Object.keys(stored.json?.text || {})[0];
    const STALE_ORIGINAL = 'BUILD HIGH-VALUE SKILLS. — wording that is no longer on this page';
    const poisoned = await request('PUT', `${API}/settings/site-editor`, {
      token,
      body: {
        route: EDIT_PAGE,
        text: { [headlineKey]: { original: STALE_ORIGINAL, value: HEADLINE_VALUE } },
      },
    });
    check('An override whose stored original is gone can be set up',
      poisoned.json?.saved === 1 && Object.keys(stored.json?.text || {}).length === 1,
      `key "${String(headlineKey).slice(0, 40)}"`);

    const poisonedVisitor = await visitorContext.newPage();
    await poisonedVisitor.goto(`${BASE}${EDIT_PAGE}`, { waitUntil: 'domcontentloaded' });
    await poisonedVisitor.waitForFunction(
      (expected) => (document.querySelector('h1')?.textContent || '').trim().startsWith(expected),
      { timeout: 20000 },
      'Masters',
    );
    const poisonedHeadline = await poisonedVisitor.evaluate(() => document.querySelector('h1').textContent.trim());
    check('A published edit still renders when its stored original no longer exists',
      poisonedHeadline.startsWith('Masters'),
      `visitor h1 "${poisonedHeadline.slice(0, 40)}"`);
    check('The stale original is nowhere on the page (so nothing else could match)',
      !(await poisonedVisitor.evaluate(
        (t) => document.body.innerText.includes(t),
        STALE_ORIGINAL.slice(0, 30),
      )));
    await poisonedVisitor.close();

    await racePage.goto(editorUrl(EDIT_PAGE), { waitUntil: 'domcontentloaded' });
    await racePage.waitForSelector(EDIT_ROOT, { timeout: 30000 });
    await sleep(2000);
    const raceBadge = await readEditor(racePage);
    check('The published headline stays live across an editor reload',
      badgeLiveCount(raceBadge.badge) === 1 && badgeDraftCount(raceBadge.badge) === 0,
      `badge "${raceBadge.badge}"`);

    const raceCleanup = await request('DELETE', `${API}/settings/site-editor?route=${encodeURIComponent(EDIT_PAGE)}`, { token });
    check('Cleanup removed the headline override',
      raceCleanup.status === 200 && raceCleanup.json?.removedText === 1,
      `removed ${raceCleanup.json?.removedText} text`);
    await racePage.close();

    await adminContext.close();
    await visitorContext.close();
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`RESULT: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach((f) => console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`));
    process.exit(1);
  }
  console.log('All Website Editor draft checks passed \u2705');
};

run().catch((error) => {
  console.error('\nVerification crashed:', error.message);
  process.exit(1);
});
