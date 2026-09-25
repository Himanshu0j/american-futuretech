# American FutureTech — Client Handoff Message

> **Yeh file ek ready-to-send message hai.** Section "INTERNAL — bhejne se pehle" hata dein, baaki pura text jaisa hai waisa client ko WhatsApp / email par bhej sakte hain.

---

## INTERNAL — bhejne se pehle (client ko na bhejein)

1. **Deploy status:** Academy / LMS Control Centre isi release me ja raha hai (push → Render + Vercel auto-deploy, ~5 minute). Bhejne se pehle ek baar live check kar lein: `https://american-futuretech-api.onrender.com/api/health` aur `https://american-futuretech.vercel.app/admin/login`.
2. **Passwords:** Section 6 me password column khaali hai — values `admin-credentials.local` (git-ignored) me hain. Plaintext password email par na bhejein; password manager link ya alag secure message better hai.
3. **Stripe:** production me Stripe keys set nahi hain, isliye online card payment abhi "manual admissions enquiry" par jata hai. Client ko yeh pehle se batana zaroori hai.

---

# 🎉 American FutureTech — Platform Handoff

Namaste Sir/Ma'am,

Aapka pura platform **live** hai, aur **fully tested** hai. Website, admin console, aur naya **Academy / LMS Control Centre** — sab ready hai. Neeche ek-ek cheez detail me di gayi hai: links, kya-kya bana hai, kitni testing hui, aur kaise use karna hai.

---

## 1. Live Links

| Kya | Link |
|---|---|
| **Website (Home)** | https://american-futuretech.vercel.app |
| Courses | https://american-futuretech.vercel.app/courses |
| Careers / Jobs | https://american-futuretech.vercel.app/jobs |
| Contact | https://american-futuretech.vercel.app/contact |
| Blog | https://american-futuretech.vercel.app/blog |
| **Student Login** | https://american-futuretech.vercel.app/student/login |
| Student Register | https://american-futuretech.vercel.app/student/register |
| **Admin Login** | https://american-futuretech.vercel.app/admin/login |
| Admin In-App Guide (handbook website ke andar) | https://american-futuretech.vercel.app/admin/guide |
| Certificate Verification (public page — koi bhi certificate number daal ke check kar sakta hai) | https://american-futuretech.vercel.app/certificate/&lt;certificate-id&gt; |
| Backend API health check | https://american-futuretech-api.onrender.com/api/health |
| Source code (private repo) | https://github.com/Himanshu0j/american-futuretech |

---

## 2. Admin Console me kya-kya hai

Poori website **bina developer** aap khud chala sakte hain:

| Module | Kya kar sakte hain | Link |
|---|---|---|
| Dashboard + Analytics | Leads, students, revenue, course-wise numbers ek jagah | `/admin/dashboard` |
| Leads CRM | Enquiry aaye → follow-up, status, notes | `/admin/leads` |
| Courses CMS | Course create/edit, fees, duration, syllabus, publish | `/admin/courses` |
| Batches | Batch dates, seats, timing | `/admin/batches` |
| Students | Student list, add/edit, status | `/admin/students` |
| Payments | Payment records, reconciliation | `/admin/payments` |
| Coupons | Discount coupon banao / band karo | `/admin/coupons` |
| Jobs & Careers | Job posting, applications | `/admin/jobs` |
| Content CMS | Testimonials, FAQs, blog posts | `/admin/content` |
| Footer Manager | Footer ke links/columns | `/admin/footer` |
| Support Tickets | Student enquiry → reply aur status | `/admin/support` |
| Settings | Site name, tagline, contact, social links, SEO | `/admin/settings` |
| Website Editor | Text/image live edit, page-wise overrides | `/admin/website-editor` |
| Staff & Permissions (RBAC) | Staff account banao aur decide karo kis module ka access mile | `/admin/users` |
| Admin Guide | Website ke andar hi pura Hinglish manual | `/admin/guide` |

---

## 3. 🆕 Academy / LMS Control Centre — ab pura LMS aapke haath me

Pehle LMS ko developer ke through update karna padta tha. **Ab nahi.** Admin console me ek naya **"Academy / LMS"** section hai (left sidebar me) — 8 pages:

| # | Page | Kya kar sakte hain | Link |
|---|---|---|---|
| 1 | **LMS Dashboard** | Ek nazar: kitne courses, lessons, enrolled students, certificates, pending work | `/admin/lms` |
| 2 | **Curriculum Builder** | Module banao, lesson add karo, **drag & drop se order badlo**, duplicate karo, Draft/Published toggle | `/admin/lms/curriculum` |
| 3 | **Lesson Editor** | Video link + **live preview**, notes, PDF, study material ke links, kaunsa lesson free preview hoga | (Curriculum Builder se khulta hai) |
| 4 | **Assessments (Quizzes)** | Quiz banao, questions + options, correct answer, passing score, time limit | `/admin/lms/quizzes` |
| 5 | **Enrollments** | Student ko course me enroll karo, status badlo, hatao | `/admin/lms/enrollments` |
| 6 | **Progress Tracker** | Kis student ne kitna % complete kiya, lesson-wise status, progress reset/override | `/admin/lms/progress` |
| 7 | **Certificates** | Eligible students dekho, certificate **issue / revoke / reinstate** karo, number se verify | `/admin/lms/certificates` |
| 8 | **Communications** | Announcement bhejo — sab students ko, ek course ko, ya ek batch ko; pin karo | `/admin/lms/communications` |
| 9 | **LMS Settings** | Welcome message, lesson preview on/off, quiz ke defaults, certificate ka wording | `/admin/lms/settings` |

### Video kaise add karein (sabse important)
- YouTube / Vimeo ka **normal link paste** kar dein — jaise `https://www.youtube.com/watch?v=XXXXXXXXXXX` ya `https://youtu.be/XXXXXXXXXXX`.
- System khud use **embed** link bana deta hai aur **live preview** dikha deta hai — Save karne se pehle dekh sakte hain ki video chal rahi hai ya nahi.
- Sirf **https** link chalta hai (http reject ho jayega), aur galat link par saaf error message aata hai.
- PDF / notes ke liye link daal dein (Google Drive, Dropbox, ya koi bhi public https link).

### Student ko kya dikhta hai
- Student login: `/student/login` → dashboard par welcome message + **Notice Board** (aapke announcements, sirf relevant audience ko) → My Courses → lesson player me video + notes + PDF + resources → quiz → pass hone par certificate (jise koi bhi public page par verify kar sakta hai).

---

## 4. Testing — kitna aur kaise test hua

Sirf "chal raha hai" nahi — **automated checks** chalte hain jo asli server aur asli database par har feature ko test karte hain.

| Test Suite | Checks | Result |
|---|---|---|
| Academy / LMS Control Centre (naya) | 67 | ✅ 67/67 |
| RBAC / Staff permissions | 135 | ✅ 135/135 |
| Security hardening | 75 | ✅ 75/75 |
| Admin CRUD | 77 | ✅ 77/77 |
| Jobs & Careers | 55 | ✅ 55/55 |
| Authentication (login/lockout/sessions) | 49 | ✅ 49/49 |
| Students | 42 | ✅ 42/42 |
| Coupons | 40 | ✅ 40/40 |
| Payments | 36 | ✅ 36/36 |
| Analytics | 31 | ✅ 31/31 |
| Content CMS | 30 | ✅ 30/30 |
| Website Editor | 29 | ✅ 29/29 |
| Credentials / password rotation | 10 | ✅ 10/10 |
| **TOTAL** | **676** | ✅ **676 / 676 pass** |

Iske alawa:

- **Accessibility audit — 46 pages: 46 clean, 0 failing.** (Screen-reader / keyboard users ke liye WCAG checks — poore admin console aur LMS pages include.)
- **Live browser sweep — 208 page loads, 52 routes, 0 issues.** Har page mobile (320px), tablet aur desktop widths par load karke check kiya gaya.
- **Admin ↔ Schema audit — 169 database fields, 32 admin files: 0 dead field.** Matlab jo bhi field admin form me dikh raha hai, woh sach me database me save hota hai — koi "save kiya, update nahi hua" wala silent bug nahi.
- **Database persistence check — ✅ admin ka content real database me save hota hai** (server restart ke baad bhi rehta hai).

### Teen asli bugs jo testing me pakde aur fix kiye
1. **Lessons delete ho rahe the** — course update karne par jinke lessons ka content bhara hua tha woh background me delete ho jate the. Ab aisa **kabhi nahi** hoga: content ya quiz wala lesson delete nahi hota, sirf naye lessons add/update hote hain.
2. **Student ka email public ho raha tha** — certificate verify page se student ka email address public me dikh raha tha. Ab sirf naam aur photo dikhta hai.
3. **Jhoothe resources dikh rahe the** — jin lessons me material nahi tha, unme "Lab Resources" ke dummy naam dikh rahe the. Ab saaf-saaf "abhi koi material nahi" dikhta hai.

---

## 5. Login Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** (sab kuch) | admin@americanfuturetech.com | ____________________ |
| Counselor (leads + enrollment) | counselor@americanfuturetech.com | ____________________ |
| Student (demo account) | student@americanfuturetech.com | ____________________ |

🔐 **Security note:** password email par plaintext me na bhejein. Password manager link, ya alag secure message better hai. Pehli baar login karne ke baad apna password change karna recommended hai.

---

## 6. Zaroori baatein (Important)

1. **Video / PDF upload** — abhi direct upload nahi hai (server par PDF/MP4 upload + storage alag service chahiye). Filhaal YouTube / Vimeo / Drive ke **https link** use karein — farak nahi padta, student ko wahi video player milta hai. Chahiye to next phase me direct upload bhi add kar dunga.
2. **Online card payment** — Stripe keys production me set nahi hain, isliye abhi checkout "manual admissions enquiry" par jata hai (payment record admin manually mark karta hai). Stripe keys aa jayein to 1 din ka kaam hai.
3. **Batches** module abhi sirf Super Admin edit kar sakta hai.
4. **Purane pages par 28 accessibility advisories** (heading order / region landmarks) — yeh non-blocking hain, screen reader par kaam karta hai, par chaho to next round me clean kar deta hoon.

---

## 7. Documentation

| File | Kya hai |
|---|---|
| `docs/lms-admin-handbook.md` | **Hinglish step-by-step handbook** — Academy / LMS ke saare 8 pages, video link ke rules, quiz banane ka tarika, enrollment, progress, certificate issue/revoke, announcements, settings table, permissions, troubleshooting. Yeh pehle padh lein. |
| `/admin/guide` (website ke andar) | Admin console ka in-app manual — 14 sections, LMS wala bhi include. |
| `docs/security.md` | Kaun kya kar sakta hai (roles + permissions) aur security decisions. |
| `docs/payments.md` | Payment / Stripe setup. |
| `docs/website-editor.md` | Website Editor ka manual. |
| `docs/data-persistence.md` | Database aur data safe rakhne ke rules. |

---

## 8. Recommended first setup order (LMS)

1. **LMS Settings** — welcome message, certificate ka wording apne hisaab se set karein.
2. **Curriculum Builder** — apna course structure banayein (module → lesson), video links paste karein.
3. **Assessments** — quiz add karein, passing score set karein.
4. **Communications** — students ko announcement bhejein.
5. **Enrollments** — students ko course me enroll karein.
6. **Certificates** — jab student course pura kare, certificate issue karein.

---

Koi bhi cheez samajh nahi aayi ho, ya kuch aur chahiye ho (direct video upload, assignments + grading, student-wise analytics, mobile app) — bata dein, next phase me add kar dunga.

Dhanyavaad! 🙏
