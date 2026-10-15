/**
 * Stripe webhook endpoint repair.
 *
 * Why this exists: the webhook endpoint lives in the Stripe dashboard, which
 * means nothing in this codebase can see or fix it — the panel's only advice was
 * "add the endpoint in Stripe yourself". When the site moved to its custom
 * domain, the live endpoint stayed pointed at a subdomain that no longer serves
 * the app (its TLS handshake does not even complete), so for nine days every
 * delivery failed: 15 attempts, then Stripe's "we will stop sending events"
 * notice. Paid orders stopped confirming themselves, and no screen in the admin
 * panel said so.
 *
 * Stripe's API can do the whole repair, so the panel now offers it as one
 * button:
 *   · create the endpoint at OUR url when there is none (or the only ones are
 *     leftovers from an older domain),
 *   · add the settlement events a matching endpoint is missing,
 *   · re-enable one Stripe disabled after repeated failures,
 *   · disable stale endpoints we no longer serve, so their failure emails stop,
 *   · and store the signing secret Stripe returns ONCE at creation, which is the
 *     step a dashboard visit cannot avoid (copy-pasting a whsec_ by hand is
 *     exactly what gets skipped).
 *
 * The decision logic is pure (`planWebhookRepair`) and the I/O is injected
 * (`applyWebhookRepair`, `probeWebhookUrl`), so the whole thing is verifiable
 * without a network, a live key or a single real delivery.
 */

/** What `planWebhookRepair` decided should happen. */
const ACTIONS = {
  CREATE: 'created',
  REPAIR: 'repaired',
  UNCHANGED: 'unchanged',
};

/**
 * Decide what to change on the Stripe account. No I/O at all.
 *
 * `endpoints` is the list Stripe returned (id, url, status, enabled_events).
 * The plan keeps working when Stripe hands back fields it did not promise:
 * anything missing is treated as "unknown", never as "fine".
 */
const planWebhookRepair = ({
  endpoints = [],
  expectedUrl,
  requiredEvents = [],
  disableOthers = false,
} = {}) => {
  const list = Array.isArray(endpoints) ? endpoints : [];
  const matching = list.find((endpoint) => endpoint?.url === expectedUrl) || null;
  const others = list.filter((endpoint) => endpoint?.url !== expectedUrl);

  const stale = others
    .filter((endpoint) => endpoint?.status === 'enabled' && endpoint?.id)
    .map((endpoint) => ({ id: endpoint.id, url: endpoint.url }));

  if (!matching) {
    return {
      action: ACTIONS.CREATE,
      expectedUrl,
      endpointId: null,
      // Stripe only ever hands the signing secret back on creation, so a create
      // plan is the one that must store it.
      expectsSecret: true,
      enabledEvents: [...requiredEvents],
      missingEvents: [],
      reEnable: false,
      staleToDisable: disableOthers ? stale : [],
      others,
      notes: [
        others.length
          ? `Stripe has no endpoint at our URL — only leftovers at ${others.map((e) => e.url).join(', ')}.`
          : 'Stripe has no webhook endpoint at all for this account yet.',
      ],
    };
  }

  const enabled = Array.isArray(matching.enabled_events) ? matching.enabled_events : [];
  // A `*` subscription already covers every event we need; rewriting it to our
  // list would silently narrow what the client asked Stripe to send.
  const wildcard = enabled.includes('*');
  const missingEvents = wildcard ? [] : requiredEvents.filter((name) => !enabled.includes(name));
  const reEnable = matching.status !== 'enabled';

  if (!missingEvents.length && !reEnable) {
    return {
      action: ACTIONS.UNCHANGED,
      expectedUrl,
      endpointId: matching.id,
      expectsSecret: false,
      enabledEvents: enabled,
      missingEvents: [],
      reEnable: false,
      staleToDisable: disableOthers ? stale : [],
      others,
      notes: ['The endpoint already points at our URL with every settlement event and is enabled.'],
    };
  }

  return {
    action: ACTIONS.REPAIR,
    expectedUrl,
    endpointId: matching.id,
    expectsSecret: false,
    // The union, not the required list: events the client added by hand stay.
    enabledEvents: wildcard ? enabled : [...enabled, ...missingEvents],
    missingEvents,
    reEnable,
    staleToDisable: disableOthers ? stale : [],
    others,
    notes: [
      missingEvents.length
        ? `Adding ${missingEvents.length} missing event(s) to the existing endpoint.`
        : '',
      reEnable ? 'Re-enabling the endpoint Stripe disabled after repeated failures.' : '',
      // Worth saying out loud: the panel asks for the signing secret after
      // creating an endpoint, and an admin who thinks an update re-issues it
      // would go looking for a new value that does not exist.
      'Updating an endpoint does not change its signing secret — the one already saved stays valid.',
    ].filter(Boolean),
  };
};

/**
 * Run the plan against Stripe. Returns a report with no secret material except
 * `secret`, which the caller stores and must never echo back to a browser.
 */
const applyWebhookRepair = async ({ stripe, plan, description = 'American FutureTech site' } = {}) => {
  if (!stripe) throw new Error('Stripe is not configured');
  if (!plan) throw new Error('No repair plan was supplied');

  const report = {
    action: plan.action,
    endpointId: plan.endpointId || null,
    secret: '',
    addedEvents: [],
    reEnabled: false,
    disabledOthers: [],
    notes: [...(plan.notes || [])],
  };

  if (plan.action === ACTIONS.CREATE) {
    if (!plan.expectedUrl) throw new Error('A create plan needs the URL to create the endpoint at');
    const created = await stripe.webhookEndpoints.create({
      url: plan.expectedUrl,
      enabled_events: plan.enabledEvents,
      description,
    });
    report.endpointId = created?.id || null;
    report.secret = String(created?.secret || '');
    if (!report.secret) {
      report.notes.push(
        'Stripe did not return a signing secret for the new endpoint — paste it from the dashboard.',
      );
    }
  } else if (plan.action === ACTIONS.REPAIR) {
    const payload = {};
    if (plan.missingEvents?.length) payload.enabled_events = plan.enabledEvents;
    if (plan.reEnable) payload.disabled = false;
    const updated = await stripe.webhookEndpoints.update(plan.endpointId, payload);
    report.endpointId = updated?.id || plan.endpointId;
    report.addedEvents = plan.missingEvents || [];
    report.reEnabled = Boolean(plan.reEnable);
  }

  // Stale endpoints are disabled, never deleted: disabling is reversible from
  // the dashboard, and deleting someone else's configuration is not our call.
  // This runs for EVERY action, creation included — a fresh endpoint at our URL
  // does not stop the old domain's failure notices on its own, and that mailbox
  // filling up is half of why this repair exists.
  for (const endpoint of plan.staleToDisable || []) {
    await stripe.webhookEndpoints.update(endpoint.id, { disabled: true });
    report.disabledOthers.push(endpoint.url);
  }

  return report;
};

/**
 * Plain-language reachability of a URL, from the failure object alone (pure).
 *
 * `status` is set when the request got an HTTP answer at all. Our own webhook
 * answers 404 to a GET by design — no GET route exists — which still proves that
 * TLS terminated and the app answered, so any status counts as reachable.
 */
const classifyWebhookProbe = ({ status, error } = {}) => {
  if (status) {
    return {
      reachable: true,
      code: 'reachable',
      message: `The endpoint answered HTTP ${status} (a GET is expected to be 404 — only Stripe's signed POST is accepted).`,
    };
  }

  const message = String(error?.message || error || 'no response');
  const code = String(error?.code || error?.cause?.code || error?.cause?.errno || '');
  const fingerprint = `${code} ${message}`;

  if (/certificate|CERT|self.signed|unable to verify|SSL|TLS|EPROTO|alert|handshake/i.test(fingerprint)) {
    return {
      reachable: false,
      code: 'tls',
      message: `The HTTPS handshake to this URL failed (${message}). Stripe cannot deliver here until the certificate for this hostname works — check the domain's SSL in your hosting panel, or point the webhook at the domain that already serves the site.`,
    };
  }
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo|DNS/i.test(fingerprint)) {
    return {
      reachable: false,
      code: 'dns',
      message: `This hostname does not resolve (${message}). Point the webhook at a domain that exists.`,
    };
  }
  if (/ETIMEDOUT|timed out|timeout|aborted|ECONNRESET|ECONNREFUSED/i.test(fingerprint)) {
    return {
      reachable: false,
      code: 'unreachable',
      message: `No answer from this URL in time (${message}).`,
    };
  }
  return { reachable: false, code: 'unknown', message: `Could not verify the URL: ${message}` };
};

/** GET the URL and classify the answer. `fetchImpl` is injectable for tests. */
const probeWebhookUrl = async (url, { fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) => {
  if (!url) return classifyWebhookProbe({ error: new Error('no url to probe') });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
    });
    return classifyWebhookProbe({ status: res?.status || 200 });
  } catch (error) {
    return classifyWebhookProbe({ error });
  } finally {
    clearTimeout(timer);
  }
};

module.exports = {
  ACTIONS,
  planWebhookRepair,
  applyWebhookRepair,
  classifyWebhookProbe,
  probeWebhookUrl,
};
