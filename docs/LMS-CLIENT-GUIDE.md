# Academy / LMS — Complete Client Guide

**American FutureTech · Learning Management System**

Ye ek hi document hai jo batata hai: **LMS poora kaise chalta hai, admin side se kaise chalate hain, aur student ko kya-kya dikhta hai.**
Aap (ya aapki team) is document ko padh kar poora LMS khud chala sakte hain — **bina developer, bina code.**

> **Isko kis ke liye diya ja sakta hai:** AFT team (Super Admin / Counselor / Instructor) — aur jo bhi staff LMS ka daily kaam karega.

---

## 0. 60-second summary

LMS 3 hisson me chalta hai:

| # | Hissa | Kaun chalata hai | Kahan |
|---|---|---|---|
| 1 | **Content banane wala** (course → module → lesson/video/notes/resources → quiz) | Admin / Instructor | Admin → **Academy / LMS** → Curriculum Builder + Assessments |
| 2 | **Access dene wala** (student ko course dena, progress, certificate, notice) | Admin / Counselor | Admin → **Academy / LMS** ke baaki pages |
| 3 | **Padhne wala** (video, notes, resources, test, certificate) | Student | `/student/login` portal |

**Ek line me poora flow:**

```
Admin course + module + lesson banata hai
        ↓  (publish)
Admin/Counselor student ka account banata hai
        ↓
Student ko course ENROLL karta hai  →  student ko turant course dikhne lagta hai
        ↓
Student video dekhta hai, notes padhta hai, resources download karta hai
        ↓  har lesson "Mark as Complete"
Student module ka quiz deta hai  →  score turant (pass mark ke saath)
        ↓  jab saare published lessons complete
CERTIFICATE khud-ba-khud ban jata hai  →  /certificate/<ID> par verify ho sakta hai
        ↓
Admin Progress / Certificates / Communications se sab monitor karta hai
```

---

## 1. Links aur logins

| Kya | Link |
|---|---|
| **Admin Login** | https://americanfuturetechllc.com/admin/login |
| Admin → LMS Overview | https://americanfuturetechllc.com/admin/lms |
| Admin → How to Use Admin (in-built manual) | https://americanfuturetechllc.com/admin/guide |
| **Student Login** | https://americanfuturetechllc.com/student/login |
| **Certificate Verification (public, bina login)** | https://americanfuturetechllc.com/certificate/&lt;certificate-id&gt; |
| Server health | https://americanfuturetechllc.com/api/health |

**Local (development) par:** admin `http://localhost:5173/admin/login`, student `http://localhost:5173/student/login`.

> Passwords kabhi email/WhatsApp par plain text me na bhejein — password manager link ya sealed sheet (`docs/credentials.local.md`) use karein.

---

## 2. LMS ka structure (ekdum basic)

Sabse chhoti unit se badi unit tak:

| Level | Kya hota hai | Kahan banate hain |
|---|---|---|
| **Course** | Ek program (jaise “AI Engineering Fellowship”) | Curriculum & Courses CMS (ya LMS Curriculum Builder se course chuno) |
| **Module** | Course ke andar ek hissa (jaise “Foundations”, 20 hours) | Admin → LMS → Curriculum Builder → Add module |
| **Lesson** | Module ke andar ek class — video link, notes, resources | Curriculum Builder → Add lesson |
| **Quiz** | Module ke aakhir me test (pass mark, time limit) | Curriculum Builder → Add quiz / Assessments page |
| **Student** | Person jiska account + enrollment ho | Admin → Enrolled Students |
| **Enrollment** | “Is student ko ye course mila hai” — access ka switch | Admin → LMS → Enrollments & Access |
| **Progress** | Kitne % lessons complete hue | Student khud complete karta hai; admin override kar sakta hai |
| **Certificate** | 100% par auto-ban new credential | Admin → LMS → Certificates |
| **Announcement** | Notice jo student dashboard par dikhta hai | Admin → LMS → Communications |

### 2.1 Sabse zaroori do lafz

- **Published (Live):** student ko **turant** dikhta hai.
- **Draft:** sirf admin ko dikhta hai, student ko kabhi nahi.

Galti ho jaye to kisi bhi lesson/module ko **Draft** kar dein — student se chhup jayega, delete karne ki zaroorat nahi.

---

## 3. Pehli baar setup — recommended order (30–60 min)

1. **LMS Settings** (`/admin/lms/settings`) — apni defaults set karein: lesson duration, quiz pass mark, certificate ki wording aur accreditation body.
2. **Curriculum Builder** (`/admin/lms/curriculum`) — course chunein → modules banayein → har module me lessons daalein (**video link + notes + resources**).
3. Har module ka **Quiz** banayein (Curriculum Builder → Add quiz, ya Assessments page).
4. **Enrolled Students** (`/admin/students` → **Add Student**) se ek **test student account** banayein.
5. **Enrollments & Access** se us student ko course dein.
6. Us test student se **poora flow khud chala kar dekhein** — video chala? notes dikhe? resources download huye? quiz submit hua? certificate bana?
7. **Communications** se pehla announcement publish karein.
8. **Staff & Security RBAC** me team ko sirf zaroori LMS permissions dein.

---

## 4. Admin side — 8 pages ka poora tareeka

Sidebar → **Academy / LMS** group.

| # | Sidebar naam | Link | Kaam |
|---|---|---|---|
| 1 | LMS Overview | `/admin/lms` | Aankhon ke saamne ke numbers + shortcuts |
| 2 | Curriculum Builder | `/admin/lms/curriculum` | Course → module → lesson (video, notes, PDF, resources) |
| 3 | Assessments & Quizzes | `/admin/lms/quizzes` | Quiz banao + student scores dekho |
| 4 | Enrollments & Access | `/admin/lms/enrollments` | Student ko course dena / rokna / hatana |
| 5 | Progress & Completion | `/admin/lms/progress` | Kitna poora hua, reset, force-complete |
| 6 | Certificates | `/admin/lms/certificates` | Issue / revoke / reinstate + verify |
| 7 | Communications | `/admin/lms/communications` | Announcement + support desk |
| 8 | LMS Settings | `/admin/lms/settings` | Defaults aur certificate wording |

---

### 4.1 LMS Overview — sabse pehle yahi kholna

**Kahan:** Sidebar → Academy / LMS → **LMS Overview**

Upar ke cards ek nazar me batate hain:

- **Students** — kitne students + kitne active enrollments
- **Curriculum** — kitne lessons / courses / quizzes
- **Average progress** — average kitne % (0% ka matlab: abhi koi progress record nahi)
- **Quiz pass rate** — kitne % pass + kitne attempts
- **Certificates issued** — kitne issue + kitne revoked
- **Open support tickets** — kitni student queries pending hain

Neeche **Recent enrollments** table (latest students + course + status), right side **Manage the LMS** shortcuts aur **Latest announcements** hain.

> **Confusion na karein:** “0” ka matlab hota hai “abhi data nahi hai”, kharabi nahi. Jaise pass rate 0% tab tak jab tak koi quiz submit na kare.

---

### 4.2 Curriculum Builder — LMS ka dil

**Kahan:** Sidebar → **Curriculum Builder**

#### Step 1 — Course chunein
Top-right **“Select course”** dropdown. Draft course ke saath `(draft)` likha aayega.
Neeche badge row: `X modules`, `Y lessons`, `Z quizzes`, aur agar koi lesson draft hai to `N drafts`.

#### Step 2 — Module banein
**Add module** → naya module ban jayega. Har module card me:

| Element | Kaam |
|---|---|
| **⬆ ⬇** | Module ka order upar/neeche (save ho jata hai) |
| **Title** | Module ka naam |
| **Hours** | Kitne ghante ka module hai |
| **Live / Draft** | Student ko dikhana ya chhupana |
| **Save** | Title + hours + publish status save |
| **Add quiz / Edit quiz** | Us module ka test |
| **🗑** | Module delete (agar lessons/quiz hain to confirmation me saaf likha aata hai) |

#### Step 3 — Lesson banayein (VIDEO yahan dalna hai)
Module ke andar **“Add lesson”** → Lesson Editor khulega:

| Field | Kya bharein |
|---|---|
| **Lesson title** | Lesson ka naam — **zaroori** |
| **Lesson type** | Video / Written notes / PDF reading / Interactive lab (sirf label) |
| **Video link** | 👇 rules neeche |
| **Displayed duration** | Student ko list me dikhne wala duration (jaise `45m`) |
| **Short description** | Lesson ke upar ek line |
| **Lesson notes** | Jo student video ke saath padhega. **Khaali line = naya paragraph** |
| **Reading / PDF link** | Slide deck ya reading ka link (optional) |
| **Lab resources** | Download list — title, URL, file type, size. **Add resource** se extra row, 🗑 se delete |
| **Published to students** | Tick = student turant dekh sakta hai. Untick = draft |
| **Free preview** | Tick = enrollment se pehle bhi preview (LMS Settings se on/off) |

**VIDEO LINK — sabse important niyam:**

✅ **Ye chalega:**
- `https://www.youtube.com/watch?v=XXXXXXXX`
- `https://youtu.be/XXXXXXXX`
- `https://vimeo.com/123456789`

Sistem khud inko player-friendly embed form me badal deta hai. Field ke neeche **YouTube/Vimeo badge**, **“stored as …”** aur **live preview** dikh jata hai — **preview chala to hi Save karein.**

❌ **Ye nahi chalega:**
- `http://…` (sirf **https** — warna player khaali)
- Koi random website link (sirf tab chalega jab wo site iframe allow kare; Google Drive private / bade news sites aksar nahi karte)

> ⚠️ **Video file upload abhi available nahi hai.** Video pehle **YouTube ya Vimeo** (unlisted bhi chalega) par daalein, phir link yahan paste karein.

**Save** → “Lesson saved.” message aur lesson list me turant entry.

#### Step 4 — Lesson row ke buttons

| Icon | Kaam |
|---|---|
| ✏️ pencil | Lesson edit (video, notes, resources sab) |
| 👁 eye | Publish ↔ Unpublish (draft) |
| 📄 copy | Lesson **duplicate** (video + resources saath) — doosre module me wahi lesson chahiye to best |
| 🗑 trash | Lesson delete |

Row par ek nazar me: video linked hai ya **“no video”**, kitne **resources**, aur **“notes ✓”**.

#### Step 5 — Order badalna (drag & drop)
- **Lesson** ko handle se **kheench kar** usi module me ya **doosre module me** drop karein — naya order save ho jata hai. Drag karte waqt module ke neeche likha aata hai: *“Drop here to move the lesson into this module”*.
- **Module** ka order **⬆ ⬇** se.

> **Data safety:** jis lesson me video/notes/PDF/resources bhare hain, wo **Course CMS se course edit karne par delete nahi hota**. Pehle ye bug tha (video ud jata tha) — ab fix hai. Sirf aapka khud ka 🗑 delete karta hai.

---

### 4.3 Assessments & Quizzes — module ka test

**Kahan:** Sidebar → **Assessments & Quizzes**

#### Quiz banana
1. Upar **Select course** chunein.
2. Module card se **“Add quiz”** (Curriculum Builder me), ya isi page ke **“Modules without a quiz:”** buttons se.
3. Popup me bharein:
   - **Quiz title** (zaroori), **Description**
   - **Time limit (minutes)** — default 15
   - **Passing score (%)** — default 70
   - **Question** + **Options** (4 rows ready) → jis option ko **sahi jawab** banana hai uske **gol circle** par click (green ho jayega)
   - **Explanation** — grading ke baad student ko dikhta hai
   - **Add question** se aur sawaal; 🗑 se delete
4. **Create quiz / Save quiz**.

#### Student ko kya dikhta hai
Us module ke sidebar me **Test** button. Student submit kare → score turant calculate → pass/fail + detailed breakdown + har question ka explanation. Pass hone par confetti 🎉.

#### Scores dekhna
Neeche **Recent attempts** table: Student, Quiz (+course), **Score** (`correct/total · %`), **Result** (Passed/Failed), **Submitted** time. Upar badge me **pass rate**.

**Zaadtiyaan:** Quiz save hone ke liye kam se kam 2 options chahiye; sahi jawab khaali chhoda to save nahi hoga (error aayega).

---

### 4.4 Enrollments & Access — student ko course dena

**Kahan:** Sidebar → **Enrollments & Access**

> **Pehla step (bahut zaroori):** student ka **account** banana padta hai — **Admin → Enrolled Students → Add Student** se. Public self-registration **band** hai by design, taaki program access hamesha staff ke assignment se ho (student register page par counselor se contact karne ka message dikhta hai).

#### Naya enrollment
1. Top-right **“Enroll student”**.
2. Popup: **Student** chunein → **Course** chunein → **Batch** (optional, live cohort) → **Status** (`Active`).
3. **Enroll** → student ko turant LMS me course dikhne lagta hai.

#### Table samajhna
Filters: **Course**, **Status**, **Search** (naam/email).
Columns: **Student** (naam + email), **Course**, **Batch**, **Progress** bar, **Status**, **Actions**.

Actions:
- **Status dropdown** — `Active` / `Completed` / `Suspended` / `Cancelled`.
  *Course rokna hai → `Suspended` (progress bacha rehta hai). Hamesha ke liye hatana → 🗑.*
- **🗑 Remove access** — student ka course **aur uski progress** dono hat jate hain.

**Note:** same student ko same course dobara enroll karna galti nahi — duplicate nahi banta.

---

### 4.5 Progress & Completion

**Kahan:** Sidebar → **Progress & Completion**

Filters: **Course** (ya All courses) + **Refresh**. Upar badges: `N tracked students`, `N completed`, `average X%`.

Table: **Student** (complete hone par 🏅), **Course**, **Lessons** (`completed / total`), **Progress** bar, **Last activity** (aur completion date), **Actions**:

| Button | Kya karta hai | Kab use karein |
|---|---|---|
| **Complete** | Course ke saare lessons complete mark + 100% + completion date. Student **certificate-eligible** ban jata hai | Offline/batch me padha, ya record update nahi hua |
| **Reset** | Completed lessons, % aur completion date saaf — student shuru se | Galti se complete ho gaya, ya student dobara kar raha hai |

> `Complete` button already-completed row par disabled rehta hai.

---

### 4.6 Certificates

**Kahan:** Sidebar → **Certificates**

Tabs: **Issued** | **Ready to issue** | **Revoked**. Search (certificate ID / student / course) + Course filter.

#### Kaise kaam karta hai
- Student jab course ke **saare published lessons** complete kar leta hai → certificate **khud-ba-khud** ban jata hai.
- Kisi wajah se auto nahi bana? **Ready to issue** tab me student dikhega → **“Issue certificate”** dabayein.
- Certificate ID format: `AFT-CERT-XXXXXXXX`. Public verify page: **`/certificate/<ID>`**.
- Certificate par **grade** (jaise Honor Distinction) aur **accreditation body** LMS Settings se aate hain.

#### Issued tab
Columns: **Certificate** (ID + `sample`/`revoked` badge), **Student**, **Course**, **Issued**, **Actions** → **Verify** (public page naye tab me).

#### Revoke (dhyan se)
**Revoke** → popup me **Reason** likhein (audit log me jayega) → **Revoke certificate**.
Public page par saaf likha aata hai: *“This credential has been withdrawn by American FutureTech and is no longer valid.”*
Certificate **delete nahi hota** — record rehta hai (kaun, kab, kyun) — isliye **Reinstate** bhi possible hai.

#### Reinstate
**Revoked** tab → **Reinstate** → certificate phir valid.

> **Privacy:** public certificate page par student ka **email nahi dikhta** — sirf naam, course, grade, accreditation body aur validity.

---

### 4.7 Communications — announcement + support desk

**Kahan:** Sidebar → **Communications**

#### Announcement publish karna
1. **“New announcement”**.
2. **Title** (zaroori), **Message**, **Audience**:
   - **All Students** — saare enrolled students
   - **Course** — sirf us course ke students
   - **Batch** — sirf us cohort ke students
3. **Pin to the top** (dashboard par sabse upar) aur **Publish now** tick.
4. **Save announcement**.

Student ko ye **LMS dashboard ke “Notice Board”** me dikhta hai. Admin list me badges (pinned / published–draft / audience) aur 👁 publish-unpublish, ✏️ edit, 🗑 delete buttons hote hain.

> Do notices ek hi student ko? Wahi announcement **All Students** aur ek **Course** dono par bhejne ki zaroorat nahi — audience ek chunein. Notice doosre course ko target karta hai to us course ke bahar wale students ko **nahi** dikhega.

#### Support desk
Right side card: kitne **open tickets** hain + latest tickets → **“Open the full support desk”** se poora support module (reply + status change). Staff reply student ke **Student Support** page par dikhta hai.

---

### 4.8 LMS Settings — defaults aur wording

**Kahan:** Sidebar → **LMS Settings** → badlaav ke baad top-right **Save settings**.

| Group | Setting | Default | Matlab |
|---|---|---|---|
| **Curriculum defaults** | Default lesson duration | `45m` | Naya lesson banate waqt pehle se bhara |
| | Default module hours | `20` | Naya module kitne ghante ka |
| | Default quiz time limit | `15` min | Naya quiz ka time |
| | Default passing score | `70%` | Naya quiz ka pass mark |
| **Certificates** | Default grade / distinction | `Honor Distinction` | Manual issue par certificate par chhapta hai |
| | Accreditation body | `American FutureTech Institute of Advanced Technologies (Wyoming, USA)` | Certificate par likhi body |
| **Student experience** | Welcome message | `Welcome back. Pick up where you left off.` | Student dashboard ka greeting |
| | Allow free-preview lessons | ✅ on | Preview lessons enrollment se pehle dikhein |
| | Show announcements on the student dashboard | ✅ on | **Off** karne par student ko koi announcement nahi dikhega (notices preserve rehte hain) |

> Ye settings **sach me** student par lagti hain — jaise preview off karne par lesson public curriculum se hat jata hai, aur welcome message student dashboard par change ho jata hai. Isi liye setting badalne ke baad ek baar student view check kar lena acchi practice hai.

---

## 5. Student side — student ko exactly kya dikhta hai

Student `https://americanfuturetechllc.com/student/login` se login karta hai. Sidebar me 6 page hain:

| # | Student ka page | Wahan kya hota hai |
|---|---|---|
| 1 | **Dashboard** | Welcome message, 4 stat cards (Enrolled Courses, Average Completion, Certificates Earned, Quizzes & Labs Completed), enrolled programs + progress bar + “Resume” button, earned credentials, aur **Notice Board** |
| 2 | **My Courses** | Saare enrolled programs — category, % complete, progress bar, **“Launch Course Player”** |
| 3 | **Certificates** | US diplomas (verify + print PDF + share link) aur Microsoft-aligned credentials |
| 4 | **Invoices & Receipts** | Total settled, invoice list, receipt print/download |
| 5 | **Student Support** | Ticket banayein (category + priority), faculty se conversation |
| 6 | **Profile Settings** | Naam, phone, password etc. |

### 5.1 Course Player screen (student ka asli classroom)

- **Left sidebar:** Course Curriculum — Module 01, 02… ke andar lessons, jahan **✓ tick** = complete. Module ke neeche **Test** button (quiz).
- **Center:** video player (YouTube/Vimeo embed). Video nahi hai to “Video content ready for playback.”
- **Neeche:** `Previous` / `Next` buttons aur **Mark as Complete**.
- **Right/nichla tabs:** **Lesson Overview & Notes** (description + notes, paragraphs ke saath) aur **Lab Resources (N)** — har resource ke saath **Download** button. Kuch nahi diya to saaf likha aata hai: “No resources attached to this lesson”.
- **Top bar:** course title, “Lesson X of Y”, **Course Progress %** bar. 100% hone par **Claim Certificate**.

### 5.2 Quiz lene ka tareeka (student)
Module sidebar → **Test** → saare questions ek page par → option select (sahi/select hua option highlight) → **Submit Assessment for Grading** → turant result: score %, correct count, passed/failed, phir **Detailed Question Breakdown** (har question ✅/❌ + explanation) → **Retake Assessment** button.

### 5.3 Certificate kab milta hai
Saare **published** lessons 100% complete → certificate auto-issue → **Certificates** page par “View & Verify”, “Print PDF”, “Share Link”. Employer/parent koi bhi **`/certificate/<ID>`** khol kar bina login verify kar sakta hai.

### 5.4 Admin ka kaam → student ko kahan dikhta hai

| Admin ne kya kiya | Student ko kahan dikhta hai |
|---|---|
| Course enroll kiya | My Courses me course card, Dashboard me progress |
| Lesson + video daala | Course player me video, neeche notes |
| Lab resources daale | Lesson ke **Lab Resources** tab me Download |
| Quiz banaya | Module ke sidebar me **Test** |
| Lesson complete kiya | Progress % badhta hai (Dashboard + admin Progress page) |
| Saare lessons complete | Certificate auto-issue → Certificates page + public verify |
| Announcement publish | Dashboard ka **Notice Board** |
| Ticket ka reply | Student Support page par conversation |
| Enrollment **Suspended** | Course player “Curriculum Unavailable” — access band |

---

## 6. Ek poora cycle — naye batch ka example (step by step)

Maan lijiye naya batch “AI Engineering — March Cohort” shuru ho raha hai:

1. **LMS Settings** check karein — pass mark 70%, welcome message, certificate wording.
2. **Curriculum Builder** → course chunein → agar pehle se modules hain to unme lessons bharein; naye modules **Add module** se.
3. Har lesson me **video link paste → preview chala confirm → notes + resources → Published tick → Save**.
4. Har module ka **quiz** banayein (Assessments) — sahi jawab ka green circle check karein.
5. **Enrolled Students → Add Student** se 20 students ke accounts banayein (naam, email, phone, password).
6. **Batches & Urgency** me cohort banayein (optional) — phir enrollment me batch assign karein.
7. **Enrollments & Access → Enroll student** — 20 students × course, batch = March cohort, status `Active`.
8. **Communications → New announcement** — “Batch Monday se shuru, pehla module ready hai”, audience = us course/ batch, **pinned**.
9. Batch ke dauran: **LMS Overview** roz check karein; **Progress & Completion** se pata chale kaun peeche hai; **Assessments → Recent attempts** se scores.
10. Jis student ne sab poora kar liya → **Certificates → Issued** me uska certificate; verify link usko bhej dein.
11. Koi student rokna ho (fees pending / leave) → **Enrollments** me status `Suspended` — progress safe rehta hai, wapas `Active` karte hi access laut aata hai.
12. Course update karna ho → naya lesson **Draft** me banayein, taiyar hone par publish karein. Student ko draft kabhi nahi dikhta.

---

## 7. Kaun kya kar sakta hai (permissions)

**Kahan:** Admin → **Staff & Security RBAC** → staff member → module **“LMS / Academy Control”**.

| Permission | Isse kya allow hota hai |
|---|---|
| `LMS_VIEW` | Academy/LMS section dekhna (sab pages read) |
| `LMS_CONTENT_EDIT` | Lessons, video/link, notes, resources, settings |
| `LMS_QUIZ_EDIT` | Quiz banana + attempts dekhna |
| `LMS_ENROLL_EDIT` | Student enroll / unenroll / status |
| `LMS_PROGRESS_EDIT` | Progress reset / force-complete |
| `LMS_CERTIFICATE_ISSUE` | Certificate manually issue / reinstate |
| `LMS_CERTIFICATE_REVOKE` | Certificate revoke |
| `LMS_COMMS_EDIT` | Announcement aur ticket reply |

**Rules:**
- **SuperAdmin** ko sab kuch automatically.
- **Counselor** — enrollment + announcements (+ dekhna).
- **Instructor** — lessons/quizzes + progress control.
- **Read-only staff** sirf dekh sakta hai — koi bhi Save/Issue **API level par bhi** refuse hota hai (button chhupana hi security nahi hai).
- Naye staff ke liye presets ready hain: **Admissions Counselor**, **Career & Placement Officer**, **Read-Only Auditor**.

---

## 8. Troubleshooting — jo aksar pucha jata hai

| Problem | Wajah / Fix |
|---|---|
| **Video khaali/kala dikh raha hai** | Link `https://` se shuru hona chahiye aur YouTube/Vimeo ka hona chahiye. Lesson Editor me paste karein — preview turant dikhega; preview nahi chala to student ke paas bhi nahi chalega |
| **Lesson student ko nahi dikh raha** | Lesson ya module **Draft** hai. 👁 ya module ka Live/Draft button se publish karein |
| **Student ko course hi nahi dikh raha** | Enrollment nahi hai. **Enrollments & Access** me row check karein — status `Active` hona chahiye |
| **Student login nahi kar pa raha** | Account **Enrolled Students** se bana hai? Email/password theek? Chahain to **Reset password** use karein |
| **Certificate nahi bana** | Saare **published** lessons complete hone chahiye. **Certificates → Ready to issue** me student dikhega → **Issue certificate** |
| **Announcement student ko nahi dikha** | Audience sahi chuni? Publish tick hai? **LMS Settings** me “Show announcements” ON hai? |
| **Quiz submit nahi ho raha** | Student ne saare questions ke jawab nahi chune — button tab tak disabled rehta hai |
| **Save nahi ho raha / “could not save”** | Lesson title khaali hai, ya video link `https://` ke bajay kuch aur hai. Dono theek karein |
| **Course edit karne ke baad lesson update nahi dikha** | Page **Refresh** karein — naya curriculum save hote hi live ho jata hai |
| **Purana lesson ka video gayab** | Aisa ab nahi hota (authored lesson composer se delete nahi hota). Sirf khud ka 🗑 delete karta hai |
| **Student ka progress 100% dikha raha hai par usne kiya nahi** | Kisi ne **Complete** button dabaya tha. **Reset** se zero karein |

---

## 9. Do's & Don'ts

**Karo**
- Naya lesson pehle **Draft** me banao, poora bhar kar publish karo.
- Video ka **preview field me chalna confirm** karo, tab hi save karo.
- Certificate revoke karne se pehle **reason** likho — audit me usi se pata chalta hai.
- Course rokna ho to **Suspended** karo (delete nahi) — progress bacha rehta hai.
- Har publish ke baad ek **test student** se ek baar dekh lo.

**Mat karo**
- `http://` link **mat** daalo — player block kar dega.
- Jis lesson me video/notes bhare hain usko bina soche **delete mat karo** (undo nahi hai).
- Announcements **off** karne se pehle soch lo — student dashboard se saare notices gayab ho jayenge.
- Ek hi student ko **Enrolled Students** aur **Enrollments** dono jagah baar-baar enroll karne ki zaroorat nahi — duplicate nahi banta.
- Ek hi batch ko ek hi announcement do baar (All Students + Course) **mat** bhejo — audience ek chuno.

---

## 10. Kya kaam karta hai — aur kya abhi nahi

**✅ Kaam karta hai**
- Course → module → lesson authoring: video embed (YouTube/Vimeo), notes, PDF/reading link, lab resources
- Lesson drag & drop ordering, duplicate, draft/publish, free preview
- Module-wise quizzes: time limit, pass mark, explanation, instant grading, attempt history
- Student portal: dashboard, course player, notes, resources download, quizzes, certificates, invoices, support tickets, profile
- Enrollments (add / suspend / reactivate / remove), progress tracking + admin override
- Auto certificate issue, manual issue, revoke + reinstate, public verification page
- Announcements (all / course / batch, pinned), support desk with staff replies
- Permissions (RBAC) + audit: LMS ki har sensitive action staff identity ke saath log hoti hai
- Inventory-level proof: `npm run verify:lms` poore LMS surface ka regression suite chalata hai

**❌ Abhi nahi hai (aage add ho sakta hai)**
- **Direct video file upload** — video YouTube/Vimeo link se lagti hai
- Assignments + manual grading (abhi sirf MCQ quizzes)
- Live class / attendance modules
- Student analytics dashboard (abhi progress numbers hain, deep analytics nahi)

---

## 11. Verification — is guide ki buniyad

Har cheez jo is document me likhi hai, code aur test se verify ki gayi hai:

| Kya verify hua | Kaise |
|---|---|
| LMS admin surface (content, enrollments, progress, certificates, announcements, settings) | `npm run verify:lms` — real API + throwaway database, har page ka flow |
| Lesson video link normalisation (YouTube short/watch/Vimeo → embed), `http://` aur junk link ka refusal | Same suite ka “CONTENT & MEDIA DISCIPLINE” section |
| Authored lessons course composer se safe rehna (video delete na ho) | Same suite ka “COMPOSER DATA SAFETY” section |
| Public certificate registry: sirf allow-list fields, email/staff/reason kabhi leak na ho | Same suite ke public-registry checks |
| Read-only staff ka koi bhi mutating endpoint refuse hona | Same suite ke RBAC assertions |
| Free preview on/off aur welcome message sach me student tak pahunchna | Same suite ke setting-to-surface checks |

**Dobara chalane ke liye:** project root par

```bash
npm run verify:lms
```

(Iske liye MongoDB `127.0.0.1:27018` par chalti honi chahiye — suite apna throwaway database khud banata aur delete karta hai.)

---

*Koi cheez samajh na aaye, ya LMS me kuch aur chahiye ho (video upload, assignments + grading, live classes, student analytics) to bata dijiye — sab add kiya ja sakta hai.*
