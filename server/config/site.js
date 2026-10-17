/**
 * The one origin this project actually serves.
 *
 * Why this file exists: the deployment's `CLIENT_URL` was found set to a
 * leftover Hostinger subdomain (`https://test.americanfuturetechllc.com`), so
 * every URL derived from it — the Stripe webhook endpoint the admin panel hands
 * to Stripe, the checkout success/cancel redirects when no Origin header is
 * present — pointed at a host that serves no app. That is exactly the state the
 * Stripe dashboard was in: two endpoints, both failing, and none at the domain
 * customers actually buy on.
 *
 * The site and the API are one app on one domain now, so the canonical origin is
 * known. `PUBLIC_SITE_ORIGIN` (or `PUBLIC_API_URL`) can still override it for a
 * future move, but a config value pointing at a retired host can no longer make
 * us hand Stripe a dead URL.
 */

const CANONICAL_SITE_ORIGIN = 'https://americanfuturetechllc.com';

/**
 * Hosts this project no longer serves. Matching is on the HOST, never on a
 * substring of the whole URL, so a legitimate domain that merely contains
 * "api." is not caught by accident.
 */
const RETIRED_HOST_PATTERNS = [
  // Both leftovers from the split "test API" deployment: the live CLIENT_URL
  // was found set to `test.…`, and Stripe also held an endpoint at `testapi.…`.
  /^test\.americanfuturetechllc\.com$/i,
  /^testapi\.americanfuturetechllc\.com$/i,
  /^api\.americanfuturetechllc\.com$/i,
  /\.onrender\.com$/i,
  /\.vercel\.app$/i,
];

const stripTrailingSlash = (value) => String(value || '').trim().replace(/\/+$/, '');

const hostOf = (value) => {
  try {
    return new URL(stripTrailingSlash(value)).host;
  } catch (error) {
    return '';
  }
};

/** Is this origin one of the hosts we retired? */
const isRetiredOrigin = (value) => {
  if (!value) return false;
  const host = hostOf(value);
  if (!host) return false;
  return RETIRED_HOST_PATTERNS.some((pattern) => pattern.test(host));
};

/**
 * The origin to advertise to Stripe and to use for absolute links.
 *
 * Order: an explicit public API URL, then an explicit site origin, then
 * `CLIENT_URL` — but only when it is not a retired host — and finally the
 * canonical domain.
 */
const resolveSiteOrigin = () => {
  const explicitApi = stripTrailingSlash(process.env.PUBLIC_API_URL);
  if (explicitApi) return explicitApi;

  const explicitSite = stripTrailingSlash(process.env.PUBLIC_SITE_ORIGIN);
  if (explicitSite) return explicitSite;

  const clientUrl = stripTrailingSlash(process.env.CLIENT_URL);
  if (clientUrl && !isRetiredOrigin(clientUrl)) return clientUrl;

  return CANONICAL_SITE_ORIGIN;
};

module.exports = {
  CANONICAL_SITE_ORIGIN,
  resolveSiteOrigin,
  isRetiredOrigin,
  hostOf,
};
