import React, { useEffect, useState } from 'react';

/**
 * The square tile in front of every row of the header's CAREER PROGRAMS
 * mega-menu (and of the mobile drawer's "Flagship Tracks" list).
 *
 * One component instead of two copies of the same markup, because Admin →
 * Courses → "Menu Logo" now previews the tile. The preview renders this exact
 * element, so what the client sees while uploading is what the header will
 * draw — not a mock-up that quietly drifts away from it.
 *
 * The artwork is CONTAINED, never cropped: a square logo fills the tile edge to
 * edge, while a wide or tall one is letterboxed inside it — whole, just small.
 * `p-0.5` is the breathing room that keeps a logo off the border.
 *
 * The monogram is the last resort (no logo and no card image), and it also
 * takes over when the image is there but cannot be LOADED — a moved file or a
 * bad URL used to leave a broken-image icon in the menu.
 */

/** Two initials for a program with no logo set: "Data Science with AI…" → DS. */
export const programMonogram = (title) =>
  String(title || '?')
    .split(/[\s&/-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

/**
 * The two sizes the header actually renders. Nothing else is offered: a preview
 * at a size no visitor sees would be a lie about how the artwork fits.
 *   md → the desktop dropdown tile (36 px)
 *   sm → the mobile drawer tile (28 px)
 */
const SIZES = {
  md: { box: 'w-9 h-9 rounded-lg', label: 'text-[11px]' },
  sm: { box: 'w-7 h-7 rounded-md', label: 'text-[10px]' },
};

export default function MenuLogoTile({ src = '', title = '', size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false);
  const image = String(src || '').trim();
  const shape = SIZES[size] || SIZES.md;

  // A tile instance can be reused for a different program as the list changes
  // (the navbar re-renders in place), and a new URL deserves its own attempt
  // rather than inheriting the previous program's failure.
  useEffect(() => {
    setFailed(false);
  }, [image]);

  return (
    <span
      className={`${shape.box} bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 ${className}`}
    >
      {image && !failed ? (
        <img
          src={image}
          alt=""
          className="w-full h-full object-contain p-0.5"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={`${shape.label} font-bold font-mono text-[color:rgb(var(--tw-ink-900))] dark:text-white`}>
          {programMonogram(title)}
        </span>
      )}
    </span>
  );
}
