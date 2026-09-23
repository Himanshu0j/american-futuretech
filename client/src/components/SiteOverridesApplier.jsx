import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  applyCurrent,
  hasAppliedOverrides,
  hasOverrides,
  hydrateRoute,
  loadRoute,
  subscribe,
} from '../lib/siteOverrides';

/**
 * Applies admin text/image edits for EVERY visitor.
 *
 * Without this, an edit only ever appeared inside the editor itself — the public
 * site kept rendering the coded defaults. It mounts once at the app root, walks
 * nothing until a route actually has overrides, and re-applies after React
 * re-renders so the edited wording survives navigation and hot reloads.
 *
 * The layout effect below runs before the browser paints and puts the last known
 * overrides back on the page from local cache, so a refresh shows the edited
 * content immediately instead of flashing the coded version first. The network
 * request then corrects it in the background.
 */
export default function SiteOverridesApplier() {
  const { pathname } = useLocation();
  const applyingRef = useRef(false);

  // Warm start — cached overrides go up before the first paint.
  useLayoutEffect(() => {
    const route = pathname || '/';
    if (route.startsWith('/admin') || route.startsWith('/student')) return;
    if (hydrateRoute(route) && hasOverrides()) applyCurrent();
  }, [pathname]);

  // Server truth (cheap, public, cached by the store).
  useEffect(() => {
    const route = pathname || '/';
    if (route.startsWith('/admin') || route.startsWith('/student')) return;
    let cancelled = false;
    loadRoute(route).then(() => {
      if (!cancelled && hasOverrides()) requestAnimationFrame(() => applyCurrent());
    });
    return () => { cancelled = true; };
  }, [pathname]);

  // Re-apply whenever the store changes (new data, staged draft, publish).
  useEffect(() => {
    let timer = null;
    const schedule = (delay = 60) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        if (applyingRef.current) return;
        // Nothing to write and nothing written → skip the DOM walk entirely.
        if (!hasOverrides() && !hasAppliedOverrides()) return;
        applyingRef.current = true;
        try { applyCurrent(); } finally { applyingRef.current = false; }
      }, delay);
    };

    const unsubscribe = subscribe(() => schedule());

    // React re-renders overwrite our text nodes, so watch the DOM and re-apply.
    const observer = new MutationObserver(() => {
      if (applyingRef.current) return;
      schedule(120);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    schedule(0);

    return () => {
      unsubscribe();
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
