/**
 * "A new phone still shows the old site" — self-heal for a stale document.
 *
 * The report: the client's own laptop showed every change, but a phone that had
 * never visited the site still painted old content. A fresh browser has no
 * localStorage cache to blame, so the stale half had to be the DOCUMENT itself:
 * an edge/CDN copy of `index.html` (or a carrier proxy) still referencing the
 * previous, fingerprinted bundle. Nothing inside React can see that — the app
 * being rendered IS the old build, so it renders old content and never asks the
 * server for a newer file.
 *
 * The fix compares two things that are always in the page:
 *   · `<meta name="x-aft-commit">` — the build this DOCUMENT was made from
 *     (client/vite.config.js stamps it at build time), and
 *   · `/api/health` → `build.commit` — the build the SERVER is running now.
 *
 * When they differ, this document is stale. One cache-busting reload later the
 * browser fetches `index.html` past every stored copy and the app becomes the
 * current build. It is deliberately conservative:
 *   · a missing/unknown stamp does nothing (dev server, older build),
 *   · at most one forced reload per target commit per session, so a rollback or
 *     a mid-deploy mismatch can never turn into a reload loop,
 *   · the `_build` query is removed from the address bar afterwards, so a shared
 *     link is not littered with it.
 */

const META_NAME = 'x-aft-commit';
const GUARD_KEY = 'aft_stale_reload_for';
const QUERY_KEY = '_build';

const stampOf = (value) => String(value || '').trim();

/** The build this document was made from, or '' when it cannot be known. */
export const readDocumentCommit = () => {
  if (typeof document === 'undefined') return '';
  const tag = document.querySelector(`meta[name="${META_NAME}"]`);
  const value = stampOf(tag?.getAttribute('content'));
  return value && value !== 'unknown' ? value : '';
};

const cleanAddressBar = () => {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(QUERY_KEY)) return;
    url.searchParams.delete(QUERY_KEY);
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
  } catch (error) {
    /* opaque origin or blocked history API — the page still works */
  }
};

const reloadFor = (commit) => {
  try {
    if (window.sessionStorage.getItem(GUARD_KEY) === commit) return false;
    window.sessionStorage.setItem(GUARD_KEY, commit);
  } catch (error) {
    // Storage blocked (private mode): reload once per page life instead of
    // risking a loop. `return false` is the safe direction.
    return false;
  }

  const url = new URL(window.location.href);
  url.searchParams.set(QUERY_KEY, commit.slice(0, 12));
  // `replace` keeps the stale document out of the back stack, so pressing Back
  // after the heal does not return to the stale page and bounce again.
  window.location.replace(url.toString());
  return true;
};

/**
 * Ask the server what it is running and heal the document if it moved on.
 * Returns the server's commit (or '' when the answer was unusable).
 */
export const checkDeployFreshness = async () => {
  const documentCommit = readDocumentCommit();
  if (!documentCommit) return '';

  let serverCommit = '';
  try {
    const res = await fetch('/api/health', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return '';
    const body = await res.json();
    serverCommit = stampOf(body?.build?.commit);
  } catch (error) {
    return '';
  }

  if (!serverCommit || serverCommit === 'unknown' || serverCommit === documentCommit) {
    return serverCommit;
  }

  reloadFor(serverCommit);
  return serverCommit;
};

/** Wire it up once, after the first paint. Safe to call in StrictMode. */
export const startDeployFreshnessWatch = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  cleanAddressBar();

  // Wait for the first paint: a reload during hydration would flash the page
  // for no reason when nothing is stale, which is the common case.
  const run = () => {
    checkDeployFreshness().catch(() => {});
  };

  setTimeout(run, 4000);

  // A tab left open across a deploy is the other half of "purana data" — it
  // keeps rendering the build it loaded until it is told to look again.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') run();
  });
};
