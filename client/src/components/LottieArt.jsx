import React, { useEffect, useRef, useState } from 'react';
import { Lottie } from 'lottie-react';

/**
 * The site's Lottie marks — sourced from LottieFiles, recoloured to the brand
 * palette, and served as bundled JSON (see docs/design-assets.md for the
 * source page, creator and licence of each one).
 *
 * Three things this wrapper exists to guarantee:
 *
 * 1. **The box never collapses.** A Lottie draws into whatever box it is given,
 *    and a box with no height shows nothing. Callers pass the size through
 *    `className`; the wrapper keeps it whether or not the JSON has arrived, so
 *    the hero badge or an empty state never jumps as the animation loads.
 * 2. **Nothing loads until it is near the viewport.** Each animation is its own
 *    chunk, imported only once the mark is within 200px of the screen — the
 *    certificate seal costs a visitor who never opens that page nothing.
 * 3. **Reduced motion gets a still.** `prefers-reduced-motion` visitors get the
 *    first frame parked, not a loop; the mark is decoration, so a frozen frame
 *    loses no information.
 *
 * It is always decorative unless `label` is given: the headings and paragraphs
 * beside these marks already say what they mean, and a second announcement
 * ("image: graduation cap") only adds noise.
 */
const SOURCES = {
  'graduation-cap': () => import('../assets/animations/hero/graduation-cap.json'),
  'credential-seal': () => import('../assets/animations/certification/credential-seal.json'),
  'success-check': () => import('../assets/animations/learning/success-check.json'),
  'search-empty': () => import('../assets/animations/misc/search-empty.json'),
};

const usePrefersReducedMotion = () => {
  const [reduce, setReduce] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(query.matches);
    sync();
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  return reduce;
};

export default function LottieArt({
  name,
  className = '',
  label,
  fallback = null,
  eager = false,
  loop = true,
}) {
  const hostRef = useRef(null);
  const [active, setActive] = useState(eager);
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const reduce = usePrefersReducedMotion();

  // Start the fetch when the mark comes near the viewport (or immediately, for
  // the hero). `rootMargin` prefetches a little early so the swap is invisible.
  useEffect(() => {
    if (active || failed) return undefined;
    const node = hostRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver !== 'function') {
      setActive(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active, failed]);

  useEffect(() => {
    if (!active) return undefined;
    const load = SOURCES[name];
    if (!load) {
      setFailed(true);
      return undefined;
    }
    let alive = true;
    load()
      .then((module) => {
        if (alive) setData(module.default || module);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [active, name]);

  const showsFallback = !data;

  return (
    <span
      ref={hostRef}
      className={`inline-flex items-center justify-center ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      {showsFallback ? fallback : null}
      {/* lottie-react v3 takes the parsed animation as `src` (a URL or the
          object itself). The v2 `animationData` prop is gone and silently
          renders an empty box, which is how this looked before it was caught. */}
      {data ? (
        <Lottie
          src={data}
          loop={loop && !reduce}
          autoplay={!reduce}
          className="h-full w-full"
        />
      ) : null}
    </span>
  );
}
