# Follow-up audit — 2026-10-22

Read-only production audit, then isolated repairs on `staging/audit-2026-10-22`.
The repairs were later fast-forwarded into `main` and deployed on 2026-10-27 — see
[Deployment](#deployment--2026-10-27). During the audit itself nothing was pushed
and nothing ran against live data; production stayed on `367165b` throughout.

## Deployment — 2026-10-27

Approved by the owner and shipped as a fast-forward, `367165b..1d3c736` on `main`
(five commits, 13 files). Both providers caught up within 50 s:

- Vercel (site) and Render (API) both report `1d3c7365`; `npm run verify:deploy`
  is **22/22**, including the live first-paint snapshots and the deposit allowlist.
- `robots.txt` → `200 text/plain` (512 B); `sitemap.xml` → `200 application/xml`,
  37 URLs.
- Anonymous `/api/health` returns no DB host, no DB name and no payment mode;
  `payments` is `{provider, configured, webhookConfigured, currency, ready, warning}`.
- Live checkout against the production API: the $499 seat keeps `$499` in the
  button, the line item and *Total Due Now* across five samples over ~6 s; the
  $99 seat returns `$99`. No console errors; every quote `POST` answered 200.

Gates run before the push, on the exact committed tree: client production build
(with its prebuild checks), `verify:quote-race` 20/20, `verify:checkout-browser`
9/9 against that build, `verify:security` 93/93, `verify:deposit` 45/45,
`verify:payments` 206/206.

## Environment map (verified this session)

| URL | State |
| --- | --- |
| `americanfuturetechllc.com` | as audited: 200, commit `367165b`, Node process uptime 7043 s, DB `american_futuretech_staging`, Stripe `live`, webhook ready — now serving `1d3c736` |
| `www.americanfuturetechllc.com` | 200, same commit/DB, uptime 5135 s — **a second Node process** |
| `test.americanfuturetechllc.com` | A `82.180.138.75` (Hostinger); TCP 443 accepts, TLS handshake returns `internal_error`; HTTP 80 answers **403 Forbidden (LiteSpeed)** — no app behind it |
| `american-futuretech.vercel.app` | same commit, proxies `/api` + `/uploads` to production (`client/vercel.json`), therefore live Stripe |

Two things worth stating plainly:

- The database production serves from is **named** `american_futuretech_staging`.
  The name is legacy; it holds live data. A staging environment must not reuse it.
- The checkout also contains `.env.production.local` (untracked) pointing at a
  **different Atlas cluster** (`betexch…`, database `american_futuretech`). That is
  how a "staging" run can land on the wrong catalogue.

## Checkout price race (`f5334fe`) — verified

Source review: every quote claims a monotonic token (`client/src/lib/quoteGate.mjs`)
and only the newest may write state; the summary additionally rejects a deposit
quote whose own pre-discount figure differs from the selected deposit.

Real-browser proof, with the $99 response forced to arrive 1.2 s after the $499 one:

- pre-fix build (`367165b`): pay button and Total Due Now read **$99** while the
  $499 option is selected — 3 of 9 checks fail;
- fixed build: **9/9** checks pass, and selecting $99 afterwards shows $99.

The checkout request carries only the selection (`depositAmount`); no client-side
amount and no quote object is ever sent, so the server remains the price authority.

## Fixes prepared (branch `staging/audit-2026-10-22`)

| Commit | Change |
| --- | --- |
| `7154b1d` | `/sitemap.xml` built from published programs + blog posts (36 URLs locally) and served as XML; `robots.txt` shipped with the build; `/api/health` no longer discloses DB host, DB name or live/test mode to anonymous callers (admin token still gets the full block) |
| `a706023` | `set:fee` refuses loopback targets, ambiguous `MONGODB_URI` sources (env vs `server/.env`), and `--apply` without a matching `--expect-db`; prints host/database but never credentials |
| `6afa902` | `verify:checkout-browser` (9 checks), a checkout-body assertion in `verify:quote-race`, and a fix for `verify-payments`' own `CLIENT_URL` fixture overriding three origin checks |

Production files were not touched by any of these; all three are code/docs/tests.

## Test results

| Suite | Result |
| --- | --- |
| `verify:quote-race` | 20/20 |
| `verify:checkout-browser` (fixed build) | 9/9 |
| `verify:checkout-browser` (pre-fix build) | 6/9 — the expected failure |
| `verify:deposit` | 45/45 (against a real throwaway mongod on 27018) |
| `verify:security` | 93/93 (previously could not run: no local mongod) |
| `verify:payments` | 206/206 (pre-fix baseline: 202/206; three were the suite's own env bug, one was flaky) |
| `verify:auth` | 49/49 |
| `verify:rbac` | 148/148 |
| `client` production build | passed (39 s) |
| Production-mode probe | `robots.txt` 200 `text/plain`; `sitemap.xml` 200 `application/xml`, 8 programs / 15 posts; SPA deep links still served; anonymous health redacted, staff health full |

Not run (and not claimed): Stripe test-mode end-to-end checkout + webhook replay,
authenticated admin/student UI flows, uploads, the 11-width viewport matrix, and
anything on a real staging host.

## Staging: what is missing

The subdomain points at a Hostinger LiteSpeed vhost with no application and no
certificate. Restoring it needs one of:

1. hPanel access for `americanfuturetechllc.com` to attach a Node.js app to
   `test`, issue the certificate, and set: separate `MONGODB_URI` (a clone of the
   live catalogue, **not** `american_futuretech_staging`), `REQUIRE_PERSISTENT_DB=true`,
   `SEED_ON_BOOT=false`, its own `JWT_SECRET`, `CLIENT_URL=https://test.…`, and
   **Stripe test keys + a test webhook secret**; or
2. a different staging host (Render/Vercel preview) with the same separation.

No credentials for either were found in the workspace, so no attempt was made.

## Open items / risks

1. Staging is unavailable; the fixes have not run on a deployed environment.
2. `www` and apex are two Node processes on the same DB and live Stripe keys —
   duplicate deployment surface. Recommend a single app with `www` 301-ing to the
   apex (host-panel change).
3. The Vercel mirror executes live payments against production and its Git branch
   cannot be verified from the repo (no `.vercel` metadata). Confirm whether it is
   intended; if not, retire it or point it at staging.
4. Missing static assets still answer `200 text/html` (SPA catch-all). Not changed.
5. No canonical/OG/Twitter tags in `index.html`; adding a single canonical would be
   wrong for a SPA, so this needs per-route handling.

## Rollback

No database migration, no schema change, no env change, so a revert is the whole
rollback. The deployed range is `367165b..1d3c736`:

```bash
git revert --no-commit 1d3c736 6afa902 a706023 7154b1d
git commit -m "revert: undo the 2026-10-27 audit fixes"
git push origin main   # both providers rebuild; confirm with npm run verify:deploy
```

Reverting only `7154b1d` also works if the issue is limited to sitemap/robots/health.
`client/dist` is gitignored and is built by the provider, not committed.

## Approval still needed

1. Staging host/credentials (or approval of a different staging target).
2. Decision on the Vercel mirror and on consolidating `www`.
