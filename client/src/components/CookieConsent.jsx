import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cookie, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';

/**
 * Cookie consent banner.
 *
 * The site had a Cookie Policy page but no banner, so nothing was ever asked or
 * recorded. The client's ask was specific: keep the record of who accepted, but
 * do not ask the visitor for personal details — so a decision here stores the
 * choice, the page, the time, the browser and a salted hash of the address, and
 * nothing else (see server/models/CookieConsent.js).
 *
 * Why it is written the way it is:
 *   · The choice lives in localStorage so the banner does not follow a visitor
 *     around the site. The SERVER copy is the record; this is only the "dismissed"
 *     flag, and losing it (private mode) costs one extra click, not the record.
 *   · The POST is fire-and-forget: a blocked or failed request must never keep
 *     the banner on screen, because the visitor has already made the choice.
 *   · A changed policy version re-asks everyone, and `policyVersion` is sent so
 *     an old row still says which wording was agreed to.
 *   · It is a bottom sheet, not a modal: the page stays usable, so a visitor is
 *     never trapped behind a consent prompt before they can read anything.
 */

const STORAGE_KEY = 'aft_cookie_consent_v1';
const POLICY_VERSION = '2026-10-17';
// Re-ask after this long even if the wording did not change (EU guidance treats
// a consent as needing renewal), and never trust a stored value with no date.
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

const readStored = () => {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.version !== POLICY_VERSION) return null;
    const at = Number(parsed.at) || 0;
    if (!at || Date.now() - at > MAX_AGE_MS) return null;
    return parsed;
  } catch (error) {
    return null;
  }
};

const writeStored = (value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    /* private mode or full storage — the banner simply asks again next visit */
  }
};

/** Tell the app (and anything listening) that a decision exists. */
const broadcast = (choice) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('aft:cookie-consent', { detail: { choice } }));
};

export default function CookieConsent() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  /*
   * Show only when there is no current decision. The delay lets the page paint
   * first: a consent sheet appearing over a half-rendered hero reads as a
   * pop-up, and the visitor has not seen what they are consenting to yet.
   */
  useEffect(() => {
    if (pathname.startsWith('/admin')) return undefined;
    if (readStored()) return undefined;
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [pathname]);

  /* A "Cookie settings" control elsewhere on the site opens this same sheet. */
  useEffect(() => {
    const open = () => {
      setManaging(true);
      setVisible(true);
    };
    window.addEventListener('aft:open-cookie-settings', open);
    return () => window.removeEventListener('aft:open-cookie-settings', open);
  }, []);

  const decide = (choice, categories = {}) => {
    const stored = {
      version: POLICY_VERSION,
      choice,
      categories,
      at: Date.now(),
    };
    writeStored(stored);
    setVisible(false);
    setManaging(false);
    broadcast(choice);

    /*
     * The record is best-effort. `keepalive` matters: a visitor often accepts and
     * immediately taps a link, and without it the request is cancelled when the
     * page unloads — losing exactly the acceptance we were asked to keep.
     */
    try {
      fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          choice,
          categories,
          policyVersion: POLICY_VERSION,
          page: window.location.pathname,
          language: navigator.language || '',
        }),
      }).catch(() => {});
    } catch (error) {
      /* no network — the local decision still stands */
    }
  };

  const acceptAll = () => decide('all', { necessary: true, analytics: true, marketing: true });
  const essentialsOnly = () => decide('essential', { necessary: true, analytics: false, marketing: false });
  const saveCustom = () => decide('custom', { necessary: true, analytics, marketing });

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[70] px-3 pb-3 sm:px-5 sm:pb-5 pointer-events-none"
      role="region"
      aria-label="Cookie consent"
    >
      {/* `pr-11` reserves the close button's column at every width: with the X in
          the flex row, the text column lost ~40px on a laptop and the last line
          of the notice ran under the buttons. Absolutely positioning it keeps
          the full card width available to the copy. */}
      <div className="pointer-events-auto relative mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-18px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={essentialsOnly}
          aria-label="Dismiss and continue with essential cookies only"
          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 p-4 pr-11 sm:p-5 sm:pr-12">
          <div className="hidden sm:flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300">
            <Cookie className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
              We use cookies
            </h2>
            <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Essential cookies keep the site working (sign-in, forms, your theme). With
              permission we also use analytics and marketing cookies. Change this any time
              in the{' '}
              <Link to="/cookie-policy" className="font-semibold text-red-700 underline underline-offset-2 hover:text-red-800 dark:text-red-300">
                Cookie Policy
              </Link>
              .
            </p>

            {managing && (
              <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                  <input type="checkbox" checked disabled className="mt-0.5 accent-red-600" />
                  <span>
                    <span className="font-semibold">Strictly necessary</span> — always on. Needed
                    for the site and the student portal to work.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(event) => setAnalytics(event.target.checked)}
                    className="mt-0.5 accent-red-600"
                  />
                  <span>
                    <span className="font-semibold">Analytics</span> — which pages are read and
                    where visitors drop off, in aggregate.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(event) => setMarketing(event.target.checked)}
                    className="mt-0.5 accent-red-600"
                  />
                  <span>
                    <span className="font-semibold">Marketing</span> — measuring campaigns and
                    showing relevant program offers.
                  </span>
                </label>
              </div>
            )}

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <button
                type="button"
                onClick={acceptAll}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Accept all
              </button>
              <button
                type="button"
                onClick={essentialsOnly}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Essential only
              </button>
              {managing ? (
                <button
                  type="button"
                  onClick={saveCustom}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-colors dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200 flex items-center justify-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Save my choices
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setManaging(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors dark:text-slate-300 dark:hover:text-white text-center"
                >
                  Customise
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
