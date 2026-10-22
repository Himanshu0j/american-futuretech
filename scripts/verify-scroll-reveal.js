#!/usr/bin/env node
/**
 * Scroll reveal + premium surface contract test.
 *
 *   npm run verify:scroll-reveal
 *
 * The client asked for two things in one sentence: "thoda scrolling animation
 * hr page mein" and "website bhut jyada AI made lg rhi hai — clasy premium lge".
 * Both are easy to fake and easy to break, so this script pins the parts that
 * matter and would silently regress:
 *
 *   1. the effect can never leave content invisible (guarded hidden state,
 *      reduced-motion override, a watchdog that shows the page instead of
 *      waiting), and it never touches the DOM structure the inline editor's
 *      position-based keys depend on;
 *   2. it never runs on /admin or the student LMS, and it stands down while the
 *      inline editor is on;
 *   3. the premium pass really removed the four template tells it claimed to
 *      (wireframe outline, gradient buttons, mono micro-labels, background
 *      grid), and did it without adding a dependency.
 *
 * Static, no database and no server: it reads the same source the browser gets.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  OK ' : '  FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const section = (title) => {
  console.log(`\n${'-'.repeat(68)}\n${title}\n${'-'.repeat(68)}`);
};

const LIB = 'client/src/lib/scrollReveal.js';
const COMPONENT = 'client/src/components/ScrollReveal.jsx';
const CSS = 'client/src/index.css';

console.log('\nScroll reveal & premium surfaces — contract check');

/* ─────────────────────────────────────────────────────────────────
   1. The engine exists and is wired in
   ───────────────────────────────────────────────────────────────── */
section('1. Engine and mount point');

check('The reveal engine exists', exists(LIB));
check('The mount component exists', exists(COMPONENT));

const lib = exists(LIB) ? read(LIB) : '';
const component = exists(COMPONENT) ? read(COMPONENT) : '';
const app = read('client/src/App.jsx');

check('App imports ScrollReveal', app.includes("import ScrollReveal from './components/ScrollReveal'"));
check('App renders it exactly once', (app.match(/<ScrollReveal\s*\/>/g) || []).length === 1);
check('It is mounted inside the router (so useLocation works)',
  /<SiteSettingsProvider>[\s\S]*<ScrollReveal\s*\/>/.test(app));

/* ─────────────────────────────────────────────────────────────────
   2. No DOM structure changes — the inline editor's keys are untouched
   ───────────────────────────────────────────────────────────────── */
section('2. The inline editor stays safe');

const insertion = ['appendChild', 'insertBefore', 'replaceChild', 'replaceWith', 'insertAdjacent', 'createElement'];
const foundInsertion = insertion.filter((api) => lib.includes(api));
check('The engine never creates, moves or replaces a node', foundInsertion.length === 0,
  foundInsertion.length ? foundInsertion.join(', ') : 'attributes and classes only');
check('It explains why, so nobody "simplifies" it into a wrapper div',
  lib.includes('pathKey') && lib.toLowerCase().includes('inline website editor'));

/* ─────────────────────────────────────────────────────────────────
   3. Content can never be stranded invisible
   ───────────────────────────────────────────────────────────────── */
section('3. Safety: the page always shows');

const css = read(CSS);

check('The hidden state is gated behind the engine\'s own flag',
  /html\[data-aft-reveal="on"\]\s*\.aft-rv-armed:not\(\.is-in\)\s*\{[^}]*opacity:\s*0/.test(css));
check('There is no un-guarded `opacity: 0` rule for reveal units',
  !/(^|\n)\s*\.aft-rv-armed:not\(\.is-in\)\s*\{[^}]*opacity:\s*0/.test(css));
check('Reduced motion forces every unit visible',
  /prefers-reduced-motion:\s*reduce[\s\S]{0,400}\.aft-rv-armed:not\(\.is-in\)\s*\{[^}]*opacity:\s*1/.test(css));
check('Printing cannot print a half-revealed block', /@media print[\s\S]{0,300}\.aft-rv-armed/.test(css));

check('A watchdog exists', lib.includes('safetyCheck'));
check('The watchdog only trips when an ON-SCREEN unit is still hidden',
  /const stuck[\s\S]{0,240}rect\.top < fold/.test(lib));
check('Units the observer cannot see are revealed directly, not left hidden',
  /stuck\.forEach\(revealNow\)/.test(lib));
check('A wholly broken observer shows the page instead of hiding it',
  /if \(stuck\.length > 6\) \{\s*disableEffect\(\);/.test(lib));
check('Units already scrolled past are revealed', /passed\.forEach\(revealNow\)/.test(lib));
check('The watchdog does not blanket-reveal a healthy page (that would kill the feature)',
  !/setTimeout\(revealAll/.test(lib));
check('A browser without IntersectionObserver shows the page',
  /'IntersectionObserver' in window/.test(lib));
check('Reduced-motion visitors are never tagged at all',
  /prefersReducedMotion\(\)[\s\S]{0,120}untagAll\(\)/.test(lib));

/* A waiting block is still content: hiding it with `visibility`/`aria-hidden`
   would make a screen reader skip a paragraph it reaches before the visitor has
   scrolled there. The inaccessible alternative was tempting (it also silences
   contrast checkers), so it is pinned here. */
const hiddenRule = (css.match(/html\[data-aft-reveal="on"\] \.aft-rv-armed:not\(\.is-in\) \{[^}]*\}/) || [''])[0];
// Declaration, not prose: the rule's own comment names the rejected property.
check('The waiting block stays in the accessibility tree',
  !/(^|\s)visibility:\s*hidden\s*;/.test(hiddenRule) && !lib.includes('aria-hidden'));
check('The accessibility audit reveals the page before measuring it',
  /revealWholePage/.test(read('scripts/audit-accessibility.js')));

/* ─────────────────────────────────────────────────────────────────
   4. Scope: public pages only, editor off
   ───────────────────────────────────────────────────────────────── */
section('4. Scope');

check('Admin and the student LMS are excluded at the route level',
  /isStaffRoute\s*=\s*\(pathname = ''\) =>\s*pathname\.startsWith\('\/admin'\) \|\| pathname\.startsWith\('\/student'\)/.test(lib));
check('The scan honours that exclusion', /isStaffRoute\(window\.location\.pathname\)/.test(lib));
check('A route change honours it too', /isStaffRoute\(pathname\)/.test(lib));
check('The inline editor turns the effect off', /editorIsOn\(\)/.test(lib));
check('The mount re-syncs when the editor opens/closes',
  component.includes('attributeFilter: [\'data-site-editor-active\']'));

check('The audience flag is published for CSS scoping',
  lib.includes("AUDIENCE_ATTR = 'data-audience'") && component.includes("'data-audience'"));
check('Public is the default audience, staff is explicit',
  /isStaffRoute\(pathname \|\| ''\) \? 'staff' : 'public'/.test(component));

/* ─────────────────────────────────────────────────────────────────
   5. Motion quality: one level, staggered, and cleaned up
   ───────────────────────────────────────────────────────────────── */
section('5. Motion quality');

check('A stagger is published per unit', lib.includes("setProperty('--aft-rv-i'") && css.includes('var(--aft-rv-i'));
check('Stagger is capped so late cards are not delayed forever', lib.includes('Math.min(index, 6)'));
check('Nested units are avoided (a block with a tagged ancestor is skipped)',
  lib.includes('unit.querySelector(`[${ROOT_ATTR}]`)'));
check('Grids are expanded into their cards instead of animating both levels',
  lib.includes('isGrid') && lib.includes('cards.length < 2'));
check('Above-the-fold content is left alone (no entrance flash)',
  lib.includes('ABOVE_FOLD_FACTOR'));
check('Long-form pages arrive as one unit, not paragraph-by-paragraph',
  lib.includes('units.length > MAX_UNITS_PER_BLOCK'));
check('Sticky and fixed elements are excluded', lib.includes("'[class*=\"sticky\"]'") && lib.includes("'[class*=\"absolute\"]'"));
check('The paint hint is cleaned up after each reveal',
  lib.includes("el.style.willChange = ''"));
check('Observers are disconnected on teardown',
  (lib.match(/\.disconnect\(\)/g) || []).length >= 2);
check('The scroll listener is removed on teardown',
  lib.includes("removeEventListener('scroll'"));

/* ─────────────────────────────────────────────────────────────────
   6. Premium surfaces: the template tells are gone
   ───────────────────────────────────────────────────────────────── */
section('6. Premium surface pass');

const outline = (css.match(/--box-outline:\s*rgba\([^)]*\)/) || [''])[0];
const outlineAlpha = Number((outline.match(/([\d.]+)\)$/) || [])[1]);
check('The black wireframe outline is gone', outline.includes('0, 32, 96') && outlineAlpha > 0 && outlineAlpha <= 0.14,
  outline || 'missing');

const primaryBlock = (css.match(/\.elms-btn-primary, \.aft-btn-primary, \.apple-btn-primary \{[\s\S]*?\n\}/) || [''])[0];
check('The primary button is flat navy, not a gradient', /background-image:\s*none/.test(primaryBlock));
check('The accent button is flat red, not a gradient',
  /\.elms-btn-gold \{[\s\S]{0,600}?background-image:\s*none/.test(css));

check('A public-only micro-label reset exists',
  /\[data-audience="public"\]\s*\.font-mono\s*\{/.test(css));
check('The editor keeps its own mono labels',
  /\[data-site-editor-ui\]\s*\.font-mono\s*\{/.test(css));
check('The section kicker is no longer a tinted pill',
  /\.section-eyebrow \{[\s\S]{0,500}?border-radius:\s*0/.test(css));

const ambient = read('client/src/components/AmbientBackground.jsx');
check('The background micro-grid is gone', !ambient.includes('arch-grid') && !ambient.includes('<pattern'));
check('Off-brand green/purple washes are gone',
  !ambient.includes('64,132,78') && !ambient.includes('158,79,143'));

const navbar = read('client/src/components/Navbar.jsx');
check('The header CTA is solid navy, not the blue gradient',
  navbar.includes('bg-[rgb(var(--tw-ink-900))]') && !navbar.includes('bg-brand-gradient'),
  'bg-ink-900, no bg-brand-gradient');

const gradientCtas = [
  ['client/src/components/PersonalizedLearningSection.jsx', 'aft-solid-accent'],
  ['client/src/pages/CourseDetailPage.jsx', 'aft-solid-primary'],
  ['client/src/pages/JobDetailPage.jsx', 'aft-solid-accent'],
];
gradientCtas.forEach(([file, cls]) => {
  const source = read(file);
  check(`${path.basename(file)} CTA uses the flat ${cls} treatment`, source.includes(cls), cls);
});

const converted = gradientCtas.map(([file]) => read(file)).join('\n');
check('No red two-stop gradient button is left in those CTAs',
  !/bg-gradient-to-r from-red-5[05] to-red-5[05]/.test(converted));

check('No dependency was added for the animation',
  !/\bfrom 'framer-motion'|\bfrom 'gsap'|\bfrom 'motion'/.test(lib + component));

/* ─────────────────────────────────────────────────────────────────
   Report
   ───────────────────────────────────────────────────────────────── */
const failed = results.filter((r) => !r.passed);
console.log(`\n${'-'.repeat(68)}`);
console.log(`${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('\nFailed:');
  failed.forEach((r) => console.log(`  • ${r.name}${r.detail ? ` — ${r.detail}` : ''}`));
  process.exit(1);
}
console.log('Scroll reveal is guarded, public-only and editor-safe.\n');
