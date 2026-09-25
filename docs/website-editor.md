# Website Editor — har text aur image ka control

Admin panel se poori website ka **text aur images** badal sakte hain — bina developer, bina code.
Kisi bhi heading, button, label, footer line ya image tak — ek-ek lafz tak.

> **Client-facing version:** `docs/CLIENT-GUIDE.md` (section 3).

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
3. Naya text likho (ya image ka URL paste karo) → **Stage change**.
4. Panel ke neeche **Publish** dabao.
5. Bas — change **turant sabhi visitors** ko dikhne lagta hai.

Panel ke andar:
- **Upari dropdown** — kisi bhi page par seedha jump karo.
- **Search box** — us page ka koi bhi lafz dhoondo (kitne texts hain wo bhi dikhta hai).
- **LIVE / DRAFT badge** — kaun sa change publish ho chuka hai, kaun sa sirf draft hai.
- **Revert** (single element) — sirf usi cheez ka original wapas.
- **Reset** (poore page par) — us page ke saare changes (draft bhi) hata kar original content.

### Draft — aapka adhoora kaam bachta hai

Staged change ek **draft** hai, aur draft **per page** sambhal ke rakha jata hai:

- Page **refresh** karo, doosre page par **navigate** karo, ya tab background mein refetch kare — draft **rehta hai**.
- Wapas aane par editor `Restored n unsaved draft change(s)` dikhata hai aur badge par `n draft` hota hai.
- Draft **published nahi hota** jab tak Publish na dabayein. Aam visitor us draft ko **kabhi nahi** dekhta.
- Draft `sessionStorage` (`aft_site_editor_drafts_v1`) mein route-wise rehta hai — yaani **usi browser tab** tak,
  aur browser band hone par un-published draft chala jata hai. **Published** changes database mein permanent hote hain.
- `Discard` sirf current page ka draft hatata hai; `Reset` page ke published + draft dono hata deta hai.

### Publish hamesha jawab deta hai

Publish button **kabhi chup-chaap kuch nahi karta**. Har case ka saaf message aata hai:

| Situation | Kya dikhta hai |
|---|---|
| Kuch staged nahi | `Nothing is staged on /courses yet — click a text or an image on the page…` |
| Sab publish ho gaya | `n change(s) published live on /courses — every visitor sees them now.` |
| Kuch entries server ne refuse ki | `n published live. m stayed as a draft because the server refused them:` + **har entry ka naam aur reason** |
| Sab refuse ho gayi | `Nothing was published — all n staged change(s) were rejected:` + naam + reason |
| Network/server error | `…nothing was published. Your draft is still here — press Publish again.` |

Refused entries **staged reh jaati hain** (live nahi hoti) — taaki admin usko theek kar ke dobara publish kar sake.
Publish se **pehle** bhi editor warning de deta hai: jo staged entry server refuse karega, uska naam aur wajah
(600-character text limit, 90-character key limit, image URL rule) preview mein hi dikh jati hai.

## 3. Kaun sa content kahan se badalta hai

| Content | Kahan se |
|---|---|
| Headings, buttons, labels, banner, footer, images | **Website Editor** (ye document) |
| Course ka title, fees, duration, curriculum, capstone | Curriculum & Courses CMS |
| Job postings | Partner Job Board |
| Blog, FAQs, Success Stories | Content & FAQs CMS |
| Logos, hero headline/sub-headline, global CTAs | Settings CMS **ya** Website Editor (dono) |

**CMS wali wording bhi editor se badal sakte hain.** Hero headline jaisi lines pehle coded default paint karti hain
aur `/api/settings` aane par CMS wording swap hoti hai. Editor ab element ka "original" **usi wording se** leta hai
jo screen par abhi dikh rahi hai, isliye ye case sahi chalta hai.
Dhyaan rahe: **dono jagah same line badalne par Website Editor ka change upar rehta hai** — isliye ek jagah se hi badlein.

## 4. Refresh par draft/override kaise lagta hai

- Har page ke last known **published** overrides browser mein cache hote hain
  (`localStorage → aft_site_overrides_v1`) aur **pehle paint se pehle** apply ho jate hain (React `useLayoutEffect`),
  taaki refresh par aapka content seedha dikhe — pehle coded text ka flash na aaye. Uske baad server se confirm hota hai.
- **Draft** alag store hota hai (`sessionStorage → aft_site_editor_drafts_v1`) aur route-wise rehta hai.
- Ek page ke draft us page ka load **kabhi wipe nahi karta** — pehle yahi bug tha (draft aur Publish dono gayab).
- Slow response jo page chhod dene ke baad aaye, wo current page ko overwrite nahi karta (stale-response guard).

## 5. Ye safe kyun hai

- Har change ke saath uska **original** store hota hai. Agar layout badal jaye aur original wording page par
  kahin aur **mil jaye**, to rescue us naye position par apply hota hai.
- Agar original wording page se **poori tarah hat chuki ho** (jaise CMS ne wording badal di), to edit
  **position par apply hota hai** — pehle ise chup-chaap skip kar diya jata tha, aur admin ko lagta tha
  ki publish hua hi nahi. Ab **jo publish hota hai wahi visitor ko dikhta hai**; galat jagah lagne par
  page-level **Reset** available hai.
- Sab kuch **database mein permanently** save hota hai (server restart / redeploy par bhi rehta hai).
- **Overview page** (`/admin/website-editor`) par dekh sakte hain: kis page par kitne text/image changes hue hain
  aur kab — aur wahi se ek click mein **Reset** bhi.
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

`PUT` ka response:

```json
{
  "success": true,
  "route": "/",
  "text":   { "<dom-key>": { "original": "...", "value": "...", "updatedAt": "..." } },
  "images": {},
  "saved": 1,
  "rejected": ["text.<dom-key>"],                       // legacy shape (purane clients ke liye)
  "rejections": [{ "kind": "text", "key": "<dom-key>",  // asli shape: kis entry ne kyun refuse kiya
                   "reason": "its key is 109 characters long, over the 90-character limit" }]
}
```

Storage: `SiteSettings.textOverrides` / `imageOverrides`, shape
`{ "/route": { "<dom-key>": { original, value, updatedAt } } }`.

Regression tests:

```bash
npm run verify:editor           # 36 checks — schema, validation, rejection reasons, partial publish, auth, overview, reset, audit log
npm run verify:editor:browser   # 31 checks — real Chrome: draft survival, publish feedback, CMS-driven text, visitor view
```

`verify:editor:browser` env: `SB_BASE` (default `http://127.0.0.1:5273`), `SB_EMAIL`, `SB_PASSWORD`, `CHROME_PATH`.
