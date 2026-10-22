#!/usr/bin/env node
/**
 * Checkout price-display race — contract + unit test.
 *
 *   npm run verify:quote-race
 *
 * The bug this pins: checkout quotes $99 (the site default) on first paint and
 * a second time once the selected course's own reservation fee is known ($499
 * for CISSP, AI Product Manager and GRC). Responses are not ordered, so a slow
 * $99 answer could overwrite the $499 one — the summary and the pay button read
 * $99 while the selected deposit, and the amount the server would charge, was
 * $499.
 *
 * Two independent defences are asserted here:
 *
 *   1. ordering — only the newest quote may write state (lib/quoteGate.mjs),
 *      exercised with a real out-of-order resolution instead of a source grep;
 *   2. rendering — a deposit quote is ignored unless its own pre-discount figure
 *      equals the deposit currently selected, so a stale quote cannot paint a
 *      number the submit path would not charge.
 *
 * No server, no database and no network: the gate is imported from the same
 * module the page uses, and the page/server contracts are read from source.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed });
  console.log(`${passed ? '  OK ' : '  FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const section = (title) => {
  console.log(`\n${'-'.repeat(70)}\n${title}\n${'-'.repeat(70)}`);
};

const main = async () => {
  const checkout = read('client/src/pages/CheckoutPage.jsx');
  const pricing = read('server/utils/pricing.js');

  section('1. Ordering gate (real unit test)');
  const { createQuoteGate } = await import(
    path.posix.join('..', 'client', 'src', 'lib', 'quoteGate.mjs').replace(/\\/g, '/')
  );

  const gate = createQuoteGate();
  const first = gate.begin();
  const second = gate.begin();
  check('A newer request replaces the claim', gate.isCurrent(second) && !gate.isCurrent(first));
  check('The stale claim is rejected', gate.isCurrent(first) === false);

  // Simulate the real sequence: request A paints, request B starts, B answers
  // first, then the slower A answers. Only B may be applied.
  let painted = null;
  const apply = (token, amount) => {
    if (!gate.isCurrent(token)) return false;
    painted = amount;
    return true;
  };
  const a = gate.begin();
  const b = gate.begin();
  apply(b, 499);
  apply(a, 99);
  check('Out-of-order response cannot overwrite the newest quote', painted === 499, `painted=${painted}`);
  check('The stale response is rejected, the newest is accepted', apply(a, 99) === false && apply(b, 499) === true && painted === 499);
  check('A later selection invalidates both earlier claims', (() => {
    const c = gate.begin();
    return gate.isCurrent(c) && !gate.isCurrent(a) && !gate.isCurrent(b);
  })());

  section('2. Checkout page contract');
  check('CheckoutPage imports the shared gate', /from '\.\.\/lib\/quoteGate\.mjs'/.test(checkout));
  check('A gate instance is kept per page', /quoteGate\.current = createQuoteGate\(\)/.test(checkout));
  check('Every quote claims a sequence number', /quoteGate\.current\.begin\(\)/.test(checkout));
  check(
    'Stale responses are discarded before they can paint',
    /if \(!isCurrent\(\)\) return null;/.test(checkout),
  );
  check(
    'Loading state is only cleared by the newest request',
    /if \(isCurrent\(\)\) setQuoteLoading\(false\)/.test(checkout),
  );
  check(
    'A deposit quote must match the selected deposit',
    /quoteMatchesSelection[\s\S]{0,220}Number\(quoteForTier\.originalPrice\) === Number\(depositAmount\)/.test(checkout),
  );
  check(
    'The summary only prints a quote that matches the selection',
    /const usableQuote = quoteMatchesSelection \? quoteForTier : null;/.test(checkout),
  );
  check(
    'Summary label, total and discount all read the guarded quote',
    /baseAmount = usableQuote\?\.originalPrice/.test(checkout) &&
      /finalAmount = usableQuote\?\.amount/.test(checkout) &&
      /discountAmount = usableQuote\?\.discountAmount/.test(checkout),
  );
  check(
    'The manual-invoice fallback names the selected deposit',
    /requestManualPaymentLink\(tier === 'deposit' \? depositAmount :/.test(checkout),
  );
  check(
    'The Stripe submission sends the selected deposit for server pricing',
    /depositAmount: tier === 'deposit' \? depositAmount : undefined/.test(checkout),
  );

  section('3. Server remains the price authority');
  check('Only 99/499/2499/4499 are accepted reservation amounts', /RESERVE_OPTIONS_USD = \[99, 499, 2499, 4499\]/.test(pricing));
  check(
    'A requested amount must be on the allowlist',
    /if \(RESERVE_OPTIONS_USD\.includes\(asked\)\) return asked;/.test(pricing),
  );
  check(
    'An unknown amount falls back instead of being charged',
    /const configured = Number\(settings\?\.depositPriceUSD\);\s*\n\s*if \(RESERVE_OPTIONS_USD\.includes\(configured\)\) return configured;\s*\n\s*return DEPOSIT_FALLBACK_USD;/.test(pricing),
  );
  check(
    'The deposit label is built from the resolved amount',
    /Cohort Seat Reservation Deposit \(\$\$\{amount\.toLocaleString\('en-US'\)\}\)/.test(pricing),
  );

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.error('\nCheckout quote race is NOT guarded.');
    process.exit(1);
  }
  console.log('Checkout price display follows the newest quote and the selected deposit.');
};

main().catch((err) => {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
});
