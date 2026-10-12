import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Starts a muted, looping showcase clip the instant its frame exists and keeps
 * it running for as long as the page is open.
 *
 * `autoPlay` alone cannot promise that:
 *   • a `play()` issued while the first frames are still arriving is rejected
 *     (AbortError), so a slow connection can leave the frame frozen on its
 *     poster even though the file is on its way;
 *   • a browser pauses muted autoplay when the tab is backgrounded, and a
 *     panel that unmounts and remounts — the hero cockpit swaps panels on a tab
 *     switch — comes back paused, because `autoPlay` is only honoured when the
 *     element is inserted.
 *
 * So the clip is started explicitly, started again as data lands, and resumed
 * on every signal that the page is in front of someone again.
 *
 * `prefers-reduced-motion` visitors keep a still first frame (the WCAG
 * expectation for looping motion), and the caller's own pause/play control
 * still works in both directions. A pause the visitor chose is respected —
 * only browser-initiated pauses are undone.
 *
 * The hook owns the ref, and returns it as `videoRef`: a callback ref re-runs
 * the effect when the element is mounted again, which a plain ref object
 * cannot signal.
 *
 * @param {string} src the clip's URL; changing it restarts playback
 * @returns {{ videoRef: (el: HTMLVideoElement | null) => void, isPlaying: boolean, toggle: () => void }}
 */
export default function useAlwaysPlayingVideo(src) {
  const [node, setNode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  // Remembers a pause the visitor asked for, so returning to the tab does not
  // override their choice.
  const userPausedRef = useRef(false);

  const videoRef = useCallback((el) => setNode(el || null), []);

  const requestPlay = useCallback((el) => {
    if (!el) return;
    // Some browsers return undefined here instead of a promise.
    const attempt = el.play();
    if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    setIsPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    if (!node) return;
    if (node.paused || node.ended) {
      userPausedRef.current = false;
      requestPlay(node);
    } else {
      userPausedRef.current = true;
      node.pause();
      setIsPlaying(false);
    }
  }, [node, requestPlay]);

  useEffect(() => {
    if (!node) return undefined;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      node.pause();
      setIsPlaying(false);
      return undefined;
    }

    userPausedRef.current = false;
    requestPlay(node);

    const resume = () => {
      if (document.hidden || userPausedRef.current) return;
      if (!node.paused && !node.ended) return;
      requestPlay(node);
    };
    const handleVisibility = () => {
      if (!document.hidden) resume();
    };
    const handlePlaying = () => setIsPlaying(true);

    // Coming back to the tab: whichever of these the browser fires, the clip
    // should be moving again.
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', resume);
    window.addEventListener('pageshow', resume);
    // Data that arrived after the first attempt: `canplay` is the reliable
    // moment to try again, since the earlier `play()` was rejected.
    node.addEventListener('loadeddata', resume);
    node.addEventListener('canplay', resume);
    node.addEventListener('playing', handlePlaying);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pageshow', resume);
      node.removeEventListener('loadeddata', resume);
      node.removeEventListener('canplay', resume);
      node.removeEventListener('playing', handlePlaying);
    };
  }, [node, src, requestPlay]);

  return { videoRef, isPlaying, toggle };
}
