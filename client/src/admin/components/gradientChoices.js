/**
 * Gradient classes the admin is allowed to store on CMS-driven badges
 * (capstone cards, career-role pills).
 *
 * Why a fixed list instead of a free-text field: the value lives in MongoDB and
 * only reaches Tailwind at RUNTIME — long after the CSS was compiled. A class
 * that appears nowhere in the source is never emitted, so a white-text badge
 * painted no background at all and "ENTRY LEVEL" vanished from four course
 * pages. Every value below is safelisted in client/tailwind.config.js, so the
 * picker can only produce colours that actually exist in the build.
 *
 * The first entry is the default new cards get.
 */
export const GRADIENT_CHOICES = [
  { label: 'Brand Blue (default)', value: 'from-brand-600 to-ink-900' },
  { label: 'Brand Blue → Sky', value: 'from-brand-600 to-brand-400' },
  { label: 'Ink Navy', value: 'from-ink-900 to-ink-950' },
  { label: 'Brand Red', value: 'from-gold-500 to-gold-600' },
  { label: 'Amber → Red', value: 'from-amber-500 to-red-600' },
  { label: 'Emerald → Teal', value: 'from-emerald-500 to-teal-500' },
  { label: 'Violet → Indigo', value: 'from-violet-500 to-indigo-500' },
  { label: 'Sky → Indigo', value: 'from-sky-500 to-indigo-600' },
  { label: 'Blue (legacy)', value: 'from-blue-500 to-blue-500' },
  { label: 'Red (legacy)', value: 'from-red-500 to-red-500' },
  { label: 'Red → Yellow (legacy)', value: 'from-red-500 to-yellow-500' },
];

/** The gradient new cards are created with. */
export const DEFAULT_GRADIENT = GRADIENT_CHOICES[0].value;

/**
 * Options for a <select>, keeping a value that is not in the list (older data,
 * or one the client typed before this picker existed) selectable and visible
 * instead of silently rewriting it.
 */
export const gradientOptionsFor = (current) => {
  const value = String(current || '').trim();
  if (!value || GRADIENT_CHOICES.some((c) => c.value === value)) return GRADIENT_CHOICES;
  return [{ label: `Current (${value})`, value }, ...GRADIENT_CHOICES];
};
