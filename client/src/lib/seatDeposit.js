/**
 * The seat reservation deposit — read from ONE place per surface.
 *
 * Why this module exists: the amount was typed into the markup wherever it was
 * shown ("$99 Deposit" in the header menu, "Reserve Seat — $99" on the cards,
 * the hero ledger), so the same visitor could read one figure in the CAREER
 * PROGRAMS mega-menu on the home page and another on the Live Jobs page, and
 * neither had to agree with what Settings → Deposit actually charges.
 *
 * Two levels decide the number, most specific first:
 *
 *   1. `course.pricing.reservationFee` — set per program in Admin → Courses.
 *      The four-month programs (CISSP, AI Product Manager, GRC) carry a $499
 *      reservation fee while the rest keep the site default, and this is the
 *      only place that difference can live.
 *   2. `settings.depositPriceUSD` — the site default from Admin → Settings.
 *
 * The server refuses any other amount (see server/utils/pricing.js →
 * resolveReserveAmount), so the browser prints the same numbers it will be
 * charged: 99 or 499, and 99 when both saved values are missing or off-menu.
 */

/** The two seat-deposit amounts the checkout offers. */
export const SEAT_DEPOSIT_OPTIONS = [99, 499];

/** Charged when neither the course nor the site default names a valid amount. */
export const FALLBACK_SEAT_DEPOSIT = 99;

/**
 * The fee saved on one course, or null when it inherits the site default.
 *
 * An unset field is stored as 0 by the schema, and an off-menu number (an old
 * saved value, a hand-edited database row) is ignored rather than printed.
 */
export function resolveCourseSeatDeposit(course) {
  const configured = Number(course?.pricing?.reservationFee);
  return SEAT_DEPOSIT_OPTIONS.includes(configured) ? configured : null;
}

/** The deposit amount, as a number, for a course (or the site default). */
export function resolveSeatDeposit(settings, course) {
  const perCourse = resolveCourseSeatDeposit(course);
  if (perCourse) return perCourse;
  const configured = Number(settings?.depositPriceUSD);
  return SEAT_DEPOSIT_OPTIONS.includes(configured) ? configured : FALLBACK_SEAT_DEPOSIT;
}

/** "$99" / "$499" — the amount, formatted the way the site writes money. */
export function formatSeatDeposit(settings, course) {
  return formatDepositAmount(resolveSeatDeposit(settings, course));
}

/** The same formatting for an amount that is already resolved. */
export function formatDepositAmount(amount) {
  return `$${Number(amount).toLocaleString('en-US')}`;
}

/** "$99 Deposit" — the badge text used by the header menu and the cards. */
export function seatDepositLabel(settings, course) {
  return `${formatSeatDeposit(settings, course)} Deposit`;
}

/**
 * The lowest deposit any of these courses asks for.
 *
 * Used by the mega-menu header ("Deposits from $99"), which is the only label
 * that covers a mixed catalogue: once one program charges $499, a header that
 * said "All with $99 Deposit" would be wrong for it.
 */
export function lowestSeatDeposit(settings, courses = []) {
  const amounts = courses.map((course) => resolveSeatDeposit(settings, course));
  return Math.min(resolveSeatDeposit(settings), ...amounts);
}

export default resolveSeatDeposit;
