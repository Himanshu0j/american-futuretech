# American FutureTech — Complete Platform Guide

**Ye ek hi document hai. Ismein sab kuch hai** — links, logins, poore admin panel ki list (kya-kya badal sakte hain),
Website Editor ka tarika, Academy / LMS, aur saaf-saaf **kya kaam karta hai aur kya nahi**.

> **Ye document kis ke liye hai:** AFT team (Super Admin / staff) ke liye — jisse aapko developer se kuch poochna na pade.
> Har cheez khud kar sakte hain, bina code, bina developer.

---

## 0. 60-second quick start

1. **Admin login:** https://american-futuretech.vercel.app/admin/login
2. **Website ka text/image badalna hai** → sidebar → **Website Editor (Text & Images)** → page chuno → **Edit on site**
   → text par click → naya text likho → **Stage change** → **Publish**. Bas, turant sabhi visitors ko dikh jayega.
3. **Course / video / quiz / student** → sidebar → **Academy / LMS** group.
4. **Naya staff account** → sidebar → **Staff & Security RBAC**.
5. Kuch bhi samajh na aaye → sidebar → **How to Use Admin** (`/admin/guide`) — poora manual website ke andar hi hai.

---

## 1. Live links

| Kya | Link |
|---|---|
| **Website (Home)** | https://american-futuretech.vercel.app |
| All Courses | https://american-futuretech.vercel.app/courses |
| Careers / Job Board | https://american-futuretech.vercel.app/jobs |
| Blog | https://american-futuretech.vercel.app/blog |
| FAQs | https://american-futuretech.vercel.app/faq |
| Contact | https://american-futuretech.vercel.app/contact |
| **Student Login** | https://american-futuretech.vercel.app/student/login |
| Student Register | https://american-futuretech.vercel.app/student/register |
| **Admin Login** | https://american-futuretech.vercel.app/admin/login |
| Admin in-app manual | https://american-futuretech.vercel.app/admin/guide |
| **Certificate Verification (public)** | https://american-futuretech.vercel.app/certificate/&lt;certificate-id&gt; |
| Server health check | https://american-futuretech-api.onrender.com/api/health |
| Source code (private repo) | https://github.com/Himanshu0j/american-futuretech |

**Certificate demo:** https://american-futuretech.vercel.app/certificate/AFT-CERT-AI9821
(koi bhi certificate number isi page par daal ke verify kar sakta hai — sirf naam aur photo dikhta hai, email nahi.)

> **Version:** Website + Admin Console + Academy/LMS live hain. Website Editor ke do bade fixes is handover wali
> release mein hain — yaani text/image save na hone wali dono problem ab **solve** hain.

---

## 2. Logins

| Role | Email | Login page | Kya kar sakta hai |
|---|---|---|---|
| **Super Admin** | admin@americanfuturetech.com | `/admin/login` | Sab kuch — settings, staff, LMS, payments, sab |
| Counselor | counselor@americanfuturetech.com | `/admin/login` | Leads + enrollments + students (RBAC se control hota hai) |
| Student (demo) | student@americanfuturetech.com | `/student/login` | Student portal — courses, videos, quizzes, certificate |

🔑 **Passwords** is document ke saath di gayi **sealed credential sheet** (`credentials.local.md`) mein hain —
plaintext password email/WhatsApp par **na** bhejein. Password manager link ya alag secure message better hai.
Pehli login ke baad password change karna recommended hai.

---

## 3. Website Editor — koi bhi text ya image badlein

Website ka **koi bhi lafz** ya **koi bhi image** — Home, Courses, About, Careers, Success Stories, Blog, FAQ, Contact,
Checkout, Privacy, Refund, Cookie, Terms ke pages par.

### 3.1 Kaise kholein

| Tareeka | Kaise |
|---|---|
| **Admin panel se (recommended)** | Sidebar → **Website Editor (Text & Images)** → page chuno → **Edit on site** |
| **Seedha page par** | Jis page ko badalna hai uske address ke aage `?edit=1` laga dein — e.g. `yoursite.com/courses?edit=1` |

Editor **sirf signed-in admin** ko dikhta hai. Aam visitor ko sirf aapke kiye hue changes dikhte hain — editor nahi.

### 3.2 Badalne ka tarika (5 steps)

1. Page khulte hi jo badla ja sakta hai uspar **halki indigo outline** aa jati hai.
2. Us text ya image par **click** karein.
3. Naya text likhein (ya image ka URL paste karein) → **Stage change**.
4. Panel ke neeche **Publish** dabayein.
5. Ho gaya — change **turant sabhi visitors** ko dikhne lagta hai.

### 3.3 Panel mein kya-kya hai

| Cheez | Matlab |
|---|---|
| **Editing page** dropdown | Kisi bhi page par seedha jump |
| **Search box** | Us page ka koi bhi lafz dhoondein (kitne texts hain wo bhi dikhta hai) |
| **LIVE / DRAFT badge** | Kitne changes publish ho chuke hain, kitne sirf draft hain |
| **DRAFT** | Aapka change abhi sirf aapko dikh raha hai — **Publish** dabana baaki hai |
| **Publish (n)** | n changes ko live karta hai. Har baar saaf jawab deta hai |
| **Discard** | Us page ke draft hata deta hai (kuch publish nahi hota) |
| **Revert** (ek element) | Sirf usi text/image ka original wapas |
| **Reset** (poore page par) | Us page ke saare changes hata kar original content |

### 3.4 Zaroori baatein (ye pehle padh lein)

1. **Draft aapka kaam bachata hai.** Change karne ke baad agar aap **Publish na karein
   aur page refresh kar dein, page chhor dein, ya dusre page par jaayein** — to bhi aapka draft
   **wapas mil jayega**. "Restored n unsaved draft change(s)" ka message aata hai, aur Badge par `n draft` dikhta hai.
   **Draft tab tak live nahi hota jab tak Publish na dabayein.**
2. **Publish hamesha jawab deta hai** — kitne change live hue, ya kaun sa change reject hua **aur kyun**.
   Koi chup-chaap fail nahi hota.
3. **Draft us browser/tab mein rehta hai** (jaan-bujh kar). Browser band karne par un-published draft chala jata hai.
   **Published change hamesha database mein rehta hai** aur sabko dikhta hai.
4. **Bade change ke liye:** ek hi text ko bahut lamba na karein (limit **600 characters** per element).
   Limit se bada hone par editor **Publish se pehle** hi warning de deta hai — kis element par kya problem hai, naam ke saath.
5. **Image ke liye external `https://` URL best hai** (apni hosting / Drive / koi bhi public link).
   Editor se file upload bhi kar sakte hain, par wo file server ke temporary disk par jati hai aur
   redeploy ke baad gayab ho sakti hai — isliye permanent image ke liye URL use karein.
6. **Hero headline / sub-headline jaisi wording** Settings CMS se bhi badalti hai. **Website Editor ka change upar
   rehta hai** (baad mein apply hota hai). Confusion se bachne ke liye ek hi jagah se badlein — best hai
   **Website Editor** use karna, kyunki wahin turant result dikh jata hai.

### 3.5 Kaun sa content kahan se badalta hai

| Content | Kahan se badlein |
|---|---|
| Headings, buttons, labels, banners, footer text, koi bhi image | **Website Editor** (ye document) |
| Course title, fees, duration, syllabus, capstone | **Curriculum & Courses CMS** (`/admin/courses`) |
| Lesson video, notes, PDF, resources | **Curriculum Builder → Lesson Editor** (`/admin/lms/curriculum`) |
| Job postings | **Partner Job Board** (`/admin/jobs`) |
| Blog, FAQs, Testimonials, Success Stories | **Content & FAQs CMS** (`/admin/content`) |
| Footer ke links / columns | **Footer CMS** (`/admin/footer`) |
| Site name, tagline, contact, social links, SEO, hero, CTAs | **Settings & Audit Log** (`/admin/settings`) |

---

## 4. Poora admin panel — kya-kya badal sakte hain

| # | Module | Aap kya-kya kar sakte hain | Link |
|---|---|---|---|
| 1 | **Executive Dashboard** | Leads, students, revenue, course-wise numbers ek jagah | `/admin/dashboard` |
| 2 | **Admissions Pipeline** | Enquiry aaye → status, follow-up notes, assignment | `/admin/leads` |
| 3 | **Curriculum & Courses CMS** | Course banao/edit karo, fees, duration, syllabus, capstone, publish | `/admin/courses` |
| 4 | **Batches & Urgency** | Batch dates, seats, timing (Super Admin) | `/admin/batches` |
| 5 | **Enrolled Students** | Student list, add/edit, status, batch | `/admin/students` |
| 6 | **LMS Overview** | Kitne courses/lessons/students/certificates, pending kaam | `/admin/lms` |
| 7 | **Curriculum Builder** | Module + lesson banao, drag & drop se order, duplicate, Draft/Published | `/admin/lms/curriculum` |
| 8 | **Lesson Editor** | **Video link + live preview**, notes, PDF link, resources, duration, free-preview | Curriculum Builder se khulta hai |
| 9 | **Assessments & Quizzes** | Quiz banao, questions + options, correct answer, passing score, time limit | `/admin/lms/quizzes` |
| 10 | **Enrollments & Access** | Student ko course mein enroll / hatao — **yahi decide karta hai kaun kaunsa course dekh sakta hai** | `/admin/lms/enrollments` |
| 11 | **Progress & Completion** | Kis student ne kitna % kiya, lesson-wise status, progress reset/override | `/admin/lms/progress` |
| 12 | **Certificates** | Eligible list, **issue / revoke / reinstate**, number se verify | `/admin/lms/certificates` |
| 13 | **Communications** | Announcement bhejein — All Students / ek Course / ek Batch; pin karein | `/admin/lms/communications` |
| 14 | **LMS Settings** | Welcome message, lesson preview on/off, quiz defaults, certificate wording | `/admin/lms/settings` |
| 15 | **Tuition & Billing Ledger** | Payment records, reconciliation | `/admin/payments` |
| 16 | **Coupons & Promotions** | Discount coupon banao / band karo | `/admin/coupons` |
| 17 | **Partner Job Board** | Job posting, applications | `/admin/jobs` |
| 18 | **Content & FAQs CMS** | Blog, FAQs, testimonials, success stories | `/admin/content` |
| 19 | **Footer CMS** | Footer ke links aur columns | `/admin/footer` |
| 20 | **Student Support Desk** | Student ticket → reply, status | `/admin/support` |
| 21 | **Website Editor** | Koi bhi text/image, page-wise | `/admin/website-editor` |
| 22 | **Settings & Audit Log** | Site name, tagline, contact, social, SEO, hero, CTAs, audit log | `/admin/settings` |
| 23 | **Staff & Security RBAC** | Staff account banao aur decide karo kis module ka access mile | `/admin/users` |
| 24 | **How to Use Admin** | Website ke andar hi poora Hinglish manual | `/admin/guide` |

---

## 5. Academy / LMS — student portal aapke haath mein

Pehle LMS update karne ke liye developer chahiye tha. **Ab nahi.** Sidebar mein **Academy / LMS** group hai (upar table 6–14).

### 5.1 Student ko kya dikhta hai

`/student/login` → Dashboard (aapka welcome message + **Notice Board** jisme sirf relevant announcements)
→ **My Courses** → lesson player (video + notes + PDF + resources) → quiz → pass hone par **certificate**,
jise koi bhi public page par verify kar sakta hai.

### 5.2 Video / notes kaise add karein

- YouTube / Vimeo ka **normal link paste** karein — jaise `https://www.youtube.com/watch?v=XXXXXXXXXXX`
  ya `https://youtu.be/XXXXXXXXXXX`.
- System khud **embed** link bana deta hai aur **live preview** dikha deta hai — Save se pehle dekh sakte hain
  ki video chal rahi hai ya nahi.
- Sirf **https** link chalega (http reject hota hai) aur galat link par saaf error message aata hai.
- PDF / notes ke liye public **https link** daalein (Google Drive, Dropbox, ya apni hosting).

### 5.3 Kis student ko kaunsa course ka video dikhega

- **Enrollments & Access** (`/admin/lms/enrollments`) hi decide karta hai.
- Jo student enroll nahi hai, wo us course ka video khol nahi sakta (server 403 `NOT_ENROLLED` deta hai) —
  yaani paid/free content apne aap protected hai.
- Lesson par **Free Preview** on kar dein to wo lesson bina enroll bhi dikh sakta hai (LMS Settings se control).
- **Draft** lessons student ko dikhte hi nahi — sirf **Published** lessons dikhte hain.

### 5.4 Live class ke bare mein (important)

Is phase mein **live class scheduler nahi hai**. Live class ke liye:
- **Communications** se announcement bhejein (audience: All Students / ek Course / ek Batch, aur **pin** kar dein
  jisse notice board par upar rahe), aur
- usi lesson mein **video link** ki jagah live class ka join link (Zoom / Meet) daal dein.
Client ko live class ka poora scheduler chahiye to ye next phase ka kaam hai — bata dein, add kar dunga.

---

## 6. Kya kaam karta hai / kya nahi (saaf-saaf)

### ✅ Kaam karta hai

| Cheez | Detail |
|---|---|
| Website ka koi bhi text/image | Website Editor se, turant live |
| Course, batch, student, lead, coupon, job, blog, FAQ, footer, settings | Poora admin se |
| LMS — modules, lessons, video links, notes, PDF links, quizzes, enrollments, progress, certificates, announcements, settings | Poora admin se |
| Certificate public verification | Number se, bina login; sirf naam + photo (email private) |
| Draft vs Live control | Lesson aur course dono ka |
| Staff permissions (RBAC) | Kaun kaunsa module dekh sakta hai |
| Audit log | Kis admin ne kya badla — Settings ke andar record |
| Lead form validation | Galat/adhoora data server par reject hota hai aur clean error milta hai |

### ⛔ Abhi nahi hai (aur uska kaam ka tareeka)

| Cheez | Abhi kya karein |
|---|---|
| **Video / PDF file upload** (server storage chahiye) | YouTube / Vimeo / Drive ka **https link** use karein — student ko wahi player milta hai |
| **Website Editor se image upload ka permanent hona** | Image ka **external https URL** use karein (upload temp disk par jata hai) |
| **Online card payment (Stripe)** — keys set nahi hain | Abhi checkout "manual admissions enquiry" par jata hai; payment admin manually mark karta hai. Keys mil jayein to 1 din ka kaam |
| **Live class scheduler** | Communications se announcement + lesson mein join link |
| **Automatic emails** (lead confirmation, certificate issued, password reset) | Server par SMTP username/password set hone par hi email jayega. Record sab admin panel mein banta rehta hai. Set nahi hai to bata dein, kar dunga |
| **Assignments + grading** | Next phase ka kaam |
| **Batches** module abhi sirf Super Admin edit kar sakta hai | Chahiye to Counselor ko bhi de sakta hoon |

### ℹ️ Chhoti limits (non-blocking)

- Ek text element **600 characters** tak. Isse bada hone par Publish se **pehle** saaf warning aa jati hai.
- Bahut deep/generic element ka technical limit **90 characters** ka hota hai — editor ise
  **"TOO LONG TO SAVE"** badge se pehle hi dikha deta hai, chup-chaap fail nahi karta.
- **28 purane pages par accessibility advisories** (heading order / region landmarks) — screen reader par
  kaam karta hai, non-blocking. Chahein to next round mein clean kar dunga.

---

## 7. Testing — kitna aur kaise test hua

Sirf "chal raha hai" nahi — **automated test suites** asli server aur asli database par chalti hain.

| Test Suite | Checks | Result |
|---|---|---|
| RBAC / Staff permissions | 135 | ✅ 135/135 |
| Academy / LMS Control Centre | 110 | ✅ 110/110 |
| Security hardening | 91 | ✅ 91/91 |
| Admin CRUD (har admin section ka save) | 77 | ✅ 77/77 |
| Jobs & Careers | 55 | ✅ 55/55 |
| Authentication (login / lockout / sessions) | 49 | ✅ 49/49 |
| Students | 42 | ✅ 42/42 |
| Coupons | 40 | ✅ 40/40 |
| Payments | 36 | ✅ 36/36 |
| **Website Editor** | 36 | ✅ 36/36 |
| Analytics | 31 | ✅ 31/31 |
| Content CMS | 30 | ✅ 30/30 |
| Credentials / password rotation | 10 | ✅ 10/10 |
| **TOTAL** | **742** | ✅ **742 / 742** |
| **Website Editor — real browser regression** | 31 | ✅ 31/31 |

Iske alawa:

- **Accessibility audit — 46 pages: 46 clean, 0 failing** (WCAG checks, poore admin console aur LMS pages, zero console errors).
- **Live browser sweep — 468 page loads, 52 routes, 0 issues** (mobile 320px se le kar desktop 1920px tak 9 widths).
- **Admin ↔ Database audit — 169 database fields, 32 admin files: 0 dead field**
  (jo field admin form mein dikhta hai wo sach mein save hota hai — koi "save kiya, update nahi hua" wala silent bug nahi).
- **Real-device browser proof for the Website Editor:** ek change stage karo → page refresh karo → doosre page par jao
  aur wapas aao → Publish → visitor ka reload — sab step-by-step browser mein verify kiya gaya.

### Testing mein pakde aur fix kiye gaye asli bugs

1. **Website Editor: draft chala jata tha** — change karke publish karne se pehle page refresh / navigate karne par
   aapka staged change gayab ho jata tha aur **Publish button bekaar** ho jata tha. Ab draft **per page safe** rehta hai
   aur Publish **hamesha** jawab deta hai.
2. **Website Editor: CMS wala text save hone ke baad bhi nahi dikhta tha** — Homepage ka headline
   ("Master Applied Emerging Tech…") Settings se aata hai, aur editor purani (coded) wording ko "original" maan leeta tha,
   jisse publish hone ke baad bhi change **visitors ko nahi dikhta tha**. Ab editor **screen par jo dikh raha hai** usi ko
   original maanta hai, aur published change render hota hi hai.
3. **Lessons delete ho rahe the** — course update karne par jinke lessons ka content bhara hua tha wo background mein
   delete ho jate the. Ab content/quiz wale lesson delete nahi hote.
4. **Student ka email public ho raha tha** — certificate verify page par email dikh raha tha. Ab sirf naam + photo.
5. **Jhoothe resources dikh rahe the** — jis lesson mein material nahi tha usme dummy "Lab Resources" aata tha. Ab
   saaf "abhi koi material nahi" dikhta hai.

---

## 8. Pehli baar setup karne ka order (recommended)

1. **LMS Settings** — welcome message + certificate wording apne hisaab se.
2. **Curriculum Builder** — course structure (module → lesson), video links paste karein, Draft/Published set karein.
3. **Assessments** — quiz + passing score.
4. **Enrollments** — students ko course mein enroll karein.
5. **Communications** — welcome / orientation announcement bhejein.
6. **Website Editor** — homepage aur baaki pages ki wording / images apne hisaab se.
7. **Staff & Security RBAC** — team ke accounts + permissions.

---

## 9. Security notes

- **Passwords plaintext email/WhatsApp par na bhejein** — sealed sheet ya password manager link use karein.
- Har staff ka **apna account** banayein (shared login na karein) — audit log mein kiske naam se kya badla, wo record hota hai.
- **Certificate verify page** sirf naam + photo dikhata hai — email/phone jaisi personal detail public nahi hoti.
- Payment gateway ke secret keys **encrypted** store hote hain aur kabhi wapas browser par nahi bheje jaate.
- Galat password par account **temporarily lock** ho jata hai (brute-force protection).

---

## 10. Is handover mein kaun-kaun si file hai

| File | Kya hai |
|---|---|
| **`docs/CLIENT-GUIDE.md`** | **Yehi document** — poora platform guide |
| `credentials.local.md` | **Sealed login sheet** (sirf aapke paas / client ko secure tarike se bhejein) |
| `docs/lms-admin-handbook.md` | LMS ke saare pages ka Hinglish step-by-step handbook |
| `/admin/guide` (website ke andar) | Admin console ka in-app manual |
| `docs/website-editor.md` | Website Editor ka detailed manual |
| `docs/security.md` | Roles + permissions + security decisions |
| `docs/payments.md` | Payment / Stripe setup |
| `docs/data-persistence.md` | Database aur data safe rakhne ke rules |

---

## 11. Aage kya ho sakta hai (next phase options)

Agar chahiye to ye add ho sakta hai — bata dein:

- Video / PDF / assignment **direct upload** (permanent storage ke saath)
- **Live class scheduler** (batch-wise class list, reminder, join link eke jagah)
- **Assignments + grading** (submission, marks, feedback)
- **Student-wise analytics** (kaun kitna active, kis lesson par atak raha hai)
- **WhatsApp / email automation** (lead confirmation, certificate issued, fee reminder)
- **Stripe live keys** → online card payment turant chalu
- Purane pages ki **28 accessibility advisories** clean karna

---

Koi bhi cheez samajh na aaye, kuch aur chahiye, ya kuch galat lage — seedha bata dein. Dhanyavaad! 🙏
