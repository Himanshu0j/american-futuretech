/**
 * Ordering gate for asynchronous price quotes.
 *
 * Why this exists: checkout sends a quote the moment the page paints ($99, the
 * site default) and a second one once the selected course — and therefore that
 * course's own reservation fee — is known ($499 for the four-month programs).
 * Two requests are then in flight and responses are not ordered: the slow $99
 * answer can land after the $499 one and overwrite it, leaving the summary and
 * the pay button reading $99 while the selected deposit (and the amount the
 * server would charge) is $499.
 *
 * `begin()` claims the next sequence number; `isCurrent(token)` answers whether
 * that claim is still the newest one. A response whose token is stale is
 * discarded instead of being painted.
 *
 * Kept dependency-free and in its own module so `scripts/verify-checkout-quote-race.js`
 * can exercise the same logic the page uses, instead of a copy of it.
 */
export function createQuoteGate() {
  let current = 0;
  return {
    /** Claim the newest slot; the returned token identifies this request. */
    begin() {
      current += 1;
      return current;
    },
    /** True only for the most recently claimed token. */
    isCurrent(token) {
      return token === current;
    },
  };
}

export default createQuoteGate;
