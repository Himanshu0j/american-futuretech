# Website Editor — har text aur image ka control

Admin panel se poori website ka **text aur images** badal sakte hain — bina developer, bina code.
Kisi bhi heading, button, label, footer line ya image tak — ek-ek lafz tak.

---

## 1. Kaise kholein

Do tareeke hain, dono kaam karte hain:

| Tareeka | Kaise |
|---|---|
| **Admin panel se** (recommended) | Sidebar → **Website Editor (Text & Images)** → page chuno → **Edit on site** |
| **Seedha page par** | Jo page badalna hai, uske address ke aage `?edit=1` laga do (e.g. `yoursite.com/courses?edit=1`) |

> Editor sirf **signed-in admin** ko dikhta hai. Aam visitor ko sirf aapke kiye hue changes dikhte hain — editor nahi.

## 2. Edit kaise karein

1. Page khulte hi jo bhi cheez badli ja sakti hai, uspar **halki indigo outline** aa jati hai.
2. Us text ya image par **click** karo.
3. Naya text likho (ya image **upload** karo / URL paste karo) → **Stage change**.
4. Panel ke neeche **Publish** dabao.
5. Bas — change **turant sabhi visitors** ko dikhne lagta hai.

Panel ke andar:
- **Upari dropdown** — kisi bhi page par seedha jump karo.
- **Search box** — us page ka koi bhi lafz dhoondo (`661 texts` jaisa count bhi dikhta hai).
- **LIVE / DRAFT badge** — kaun sa change publish ho chuka hai, kaun sa sirf draft hai.
- **Revert** (single element) — sirf usi cheez ka original wapas.
- **Reset** (poore page par) — us page ke saare changes hata kar original content.

## 3. Kaun sa content kahan se badalta hai

| Content | Kahan se |
|---|---|
| Headings, buttons, labels, banner, footer, images | **Website Editor** (ye document) |
| Course ka title, fees, duration, curriculum, capstone | Curriculum & Courses CMS |
| Job postings | Partner Job Board |
| Blog, FAQs, Success Stories | Content & FAQs CMS |
| Logos, hero headline, global CTAs, sections hide/show | Site CMS & Settings |

## 4. Refresh par purani screen kyun nahi aati

Pehle problem thi: page refresh karne par **pehle original (coded) text** dikhta tha aur ek pal baad aapka edited text aata tha —
kuch sambhal ke lagta tha ki change laga hi nahi.

Ab har page ke last known changes **browser mein locally cache** hote hain (`localStorage → aft_site_overrides_v1`) aur
**pehle paint se pehle** apply ho jate hain (React ka `useLayoutEffect`). Uske baad server se confirm ho jata hai.
Iska matlab: refresh par seedha aapka content dikhta hai, flash nahi. Same warm start settings ke liye bhi hai (`aft_site_settings_v1`).

Saath hi **Reset ab sach mein reset karta hai** — jo override hat jata hai, uska original text/image visitor ke screen par
wapas aa jata hai, bina hard reload ke.

## 5. Ye safe kyun hai

- Har change mein **original text bhi save** hota hai. Layout badalne par purana change chup-chaap skip ho jata hai — page **kabhi tootega nahi**, bas default content dikhega.
- Sab kuch **database mein permanently** save hota hai (server restart / redeploy par bhi rehta hai).
- **Overview page** par dekh sakte hain: kis page par kitne text/image changes hue hain aur kab — aur wahi se ek click mein **Reset** bhi.
- Har action **audit log** mein record hota hai.
- Public read endpoint rate-limited hai; likhne ke liye admin permission (`SETTINGS_EDIT` / `HOMEPAGE_EDIT`) chahiye.

## 6. Developer ke liye (technical)

| His sa | File |
|---|---|
| Shared engine (DOM keys, apply, store) | `client/src/lib/siteOverrides.js` |
| Public applier (sabhi visitors ke liye) | `client/src/components/SiteOverridesApplier.jsx` |
| Editing UI (`?edit=1`) | `client/src/components/SiteEditor.jsx` |
| Admin overview page | `client/src/admin/WebsiteEditor.jsx` |
| Public pages list | `client/src/data/publicPages.js` |
| Server endpoints | `server/routes/settingsRoutes.js`, `server/controllers/settingsController.js` |

Endpoints:

```
GET    /api/settings/site-editor?route=/courses   → public, ek page ke overrides
GET    /api/settings/site-editor/summary          → admin, sabhi pages ki list + counts
PUT    /api/settings/site-editor                  → admin, merge save
DELETE /api/settings/site-editor?route=/courses   → admin, ek page reset
```

Regressions test:

```bash
npm run verify:editor     # 29 checks (schema, validation, auth, overview, reset, audit log)
```

Storage: `SiteSettings.textOverrides` / `imageOverrides`, shape
`{ "/route": { "<dom-key>": { original, value, updatedAt } } }`.
