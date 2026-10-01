/**
 * Smoke-test watchdog scheduler.
 *
 * The refund logic lives next to the settlement path it shares
 * (`recoverStrandedSmokeTests` in the payments controller); this module only
 * decides *when* it runs, so the API process itself can put a stranded charge
 * back on the card without anybody opening the admin panel.
 *
 * Two guards keep it from being a surprise in the wrong place:
 *
 *   DISABLE_BACKGROUND_JOBS=true     every timer in the process is off
 *   SMOKE_TEST_WATCHDOG_ENABLED=false  just this one
 *
 * It needs no configuration to be useful in production: with no secret key the
 * controller reports `gateway-off` and does nothing, and with no smoke-test rows
 * (a fresh or throwaway database) the pass is a single indexed query.
 */

const { recoverStrandedSmokeTests } = require('../controllers/paymentController');

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

// Give the settlement webhook its chance before touching Stripe, and let short
// lived processes (test suites, one-off scripts) exit without ever ticking.
const DEFAULT_START_DELAY_MS = 45 * 1000;

/** Never hammer a timer tighter than a minute, whatever the environment says. */
const readIntervalMs = () => {
  const configured = Number(process.env.SMOKE_TEST_WATCHDOG_INTERVAL_MS);
  if (Number.isFinite(configured) && configured >= 60 * 1000) return configured;
  return DEFAULT_INTERVAL_MS;
};

const readStartDelayMs = () => {
  const configured = Number(process.env.SMOKE_TEST_WATCHDOG_START_DELAY_MS);
  if (Number.isFinite(configured) && configured >= 0) return configured;
  return DEFAULT_START_DELAY_MS;
};

/**
 * Whether the safety net is actually running, reported through /api/health — an
 * operator asking "will a stranded charge be refunded tonight?" should not have
 * to read the deploy logs to find out.
 */
let watchdogStatus = { armed: false, intervalMinutes: null, startedAt: null, disabledReason: null };

const getSmokeTestWatchdogStatus = () => ({ ...watchdogStatus });

const startSmokeTestWatchdog = () => {
  if (process.env.DISABLE_BACKGROUND_JOBS === 'true') {
    watchdogStatus = { armed: false, intervalMinutes: null, startedAt: null, disabledReason: 'DISABLE_BACKGROUND_JOBS' };
    console.log('[Smoke Test Watchdog] disabled (DISABLE_BACKGROUND_JOBS=true)');
    return null;
  }
  if (process.env.SMOKE_TEST_WATCHDOG_ENABLED === 'false') {
    watchdogStatus = { armed: false, intervalMinutes: null, startedAt: null, disabledReason: 'SMOKE_TEST_WATCHDOG_ENABLED' };
    console.log('[Smoke Test Watchdog] disabled (SMOKE_TEST_WATCHDOG_ENABLED=false)');
    return null;
  }

  const intervalMs = readIntervalMs();
  const startDelayMs = readStartDelayMs();
  let running = false;

  const tick = async () => {
    // A slow pass must not overlap with the next one: two passes racing over the
    // same charge is harmless (the refund is idempotent) but pointless.
    if (running) return;
    running = true;
    try {
      const summary = await recoverStrandedSmokeTests();
      if (summary.skipped) {
        // No gateway configured: expected before go-live, so stay quiet.
        return;
      }
      if (summary.checked > 0) {
        console.log(
          `[Smoke Test Watchdog] checked ${summary.checked} — recovered ${summary.recovered}, refunded ${summary.refunded}, expired ${summary.expired}, alerts ${summary.alerts}, errors ${summary.errors}`,
        );
      }
    } catch (error) {
      console.error(`[Smoke Test Watchdog] pass failed: ${error.message}`);
    } finally {
      running = false;
    }
  };

  const startTimer = setTimeout(tick, startDelayMs);
  const intervalTimer = setInterval(tick, intervalMs);
  // `unref` so a background job can never keep a process alive on its own.
  if (typeof startTimer.unref === 'function') startTimer.unref();
  if (typeof intervalTimer.unref === 'function') intervalTimer.unref();

  watchdogStatus = {
    armed: true,
    intervalMinutes: Math.round(intervalMs / 60000),
    startedAt: new Date().toISOString(),
    disabledReason: null,
  };
  console.log(
    `[Smoke Test Watchdog] armed — first pass in ${Math.round(startDelayMs / 1000)}s, then every ${Math.round(intervalMs / 60000)} min`,
  );

  return {
    stop() {
      clearTimeout(startTimer);
      clearInterval(intervalTimer);
      watchdogStatus = { armed: false, intervalMinutes: null, startedAt: null, disabledReason: 'stopped' };
    },
  };
};

module.exports = {
  startSmokeTestWatchdog,
  getSmokeTestWatchdogStatus,
  __test__: { readIntervalMs, readStartDelayMs, DEFAULT_INTERVAL_MS, DEFAULT_START_DELAY_MS },
};
