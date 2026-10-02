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

**hPanel → Websites → Add Website → Deploy Web App → Import Git Repository →
Connect with GitHub.** Repo chuno: `Himanshu0j/american-futuretech`, branch `main`.

> **GitHub connect karna optional nahi hai** — auto-deploy (yaani "push karo,
> live ho jaye") sirf isi raste se milta hai. Sirf repo URL paste karne se ek
> baar deploy hota hai, push par kuch nahi hota. Approve karte waqt Hostinger
> GitHub App ko is repo ka access dena zaroori hai (Settings → Applications me
> baad me check kar sakte ho).
>
> **Pehle ek cheez check karo:** agar ye domain is plan me pehle se kisi website
> ki tarah add hai (jaise default hosting page), to Node.js app banane se pehle
> wo website **remove** karni padti hai — Hostinger fresh slot expect karta hai.

Deploy settings screen par **exactly ye values** rakho:

| Field | Value | Kyun |
|---|---|---|
| Framework / Application type | **Other** (ya Express.js) | ye monorepo hai, koi single preset fit nahi baithta |
| Node.js version | **22** (LTS) | `package.json` ke `engines` se khud 22 aata hai |
| Root directory | `/` (khaali chhod do) | `package.json` repo root par hai |
| **Build script** | **`build:hostinger`** (ya `build` — ab dono ek hi kaam karte hain) | dono me install + frontend build hai (neeche note) |
| Output directory | khaali | server app poora root directory deploy karta hai |
| Entry file | **`server/server.js`** | yei process website + API dono chalata hai |
| Package manager | **npm** | `package-lock.json` dono (server + client) repo me committed hain |

> **`build:hostinger` kyun, aur `build` ka kya?**
> Hostinger ke install step me **sirf root** `package.json` ki dependencies install
> hoti hain. Is repo me `server/` aur `client/` ke apne `package.json` hain, isliye
> khaali client build chalane par Vite build fail ho jata hai ("vite: not found")
> aur app `Cannot find module 'express'` dega. `build:hostinger` teeno karta hai:
> `cd server && npm ci --ignore-scripts` (memory-Mongo binary skip — Atlas
> use ho raha hai) → `cd ../client && npm ci` → `npm run build`.
>
> **`npm install` ki jagah `npm ci` kyun?** `npm ci` committed
> `package-lock.json` se exactly wahi versions install karta hai jo local par test
> hue — koi silent upgrade nahi. Lockfile aur `package.json` me mismatch ho to
> `npm ci` **jaldi fail** karta hai (silently galat tree install nahi karta), isliye
> error aaye to local par `npm install` chala kar lockfile commit karo.
> `package-lock.json` `.gitignore` me hai, isliye pehli baar `git add -f
> client/package-lock.json server/package-lock.json` se add kiya gaya tha; ab
> ye **tracked** hain aur normal `git add` se update ho jate hain.
>
> Ab **`build` bhi wahi karta hai** (`build` → `build:hostinger`), kyunki panel ka
> build-command picker aksar sirf `npm run build` hi offer karta hai — picker
> pichhle connected repo ke scripts dikhata hai, is repo ke nahi. Isliye dono
> naam se build pass hota hai; `build:hostinger` purane panel setups ke liye
> rakha hua hai.

---

### 1a. App pehle se bani hui hai? ("Git provider is not connected" ka fix)

Agar website pehle se bani hai aur dashboard par **"Git provider is not
connected"** dikh raha hai, to naya app banane ki zaroorat nahi — wahi app kaam
karega:

1. website Dashboard → **⋮ menu → Connect to GitHub** → GitHub par **Authorize**.
   (Agar plan pehle kisi aur GitHub account se juda tha aur connect error de raha
   hai: profile → Account information → Account integrations se **Disconnect**
   karo, phir yahin se dobara connect karo.)
2. Usi **⋮ menu → Change repository** → `Himanshu0j/american-futuretech`, branch
   **main**. Repo badalte hi naya deployment khud shuru hota hai aur purani files
   overwrite ho jati hain.
3. **Ek plan ek hi GitHub account se juda ho sakta hai** — plan ke sab Node apps
   wahi account use karte hain.
4. Ek hi page par sab settings milti hain: **⋮ → Settings and redeploy** —
   Framework preset · Node version · Build command · Output directory · Entry file
   · Environment variables. **Save** settings ko agle deployment par lagta hai
   (`Save and redeploy` usi waqt build bhi chala deta hai).

> ⚠️ **Impersonation / collaborator session me ye buttons disabled rehte hain**
> ("Disabled because you are impersonating user account" — Connect Git provider,
> Change repository, Redeploy sabhi). Client ke apne login se hi ye steps ho sakte
> hain. Env variables aur build settings impersonation me bhi save ho jate hain.
>
> ⚠️ **Git provider ke bina Redeploy button bhi disabled** rehta hai aur build
> turant fail hoti hai — isliye pehle Git connect, phir repo select karo, tab
> deploy hoga.

---

## 1b. Push = live (auto-deploy) — ek baar set karo, phir hamesha

Hostinger ka Node.js app GitHub se juda hone ke baad **khud hi auto-deploy** karta
hai. Yaani aage jo bhi change local me karo: `git push origin main` — Hostinger
naya commit pull karke install + build chala kar live kar dega. Koi zip upload
nahi, koi manual redeploy nahi. (Hostinger docs: *"push to the connected branch
and Hostinger triggers a rebuild automatically"*.)

Kya hota hai push par:

1. Tum `git push origin main` karte ho.
2. GitHub webhook se Hostinger ko signal deta hai — **ye webhook Hostinger khud
   manage karta hai**, GitHub me manually add karne ki zaroorat nahi.
3. Hostinger naya commit pull karta hai → install → `build:hostinger`.
4. Build green hone par naya process live. Website aur API dono wahi commit
   serve karte hain (`/api/health` ke `build.commit` se confirm hota hai).

Iske liye teen cheezein sahi honi chahiye:

- App **Import Git Repository → Connect with GitHub** se bana ho.
- **Branch = `main`** (wahi branch jispar push karte ho).
- Overview tab par **Auto-deployment** chip dikhe. Agar "Repository access
  missing" ya "different GitHub account" likha ho to wahin se *Manage access* →
  fix kar do, warna push par deploy trigger nahi hoga.

Roz ka kaam aise hoga:

```bash
git add <files> && git commit -m "..." && git push origin main
# 2-4 min baad: hPanel → website → Deployments → last build log
curl -s https://<domain>/api/health | grep -o '"commit":"[^"]*"'   # naya commit aana chahiye
```

- **Build fail hua to live purana version hi chalta rehta hai** — isliye bina darr
  push karo. Fail hone par Deployments me Hostinger khud AI analysis + "Fix and
  redeploy" deta hai.
- Iske baad **Vercel/Render ki zaroorat nahi** rahegi; jab tak unhe retire na karo
  dono chalte rahenge (aur wahi Atlas DB use karenge — kuch tootega nahi).
- Agar pipeline apni **GitHub Actions** me chahiye (custom checks ke saath) to
  Hostinger CI/CD endpoints bhi deta hai: *Generate Upload URL* → archive PUT →
  *Start Node.js build* (API token ke saath). Ye sirf tab chahiye jab panel ka git
  flow kisi wajah se use na ho sake.

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
| 1 | **Stripe webhook URL update** | Stripe → Developers → Webhooks | naya endpoint: `https://<domain>/api/payments/webhook` (admin → Payment Gateway page wahi URL print karta hai) — tarika neeche |
| 2 | **Keep-alive cron** | hPanel → website → Cron Jobs → Create | `*/5 * * * * curl -s https://<domain>/api/health > /dev/null 2>&1` — Hostinger app ko **idle hone par sleep** karta hai; ye cron use warm rakhta hai (aur smoketest watchdog ke timers chalte rehte hain) |
| 3 | Admin login check | `https://<domain>/admin/login` | password wahi purana (same DB) |
| 4 | Test booking/payment (chhota amount) | site → checkout | Stripe LIVE keys DB se hi decrypt hoti hain — sirf `JWT_SECRET` same hona chahiye |
| 5 | Monitoring | hPanel → Monitoring / Analytics | uptime alert on kar do |
| 6 | `SEED_ON_BOOT=false` aur `REQUIRE_PERSISTENT_DB=true` confirm | Environment variables | ek baar set, hamesha ke liye |

### Stripe webhook shift karne ke do tarike

| Tarika | Kya karna | `whsec_` | Admin panel me |
|---|---|---|---|
| **A (recommended)** | purane endpoint ki **URL edit** karo (Render URL → naya domain) | **same rehta hai** | kuch nahi badalna |
| B | **naya endpoint** banao | **naya secret** milta hai | naya `whsec_` Admin → Payment Gateway me paste karna **zaroori** — warna paisa to katega par enrollment auto-confirm nahi hoga (`webhookConfigured: false` warning aayegi) |

Dono endpoints thodi der saath chal sakte hain — handler idempotent hai (`event.id` + payment status guard), duplicate events safe hain. Cutover confirm hone ke baad Render wala endpoint delete kar do. Deploy ke baad Stripe → Webhooks → **Recent deliveries** me 200 dekho.

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
7. **Files kahan land karti hain:** server app ka build
   `~/domains/<domain>/hbuilds/current/nodejs` me (`current` ek symlink hai), aur
   `public_html` me Hostinger apna **`.htaccess`** likhta hai jo requests ko Node
   process par bhejta hai. Us `.htaccess` ko hand-edit mat karo — redeploy usse
   dobara likh deta hai.
8. **Debugging:** Web App dashboard par **Running** badge se process **Restart** ho
   jata hai, aur **Runtime Logs** me app ka apna output (stdout/stderr) milta hai.
   Build green tha par site down hai to wahi dekho — 90% cases me env var ya port
   ka issue hota hai.
9. **DB connect wizard:** Web App dashboard me **Connect a database → MongoDB
   Atlas** — connection string paste karo, `MONGODB_URI` khud set hota hai aur app
   redeploy ho jata hai (Atlas me Hostinger IP allowlist karna bhi guide me likha
   hota hai). Manual env bhi kaam karta hai; ye sirf shortcut hai. Hostinger npm
   packages ka **vulnerability scan** bhi karta hai aur fix ke liye auto PR bana
   deta hai.

---

## 8. Agar build fail ho ya site na khule (troubleshooting)

| Log/aisa dikhe | Matlab | Fix |
|---|---|---|
| `vite: not found` / `Cannot find module 'vite'` | build script me client deps install nahi hue | Build script = `build:hostinger` ya `build` (dono me install hai), phir redeploy |
| `npm ci` error: `can only install packages when your package.json and package-lock.json are in sync` | lockfile purani hai | local par `npm install` chala kar `client/` ya `server/` ka `package-lock.json` commit karo, phir redeploy |
| `Cannot find module 'express'` (runtime) | server deps install nahi hui | wahi — `build:hostinger` / `build`, phir redeploy |
| Root URL par JSON: `API Core is active` | `NODE_ENV` production nahi hai | env me `NODE_ENV=production` set karo (auto redeploy) |
| `FATAL: MONGODB_URI is set, but the database could not be reached` | Atlas ne connection refuse kiya | Atlas → Network Access me `0.0.0.0/0` allow karo (ya Hostinger ka IP), aur URI me password URL-encoded ho |
| `[Data Warning]: Production is connected to a loopback MongoDB` | URI galti se localhost par hai | Atlas URI use karo |
| Website khulti hai par API 404/500 | entry file galat | Entry file = `server/server.js` |
| Images broken, `/uploads/x.png` 404 | disk copy gayi aur DB me nahi hai | file admin se dobara upload karo (ab mirror bana rahega) |
| Build 15 min me poora nahi hua | pehla build bhari hota hai | dobara Deploy dabao (install cache ho jata hai) |
| **403 Forbidden** (redeploy ke baad) | `public_html` ka auto-generated `.htaccess` stale ho gaya | hPanel se **Redeploy** karo — file dobara ban jayegi (khud edit nahi karni) |
| Push karne par deploy trigger nahi hua | Git connection toot gaya / galat branch | Overview tab par auto-deployment status dekho — branch `main` aur repo access sahi karo |

Har build ka poora log **hPanel → Deployments → last build** me milta hai — fail hone
par Hostinger khud AI analysis aur "Fix and redeploy" bhi deta hai.

---

## Appendix — ek nazar me (copy-paste)

```
Framework        : Other (ya Express.js)
Node version     : 22
Root directory   : /
Build script     : build:hostinger  (npm ci se lockfile-locked install)
Output directory : (khaali)
Entry file       : server/server.js
Package manager  : npm
Repo             : https://github.com/Himanshu0j/american-futuretech.git  (branch: main)
                   GitHub se connect karo — isi se push par auto-deploy milta hai

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
