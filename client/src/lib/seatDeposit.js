/**
 * The seat reservation deposit — ONE number for the whole public site.
 *
 * Why this module exists: the amount was typed into the markup wherever it was
 * shown ("$99 Deposit" in the header menu, "Reserve Seat — $99" on the cards,
 * the hero ledger), so the same visitor could read one figure in the CAREER
 * PROGRAMS mega-menu on the home page and another on the Live Jobs page, and
 * neither had to agree with what Settings → Deposit actually charges.
 *
 * The admin's `depositPriceUSD` is the only authority. The server already
 * refuses any other amount (see server/utils/pricing.js → resolveReserveAmount),
 * so the browser prints the same numbers it will be charged: 99 or 499, and
 * 99 when the saved value is missing or off-menu.
 */

/** The two seat-deposit amounts the checkout offers. */
export const SEAT_DEPOSIT_OPTIONS = [99, 499];

/** Charged when the admin's saved value is missing or not one of the options. */
export const FALLBACK_SEAT_DEPOSIT = 99;

/** The deposit amount, as a number, from a settings object. */
export function resolveSeatDeposit(settings) {
  const configured = Number(settings?.depositPriceUSD);
  return SEAT_DEPOSIT_OPTIONS.includes(configured) ? configured : FALLBACK_SEAT_DEPOSIT;
}

/** "$99" / "$499" — the amount, formatted the way the site writes money. */
export function formatSeatDeposit(settings) {
  return `$${resolveSeatDeposit(settings).toLocaleString('en-US')}`;
}

/** "$99 Deposit" — the badge text used by the header menu and the cards. */
export function seatDepositLabel(settings) {
  return `${formatSeatDeposit(settings)} Deposit`;
}

export default resolveSeatDeposit;
