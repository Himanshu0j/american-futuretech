# Payment Gateway (Stripe) — 3 Step Setup Guide (Hinglish)

Ye guide client ke liye hai: online card payment **khud** chalu karne ke liye. Koi
developer, koi redeploy, koi file edit — sirf admin panel.

> **Jahan kaam karna hai:** Admin → **Settings & Audit Log** → **Payment Gateway** tab
> (seedha link: `/admin/settings?tab=payments`)

---

## Saamagri (Stripe dashboard se — 2 minute)

| Cheez | Kahan milegi | Kaisi dikhti hai |
|---|---|---|
| Publishable key | Stripe → **Developers → API keys** | `pk_live_…` / `pk_test_…` |
| Secret key | wahi page → **Reveal** | `sk_live_…` / `sk_test_…` |
| Signing secret | Stripe → **Developers → Webhooks** → aapka endpoint → **Reveal** | `whsec_…` |

---

## Step 1 — Keys paste karein

1. Admin → Settings → **Payment Gateway** tab kholein.
2. **Publishable key** box mein `pk_…` paste karein.
3. **Secret key** box mein `sk_…` paste karein.
   - LIVE key paste karte hi "Environment / Mode" **apne aap LIVE** ho jayega —
     error ka koi chance nahi. Screen par ek blue notice bhi aayega.
   - TEST key paste karo to mode TEST rahega (real card charge nahi hoga).

> Secret key save hone ke baad dobara **kabhi** nahi dikhti — sirf masked hint
> (`sk_live_…4f2a`). Ye normal hai. Key kho jaaye to Stripe dashboard se nayi
> banao aur dobara paste karo.

## Step 2 — Webhook banayein

Webhook ke bina Stripe paisa to le lega, par student ko **turant access nahi milega**
(enrollment confirmation webhook se aati hai). Isliye ye step chhodna nahi hai.

1. Payment Gateway page par **webhook URL** ka box hai — **Copy URL** dabayein.
2. Stripe → **Developers → Webhooks → Add endpoint**:
   - **Endpoint URL**: page se copy kiya hua URL
     (`https://american-futuretech-api.onrender.com/api/payments/webhook`)
   - **Events**: page par diye gaye **5 events** — "Copy events" se sab copy ho
     jate hain, ya individually select karein:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `checkout.session.expired`
     - `payment_intent.payment_failed`
3. Endpoint ban jaane par Stripe **Signing secret** (`whsec_…`) dikhata hai —
   **Reveal → copy** karke Payment Gateway page ke "Webhook signing secret" box
   mein paste karein.

## Step 3 — Test karein aur Save karein

1. **Test connection** dabayein. Ye server se Stripe ko poochta hai:
   - key sahi hai ya nahi, aur TEST/LIVE kaunsi hai
   - kis Stripe account ki hai (account id + currency)
   - webhook **isi URL** par laga hai ya nahi, aur saare 5 events selected hain ya nahi
2. Sab green ho to **Save Gateway Settings** dabayein. **Save karte hi change turant
   live** ho jata hai — server restart ki zarurat nahi.
3. Page ke top par badge aana chahiye: **Card payments ACTIVE (live mode)**.
4. Phir website ke `/checkout` page par TEST mode mein ek order karein:
   - Card: `4242 4242 4242 4242`
   - Expiry: koi bhi future date · CVC: koi bhi 3 digit
   - Order settle hone par student ka account + enrollment khud ban jayega aur email
     par receipt + login details aa jayengi.

---

## Payment aane ke baad admin mein kya dikhega

Admin → **Tuition & Billing Ledger** (`/admin/payments`):

- nayi row khud ban jaati hai — status **Paid**, invoice number, student ka naam/email/phone
- tier (Seat Deposit / Full Tuition / Personalized), amount, **discount + coupon**
- **Stripe references**: payment id, checkout session, payment method, paid date
- **Invoice** button → printable invoice (browser se Print → Save as PDF)
- **Export CSV** → poori ledger Excel mein (accounts/reconciliation ke liye)

Failed / Expired orders bhi dikhte hain, reason ke sath — paid row kabhi galti se
downgrade nahi hoti.

---

## Webhook health (paisa aaya par access nahi mila?)

Usi **Payment Gateway** page par neeche ek **Webhook health** box hai. Ye batata hai:

- Stripe ne aakhri baar message **kab** bheja, aur usme kya hua (processed / pending / duplicate / unmatched / failed / rejected)
- kitni deliveries **fail** ya **reject** hui (reject = signature match nahi hua, matlab signing secret galat ya koi bahar se endpoint probe kar raha hai)
- **Pending orders older than 30 minutes** — yaani wo orders jinka paisa aaya par humein message nahi mila (delivery lost)

Us list mein row ke saamne **Re-check with Stripe** dabayein:

- Paisa actually aaya tha → order **Paid** ho jata hai, student ka account + enrollment turant active ho jate hain, aur ledger mein bhi Paid dikhta hai.
- Paisa nahi aaya → kuch nahi badalta (koi fake access nahi milta).

Yahi button **Tuition & Billing Ledger** mein bhi Pending row par milta hai. Isliye kisi ko manually Paid mark karne ki zarurat nahi.

> Log sirf routing ki jaankari rakhta hai (event id, kis order ka tha, kya hua) — card ya customer data kabhi store nahi hota.

## Zaroori baatein (yaad rakhein)

1. **Dono secrets zaroori hain.** Sirf secret key se checkout to shuru hoga par
   confirmation nahi aayegi (student ko access nahi milega). Webhook secret ke
   bina badge red rehta hai.
2. **Pehle TEST mode.** Test cards se poora flow dekhein, phir LIVE key paste karein.
3. **Switch off karna ho** to "Enable online card payments" ka checkbox hata dein —
   checkout apne aap "secure payment link" wale admissions form par chala jayega.
   Website kabhi fake "paid" nahi dikhati.
4. **Secrets kabhi kisi ko WhatsApp/email par na bhejein.** Sirf Stripe dashboard aur
   admin panel ke beech paste karein. Panel se key kabhi wapas browser mein nahi aati.
5. Key change/rotate karni ho (Stripe → Roll key) to nayi key dobara paste karke
   Save kar dein — purani key turant band ho jaati hai.

---

## Agar kuch red dikhe (troubleshooting)

| Screen par kya dikha | Iska matlab | Kya karein |
|---|---|---|
| "Missing — secret key or webhook secret" | dono mein se ek save nahi hua | Step 1 aur 2 dobara — Save dabana na bhoolein |
| Test connection: *Invalid API Key* | key galat/adhoori paste hui, ya rolled key purani hai | Stripe se key dobara copy karo (poori `sk_…`, space nahi) |
| Test connection: *No Stripe webhook points at …* | webhook endpoint bana hi nahi, ya URL galat hai | Step 2 dobara — URL exactly copy-paste karein |
| Test connection: *missing N event(s)* | webhook bana hai par events adhoore hain | Stripe → Webhooks → endpoint → Edit → sabhi 5 events tick karke save karein |
| Test connection: *Stripe list skipped (restricted key…)* | key restricted hai, list permission nahi | koi dikkat nahi — charging chalti rahegi; webhook URL Stripe mein manually check kar lein |
| Paisa kat gaya par student ko access nahi mila | webhook secret galat hai / endpoint band hai | Payment Gateway → **Webhook health** dekhein (aakhir mein event aaya bhi ya nahi), phir Pending row par **Re-check with Stripe** dabayein, aur Stripe → Webhooks mein last delivery ka **response** 200 hai ya nahi wo check karein |
| Webhook health mein `rejected` row aa rahi hai | signature match nahi hua — signing secret galat paste hua hai (ya koi endpoint probe kar raha hai) | Stripe → Webhooks → endpoint → Signing secret dobara copy karke panel mein paste karein |
| Delivery `failed` dikh rahi hai | humari taraf handler error hua; Stripe khud retry karega | message column padhein; baar-baar aaye to screenshot ke saath developer ko bhejein |

---

## Developer reference (technical)

| Kaam | Endpoint / file |
|---|---|
| Gateway status + setup checklist | `GET /api/settings/payment-gateway` (booleans + masked hints only) |
| Save keys | `PUT /api/settings/payment-gateway` (encrypted with `utils/secretVault`, mode auto-aligned) |
| Test connection | `POST /api/settings/payment-gateway/test` (calls Stripe; rate-limited) |
| Checkout / webhook | `POST /api/payments/checkout`, `POST /api/payments/webhook` |
| Ledger (admin) | `GET /api/payments` (requires `SETTINGS_VIEW`) |
| Regression suite | `npm run verify:payments` (45 checks) |

Detail: [`docs/payments.md`](payments.md)
