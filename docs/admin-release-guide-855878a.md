# American FutureTech — Naye Changes ka Admin Guide (Release 855878a)

**Kis ke liye:** AFT team / Super Admin — sab kuch admin panel se, bina developer, bina code.
**Kya cover karta hai:** is release me jo 3 cheezein add/change hui hain — (1) lesson notes ab formatted (markdown) dikhte hain, (2) module numbering automatic 01, 02, 03…, (3) naye domain wale contact emails + phone. Saath me: admin se kya-kya control hota hai aur 2-minute verification checklist.

> Detail manual pehle se maujood hai: `lms-admin-handbook.md` (poora Academy / LMS) aur `CLIENT-GUIDE.md` (poora platform). Yeh doc sirf **is release ke naye changes** par focus karta hai.

---

## 1. Ek line me: kya add hua aur admin se kya control hota hai

| # | Kya change hua | Student/visitor ko kahan dikhta hai | Admin se kya control hota hai |
|---|---|---|---|
| 1 | Lesson notes ab **formatted** dikhte hain (headings, bold, lists — markdown). Pehle `###`, `**` waise ke waise dikh jaate the. | Student login → course → lesson → **“Lesson Overview & Notes”** tab | **Academy / LMS → Curriculum Builder** → course → module → lesson → **“Lesson notes”** field |
| 2 | Player me module numbering ab **position se** — Module 01, 02, 03… lagataar. Pehle stored number ki wajah se `Module 02, 03, 05` jaise gaps dikh sakte the. | Student player ke left sidebar me module headers | Module ka **order/sequence** usi Curriculum Builder me set hota hai — jo pehla module, wahi **Module 01**. Kuch extra set karne ki zaroorat nahi. |
| 3 | Naye domain wale **emails + phone**: `info@americanfuturetechllc.com`, `support@americanfuturetechllc.com`, `+1 (660) 310-8528`. Purana `americantechgloballlc.com` / `816-6717` fallback se hata diya. | Footer, contact/checkout pages, payment screen, AI chatbox ke jawab, system alert emails | **Settings & Audit Log** (contact email/phone) + **Footer CMS** (footer ke dono emails) + **Website Editor** (page-level override) + Render env `NOTIFICATION_EMAIL` (system alerts) |

---

## 2. Lesson notes — ab markdown chalta hai

### Kahan likhein
**Sidebar → Academy / LMS → Curriculum Builder → course chuno → module kholo → lesson → “Lesson notes” field → Save.**

Field ke neeche hint bhi ab markdown batata hai: *“Blank lines start a new paragraph. Markdown works too: ### headings, **bold**, - bullets, 1. lists, [links](https://…)…”*.

### Kya-kya likh sakte hain

| Aap likhte hain | Student ko dikhta hai |
|---|---|
| `### Overview: Python Setup` | Badi heading (hash marks nahi dikhte) |
| `**Important**` | **Important** (bold) |
| `*note*` | *note* (italic) |
| `` `npm start` `` | `npm start` (code style) |
| `- point ek` (nayi line pe `- point do`) | Bullet list |
| `1. step ek` (nayi line pe `2. step do`) | Numbered list |
| `> Tip: …` | Quote block |
| `---` | Divider line |
| `[Stripe docs](https://stripe.com/docs)` | Clickable link |

**Rules (2 zaroori baatein):**
1. `###` ke baad **space** zaroor ho — `### Heading`. `###Heading` heading nahi banega.
2. **Blank line** = naya paragraph. Ek hi line ke andar Enter se sirf wrap hota hai (ek hi paragraph rehta hai).

### Purane notes ka kya hua
Jo `###` aapne pehle type kar diya tha, woh **ab heading ban ke** dikhega — hash marks nahi dikhenge. Kuch dobara likhne ki zaroorat nahi. Notes sirf **student lesson player** me render hote hain; admin editor me raw text hi dikhega (jaisa aap type karte hain).

---

## 3. Module numbering — ab automatic lagataar

- **Pehle:** player me module ka stored number print hota tha. Curriculum edit (module add/delete/reorder) ke baad woh number skip kar sakta tha → student ko `Module 02, 03, 05` jaisa broken lagta tha.
- **Ab:** player har module ko uski **order position** se number karta hai — pehla module **Module 01**, doosra **Module 02**, aur aakhri tak lagataar. Student ko hamesha clean sequence dikhegi.
- **Aapko kya karna hai:** kuch nahi. Curriculum Builder me modules ka jo order hai, wahi numbering banegi. Order badla → student ko nayi numbering turant dikhegi.
- **Note:** yeh fix **student player** ka hai. Admin panel me module ka stored number jaisa hai waisa hi dikh sakta hai — student ko hamesha position wali clean numbering dikhti hai.

---

## 4. Naye contact emails + phone

**Naye values:**

| Kaam | Naya value |
|---|---|
| General enquiries | `info@americanfuturetechllc.com` |
| Support / help | `support@americanfuturetechllc.com` |
| Phone | `+1 (660) 310-8528` |

### Kahan se badlein (priority ke saath)

1. **Page pe jo dikh raha hai wahi sabse upar hai — Website Editor.**
   **Sidebar → Website Editor (Text & Images)** → page chuno → **Edit on site** → text par click → naya text → **Stage change** → **Publish**.
   Agar kisi page pe aapne pehle purana email/phone set kiya hua hai, wohi dikhega — usay yahin update karein.
2. **Global defaults — Settings & Audit Log.**
   **Sidebar → Settings & Audit Log** → **contact email** aur **contact phone** → Save. Yeh poore site ke fallback (footer, contact page, checkout, payment screen, AI chatbox) me use hote hain.
3. **Footer ke dono emails — Footer CMS.**
   **Sidebar → Footer CMS** → **Contact emails** list → dono entries update/order set karein → Save.
4. **System alert emails (developer/one-time).**
   Lead notification aur payment alert admin ke `NOTIFICATION_EMAIL` par jaate hain. Yeh **Render Dashboard → Environment** se set hota hai. Agar woh set na ho, to code ka naya default `info@americanfuturetechllc.com` use hota hai.

**Purana domain ab code ke kisi fallback me nahi hai** — kahin `americantechgloballlc.com` ya `816-6717` dikhe to woh Website Editor ya Settings/Footer ka data hai, usay uper ke tareeke se update karein.

---

## 5. 2-minute verification checklist

1. **Admin → Academy / LMS → Curriculum Builder** → koi lesson kholo → notes me likho:
   ```
   ### Test Heading
   **bold line** aur - bullet

   Naya paragraph yahan.
   ```
   → Save.
2. **Student login** (student account se) → wahi course → wahi lesson → **“Lesson Overview & Notes”**:
   - heading badi/bold dikhe, `###` na dikhe
   - bold line bold dikhe, bullet bullet hi rahe
3. Left sidebar me modules **Module 01, 02, 03…** lagataar dikhein — koi gap nahi.
4. Website ka footer kholo → **info@ / support@americanfuturetechllc.com** aur **+1 (660) 310-8528** dikhe.
5. Kahin purana domain/phone dikhe? → **Website Editor** → us page ka override update karein (ya Settings/Footer CMS).

---

## 6. Technical reference (developer ke liye)

- **Commit:** `855878a` — Vercel (site) + Render (API) dono isi par live hain.
- **Files:** `client/src/lms/LessonNotes.jsx` (naya markdown renderer), `client/src/lms/LessonPlayer.jsx` (player + position numbering), `client/src/admin/lms/LessonEditor.jsx` (notes hint), `server/models/SiteSettings.js`, `server/utils/emailService.js`, `server/utils/seeder.js`, `client/src/hooks/useCompanyInfo.js`, `client/src/admin/FooterManager.jsx`, `client/src/admin/SettingsCMS.jsx`, `client/src/data/legalPolicies.js`, `client/src/components/AIChatbox.jsx`, `client/src/lms/StudentPayments.jsx`, `.env.example`.
- **Markdown support:** `#`–`####` headings, `**bold**`, `*italic*`, `` `code` ``, `[links](url)`, `-`/`*` bullets, `1.` lists, `>` quotes, `---` rules. Koi nayi library add nahi hui — renderer dependency-free hai.
- **Post-release verification (live):** `verify:live` 116/116, `verify:deploy` 17/17, `audit:a11y` 48/48, live lesson-render check 10/10. Detail: `scratch/post-release-verification-855878a.md`.
