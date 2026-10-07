import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  animate,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  useReducedMotion,
} from 'framer-motion';

/**
 * The premium 3D layer.
 *
 * Two pieces:
 *   • <Tilt3D />      — the artwork the client uploads (SVG/PNG/JPG) floating in
 *                       space: pointer tilt, idle drift, and a 3D entrance when
 *                       it scrolls into view.
 *   • useCard3D()     — the same treatment for existing cards/sections, spread
 *                       onto an element you are already rendering.
 *
 * Why it is written this way
 * --------------------------
 * The public pages carry inline-editor edits keyed by DOM position
 * (`siteOverrides.js`). Wrapping a picture in a new <div>, or dropping a
 * decorative element next to it, shifts every key after it and silently
 * un-publishes the admin's edits. So nothing here adds a DOM node:
 *   • <Tilt3D /> renders a motion.img — still exactly one <img>, same tag, same
 *     position, same index among its siblings
 *   • useCard3D() is spread onto the element that already exists (turning a
 *     <div> into motion.div changes nothing about the DOM)
 *   • every effect is transform/filter/opacity, so layout is untouched
 *
 * Motion is also defensive: if the browser cannot observe the element (or the
 * visitor asked for reduced motion) the picture is simply shown flat and
 * visible — never stuck mid-animation or invisible.
 */

const SPRING = { stiffness: 140, damping: 18, mass: 0.6 };
const SOFT_SPRING = { stiffness: 90, damping: 20, mass: 0.8 };

/** How long we wait for the observer before just showing the artwork anyway. */
const REVEAL_FALLBACK_MS = 1400;

/** True when the fancy motion should run (respects prefers-reduced-motion). */
export function useMotionAllowed() {
  const reduced = useReducedMotion();
  if (typeof window !== 'undefined' && window.matchMedia) {
    // framer-motion's hook is the source of truth; this is only a belt-and-braces
    // fallback for older Safari where the media query list is missing.
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    } catch (err) {
      /* ignore */
    }
  }
  return !reduced;
}

/**
 * Pointer-tilt + 3D scroll entrance for artwork.
 *
 * `slot` is the admin slot id (see data/siteImages.js) and doubles as a test
 * hook: it is written as data-art-slot on the <img>.
 */
export default function Tilt3D({
  src,
  alt = '',
  className = '',
  slot = '',
  fallbackSrc = '',
  intensity = 13,
  idle = 6,
  float = true,
  floatDistance = 9,
  delay = 0,
  lift = 1.05,
  style,
  ...rest
}) {
  const allow = useMotionAllowed();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const [forceShow, setForceShow] = useState(false);
  const [shown, setShown] = useState(src || fallbackSrc || '');

  // A saved link that 404s or a typo must not leave a hole in the page — drop
  // back to the drawing the site ships with.
  useEffect(() => {
    setShown(src || fallbackSrc || '');
  }, [src, fallbackSrc]);

  useEffect(() => {
    if (inView || forceShow) return undefined;
    const t = setTimeout(() => setForceShow(true), REVEAL_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [inView, forceShow]);

  const entered = inView || forceShow || !allow;

  // Pointer tilt
  const tiltY = useSpring(0, SPRING);
  const tiltX = useSpring(0, SPRING);

  // Idle drift: the picture breathes even when nobody is touching it.
  const driftY = useMotionValue(0);
  const driftRotate = useMotionValue(0);

  // 3D entrance
  const enterX = useSpring(18, SOFT_SPRING);
  const enterY = useSpring(-14, SOFT_SPRING);

  const rotateY = useTransform([tiltY, driftRotate, enterY], ([a, b, c]) => a + b + c);
  const rotateX = useTransform([tiltX, enterX], ([a, b]) => a + b);

  useEffect(() => {
    if (!allow || !float) {
      driftY.set(0);
      driftRotate.set(0);
      return undefined;
    }
    const a = animate(driftY, [0, -floatDistance, 0], {
      duration: 6.5,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    });
    const b = animate(driftRotate, [-idle / 2, idle / 2, -idle / 2], {
      duration: 11,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    });
    return () => {
      a.stop();
      b.stop();
    };
  }, [allow, float, floatDistance, idle, delay, driftY, driftRotate]);

  useEffect(() => {
    if (!allow) return;
    if (entered) {
      enterX.set(0);
      enterY.set(0);
    }
  }, [entered, allow, enterX, enterY]);

  const handleMove = (event) => {
    if (!allow) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    tiltY.set(px * intensity * 2);
    tiltX.set(-py * intensity * 2);
  };

  const handleLeave = () => {
    tiltY.set(0);
    tiltX.set(0);
  };

  const [hovered, setHovered] = useState(false);
  const hoverScale = useSpring(1, SPRING);

  useEffect(() => {
    hoverScale.set(hovered && allow ? lift : 1);
  }, [hovered, allow, lift, hoverScale]);

  return (
    <motion.img
      ref={ref}
      src={shown}
      alt={alt}
      onError={() => {
        if (fallbackSrc && shown !== fallbackSrc) setShown(fallbackSrc);
      }}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        handleLeave();
      }}
      initial={allow ? { opacity: 0 } : false}
      animate={entered ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6, delay: allow ? delay : 0 }}
      draggable={false}
      data-art-slot={slot || undefined}
      data-art-3d={allow ? 'on' : 'off'}
      className={className}
      style={{
        // Sits above the decorative glow drawn by .aft-aura on its container.
        position: 'relative',
        zIndex: 1,
        rotateX,
        rotateY,
        y: driftY,
        scale: hoverScale,
        transformPerspective: 900,
        transformStyle: 'preserve-3d',
        transformOrigin: '50% 55%',
        filter: hovered && allow
          ? 'drop-shadow(0 22px 34px rgba(0,32,96,0.28)) saturate(1.06)'
          : 'drop-shadow(0 12px 22px rgba(0,32,96,0.16))',
        transition: 'filter 0.4s ease',
        willChange: allow ? 'transform, filter' : undefined,
        ...style,
      }}
      {...rest}
    />
  );
}

/**
 * The card/section treatment: it rises and unfolds out of the page as it
 * scrolls in, then leans towards the pointer on hover.
 *
 * Spread it on the element you are already rendering:
 *   const card3d = useCard3D({ delay: idx * 0.06 });
 *   <motion.div {...card3d}>…</motion.div>
 */
export function useCard3D({
  delay = 0,
  distance = 26,
  rotate = 12,
  intensity = 6,
  amount = 0.2,
  once = true,
  perspective = 1100,
  settleY = 0,
} = {}) {
  const allow = useMotionAllowed();
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount });
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    if (inView || forceShow || !allow) return undefined;
    const t = setTimeout(() => setForceShow(true), REVEAL_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [inView, forceShow, allow]);

  const entered = inView || forceShow || !allow;

  const hoverY = useSpring(0, SPRING);
  const hoverX = useSpring(0, SPRING);

  const handleMove = (event) => {
    if (!allow) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    hoverY.set(px * intensity * 2);
    hoverX.set(-py * intensity * 2);
  };

  const handleLeave = () => {
    hoverY.set(0);
    hoverX.set(0);
  };

  return {
    ref,
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    initial: allow ? { opacity: 0, y: distance, rotateX: rotate } : false,
    animate: entered
      ? { opacity: 1, y: settleY, rotateX: 0 }
      : { opacity: 0, y: distance, rotateX: rotate },
    transition: { duration: 0.72, delay: allow ? delay : 0, ease: [0.22, 1, 0.36, 1] },
    style: {
      rotateX: hoverX,
      rotateY: hoverY,
      transformPerspective: perspective,
      transformStyle: 'preserve-3d',
      willChange: allow ? 'transform' : undefined,
    },
  };
}

export { motion };
