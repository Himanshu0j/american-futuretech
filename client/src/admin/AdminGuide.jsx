import React from 'react';
import {
  LayoutDashboard, Users, BookOpen, Calendar, GraduationCap, CreditCard,
  Briefcase, FileText, LifeBuoy, Settings, ShieldAlert, HelpCircle,
  ArrowLeft, Image as ImageIcon, DollarSign, Layers, MousePointerClick, Save, CheckCircle2
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
    how: 'Edit (✏️) button dabao → modal khulega. Yahan se title, tuition fee, discounted price, duration, highlights, aur curriculum modules edit karo. Save karte hi website par live update ho jata hai — module add/rename/delete karo, course page turant badal jata hai (lessons bhi wahin se bante hain). Badge dropdown se "Most Popular" etc. turant switch hota hai. Capstone projects bhi isi modal ke Capstone section se edit hote hain. Course list mein ab sahi module count dikhta hai.',
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
    how: 'Filter lagao status ya date se. Payment record khud checkout aur students manager se banta hai — yahan se sirf track karo.',
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
    icon: Settings,
    title: '10. Site CMS & Settings (Sabse Powerful)',
    path: '/admin/settings',
    what: 'Poori website ka text, images, logos, banners, prices — bina code ke.',
    how: 'Tabs use karo: General (phone/email/address + top announcement banner), Homepage Sections (kisi bhi section ko Hide/Show), Homepage Hero (headline, subheadline, CTA buttons), Company Logos (marquee mein kaunsi companies dikhein — upload ya URL), Career Programs (section ka badge/headline), Personalized (apna alag price/duration), Capstone & Tools (tools grid + capstone project cards), Roadmap Steps, About & Mission, Global CTAs ($99 reserve buttons, urgency text). Har change ke baad neeche "Publish Changes" dabana zaroori hai.',
  },
  {
    icon: Layers,
    title: '11. Website Editor (Har Text Aur Image)',
    path: '/admin/website-editor',
    what: 'Website ka koi bhi lafz ya image — jo Settings aur Course CMS mein nahi hai (headings, buttons, labels, footer, banners) — wo yahan se badalta hai. Bilkul wahi page jaisa customer dekhta hai, usi par click karke.',
    how: 'Ispage par page ki list dikhti hai + kis page par kitne change hue hain. Jis page ko badalna hai uske saamne "Edit on site" dabao → naya tab khulega. Wahan jo bhi text ya image editable hai wo halki indigo line se outline ho jayegi — us par click karo, naya text likho (ya image upload karo) → "Stage change" → phir neeche panel mein "Publish". Change turant sabhi visitors ko dikhne lagta hai. Galti ho gaya to us element par "Revert", ya poore page par "Reset" dabao. Panel ke top par dropdown se kisi bhi page par seedha jump kar sakte ho.',
  },
  {
    icon: ImageIcon,
    title: '12. Images / PNG Upload Kaise Karein',
    path: '/admin/settings',
    what: 'Company logos, course banners, job logos — sab ImageUploadInput field se.',
    how: 'Jahan bhi image field ho: "Choose File" se apna PNG/JPG/SVG upload karo (max 10MB) — URL automatically fill ho jayega — ya seedha koi image URL paste kar do. Preview turant dikh jata hai. Publish karne par website par live.',
  },
  {
    icon: ShieldAlert,
    title: '13. Staff & Security RBAC',
    path: '/admin/users',
    what: 'Team members ke accounts, roles aur granular permissions.',
    how: 'New staff add karo → role chuno (SuperAdmin / Admin / Counselor / Instructor) aur checkboxes se specific permissions do (e.g. sirf JOBS_EDIT). Deactivated user login nahi kar sakta. Audit Trail tab (Settings mein) har admin action ka record rakhta hai.',
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-2">
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
              <Icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
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
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition-colors flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{sec.title}</h3>
                </div>
                <Link
                  to={sec.path}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 whitespace-nowrap"
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
                    <li key={note} className="flex items-start gap-2 text-[11px] text-amber-200/80 leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
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
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-amber-500/30 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
          <DollarSign className="w-4 h-4" />
          Career Program vs Personalized Learning — Pricing Separately
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Career Programs</strong> ka price/duration <em>Admin → Courses</em> se edit hota hai (har course ka apna).{' '}
          <strong className="text-white">Personalized Learning</strong> ka alag price, deposit aur duration <em>Admin → Settings → Personalized tab</em> se edit hota hai. Dono independent hain — ek change karne se dusra affect nahi hota.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          <BookOpen className="w-3.5 h-3.5 inline text-amber-400 mr-1" />
          <strong className="text-white">Curriculum</strong> ka poora control ab <em>Courses → Edit</em> ke "Curriculum Module Composer" se hai: module ka naam, topics (lessons), aur hours. Jitne topics comma se likhoge, utne lessons us module mein ban jayenge, aur course page par wahi dikhenge. Kisi topic ko hata diya to uska lesson bhi hat jayega.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          <Layers className="w-3.5 h-3.5 inline text-amber-400 mr-1" />
          Capstone projects bhi do jagah se control hote hain: <em>Settings → Capstone & Tools → Capstone Project Showcase Cards</em> (saare course pages override) aur <em>Courses → Edit Course → Capstone</em> (course-specific).
        </p>
      </div>
    </div>
  );
}
