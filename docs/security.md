# Security — authentication hardening

This document covers the fixes made after the audit that found a live admin takeover path.

## What was wrong

| Issue | Impact |
|---|---|
| `admin@americanfuturetech.com` / `admin123` was seeded and worked in production | Anyone could sign in as SUPERADMIN |
| JWT signing secret had a hardcoded fallback committed to the repo (`server/middleware/auth.js`, `authController.js`) | Anyone with the source could mint a valid admin token |
| Checkout created student accounts with the shared password `Password@123`, returned in the API response | Account abuse + shared credentials |
| CRM lead conversion also used `Password@123` and logged it in plain text | Credentials in the audit trail |
| `/api/payments/invoice/:invoiceNumber` was public | Customer PII exposure |
| Login returned different errors for unknown email vs wrong password | Account enumeration |
| No password policy, no brute-force protection | Trivial credential stuffing |

## What changed

**1. No hardcoded secrets** — `server/config/auth.js` owns the JWT secret:

- Production: the server **refuses to boot** (exit code 1) when `JWT_SECRET` is missing, shorter than 32 characters, or a known leaked/placeholder value.
- Development: a random per-process secret is generated and a warning is printed, so tokens can never be forged with the published value — they simply expire on restart.

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**2. Random credentials only** — no account is created with a shared password anywhere:

- Seeder: each demo account gets its own random password, printed **once** in the server log. `SEED_ADMIN_PASSWORD` can override it deliberately.
- Checkout: new students get `Aft-xxxxxxxxNN!`, delivered by email only.
- CRM conversion: same generator, and the CRM call note no longer contains the password.

**3. Password policy** (`server/utils/passwords.js`) — minimum 8 characters, at least three of
lowercase/uppercase/digits/symbols, no common password (including the old `admin123` /
`Password@123` defaults), and must not contain the user's name or email address. Enforced on public signup, admin-created staff, admin password reset and self-service change.

**4. Brute-force protection**

- Per account: 5 failed attempts → 15-minute lock (`failedLoginAttempts`, `lockUntil`), returned as `423 ACCOUNT_LOCKED` with `retryAfterSeconds`.
- Per IP: 20 failed logins / 15 min and 10 signups / hour. Successful logins are never throttled.
- Login errors are identical for unknown accounts and wrong passwords.

**5. Session revocation** — changing a password stamps `passwordChangedAt`; every token issued before that moment is rejected with `code: "PASSWORD_CHANGED"`. The device that made the change receives a replacement token so it stays signed in.

## Required environment variables

```bash
JWT_SECRET=<48 random bytes as hex>   # REQUIRED in production, no fallback
JWT_EXPIRE=7d
```

> ⚠️ **Deploy note:** if `JWT_SECRET` is missing or still the old leaked value on Render, the API
> will not start after this change. Set it **before** deploying.

## Credential rotation runbook

```bash
# 1. Which accounts still use a password published in the repo?
npm run rotate:admin -- --scan
npm run rotate:admin -- --scan --uri "mongodb+srv://..."   # remote database

# 2. Rotate one account (random password, printed once)
npm run rotate:admin -- --email admin@americanfuturetech.com --uri "mongodb+srv://..."

# 3. Or choose the password yourself
npm run rotate:admin -- --email admin@... --password 'MyNewPass!2026'
```

Rotation also clears the brute-force lock and immediately invalidates every existing token.

## Verification

```bash
npm run verify:auth     # 42 checks: policy, JWT config, prod boot failure,
                        # forged-token rejection, lockout, enumeration, rate limits
npm run verify:payments # 36 checks
npm run verify:cms      # 17 checks
```

`verify:auth` spawns the real server against a throwaway database and proves, among other things,
that a token signed with the **old published secret is rejected**.
