# American FutureTech — Test Domain Testing Guide

**Domain:** https://test.americanfuturetechllc.com
**Status:** Live hai — aapka production ka poora data + Stripe payment gateway dono active hain.
**Date:** 3 October 2026

---

## 0. Sabse pehle ye 3 baatein jaan lijiye

1. **Ye test domain hai, par isme aapka asli production data hai** — courses, lessons, images, students, site settings; sab production ka exact copy hai.
2. **Payment gateway LIVE mode me hai.** Matlab jo card lagayenge uspe **asli charge** hoga. Isliye is guide me sabse pehle **$1 smoke test** diya gaya hai jo turant refund ho jata hai — usse pehle bade amount ka test na karein.
3. **Email abhi test domain pe band hai** (SMTP set nahi hai). Lead confirmation ya credentials ke email nahi aayenge — credentials screen pe hi dikh jate hain. Agar email testing bhi karani hai to bata dijiye, laga dunga.

---

## 1. Admin me login kaise karein

| | |
|---|---|
| URL | https://test.americanfuturetechllc.com/admin/login |
| Email | `admin@americanfuturetech.com` |
| Password | **Wahi jo aap live/production admin me use karte ho** |

> Test domain production ke **same admin account** se chalta hai — to aapka purana password hi chalega.

---

## 2. Gateway ready hai ya nahi — 30 second ka check

1. Login ke baad left sidebar me **Settings & Audit Log** kholiye (`/admin/settings`)
2. Us page ke andar **Payment Gateway** tab pe jaiye
3. Aapko ye dikhna chahiye:
   - Mode: **LIVE**
   - Status: **Ready** ✅
   - Secret key: `sk_live_…` se shuru (poori key kabhi repo me na likhein)
   - Webhook: **configured** ✅

Agar yahan "Ready" ya "Configured" na dikhe, to mujhe turant bataiye — main theek kar dunga.

---

## 3. Smoke test — $1 charge + automatic refund (ye pehle kariye)

Ye poora payment pipeline test karta hai, aur paisa aapke paas rukta nahi.

1. Usi **Payment Gateway** page pe neeche **Smoke Test** panel tak scroll kariye
2. Confirmation box me **exactly** ye likhiye: `charge-and-refund-1`
3. Start / Charge button dabaiye → naya tab khulega **Stripe Checkout** page
4. Apna card daaliye → pay kariye (**$1** charge hoga)
5. Wapas admin page pe aa jaiye — page har 4 second me khud update hota hai aur dikhayega:
   **Paid → Refunded** ✅
   - Agar refund thoda late ho to **"Refund now"** button aa jayega — usse turant refund ho jayega
   - Agar webhook kisi wajah se na aaye, to 5 minute ka watchdog khud refund kar dega + email bhi karega
6. **Verify:** Stripe dashboard → Payments me $1 ka charge aur uska refund dikhna chahiye

**Dhyan rakhiye:**
- Ek smoke test ke baad **10 minute ka cooldown** hai — turant dobara nahi chalega
- Card daalne ke liye **30 minute** ka time milta hai; beech me chhod diya to wo apne aap expire ho jata hai (koi charge nahi)

---

## 4. Asli enrollment flow (customer jaisa end-to-end)

1. Public site kholiye: https://test.americanfuturetechllc.com/courses
2. Koi program kholiye
3. Checkout page pe aapko 4 options milenge:
   - **Seat reserve (refundable deposit):** $99 ya $499 — chhoti amount, seat block ho jati hai
   - **Career Program (full):** $2,499
   - **Personalized 1-on-1 track (full):** $4,499

   > Pehli baar test kar rahe ho to **$99 deposit** hi chuniye — chhoti amount, aur gateway poora test ho jata hai.
4. Apna **naam, email, phone** bhariye
5. Card daaliye → pay kariye
6. Payment hote hi automatically:
   - **Enrollment ban jata hai** (Stripe webhook se confirm)
   - Student ke **login credentials generate** ho jate hain (screen pe ek hi baar dikhte hain)

**Verify karne ke liye:**
- Admin → **Students** me naya student dikhna chahiye
- Admin → **Tuition & Billing Ledger** (`/admin/payments`) me wo payment entry
- Us student credentials se LMS login → assigned course dikhna chahiye

---

## 5. Testing checklist

- [ ] Admin login ho gaya
- [ ] Payment Gateway page: **LIVE + Ready**
- [ ] Smoke test: $1 charge → refund ho gaya
- [ ] Home page aur `/courses` pe aapki images aur content sahi dikh rahe hain
- [ ] Ek program ka real enrollment → student + ledger me entry
- [ ] Naye student se LMS login → course dikh raha hai

---

## 6. Kuch kaam na kare to

| Problem | Solution |
|---|---|
| "Payments not configured" error | Payment Gateway page ka status dekhiye, mujhe batayiye |
| Refund pending | **"Refund now"** button dabaiye |
| Checkout page khula hi nahi | Popup blocker band kariye, ya dobara try kariye (30 min window) |
| Naya smoke test nahi chal raha | 10 minute ka cooldown khatam hone dijiye |
| Student ko email nahi aaya | Expected — test domain pe SMTP band hai, credentials screen pe dikhte hain |
| Koi image ya course missing lagta hai | Mujhe screenshot bhej dijiye, production se dobara sync kar dunga |

---

## 7. Zaroori warning

Test domain pe **asli paisa** move ho sakta hai (LIVE mode). Isliye:

- Sirf **aapke control wala card** use kariye
- Pehle $1 smoke test, uske baad hi bada test
- Bade test ke baad Stripe dashboard me refund manually bhi kar sakte hain

Koi bhi doubt ho to mujhe message kar dijiye — main live dekh ke bata dunga.
