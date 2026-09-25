# LMS ADMIN HANDBOOK — Academy / LMS Control Centre

**American FutureTech · Admin Console**
Ye handbook sirf ek cheez ke liye hai: aap **student LMS ko poora khud manage kar sakein** — bina developer ke.

Har page ka matlab, kahan click karna hai, aur wo student ko kahan dikhega — sab step-by-step neeche hai.

---

## 0. Pehle yeh samajh lo (2 minute)

- **Login:** `https://american-futuretech.vercel.app/admin/login` (local pe `http://localhost:5173/admin/login`)
- Login ke baad left sidebar me neeche ek naya group milega: **“ACADEMY / LMS”**
- Us group ke andar 8 page hain:

| # | Sidebar naam | Link | Kaam |
|---|---|---|---|
| 1 | LMS Overview | `/admin/lms` | Aankhon ke saamne ke numbers |
| 2 | Curriculum Builder | `/admin/lms/curriculum` | Course → module → lesson (video, notes, PDF, resources) |
| 3 | Assessments & Quizzes | `/admin/lms/quizzes` | Quiz banao + student ke scores dekho |
| 4 | Enrollments & Access | `/admin/lms/enrollments` | Student ko course/batch dena ya lena |
| 5 | Progress & Completion | `/admin/lms/progress` | Kitna poora hua, reset, force-complete |
| 6 | Certificates | `/admin/lms/certificates` | Certificate issue / revoke / reinstate |
| 7 | Communications | `/admin/lms/communications` | Announcement + support desk |
| 8 | LMS Settings | `/admin/lms/settings` | Defaults aur certificate ki wording |

> **Yaad rakho:** “Published” cheez student ko turant dikhti hai. “Draft” sirf aapko dikhti hai. Galti ho jaye to kisi bhi cheez ko Draft kar do — student ko wapas nahi dikhega, delete karne ki zaroorat nahi.

---

## 1. LMS Overview — sabse pehle yahi kholo

**Kahan:** Sidebar → Academy / LMS → **LMS Overview**

**Kaam:** Ek nazar me pata chal jata hai LMS me kya ho raha hai.

- Upar ke cards: **Students** (kitne + kitne active enrollments), **Curriculum** (lessons / courses / quizzes), **Average progress** (kitne %), **Quiz pass rate** (kitne % pass + kitne attempts), **Certificates issued** (kitne + kitne revoked), **Progress records**, **Open support tickets**, **Courses**.
- **Recent enrollments** table: latest enrolled students, unka course aur status.
- Right side: **Manage the LMS** (har page ka shortcut) aur **Latest announcements**.

**Agar number 0 lag raha hai to samjho:** us cheez ka data abhi nahi hai — jaise “Quiz pass rate 0%” sirf tab jab tak koi student ne quiz submit na kiya ho.

---

## 2. Curriculum Builder — yahan lesson aur video daalna hai

**Kahan:** Sidebar → **Curriculum Builder**

Yeh page poore LMS ka dil hai. Yahan se aap course ke andar **modules** aur unke andar **lessons** banate ho.

### 2.1 Course chunо

Top-right me **“Select course”** dropdown hai → apna program chuno (jo course draft hai uske saath `(draft)` likha aayega).
Iske neeche badge row dikhegi: `X modules`, `Y lessons`, `Z quizzes`, aur agar koi lesson draft hai to `N drafts`.

### 2.2 Module banao / badlo

- **Add module** (top-right) → naya module `Module N` naam se ban jayega.
- Har module card ke andar:
  - **⬆ ⬇** arrows — module ka order upar/neeche. (Order save ho jata hai, page reload par bhi wahi rahega.)
  - **Title box** — module ka naam (yahan type karo).
  - **Hours box** — kitne ghante ka module hai.
  - **Live / Draft** button — student ko dikhana ya chhupana.
  - **Save** — title + hours + publish status save kar deta hai. *(Title/hours badla hai to Save dabana zaroori hai.)*
  - **Add quiz / Edit quiz** — us module ka test (section 3 dekho).
  - **🗑** — module delete. Agar us module me lessons ya quiz hai to confirmation me saaf likha aayega ki sab permanently hat jayega.

### 2.3 Lesson add karо — VIDEO kaise dalna hai (sabse important)

Module ke andar neeche **“Add lesson”** dabao → ek popup (Lesson Editor) khulega:

| Field | Kya karna hai |
|---|---|
| **Lesson title** | Lesson ka naam. **Zaroori hai.** |
| **Lesson type** | Video lesson / Written – notes / PDF – reading / Interactive lab. (Sirf label hai — student ko player waise hi dikhta hai.) |
| **Video link** | 👇 neeche detail me |
| **Displayed duration** | Student ko list me jo duration dikhega (jaise `45m`). |
| **Short description** | Lesson ke upar chhota summary. |
| **Lesson notes** | Jo student video ke saath padhta hai. **Khaali line chhodo to naya paragraph banega.** |
| **Reading / PDF link** | Slide deck ya reading ka link (optional). |
| **Lab resources** | Download list — har row me: title, URL, file type (PDF/CODE…), size. **Add resource** dabao, extra row delete karne ke liye 🗑. |
| **Published to students** | Tick = student turant dekh sakta hai. Untick = draft. |
| **Free preview** | Tick = enrollment se pehle bhi dikhega. |

**VIDEO LINK — isko dhyan se padho:**

✅ **Aise link paste karo:**
- `https://www.youtube.com/watch?v=XXXXXXXXXXX`
- `https://youtu.be/XXXXXXXXXXX`
- `https://vimeo.com/123456789`

Sistem **khud** inko embed form me badal deta hai (`youtube.com/embed/…` / `player.vimeo.com/video/…`). Field ke neeche:
- **YouTube / Vimeo** ka badge aa jayega
- **“stored as …”** me final link दिखेगा
- aur neeche **video ka preview** turant chal jayega

❌ **Kya nahi chalega:**
- `http://…` (sirf **https** chalta hai — warna player khaali dikhega)
- Koi random website ka page link — wo chalega **sirf tab** jab us site ne iframe allow kiya ho. Aksar bade sites (Google Drive private, many news sites) allow nahi karte → us case me YouTube/Vimeo use karo.

> ⚠️ **Video UPLOAD abhi nahi hai.** LMS direct file upload support nahi karta, isliye video **YouTube ya Vimeo** par daal kar us link ko yahan paste karo. Unlisted/private video bhi chalega (embed allowed ho to).

**Save** dabao → **“Lesson saved.”** message aayega aur lesson list me turant dikh jayega.

### 2.4 Lesson row ke buttons

| Icon | Kaam |
|---|---|
| ✏️ pencil | Lesson edit (video, notes, resources sab) |
| 👁 eye | Publish ↔ Unpublish (draft) |
| 📄 copy | Lesson **duplicate** (video + resources ke saath) — same lesson doosre module me chahiye to yeh best hai |
| 🗑 trash | Lesson delete |

Lesson row par ek nazar me dikhta hai: **Video** type, video linked hai ya **“no video”**, kitne **resources**, aur **“notes ✓”** (notes likhe hue hain).

### 2.5 Order badalna (drag & drop)

- **Lesson** ko **mouse se pakad kar** (left side ka ⣿ handle) kheenchо — usi module me upar/neeche, ya **kisi doosre module me** drop kar do. Naya order save ho jata hai.
  Jab aap kheench rahe ho, module ke neeche likha aata hai: *“Drop here to move the lesson into this module”*.
- **Module** ka order **⬆ ⬇** arrows se badalta hai.

### 2.6 Safety — sabse zaroori baat

> Aap ne jis lesson me **video / notes / PDF / resources** bhare hain, wo **Course CMS (Curriculum & Courses CMS)** se course edit karne par **delete NAHI hoga**. Pehle yeh bug tha (video uda jata tha) — ab fix ho gaya hai. Jo lesson aap khud 🗑 se delete karoge, sirf wahi hat jayega.

---

## 3. Assessments & Quizzes — module ka test

**Kahan:** Sidebar → **Assessments & Quizzes**

### Quiz banao
1. Upar **Select course** chuno.
2. Do tarike:
   - Module card se: **Curriculum Builder** → us module par **Add quiz**, ya
   - Isi page par: neeche **“Modules without a quiz:”** ke buttons se jo module chahiye
3. Popup me bharo:
   - **Quiz title** (zaroori), **Description**
   - **Time limit (minutes)** — default 15
   - **Passing score (%)** — default 70
   - **Question** likho → **Options** likho (4 rows ready hain) → jis option ko **sahi jawab** banana hai uske **gol circle button** par click karo (green ho jayega) → **Explanation** (grading ke baad student ko dikhta hai)
   - **Add question** se aur sawaal; question delete karne ke liye us question ke corner me 🗑
4. **Create quiz** / **Save quiz**.

Student ko us module ke sidebar me **Test** button dikhega. Submit karne par score turant calculate hota hai.

### Scores dekho
Neeche **Recent attempts** table: Student, Quiz (+course), **Score** (`correct/total · %`), **Result** (Passed/Failed), **Submitted** time. Upar badge me **pass rate** bhi dikhta hai.

**Zaadtiyaan:** Quiz dene ke liye question me kam se kam 2 options hona chahiye; sahi jawab khaali chhoda to save nahi hoga (error aayega).

---

## 4. Enrollments & Access — student ko course dena

**Kahan:** Sidebar → **Enrollments & Access**

> Nataya student account pehle banao: **Admin → Enrolled Students** se. Uske baad usko yahan se course dena aasan hai.

### Naya enrollment
1. Top-right **“Enroll student”** dabao.
2. Popup me: **Student** chuno → **Course** chuno → **Batch** (optional, live cohort) → **Status** (`Active`).
3. **Enroll** dabao. Student ko turant LMS me course dikhne lagega.

### Table samajhо
Filters: **Course**, **Status**, **Search** (student ka naam/email).
Table columns: **Student** (naam + email), **Course**, **Batch**, **Progress** bar, **Status** badge, **Actions**.

Actions me:
- **Status dropdown** — `Active` / `Completed` / `Suspended` / `Cancelled`.
  *(Course rokna hai to `Suspended`, hamesha ke liye hataana to 🗑.)*
- **🗑 Remove access** — student ka course + uska progress **dono** hat jate hain (enrollment bhi, progress bhi).

**Note:** Same student ko same course dobara enroll karna galti nahi — sistem duplicate nahi banata.

---

## 5. Progress & Completion

**Kahan:** Sidebar → **Progress & Completion**

Filters: **Course** (ya All courses) + **Refresh**. Upar badges: `N tracked students`, `N completed`, `average X%`.

Table: **Student** (complete hone par 🏅 icon), **Course**, **Lessons** (`completed / total`), **Progress** bar, **Last activity** (aur complete hone ki date), **Actions**:

| Button | Kya karta hai | Kab use karo |
|---|---|---|
| **Complete** | Us course ke saare lessons complete mark + 100% + completion date set. Student **certificate eligible** ban jata hai. | Offline/batch me padha, ya student ne poora kiya par record update nahi hua |
| **Reset** | Completed lessons, % aur completion date **saaf** — student shuru se. | Galti se complete mark ho gaya, ya student dobara kar raha hai |

> `Complete` button already-completed row par disabled rehta hai (dobara karne ki zaroorat nahi).

---

## 6. Certificates

**Kahan:** Sidebar → **Certificates**

Teen tabs: **Issued** | **Ready to issue** | **Revoked**. Upar Search (certificate ID / student / course) aur Course filter.

### Kaise kaam karta hai
- Student jab course ke **saare published lessons** complete kar leta hai, certificate **khud-ba-khud ban jata hai**.
- Auto nahi bana? Us case me **Ready to issue** tab me student dikhega → **“Issue certificate”** dabao.
- Certificate ka ID `AFT-CERT-XXXXXXXX` hota hai, aur public verification page: `/certificate/<ID>`.

### Issued tab
Table: **Certificate** (ID + `sample`/`revoked` badge + reason), **Student**, **Course**, **Issued**, **Actions**:
- **Verify** — naye tab me public verification page kholta hai (jo parent/employer ko dikhta hai).
- **Revoke** — certificate withdraw karna.

### Revoke karna (dhyan se)
**Revoke** dabao → popup me **Reason** likho (audit log me jayega) → **Revoke certificate**.
Uske baad public page par saaf likha aata hai: *“This credential has been withdrawn by American FutureTech and is no longer valid.”*
Certificate **delete nahi** hota — record rehta hai (kaun, kab, kyun) — isliye aap baad me **Reinstate** bhi kar sakte ho.

### Reinstate
**Revoked** tab → **Reinstate** → certificate phir se valid ho jata hai.

> Student ka email address public certificate page par **nahi** dikhta (privacy) — registry sirf naam, course aur validity batata hai.

---

## 7. Communications — announcement + support

**Kahan:** Sidebar → **Communications**

### Announcement publish karna
1. **“New announcement”** dabao.
2. Bharo: **Title** (zaroori), **Message**, **Audience**:
   - **All Students** → saare enrolled students
   - **Course** → sirf us course ke students (course chuno)
   - **Batch** → sirf us cohort ke students (batch chuno)
3. **Pin to the top** (dashboard par sabse upar) aur **Publish now** tick karo.
4. **Save announcement**.

Student ko ye notice **LMS dashboard ke “Notice Board”** me dikhta hai.
List me har announcement ke saath badges hote hain (pinned / published–draft / audience) aur buttons: 👁 publish–unpublish, ✏️ edit, 🗑 delete.

### Support desk
Right side wale card me **kitne tickets open** hain aur latest tickets dikhte hain → **“Open the full support desk”** se poora support module khulta hai (wahan reply aur status change hota hai; reply student ko LMS me dikhta hai).

---

## 8. LMS Settings — defaults aur wording

**Kahan:** Sidebar → **LMS Settings** → badlaav ke baad top-right **Save settings** dabao.

| Group | Setting | Default | Matlab |
|---|---|---|---|
| **Curriculum defaults** | Default lesson duration | `45m` | Naya lesson banane par pehle se bhara aata hai |
| | Default module hours | `20` | Naya module kitne ghante ka |
| | Default quiz time limit | `15` min | Naya quiz ka time |
| | Default passing score | `70%` | Naya quiz ka pass mark |
| **Certificates** | Default grade / distinction | `Honor Distinction` | Manual issue par certificate par chhapta hai |
| | Accreditation body | `American FutureTech Institute of Advanced Technologies (Wyoming, USA)` | Certificate par likhi body |
| **Student experience** | Welcome message | `Welcome back. Pick up where you left off.` | Dashboard ka greeting |
| | Allow free-preview lessons | ✅ on | Preview lessons enrollment se pehle dikhein |
| | Show announcements on the student dashboard | ✅ on | **Off kar do** to koi bhi announcement student ko nahi dikhega (notices preserve rehte hain) |

---

## 9. Permissions — kaun kya kar sakta hai

**Kahan:** Sidebar → **Staff & Security RBAC** → staff member kholo → module **“LMS / Academy Control”**

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
- **SuperAdmin** ko sab kuch automatically milta hai.
- **Counselor** ko: enrollment + announcements (+ dekhna).
- **Instructor** ko: lessons/quizzes + progress control.
- **Read-only staff** ko sirf dekhna milta hai — koi bhi Save/Issue **API level par bhi** refuse hota hai (button chhupana hi security nahi hai).

Naya staff banate waqt presets ready hain: **Admissions Counselor**, **Career & Placement Officer**, **Read-Only Auditor** — inme LMS permissions pehle se set hain.

---

## 10. Student ko exactly kya dikhta hai

Student `https://american-futuretech.vercel.app/student/login` se login karta hai.

| Admin ne kya kiya | Student ko kahan dikhta hai |
|---|---|
| Course enroll kiya | **My Courses** me course card, **Dashboard** me progress |
| Lesson + video link daala | Course khulte hi **video player** me video, neeche **notes** |
| Lab resources daale | Us lesson ke **“Lab Resources”** tab me download button |
| Quiz banaya | Module ke sidebar me **Test** button |
| Lesson complete karta hai | Progress % badhta hai (Dashboard + admin Progress page) |
| Saare lessons complete | **Certificate auto-issue** → **My Certificates** me, aur `/certificate/<ID>` par verify-able |
| Announcement publish | Dashboard ka **Notice Board** |
| Support ticket | **Student Support** me reply (admin reply ke saath) |

---

## 11. Troubleshooting — jo aksar pucha jata hai

| Problem | Wajah / Fix |
|---|---|
| **Video khaali/kala dikh raha hai** | Link `https://` se shuru hona chahiye aur YouTube/Vimeo ka hona chahiye. Link field me paste karo → neeche **preview** turant dikhega; agar preview nahi dikha to video student ke paas bhi nahi chalega. |
| **Lesson student ko nahi dikh raha** | Lesson ya module **Draft** hai. Curriculum Builder me 👁 (ya module ka Live/Draft) button se publish kar do. |
| **Student ko course hi nahi dikh raha** | Enrollment nahi hai. **Enrollments & Access** → student ka row check karo, status `Active` hona chahiye. |
| **Certificate nahi bana** | Saare **published** lessons complete hone chahiye. **Certificates → Ready to issue** tab me student dikhega → **Issue certificate**. |
| **Announcement student ko nahi dikha** | Audience check karo (Course/Batch sahi chuna?), Publish tick hai?, aur **LMS Settings** me “Show announcements on the student dashboard” ON hai? |
| **Naya lesson banate waqt “stored as” me alag link dikh raha hai** | Yeh sahi hai — YouTube/Vimeo link ko embed form me convert kiya gaya hai. |
| **Save nahi ho raha / “could not save”** | Lesson title khaali hai, ya video link `https://` ke bajay kuch aur hai. Title bharo, link theek karo. |
| **Course edit karne ke baad lesson update nahi dikha** | Page **Refresh** karo. Naya curriculum save hote hi live ho jata hai. |
| **Purana lesson ka video gayab** | Aisa ab nahi hota — authored lesson composer se delete nahi hota. Agar kisi ne 🗑 daba diya to lesson hamesha ke liye chala jayega. |

---

## 12. Pehli baar setup — recommended order

1. **LMS Settings** me apni defaults set kar lo (duration, passing score, certificate wording + accreditation body).
2. **Curriculum Builder** me ek course chuno → modules banao → har module me lessons daalo (**video link + notes + resources**).
3. **Assessments** me har module ka quiz banao.
4. **Enrollments & Access** me ek test student enroll karke **poora flow khud chala kar dekho** (video chala? resources download huye? quiz submit hua?).
5. **Certificates** check karo — student ko complete kara ke dekho certificate ban raha hai.
6. **Communications** se pehla announcement publish karo.
7. **Staff & RBAC** me apni team ko sirf zaroori LMS permissions do.

---

## 13. Do's & Don'ts

**Karo**
- Naya lesson pehle **Draft** me banao, poora bhar kar aakhir me publish karo.
- Video ka **preview field me chalna confirm** karo, tab hi save karo.
- Certificate revoke karne se pehle **reason** likho — baad me audit me usi se pata chalta hai.
- Course rokna ho to **Suspended** karo (delete nahi), taaki progress bacha rahe.

**Mat karo**
- `http://` link **mat** daalo — player use block kar dega.
- Jis lesson me video/notes bhare hain usko bina soche **delete mat karo** (undo nahi hai).
- Announcements **off** karne se pehle soch lo — student dashboard se saare notices gayab ho jayenge.
- Ek hi student ko do jagah se (Enrolled Students + Enrollments) bar-bar enroll karne ki zaroorat nahi — duplicate nahi banta.

---

*Koi cheez samajh na aaye ya kuch aur chahiye ho to batao — LMS ko aur bhi strong bana sakte hain (jaise video file upload, assignments + grading, ya student analytics dashboard).*
