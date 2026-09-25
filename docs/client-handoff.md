# American FutureTech — Handover cover note

**Client ko bhejne wala poora document: [`docs/CLIENT-GUIDE.md`](./CLIENT-GUIDE.md)**

Us ek file mein sab kuch hai — live links, logins, poore admin panel ki list (module-wise kya badal sakte hain),
Website Editor ka step-by-step tarika, Academy / LMS, aur **kya kaam karta hai / kya nahi**. Isliye is note ko
alag se bhejne ki zaroorat nahi — sirf `CLIENT-GUIDE.md` bhejein.

---

## Bhejne se pehle (developer checklist — ye section client ko na bhejein)

1. **Deploy ho gaya ho:** `git push` ke baad Render + Vercel auto-deploy (~5 minute). Confirm karein:
   - https://american-futuretech-api.onrender.com/api/health → 200
   - https://american-futuretech.vercel.app/admin/login → khulta ho
2. **Password:** `docs/credentials.local.md` (git-ignored) mein teen logins ki email + password column bhar lein
   (values repo root ki `admin-credentials.local` se lein), phir client ko **secure channel** se bhejein.
   Plaintext password email/WhatsApp par na bhejein.
3. **Stripe:** production mein keys set nahi hain → checkout manual admissions enquiry par jata hai.
   Ye `CLIENT-GUIDE.md` ke section 6 mein saaf likha hai, client ko pehle se pata rahega.
4. **SMTP:** emails tabhi jayenge jab server par `SMTP_USER` / `SMTP_PASS` set hon — nahi set hain to
   `CLIENT-GUIDE.md` ka wahi point confirm kar lein.
5. **Numbers refresh karna ho** to: `npm run verify:rbac`, `verify:security`, `verify:admin`, `verify:jobs`,
   `verify:auth`, `verify:students`, `verify:coupons`, `verify:payments`, `verify:editor`, `verify:analytics`,
   `verify:cms`, `verify:credentials`, `verify:lms`, `verify:editor:browser`.

---

## Is handover mein kaun-kaun si file hai

| File | Kya hai |
|---|---|
| **`docs/CLIENT-GUIDE.md`** | **Client ko bhejne wala poora document** |
| `docs/credentials.local.md` | Sealed login sheet (git-ignored — sirf aapke paas) |
| `docs/lms-admin-handbook.md` | LMS ke saare pages ka Hinglish step-by-step handbook |
| `docs/website-editor.md` | Website Editor ka detailed technical manual |
| `docs/security.md` | Roles + permissions + security decisions |
| `docs/payments.md` | Payment / Stripe setup |
| `docs/data-persistence.md` | Database aur data safe rakhne ke rules |
| `/admin/guide` (website ke andar) | Admin console ka in-app manual |
