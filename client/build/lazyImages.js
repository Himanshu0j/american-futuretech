/**
 * Give every `<img>` in the app `loading="lazy" decoding="async"`.
 *
 * Why a build step and not 85 hand edits
 * --------------------------------------
 * The home page asked the browser for 96 unique images (1.5 MB) before the
 * visitor scrolled anywhere, and the browser fetched them all in the first
 * seconds — 35 of them were below the fold. On a phone that is what "images
 * dhang se load nahi ho rahi" looks like: the first screen waits behind photos
 * nobody has seen yet.
 *
 * `loading="lazy"` defers an image until it is near the viewport, which is the
 * browser's own logic — no IntersectionObserver, no layout thrash, no missing
 * first screen (Chrome still fetches an in-viewport lazy image immediately, just
 * at a lower priority). Doing it here means a NEW `<img>` added anywhere in the
 * app gets the same treatment without anyone remembering to.
 *
 * Opting out: an image that already sets `loading` is left completely alone, so
 * `loading="eager"` (the hero photo, the navbar logo) wins. That is also how a
 * future image can ask for a different behaviour.
 *
 * `decoding="async"` is added alongside: it keeps the main thread free while the
 * pixels are decoded, which is what makes a scrolling page feel smooth on a
 * mid-range Android.
 *
 * Written without `@babel/types` on purpose — Babel accepts plain AST objects,
 * and the plugin must not add a dependency to the client build.
 */
const LAZY_ATTRS = [
  { name: 'loading', value: 'lazy' },
  { name: 'decoding', value: 'async' },
];

const asJsxAttribute = ({ name, value }) => ({
  type: 'JSXAttribute',
  name: { type: 'JSXIdentifier', name },
  value: { type: 'StringLiteral', value },
});

export default function lazyImages() {
  return {
    name: 'aft-lazy-images',
    visitor: {
      JSXOpeningElement(path) {
        const { name, attributes } = path.node;
        if (!name || name.type !== 'JSXIdentifier' || name.name !== 'img') return;

        // An explicit `loading` (lazy or eager) is the author's decision.
        const optedOut = attributes.some(
          (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'loading',
        );
        if (optedOut) return;

        attributes.unshift(...LAZY_ATTRS.map(asJsxAttribute));
      },
    },
  };
}
