import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  isStaffRoute,
  startScrollReveal,
  stopScrollReveal,
  syncScrollReveal,
} from '../lib/scrollReveal';

/**
 * Mounts the public site's scroll-reveal system (see lib/scrollReveal.js).
 *
 * Renders nothing. It lives at the app root so every public page is covered
 * without touching a single page component — and, because it never renders a
 * wrapper, the inline editor's position-based keys stay exactly where the
 * client's published edits expect them.
 *
 * It also publishes `data-audience="public|staff"` on <html>, which is what the
 * premium type rules in index.css use to leave the admin panel and the student
 * LMS completely alone.
 */
export default function ScrollReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    startScrollReveal();
    return () => stopScrollReveal();
  }, []);

  useEffect(() => {
    syncScrollReveal(pathname || '/');
  }, [pathname]);

  /**
   * The inline editor marks <body> when it switches on (SiteEditor.jsx), which
   * happens after this component mounts. A hidden block is not clickable, so the
   * effect stands down the moment the editor appears — and resumes when it is
   * closed.
   */
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return undefined;
    const observer = new MutationObserver(() => {
      syncScrollReveal(window.location.pathname || '/');
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-site-editor-active'],
    });
    return () => observer.disconnect();
  }, []);

  // Belt and braces: a route that mounts without a pathname change (the
  // fallback redirect) still gets the right audience flag on its first paint.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute(
      'data-audience',
      isStaffRoute(pathname || '') ? 'staff' : 'public',
    );
  }, [pathname]);

  return null;
}
