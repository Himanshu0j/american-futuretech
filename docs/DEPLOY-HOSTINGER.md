# Hostinger par pura project live karna — step-by-step (Hinglish)

Ye guide **client ke apne Hostinger hosting (Business / Cloud → "Node.js Web App")**
par poora project — website + API + admin panel + uploads — ek hi jagah live karne
ke liye hai. Iske baad Vercel aur Render ki zaroorat nahi rehti.

> **Ek hi process sab kuch serve karta hai.** `server/server.js` production me
> `client/dist` (built website) ko static serve karta hai, SPA fallback ke saath —
> isliye alag frontend host ki zaroorat nahi:

| Kya | Kaun serve karta hai | Kaunsi file |
|---|---|---|
| Website (SPA) | usi Node process se `client/dist` | `server/server.js` (production branch) |
| API + admin panel | `/api/*` usi process se | `server/routes/*` |
| Uploaded images | `/uploads/*` — disk copy, aur disk gayab ho to MongoDB mirror | `server/routes/uploadRoutes.js` |
| Database | MongoDB **Atlas** (wahi cluster jo abhi live hai) | `server/config/db.js` |

---

## 0. Pehle ye 4 cheezein ready rakho

| # | Cheez | Kahan milegi | Kyun chahiye |
|---|---|---|---|
| 1 | Hostinger hPanel login (client ka) | client | Business/Cloud plan me hi "Node.js web app" milta hai |
| 2 | Domain (Hostinger se liya hua) | hPanel → Domains | site isi par live hogi |
| 3 | **Render ka `JWT_SECRET`** | Render → `american-futuretech-api` → Environment → copy | ⚠️ **Sabse critical.** Naya secret banaya to (a) sab admin/student log out ho jayenge aur (b) database me save kiye LIVE Stripe keys decrypt nahi honge — payments band |
| 4 | MongoDB Atlas URI | `server/.env.production.local` (git-ignored) ya Render env | yahi DB reuse karni hai, data kahin move nahi hoga |

> Repo me sab kuch pehle se ready hai: `engines.node = 22.x` (Hostinger Node 22
> uthayega), `build:hostinger` script (dono sub-packages install + frontend build),
> aur `server/server.js` me `trust proxy` (neeche point 7 dekho).

---

## 1. hPanel me Node.js app banao

**hPanel → Websites → Add Website → Deploy Web App → Import Git Repository**
(public repo hai to GitHub connect karne ki zaroorat nahi — seedha repo URL
`https://github.com/Himanshu0j/american-futuretech.git` paste kar sakte ho.
Auto-deploy on push chahiye to GitHub account connect kar lo.)

Deploy settings screen par **exactly ye values** rakho:

| Field | Value | Kyun |
|---|---|---|
| Framework / Application type | **Other** (ya Express.js) | ye monorepo hai, koi single preset fit nahi baithta |
| Node.js version | **22** (LTS) | `package.json` ke `engines` se khud 22 aata hai |
| Root directory | `/` (khaali chhod do) | `package.json` repo root par hai |
| **Build script** | **`build:hostinger`** | ⬅️ ye `build` nahi. Isi me dono install + frontend build hai (neeche note) |
| Output directory | khaali | server app poora root directory deploy karta hai |
| Entry file | **`server/server.js`** | yei process website + API dono chalata hai |
| Package manager | **npm** | `package-lock.json` hai |

> **`build:hostinger` kyun, sirf `build` kyun nahi?**
> Hostinger ke install step me **sirf root** `package.json` ki dependencies install
> hoti hain. Is repo me `server/` aur `client/` ke apne `package.json` hain, isliye
> khaali `build` chalane par Vite build hi fail ho jayega ("vite: not found") aur
> app `Cannot find module 'express'` dega. `build:hostinger` teeno karta hai:
> `npm --prefix server install --ignore-scripts` (memory-Mongo binary skip — Atlas
> use ho raha hai) → `npm --prefix client install` → `npm --prefix client run build`.

---

## 2. Environment variables

hPanel → website → **Environment variables** → **Import .env** → repo ki
`deploy/hostinger.env.example` ki copy banao (`hostinger.env`), values bharo, upload
karo. Sabse zaroori 6:

```
NODE_ENV=production        # warna root URL par JSON dikhega, website nahi
MONGODB_URI=mongodb+srv://…   # wahi Atlas cluster
REQUIRE_PERSISTENT_DB=true # DB na mile to boot fail (silent data loss se bachaav)
SEED_ON_BOOT=false         # real data hai, demo dataset dobara na bane
JWT_SECRET=<Render se copy>   # ⚠️ same value warna Stripe LIVE keys mar jayengi
CLIENT_URL=https://<domain>   # CORS + Stripe redirect + webhook URL
VITE_API_URL=https://<domain>/api   # build-time: admin "copy brief" URLs naye domain par
```

- Values **build aur runtime dono** me inject hoti hain — isliye `VITE_API_URL`
  jaisa build-time variable bhi yahin set karna hai.
- **Save karte hi Hostinger apne aap redeploy karta hai.**
- `NODE_ENV` bhoolna sabse common galti hai: uske bina `server/server.js` website
  serve hi nahi karta.

---

## 3. Deploy karo

**Deploy** dabao → build log live dikhta hai (Deployments → last build).
Pehla build ~3-6 min leta hai (dono packages install + Vite build). 15 min per
phase limit hai.

Safal hone par Hostinger ek temporary preview URL deta hai — domain attach karne se
pehle usi par test kar lo.

---

## 4. Domain + SSL

1. hPanel → website → **Domains** → apna domain add/assign karo (`www` bhi map kar do).
2. Hostinger ka free SSL auto-issue hota hai (SSL section me status dikhega) —
   uske baad "Force HTTPS" on kar do.
3. Domain ke DNS Hostinger nameservers par hi hain to kuch manual karne ki zaroorat
   nahi; warna A record us hosting IP par point karo.

---

## 5. Verify karo (2 minute)

```bash
# 1) API + DB
curl -s https://<domain>/api/health
#    chahiye: "status":"online", database.mode == "external", ephemeral == false,
#             build.commit == tumhara aakhri commit, warnings == []

# 2) Website + API ek hi host par, aur current commit
SITE_URL=https://<domain> API_URL=https://<domain> npm run verify:deploy

# 3) Poora live QA (login, admin, CRUD — sab)
LIVE_API_URL=https://<domain> npm run verify:live

# 4) DB persistence report
API_BASE=https://<domain> npm run verify:db
```

Browser me: `/` par website, `/admin/login` par admin login, ek course page, aur
admin → Media Library me koi purani uploaded image (wo `/uploads/...` se aani chahiye,
Render ke URL se nahi).

---

## 6. Deploy ke baad checklist

| # | Kaam | Kahan | Note |
|---|---|---|---|
| 1 | **Stripe webhook URL update** | Stripe → Developers → Webhooks | naya endpoint: `https://<domain>/api/payments/webhook` (admin → Payment Gateway page wahi URL print karta hai). Purana Render endpoint tab tak rakh sakte ho — handler idempotent hai (`event.id` + payment status guard). Cutover confirm hone ke baad purana delete kar do |
| 2 | **Keep-alive cron** | hPanel → website → Cron Jobs → Create | `*/5 * * * * curl -s https://<domain>/api/health > /dev/null 2>&1` — Hostinger app ko **idle hone par sleep** karta hai; ye cron use warm rakhta hai (aur smoketest watchdog ke timers chalte rehte hain) |
| 3 | Admin login check | `https://<domain>/admin/login` | password wahi purana (same DB) |
| 4 | Test booking/payment (chhota amount) | site → checkout | Stripe LIVE keys DB se hi decrypt hoti hain — sirf `JWT_SECRET` same hona chahiye |
| 5 | Monitoring | hPanel → Monitoring / Analytics | uptime alert on kar do |
| 6 | `SEED_ON_BOOT=false` aur `REQUIRE_PERSISTENT_DB=true` confirm | Environment variables | ek baar set, hamesha ke liye |

---

## 7. Hostinger-specific baatein (jo alag hain)

1. **App on-demand chalta hai** — traffic na aane par process sleep ho jata hai, agli
   request par turant (1-3s) start ho jata hai. Isliye upar wala keep-alive cron
   lagana useful hai: cold start bhi hat jaata hai aur background watchdog ke timers
   bhi chalte rehte hain. (Pehli request thodi slow lag sakti hai — ye normal hai.)
2. **Har deploy ek naya build folder hota hai** (`hbuilds/versions/<id>`) aur sirf
   **last 2 successful builds** rakhe jaate hain. Purane build folder me likhi hui
   koi bhi file (jaise `server/uploads/`) naye deploy par gayab ho jati hai — isliye
   uploads ka MongoDB mirror pehle se bana hua hai: image ka disk copy chala jaye to
   `/uploads/<file>` **DB se serve** hoti hai. Media Library me wo "durable" dikhti hain.
3. **Env var save = automatic redeploy.** Koi value badalni ho to sirf env edit karo.
4. **Rollback:** hPanel ke Deployments se pichhla build re-point kar sakte ho (2 tak),
   ya git me `revert` + push — dono theek hain. `SEED_ON_BOOT=false` hone se data
   par koi asar nahi padta.
5. **`trust proxy`** ab server me set hai (`1` hop) — isliye `/api/leads/apply` ka
   rate limit asli visitor ke IP par lagta hai, poore site ko ek IP na samjho.
6. **Vercel/Render chalu rakhna hai?** Dono abhi bhi same Atlas DB use karte hain,
   isliye kuch tootega nahi — bas do jagah se data likha ja sakta hai. Cutover
   confirm hone ke baad hi un services/`vercel.json` ko retire karo.

---

## 8. Agar build fail ho ya site na khule (troubleshooting)

| Log/aisa dikhe | Matlab | Fix |
|---|---|---|
| `vite: not found` / `Cannot find module 'vite'` | build script `build` tha, client deps install nahi hui | Build script = `build:hostinger` |
| `Cannot find module 'express'` (runtime) | server deps install nahi hui | wahi — `build:hostinger`, phir redeploy |
| Root URL par JSON: `API Core is active` | `NODE_ENV` production nahi hai | env me `NODE_ENV=production` set karo (auto redeploy) |
| `FATAL: MONGODB_URI is set, but the database could not be reached` | Atlas ne connection refuse kiya | Atlas → Network Access me `0.0.0.0/0` allow karo (ya Hostinger ka IP), aur URI me password URL-encoded ho |
| `[Data Warning]: Production is connected to a loopback MongoDB` | URI galti se localhost par hai | Atlas URI use karo |
| Website khulti hai par API 404/500 | entry file galat | Entry file = `server/server.js` |
| Images broken, `/uploads/x.png` 404 | disk copy gayi aur DB me nahi hai | file admin se dobara upload karo (ab mirror bana rahega) |
| Build 15 min me poora nahi hua | pehla build bhari hota hai | dobara Deploy dabao (install cache ho jata hai) |

Har build ka poora log **hPanel → Deployments → last build** me milta hai — fail hone
par Hostinger khud AI analysis aur "Fix and redeploy" bhi deta hai.

---

## Appendix — ek nazar me (copy-paste)

```
Framework        : Other (ya Express.js)
Node version     : 22
Root directory   : /
Build script     : build:hostinger
Output directory : (khaali)
Entry file       : server/server.js
Package manager  : npm
Repo             : https://github.com/Himanshu0j/american-futuretech.git  (branch: main)

Env (deploy/hostinger.env.example se import):
  NODE_ENV=production
  MONGODB_URI=mongodb+srv://…
  REQUIRE_PERSISTENT_DB=true
  SEED_ON_BOOT=false
  JWT_SECRET=<Render se copy — same rakho>
  JWT_EXPIRE=7d
  CLIENT_URL=https://<domain>
  VITE_API_URL=https://<domain>/api
  PAYMENT_CURRENCY=USD
  (optional) SMTP_* / NOTIFICATION_EMAIL

Cron (Advanced → Cron Jobs):
  */5 * * * * curl -s https://<domain>/api/health > /dev/null 2>&1
```
