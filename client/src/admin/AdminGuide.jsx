import React from 'react';
import {
  LayoutDashboard, Users, BookOpen, Calendar, GraduationCap, CreditCard,
  Briefcase, FileText, LifeBuoy, Settings, ShieldAlert, HelpCircle,
  ArrowLeft, Image as ImageIcon, DollarSign, Layers, MousePointerClick, Save, CheckCircle2,
  MessageSquareWarning, Images, PanelBottom, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    icon: LayoutDashboard,
    title: '1. Executive Dashboard',
    path: '/admin/dashboard',
    what: 'Business overview — daily leads, admission rate, active batches, and pipeline revenue with live charts.',
    how: 'Kuch edit nahi hota yahan — sirf numbers dekho. Har sub-chart automatically latest data dikhata hai.',
  },
  {
    icon: Users,
    title: '2. Admissions Pipeline (Leads CRM)',
    path: '/admin/leads',
    what: 'Website se aayi har application/inquiry ka record — naam, phone, course interest, status.',
    how: 'Student ki row par click karo → drawer khulega. Wahan status change karo (New → Contacted → Counseling Scheduled → Enrolled), call note likho, follow-up date set karo, ya "Convert to Student" dabao. CSV Export button se poora data Excel mein download hota hai.',
  },
  {
    icon: BookOpen,
    title: '3. Curriculum & Courses CMS',
    path: '/admin/courses',
    what: 'Saare career programs — title, price, duration, badge, curriculum modules, capstone projects.',
    how: 'Edit (✏️) button dabao → modal khulega. Yahan se title, tuition fee, discounted price, duration, highlights, aur curriculum modules edit karo. Save karte hi website par live update ho jata hai — module add/rename/delete karo, course page turant badal jata hai (lessons bhi wahin se bante hain). Badge dropdown se "Most Popular" etc. turant switch hota hai. Capstone projects bhi isi modal ke Capstone section se edit hote hain. Course list mein ab sahi module count dikhta hai. Isi modal me: Course Card Image (home page + /courses cards), Course Hero Image, Advantage Card Images (\"Why Get\" ke 6 cards ke artwork), aur Hero Credential Block (Microsoft logo / AI GRC certificate mark + certificate image) — sab URL ya upload se set hote hain.',
  },
  {
    icon: Calendar,
    title: '4. Batches & Urgency',
    path: '/admin/batches',
    what: 'Cohort start dates, seats limit, aur "Only 3 seats remaining" jaisi urgency messaging ka data.',
    how: 'New batch add karo ya existing edit karo — start date, max seats, schedule. Seats kam hone par frontend automatically urgency text badal deta hai.',
  },
  {
    icon: GraduationCap,
    title: '5. Enrolled Students',
    path: '/admin/students',
    what: 'Confirmed students ka roster unke batch aur payment status ke sath.',
    how: 'Payment status dropdown se Paid / Partial / Pending set karo. Invoice icon se branded printable invoice khulti hai — browser print se PDF bana lo.',
  },
  {
    icon: CreditCard,
    title: '6. Tuition & Billing Ledger',
    path: '/admin/payments',
    what: 'Saari fees payments ki master list — kaun kitna bhuka, kab bhuka.',
    how: 'Filter lagao status se (Paid / Pending / Failed / Expired / Refunded). Search box mein student ka naam, email, phone, invoice number, coupon ya Stripe ki payment id — kuch bhi daalo. Har row par student ka poora contact, tier, discount + coupon, payment gateway reference aur paid date dikhti hai; "Invoice" button se printable invoice khulti hai. Upar "Export CSV" se poori ledger Excel mein utaar lo.',
    notes: [
      'Stripe se payment aate hi row khud ban jaati hai (Paid) — koi entry manual nahi karni. Student ka account, enrollment aur receipt email bhi automatic hote hain.',
      'Upar jo badge "Stripe checkout" ke sath dikhta hai wo batata hai gateway chalu hai ya nahi. Red ho to usi badge ke link se seedha Payment Gateway tab khul jata hai.',
    ],
  },
  {
    icon: CreditCard,
    title: '6b. Payment Gateway (Stripe) — 3-Step Khud Setup',
    path: '/admin/settings',
    what: 'Online card payments (Stripe) — publishable key, secret key aur webhook secret daal kar checkout chalu karna. Sirf admin panel se, koi developer ya redeploy ki zarurat nahi.',
    how: 'Admin → Settings → "Payment Gateway" tab. 3 steps screen par hi likhe hain: (1) Stripe → Developers → API keys se publishable key (pk_…) aur secret key (sk_…) paste karo — LIVE key paste karte hi environment khud LIVE ho jata hai, error nahi aata; (2) Stripe → Developers → Webhooks → "Add endpoint" → isi page ka webhook URL copy karke daalo, niche diye gaye paanch events select karo, phir wahan se Signing secret (whsec_…) copy karke paste karo; (3) "Test connection" dabao, phir "Save Gateway Settings".',
    notes: [
      'Test connection button Stripe se hi poochta hai: key sahi hai ya nahi, kis account ki hai, aur webhook sahi URL + saare 5 events ke sath laga hai ya nahi. Sab green = payments live. Save se pehle bhi test kar sakte ho — jo key aap paste karo wahi test hoti hai.',
      'Save karte hi change turant live ho jaata hai — server restart ya redeploy ki zarurat nahi. Status upar wale badge aur step tick (✅) se dikhta hai.',
      'Secret key kabhi dobara screen par nahi aati — sirf masked hint (jaise sk_live_…4f2a) dikhta hai. Kho jaaye to Stripe dashboard se nayi banao aur dobara paste kar do.',
      'Pehle TEST mode mein try karo: card 4242 4242 4242 4242, koi bhi future expiry, koi bhi CVC. Sab theek chale to LIVE key paste karo.',
      'Dono cheezein zaroori hain — secret key aur webhook secret. Sirf key rakhne par paisa kat jayega par student ko access turant nahi milega (confirmation webhook se aati hai).',
      'Enable/disable switch off karne par checkout apne aap "secure payment link" wale admissions form par chala jaata hai — website kabhi crash ya fake-paid nahi dikhati.',
      'WEBHOOK HEALTH: usi page par neeche ek health box hai jo batata hai Stripe ne aakhri baar kab message bheja, kitne settle hue, aur koi delivery fail/reject hui to kyun. Isse pata chalta hai ki problem Stripe side hai ya humari side.',
      'STUDENT PAID BUT NO ACCESS? Usi health box mein "Pending orders older than 30 minutes" list aati hai — us row par "Re-check with Stripe" dabayein. Stripe se seedha confirm hota hai: paisa aaya to order Paid ho kar student ka access turant on ho jata hai, warna kuch nahi badalta. Yahi button Tuition & Billing Ledger mein bhi (Pending row par) milta hai.',
      'Samne wala bhale hi "main ne Stripe se paisa bheja hai" kahe — access sirf tab milega jab Stripe ka signed message aaye ya Re-check se confirm ho. Isliye kisi ko manually Paid mark karne ki zarurat nahi padti.',
    ],
  },
  {
    icon: Briefcase,
    title: '7. Partner Job Board',
    path: '/admin/jobs',
    what: 'Public /jobs page ke saare job postings aur unpe aayi applications.',
    how: '"Post New Partner Job" dabao → form khulega. Job title, company, logo (upload), location (bilkul manual — jo likhoge wahi dikhega), min/max salary (manual numbers, default kuch nahi lagta), description aur bullet points bharo. Multi-line paste karke bullets auto-split ho jate hain. Save karte hi job live ho jata hai. "Applicant Resumes" tab mein candidates ki applications aur unka status (Reviewing → Shortlisted → Hired) manage karo.',
  },
  {
    icon: FileText,
    title: '8. Content & FAQs CMS',
    path: '/admin/content',
    what: 'Blogs, FAQs, aur Success Stories jo public pages par dikhte hain.',
    how: 'Har card type ke liye Add / Edit / Delete available hai. FAQ mein category set karna mat bhoolo (e.g. "Live Jobs") taaki wo sahi page par filter ho.',
    notes: [
      'Success Story mein naam, role, company, salary hike %, course, rating aur graduation year — ye sab website ke card par dikhte hain.',
      '"Show on the public Success Stories page" tick hona zaroori hai — untick story website par nahi aayegi (badge "Not on site" dikhega). Isi tarah blog/FAQ mein "Published" tick rakho.',
      'Admin se daali gayi story turant /success-stories page par live ho jati hai.',
    ],
  },
  {
    icon: LifeBuoy,
    title: '9. Student Support Desk',
    path: '/admin/support',
    what: 'Students ke support tickets aur unki conversations.',
    how: 'Ticket kholo, reply likho, status change karo (Open → In Progress → Resolved). Student ko LMS mein reply dikhega.',
  },
  {
    icon: GraduationCap,
    title: '10. Academy / LMS Control Centre (Poora LMS)',
    path: '/admin/lms',
    what: 'Student portal (LMS) ki har cheez yahin se chalti hai — lessons aur unke video/link, quizzes, enrollments, progress, certificates aur announcements.',
    how: 'Sidebar mein "Academy / LMS" group kholo. Har page ka kaam alag hai: LMS Overview (numbers), Curriculum Builder (course ke modules + lessons), Assessments (quiz + scores), Enrollments (student ko course/batch dena), Progress (kitna poora hua), Certificates (issue/revoke), Communications (announcement + support), LMS Settings (defaults).',
    notes: [
      'VIDEO KAISE DAALEIN (Curriculum Builder): course chuno → module ke saamne "Add lesson" → "Video link" field mein YouTube ya Vimeo ka normal link paste kar do (jaise youtube.com/watch?v=… ya vimeo.com/123) — system khud usko embed form mein badal deta hai aur neeche turant preview dikh jata hai. Sirf https:// link chalta hai; koi aur website ka link chale to sirf tab jab wo iframe allow kare.',
      'Wahi lesson form mein: Lesson notes (student video ke saath padhta hai — markdown chalta hai: ### heading, **bold**, - bullets; poora cheat sheet agle card 10b mein), Reading/PDF link, aur Lab Resources (title + URL + file type + size) — student ke page par download button ban jata hai. Resources khaali chhod do to student ko saaf-saaf "no resources" dikhega, dummy files nahi.',
      'Lesson ke saamne wale buttons: pencil = edit, eye = publish/unpublish (draft), copy = duplicate, dustbin = delete. Lesson ko drag karke module ke andar ya ek module se doosre mein le ja sakte ho; module up/down arrows se order badalta hai.',
      'QUIZ: module ke card par "Add quiz" → questions likho, options ke saamne circle daba kar sahi jawab mark karo, passing % set karo. Student ko us module ke sidebar mein Test button dikhega.',
      'CERTIFICATE: course ke saare lessons poore karne par certificate khud ban jata hai. Jab kisi ne poora kiya par certificate nahi bana (ya offline cohort hai) to Certificates → "Ready to issue" tab → "Issue certificate". Galat certificate ko Revoke kar sakte ho — uske baad public /certificate/<ID> page par saaf likha aayega ki credential withdraw ho gaya hai.',
      'SAFETY: Courses CMS se course/edit karne par yahan banaye gaye lesson ka video ya resources delete nahi honge — sirf admin khud delete karega tab hi hatenge.',
    ],
  },
  {
    icon: BookOpen,
    title: '10b. Lesson Notes Format (Markdown) + Module Numbering',
    path: '/admin/lms/curriculum',
    what: 'Student ke lesson player mein notes ab formatted dikhte hain (headings, bold, bullets) aur module numbers hamesha Module 01, 02, 03… lagataar rehte hain — is page se poora control, koi bahar ki file dekhne ki zaroorat nahi.',
    how: 'Curriculum Builder → course chuno → module → lesson → "Lesson notes" field. Wahan ye likho: ### Heading, **bold**, *italic*, `code`, - bullet, 1. numbered list, > quote, --- divider, [text](https://link). Rules: ### ke baad space zaroor ho; blank line se naya paragraph banta hai (ek hi line ke andar Enter se sirf wrap hota hai). Save karte hi student ko aise hi dikhega.',
    notes: [
      'KAUN KAHAN DEKHTA HAI: yeh format sirf student ke lesson player (Lesson Overview & Notes tab) mein lagta hai. Aapke lesson editor mein raw text hi dikhta hai — jaisa aap type karte ho.',
      'PURANE NOTES SAFE HAIN: jo ### aapne pehle type kar diya tha wo ab heading ban ke dikhega — student ko hash marks nahi dikhte, kuch dobara likhne ki zaroorat nahi.',
      'MODULE NUMBERING: student ke sidebar mein module number uski ORDER POSITION se aata hai — pehla module Module 01, phir 02, 03… bilkul lagataar. Module add/delete karne ya up/down arrows se order badalne par numbering khud adjust ho jati hai; koi number manually set nahi karna.',
      'PEHLE KA PROBLEM: pehle stored number print hota tha, isliye curriculum edit ke baad student ko "Module 02, 03, 05" jaise gaps dikh sakte the — ab aisa nahi hoga.',
    ],
  },
  {
    icon: Settings,
    title: '11. Site CMS & Settings (Sabse Powerful)',
    path: '/admin/settings',
    what: 'Poori website ka text, images, logos, banners, prices — bina code ke.',
    how: 'Tabs use karo: General (phone/email/address + top announcement banner), Homepage Sections (kisi bhi section ko Hide/Show), Homepage Hero (headline, subheadline, CTA buttons), Company Logos (marquee mein kaunsi companies dikhein — upload ya URL), Career Programs (section ka badge/headline), Personalized (apna alag price/duration), Capstone & Tools (tools grid + capstone project cards + "Capstone Engineering Benchmark Banner" — home page wale white banner ka badge/heading/line), Credentials Showcase (home page ka "03 — Verifiable US Credentials" card — heading, CTA, aur card Success Story ya Certificate), Legal & Policies (Privacy / Refund / Cookie / Terms ke poore text + pointer bullets), Checkout & Tuition (/checkout ke teen tuition blocks ka title + chhota text, aur Step 04 ka payment note — field khaali chhodo to website par kuch bhi nahi dikhega), Roadmap Steps, About & Mission, Global CTAs ($99 reserve buttons, urgency text). Har change ke baad neeche "Publish Changes" dabana zaroori hai.',
  },
  {
    icon: FileText,
    title: '11b. Legal Pages (Privacy / Refund / Cookie / Terms)',
    path: '/admin/settings',
    what: 'Chaaron policy pages ka poora text — badge, page title, "Last Updated" line, section headings, paragraphs aur pointer bullets.',
    how: 'Admin → Settings → "Legal & Policies" tab → upar se page chuno (Privacy / Refund / Cookie / Terms). Har section ka heading, paragraph aur bullets wahan se badalte hain; bullet me **bold** likhne par wo hissa bold dikhta hai. Naya section "Add Section" se, hataana dustbin se, order badalna up/down arrows se. Checkbox "Contact card dikhao" tick karo to privacy page par address + dono email + phone wala highlighted box (General & Identity tab se) aa jata hai. "Publish Changes" dabana mat bhoolna.',
  },
  {
    icon: Award,
    title: '11c. Credentials Showcase (Home Page Certificate Card)',
    path: '/admin/settings',
    what: 'Home page par "03 — Verifiable US Credentials" section ka heading, CTA aur card.',
    how: 'Admin → Settings → "Credentials Showcase" tab. Card ke do roop hain: "Success Story" (student ka naam, photo, role, company, quote, credential ID, status) aur "Certificate" (holder name, program, credential ID, status — ya apna certificate scan upload). Top buttons se jo dikhana hai wo chuno — default Success Story hai. Floating gold seal image bhi wahin badal sakte ho.',
  },
  {
    icon: PanelBottom,
    title: '11d. Footer (Logo, Do Email, Wyoming Time)',
    path: '/admin/footer',
    what: 'Footer ka logo + white oval plate, do (ya zyada) contact email, aur live Wyoming clock.',
    how: '"White oval plate behind the logo" checkbox se logo ke peeche white oval on/off hota hai (logo artwork waise hi rehta hai). "Contact emails shown in the footer" me do email add rakho — dono footer me dikhte hain ("Add email" se teesra bhi). "Live local time (Wyoming)" me clock on/off, timezone (America/Denver) aur label editable hai — clock har second update hota hai.',
  },
  {
    icon: Award,
    title: '11e. Course Page — Career Roles + Second Certificate',
    path: '/admin/courses',
    what: 'Kisi bhi course page ka "Unlock Your Potential — What Can You Become?" section (heading, subtitle aur role pills) aur certificate artwork.',
    how: 'Admin → Courses → (course ke saamne) Edit. Modal me "Career Roles" block hai: pehle "Section Heading" aur "Section Subtitle" likho, phir "Add Role" se jitne role pills chahiye utne add karo (naam + badge ka colour + "Show" checkbox); dustbin se hataao, up/down se order badlo. Jo pill "Show" se off hai wo public page par nahi dikhta — kuch role add na karo to purani default list hi dikhti hai. Usi modal me "Second Certificate Artwork (optional)" field hai: yahan doosra certificate scan (JPG/PNG ya URL) daal do — course page ke credential band me dono certificates saath dikhte hain (GRC / Microsoft jaisa do-credential track). Khali chhod do to sirf pehla certificate dikhta hai. Save karne par turant live.',
  },
  {
    icon: Users,
    title: '11f. Team / Leadership Profiles Ko Hataana',
    path: '/admin/settings',
    what: 'About page ka "Led by Industry Practitioners" section — kisi bhi member ka naam, role, experience, bio aur skills.',
    how: 'Admin → Settings → "Team & Alliances" tab. Ek member ko hatana ho to uske saamne wala "Active" checkbox off karo (data delete nahi hota, baad me wapas on kar sakte ho). Poori team ek saath hatani ho to "Deactivate All" dabao → neeche "Publish Changes" — public About page se Leadership & Faculty section pura gayab ho jayega. Wapas laane ke liye "Activate All". Bio (about paragraph) khaali chhod do to us card par about text nahi dikhega. Poora section band karna ho to About & Mission tab se "Leadership team" visibility off kar do.',
  },
  {
    icon: Layers,
    title: '12. Website Editor (Har Text Aur Image)',
    path: '/admin/website-editor',
    what: 'Website ka koi bhi lafz ya image — jo Settings aur Course CMS mein nahi hai (headings, buttons, labels, footer, banners) — wo yahan se badalta hai. Bilkul wahi page jaisa customer dekhta hai, usi par click karke.',
    how: 'Ispage par page ki list dikhti hai + kis page par kitne change hue hain. Jis page ko badalna hai uske saamne "Edit on site" dabao → naya tab khulega. Wahan jo bhi text ya image editable hai wo halki indigo line se outline ho jayegi — us par click karo, naya text likho (ya image upload karo) → "Stage change" → phir neeche panel mein "Publish". Change turant sabhi visitors ko dikhne lagta hai. Galti ho gaya to us element par "Revert", ya poore page par "Reset" dabao. Dhyan rakho: "Stage change" ke baad upar "Draft updated — press Publish to save it for every visitor" likha aata hai — us waqt tak change sirf draft hai, jab tak Publish na dabao koi visitor use nahi dekh sakta. Panel ke top par dropdown se kisi bhi page par seedha jump kar sakte ho.',
  },
  {
    icon: ImageIcon,
    title: '13. Images / PNG Upload Kaise Karein',
    path: '/admin/settings',
    what: 'Company logos, course banners, job logos — sab ImageUploadInput field se.',
    how: 'Jahan bhi image field ho: "Choose File" se apna PNG/JPG/SVG upload karo (max 10MB) — URL automatically fill ho jayega — ya seedha koi image URL paste kar do. Preview turant dikh jata hai. Publish karne par website par live.',
  },
  {
    icon: ShieldAlert,
    title: '14. Staff & Security RBAC',
    path: '/admin/users',
    what: 'Team members ke accounts, roles aur granular permissions.',
    how: 'New staff add karo → role chuno (SuperAdmin / Admin / Counselor / Instructor) aur checkboxes se specific permissions do (e.g. sirf JOBS_EDIT). Deactivated user login nahi kar sakta. Audit Trail tab (Settings mein) har admin action ka record rakhta hai.',
  },
  {
    icon: MessageSquareWarning,
    title: '15. Client Issue Reports (Screenshot + Note)',
    path: '/admin/issues',
    what: 'Website par jo bhi problem dikhe — galat text, toota layout, missing image, price — wo screenshot ke saath yahan likh do. Ek jagah sab issues, aur wahi se poora brief copy karke developer ko bhej do.',
    how: 'Upar ke box mein: pehle screenshot paste karo (Win + Shift + S se cut karo, phir Ctrl + V — ya image drag karo / "Choose file" se upload), phir neeche apne shabdon mein likh do ki kya galat hai aur kya hona chahiye. Title aur Page (jaise /courses) bhar do → "Save issue report". Neeche list mein us issue par "Copy brief" dabao — poora note + screenshots ke link copy ho jate hain; saath hi "Copy screenshot" se asli image bhi clipboard par aa jati hai, dono ek saath paste kar do. (Chrome mein paste karna sabse best chalta hai.) Status ko Open → Fixed → Verified kar ke apna record bhi rakh sakte ho, aur "What was done about it" mein fix ki details likh sakte ho. "Show exactly what gets copied" se copy hone wala text pehle dekh lo, aur "Download brief (.txt)" se file save kar lo.',
  },
  {
    icon: Images,
    title: '16. Media Library (Upload Ki Gayi Saari Images)',
    path: '/admin/media',
    what: 'Admin panel se jo bhi image upload hui hai — company logos, course images, job logos, issue screenshots — sab ek jagah. Yahan se dekho ki kaunsi image website par kahan use ho rahi hai, aur jo purani/extra hai use delete kar do.',
    how: 'Har card par badges dekho: "durable" = safely stored (redeploy ke baad bhi rahegi), "disk only" = sirf server disk par hai to next deploy par gayab ho jayegi, "in use ×N" = website par N jagah use ho rahi hai (neeche list bhi dikhti hai). "Copy URL" se poori image link copy ho jati hai — use kisi bhi image field mein paste kar sakte ho. Delete karte waqt: agar image kahin use ho rahi hai to panel pehle batayega ki kahan-kahan, aur tab tak delete nahi karega jab tak aap "Delete anyway" na dabao (warna us jagah image toot jayegi). Jo image kisi kaam ki nahi ("unused") use bina tension delete kar sakte ho — disk aur durable, dono copies mit jati hain.',
  },
];

const TIPS = [
  { icon: Save, text: 'Har form ke bottom mein Save/Publish button hota hai — usko dabaye bina kuch bhi live nahi hota.' },
  { icon: MousePointerClick, text: 'Kisi bhi card/row par hover karoge to Edit aur Delete buttons saamne aa jate hain.' },
  { icon: ImageIcon, text: 'Sabse pehle image upload tabhi URL field bharna — direct URL bhi chalega.' },
  { icon: HelpCircle, text: 'Kuch samajh na aaye to is page ko dobara khol lo ya Audit Trail check karo ki pehle kya change hua tha.' },
  { icon: Layers, text: 'Kisi bhi live page ke address ke aage ?edit=1 laga do (jaise /courses?edit=1) — wahi page editor ke saath khul jayega.' },
];

export default function AdminGuide() {
  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono uppercase tracking-widest mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            Admin Handbook
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">
            How to Use the Admin Panel
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Step-by-step guide for every section — images, text, prices, jobs, aur poori website content yahin se control hota hai.
          </p>
        </div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Quick Tips Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TIPS.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <Icon className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-300 leading-relaxed">{tip.text}</p>
            </div>
          );
        })}
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.title}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/30 transition-colors flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{sec.title}</h3>
                </div>
                <Link
                  to={sec.path}
                  className="text-[11px] font-mono text-blue-400 hover:text-blue-300 whitespace-nowrap"
                >
                  Open →
                </Link>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">What it does</div>
                <p className="text-xs text-slate-300 leading-relaxed">{sec.what}</p>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">How to use (Hinglish)</div>
                <p className="text-xs text-slate-400 leading-relaxed">{sec.how}</p>
              </div>

              {sec.notes && (
                <ul className="space-y-1.5 border-t border-slate-800 pt-3">
                  {sec.notes.map((note) => (
                    <li key={note} className="flex items-start gap-2 text-[11px] text-red-200/80 leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Pricing note about separate Career Program vs Personalized Learning */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-red-500/30 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-red-300">
          <DollarSign className="w-4 h-4" />
          Career Program vs Personalized Learning — Pricing Separately
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Career Programs</strong> ka price/duration <em>Admin → Courses</em> se edit hota hai (har course ka apna).{' '}
          <strong className="text-white">Personalized Learning</strong> ka alag price, deposit aur duration <em>Admin → Settings → Personalized tab</em> se edit hota hai. Dono independent hain — ek change karne se dusra affect nahi hota.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          <BookOpen className="w-3.5 h-3.5 inline text-red-400 mr-1" />
          <strong className="text-white">Curriculum</strong> ka poora control ab <em>Courses → Edit</em> ke "Curriculum Module Composer" se hai: module ka naam, topics (lessons), aur hours. Jitne topics comma se likhoge, utne lessons us module mein ban jayenge, aur course page par wahi dikhenge. Kisi topic ko hata diya to uska lesson bhi hat jayega.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          <Layers className="w-3.5 h-3.5 inline text-red-400 mr-1" />
          Capstone projects bhi do jagah se control hote hain: <em>Settings → Capstone & Tools → Capstone Project Showcase Cards</em> (saare course pages override) aur <em>Courses → Edit Course → Capstone</em> (course-specific).
        </p>
      </div>
    </div>
  );
}
