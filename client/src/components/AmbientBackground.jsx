import React from 'react';

/**
 * Ambient canvas behind the home page.
 *
 * It used to draw an engineering micro-grid (a 48px SVG pattern) plus three
 * blurred colour fields — including a green and a purple that are not in the
 * brand palette at all. On a laptop that grid reads as a wireframe mockup, and
 * the off-brand blobs tinted the page lavender in the lower right: the exact
 * "AI-generated template" impression the client described.
 *
 * What is left is the part that does real work: two very soft navy washes that
 * stop the white canvas from looking like flat #FFFFFF, and a hint of brand red
 * near the top so the page keeps the warmth the client liked. No pattern, no
 * off-palette colour, nothing that competes with the content.
 */
export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-48 right-0 w-[720px] h-[720px] rounded-full bg-[radial-gradient(circle,rgba(0,32,96,0.05)_0%,transparent_68%)] blur-2xl" />
      <div className="absolute top-1/3 -left-56 w-[620px] h-[620px] rounded-full bg-[radial-gradient(circle,rgba(220,0,0,0.022)_0%,transparent_70%)] blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(0,32,96,0.035)_0%,transparent_72%)] blur-3xl" />
    </div>
  );
}
