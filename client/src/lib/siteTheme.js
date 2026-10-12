/**
 * Site appearance engine — turns the CMS "Appearance" tab into live CSS.
 *
 * The admin picks three base colours (primary / accent / text) and two fonts.
 * From those, this module derives the FULL palette the site actually uses —
 * every ink, blue, brand, gold, sand and slate shade — and writes them to CSS
 * variables on <html>. Tailwind's ramps and index.css's design tokens both
 * read those variables (see client/tailwind.config.js and client/src/index.css),
 * so one colour picker recolours headings, buttons, links, dark sections,
 * borders and body text across the whole site — no rebuild, no code edit.
 *
 * Defaults are the site's current palette, channel-for-channel: an untouched
 * theme paints exactly what today's build paints. Only a colour the admin
 * actually changes gets re-derived (its whole family follows; the other
 * families keep the shipped values).
 *
 * Fonts are KEYS ("poppins"), never raw font stacks — the server enum only
 * accepts keys and this file is the only place a key becomes a family name, so
 * a saved setting can never inject CSS. A family that is not in the default
 * Google Fonts link is loaded on demand.
 */

/* ── Fonts ────────────────────────────────────────────────────────────────── */

const googleUrl = (family, weights) =>
  `https://fonts.googleapis.com/css2?family=${family}:wght@${weights}&display=swap`;

export const BODY_FONTS = [
  { key: 'inter', label: 'Inter (default)', stack: '"Inter", system-ui, -apple-system, sans-serif' },
  { key: 'poppins', label: 'Poppins', stack: '"Poppins", "Inter", system-ui, sans-serif', href: googleUrl('Poppins', '400;500;600;700') },
  { key: 'montserrat', label: 'Montserrat', stack: '"Montserrat", "Inter", system-ui, sans-serif', href: googleUrl('Montserrat', '400;500;600;700;800') },
  { key: 'roboto', label: 'Roboto', stack: '"Roboto", "Inter", system-ui, sans-serif', href: googleUrl('Roboto', '400;500;700') },
  { key: 'opensans', label: 'Open Sans', stack: '"Open Sans", "Inter", system-ui, sans-serif', href: googleUrl('Open+Sans', '400;500;600;700') },
  { key: 'lato', label: 'Lato', stack: '"Lato", "Inter", system-ui, sans-serif', href: googleUrl('Lato', '400;700;900') },
  { key: 'nunito', label: 'Nunito', stack: '"Nunito", "Inter", system-ui, sans-serif', href: googleUrl('Nunito', '400;500;600;700;800') },
];

export const HEADING_FONTS = [
  { key: 'jakarta', label: 'Plus Jakarta Sans (default)', stack: '"Plus Jakarta Sans", "Rubik", "Inter", sans-serif' },
  { key: 'poppins', label: 'Poppins', stack: '"Poppins", "Plus Jakarta Sans", sans-serif', href: googleUrl('Poppins', '500;600;700;800') },
  { key: 'montserrat', label: 'Montserrat', stack: '"Montserrat", "Plus Jakarta Sans", sans-serif', href: googleUrl('Montserrat', '500;600;700;800') },
  { key: 'rubik', label: 'Rubik', stack: '"Rubik", "Plus Jakarta Sans", sans-serif', href: googleUrl('Rubik', '500;600;700;800') },
  { key: 'playfair', label: 'Playfair Display', stack: '"Playfair Display", "Plus Jakarta Sans", serif', href: googleUrl('Playfair+Display', '500;600;700;800') },
  { key: 'lora', label: 'Lora', stack: '"Lora", "Plus Jakarta Sans", serif', href: googleUrl('Lora', '500;600;700') },
];

export const DEFAULT_THEME = {
  bodyFont: 'inter',
  headingFont: 'jakarta',
  primaryColor: '#2563EB',
  accentColor: '#F00000',
  textColor: '#475569',
};

/* ── Colour maths (HSL, because shade ramps are lightness ladders) ────────── */

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const hexToRgb = (hex) => {
  const clean = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
};

const rgbToHsl = ([r, g, b]) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0));
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
};

const hslToRgbChannel = (h, s, l) => {
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let [r1, g1, b1] = [0, 0, 0];
  if (hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = ln - c / 2;
  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
};

/**
 * A shade ladder: the base colour at 500, lighter tints upward, darker shades
 * downward. Lightness targets are tuned so a mid-tone base (the primary or the
 * text colour) produces ramps that read like the site's current palette:
 * near-white 50s, punchy 400–600, deep 800–950. Saturation eases off toward
 * the light end so 50/100 stay neutral instead of looking like candy.
 */
const RAMP = {
  50: { l: 98, s: 0.12 },
  100: { l: 95.5, s: 0.3 },
  200: { l: 90.5, s: 0.5 },
  300: { l: 84, s: 0.72 },
  400: { l: 72, s: 0.9 },
  500: { l: null, s: null }, // the base itself
  600: { l: -8, s: 1 },
  700: { l: -16, s: 1 },
  800: { mul: 0.55 },
  900: { mul: 0.34 },
  950: { mul: 0.2 },
};

const buildRamp = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [h, s, l] = rgbToHsl(rgb);
  const out = {};
  for (const [step, rule] of Object.entries(RAMP)) {
    if (rule.l === null) {
      out[step] = `${rgb[0]} ${rgb[1]} ${rgb[2]}`;
      continue;
    }
    const lightness = rule.mul !== undefined ? l * rule.mul : l + rule.l;
    const saturation = rule.s === null ? s : s * rule.s;
    out[step] = hslToRgbChannel(h, saturation, lightness).join(' ');
  }
  return out;
};

/** A darker, deeper twin of the accent for CTA gradients (was #DC0000/#B01616). */
const accentDeep = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [h, s, l] = rgbToHsl(rgb);
  return {
    deep: hslToRgbChannel(h, s, Math.max(l * 0.78, 18)).join(' '),
    deeper: hslToRgbChannel(h, s, Math.max(l * 0.56, 12)).join(' '),
  };
};

/* ── The shipped palette, as channel triples (what an untouched site paints) ─ */

const DEFAULT_CHANNELS = {
  '--tw-ink-950': '0 24 69',
  '--tw-ink-900': '0 32 96',
  '--tw-ink-800': '0 28 87',
  '--tw-ink-700': '10 42 99',
  '--tw-ink-600': '11 58 128',

  '--tw-brand-50': '239 246 255',
  '--tw-brand-100': '219 234 254',
  '--tw-brand-400': '96 165 250',
  '--tw-brand-500': '59 130 246',
  '--tw-brand-600': '37 99 235',
  '--tw-brand-700': '29 78 216',
  '--tw-brand-800': '30 64 175',

  '--tw-blue-50': '239 246 255',
  '--tw-blue-100': '219 234 254',
  '--tw-blue-200': '191 219 254',
  '--tw-blue-300': '147 197 253',
  '--tw-blue-400': '96 165 250',
  '--tw-blue-500': '59 130 246',
  '--tw-blue-600': '37 99 235',
  '--tw-blue-700': '29 78 216',
  '--tw-blue-800': '30 64 175',
  '--tw-blue-900': '30 58 138',
  '--tw-blue-950': '23 37 84',

  '--tw-gold-100': '253 236 236',
  '--tw-gold-200': '249 201 201',
  '--tw-gold-300': '245 175 175',
  '--tw-gold-400': '255 107 107',
  '--tw-gold-500': '240 0 0',
  '--tw-gold-600': '200 30 30',

  '--tw-sand-100': '250 240 240',
  '--tw-sand-200': '252 231 231',
  '--tw-sand-300': '245 201 201',

  '--tw-accent-deep': '220 0 0',
  '--tw-accent-deeper': '176 22 22',

  '--tw-slate-50': '248 250 252',
  '--tw-slate-100': '241 245 249',
  '--tw-slate-200': '226 232 240',
  '--tw-slate-300': '203 213 225',
  '--tw-slate-400': '148 163 184',
  '--tw-slate-500': '100 116 139',
  '--tw-slate-600': '71 85 105',
  '--tw-slate-700': '51 65 85',
  '--tw-slate-800': '30 41 59',
  '--tw-slate-900': '15 23 42',
  '--tw-slate-950': '2 6 23',

  '--tw-text-strong': '0 32 96',
  '--tw-text-body': '68 80 107',
  '--tw-text-muted': '107 114 128',
  '--tw-text-faint': '154 163 178',
};

const rampVars = (ramp, prefix) =>
  Object.fromEntries(Object.entries(ramp).map(([step, v]) => [`--tw-${prefix}-${step}`, v]));

/**
 * Everything <html> should carry for a theme. Fonts are stacks (safe values
 * built from the catalogue above); colours are "r g b" channel strings.
 */
export const themeToCssVars = (theme) => {
  const t = { ...DEFAULT_THEME, ...(theme || {}) };
  const vars = { ...DEFAULT_CHANNELS };

  const bodyFont = BODY_FONTS.find((f) => f.key === t.bodyFont) || BODY_FONTS[0];
  const headingFont = HEADING_FONTS.find((f) => f.key === t.headingFont) || HEADING_FONTS[0];
  vars['--font-body'] = bodyFont.stack;
  vars['--font-heading'] = headingFont.stack;

  if (t.primaryColor !== DEFAULT_THEME.primaryColor) {
    const primaryRamp = buildRamp(t.primaryColor);
    if (primaryRamp) {
      Object.assign(vars, rampVars(primaryRamp, 'blue'));
      Object.assign(vars, rampVars(primaryRamp, 'brand'));
      // The ink ramp is the deep-navy family: same hue as the primary, pushed
      // much darker (600 is the lightest ink, 950 the deepest). The multipliers
      // reproduce the shipped navy when fed the shipped blue (#2563EB is
      // L≈53% in HSL; #002060 is L≈19% ≈ 53×0.36), and scale to any hue.
      const [h, s, l] = rgbToHsl(hexToRgb(t.primaryColor));
      const ink = {};
      const inkLightness = { 950: 0.26, 900: 0.36, 800: 0.32, 700: 0.41, 600: 0.51 };
      for (const [step, lm] of Object.entries(inkLightness)) {
        ink[step] = hslToRgbChannel(h, clamp(s * 1.2, 20, 100), clamp(l * lm, 7, 45)).join(' ');
      }
      Object.assign(vars, rampVars(ink, 'ink'));
    }
  }

  if (t.accentColor !== DEFAULT_THEME.accentColor) {
    const accentRamp = buildRamp(t.accentColor);
    if (accentRamp) {
      Object.assign(vars, rampVars(accentRamp, 'gold'));
      // Sand is the accent's pale surface tint (was red-tinted cream).
      const sand = {};
      const sandLightness = { 100: 96, 200: 92, 300: 86 };
      const [h, s] = rgbToHsl(hexToRgb(t.accentColor));
      for (const [step, lm] of Object.entries(sandLightness)) {
        sand[step] = hslToRgbChannel(h, s * 0.35, lm).join(' ');
      }
      Object.assign(vars, rampVars(sand, 'sand'));
      const deep = accentDeep(t.accentColor);
      if (deep) {
        vars['--tw-accent-deep'] = deep.deep;
        vars['--tw-accent-deeper'] = deep.deeper;
      }
    }
  }

  if (t.textColor !== DEFAULT_THEME.textColor) {
    const textRamp = buildRamp(t.textColor);
    if (textRamp) {
      Object.assign(vars, rampVars(textRamp, 'slate'));
      // The four aliases index.css feeds from (html/body colour, .elms muted
      // text…) follow the same pick: strong = a deep shade of it, muted/faint
      // = progressively lighter mixes, body = the colour itself.
      const [h, s, l] = rgbToHsl(hexToRgb(t.textColor));
      vars['--tw-text-strong'] = hslToRgbChannel(h, s, clamp(l * 0.5, 6, 30)).join(' ');
      vars['--tw-text-body'] = `${hexToRgb(t.textColor).join(' ')}`;
      vars['--tw-text-muted'] = hslToRgbChannel(h, s * 0.9, clamp(l + 12, 20, 72)).join(' ');
      vars['--tw-text-faint'] = hslToRgbChannel(h, s * 0.8, clamp(l + 25, 30, 82)).join(' ');
    }
  }

  return { vars, bodyFont, headingFont };
};

/* ── Application ─────────────────────────────────────────────────────────── */

let appliedLinkFamilies = new Set();

const ensureFontLoaded = (font) => {
  if (!font.href || appliedLinkFamilies.has(font.key) || typeof document === 'undefined') return;
  if (document.querySelector(`link[data-aft-font="${font.key}"]`)) {
    appliedLinkFamilies.add(font.key);
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = font.href;
  link.setAttribute('data-aft-font', font.key);
  document.head.appendChild(link);
  appliedLinkFamilies.add(font.key);
};

/**
 * Paint a theme onto the document. Safe to call on every settings change —
 * setting the same variable twice is free, and nothing here throws on SSR or
 * in a stripped-down test DOM.
 */
export const applySiteTheme = (theme) => {
  if (typeof document === 'undefined' || !document.documentElement) return;
  const { vars, bodyFont, headingFont } = themeToCssVars(theme);
  const root = document.documentElement;
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
  ensureFontLoaded(bodyFont);
  ensureFontLoaded(headingFont);
  root.style.setProperty('color-scheme', 'light');
};

/** Snap back to the shipped design (used by the CMS "Reset" button). */
export const resetSiteTheme = () => applySiteTheme(DEFAULT_THEME);
