/**
 * Uploaded files are stored — and typed into the CMS — as `/uploads/<file>`.
 * In the browser that is relative to whichever host served the page, so on the
 * Vercel deployment it used to resolve to the app shell (the SPA catch-all
 * rewrite answers 200 text/html for any unknown path) and every admin-uploaded
 * image rendered broken. `vercel.json` now proxies `/uploads` to the API, and
 * these helpers build the absolute form on top of that:
 *
 *   - display inside the panel can use either, the proxy handles the relative one
 *   - a copied brief must use the absolute one, because it is read outside this
 *     origin (in a chat, an editor, a bug tracker) where `/uploads/x.png` means
 *     nothing
 *
 * The API host is only guessed when nothing is configured: `VITE_API_URL` wins
 * when set, a local page resolves against its own origin (the dev server proxies
 * /uploads), and otherwise the known Render origin is used — the same host the
 * deployment's own rewrites point at.
 */

const FALLBACK_API_ORIGIN = 'https://american-futuretech-api.onrender.com';

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|\[::1\])$/i;

const isAbsoluteUrl = (value) => /^(https?:|data:|blob:|\/\/)/i.test(String(value || '').trim());

/** Origin that actually serves /uploads for the page currently rendering. */
export const apiOrigin = () => {
  const configured = String(import.meta.env.VITE_API_URL || '').trim();
  if (/^https?:\/\//i.test(configured)) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through to the host-based guess */
    }
  }
  if (typeof window !== 'undefined' && LOCAL_HOSTS.test(window.location.hostname)) {
    return window.location.origin;
  }
  return FALLBACK_API_ORIGIN;
};

/**
 * Absolute URL for a stored asset path. Already-absolute values (an external
 * logo URL the client pasted, a data: preview) are returned untouched.
 */
export const absoluteAssetUrl = (url) => {
  const value = String(url || '').trim();
  if (!value) return '';
  if (isAbsoluteUrl(value)) return value;
  return `${apiOrigin()}${value.startsWith('/') ? '' : '/'}${value}`;
};

/** Short "host/…/file.png" label — used when a copy cannot carry the bytes. */
export const describeAssetUrl = (url) => {
  const value = String(url || '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(absoluteAssetUrl(value));
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return value;
  }
};

export { FALLBACK_API_ORIGIN };
