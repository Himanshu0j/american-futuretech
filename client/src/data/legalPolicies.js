/**
 * Legal policy page defaults.
 *
 * These blocks are the *fallback* copy for /privacy, /refund-policy,
 * /cookie-policy and /terms. The live pages render whatever the admin saved in
 * Admin → Settings → Legal & Policies; when nothing has been saved yet they
 * render exactly the text below, so making the pages CMS-driven never changed
 * a single published word.
 *
 * Shape (mirrors `policies.<key>` in server/models/SiteSettings.js):
 *   { badge, title, lastUpdated, intro, sections: [{ heading, body, bullets[], contactBlock }] }
 *
 * Bullets may wrap a leading label in **double asterisks** — the page renders
 * that part bold (this is how "Personal Identifiers:", "Essential Session
 * Tokens:" etc. stay emphasised for the admin while remaining plain text).
 */
export const LEGAL_POLICY_DEFAULTS = {
  privacy: {
    badge: 'Institutional Data Protection Policy',
    title: 'Privacy Policy',
    lastUpdated: 'January 1, 2026 • American Futuretech LLC (Wyoming, USA)',
    intro: '',
    sections: [
      {
        heading: '1. Introduction & Scope',
        body:
          'American Futuretech LLC ("American FutureTech", "we", "our", or "us"), an EdTech and professional technology training organization incorporated in Sheridan, Wyoming, USA, is committed to safeguarding the privacy and security of prospective students, enrolled fellows, alumni, and website visitors.\n\nThis Privacy Policy explains how we collect, use, disclose, and protect personal information when you visit our website, apply for fellowship cohorts, access our Learning Management System (LMS), or interact with our admissions and placement teams.',
        bullets: [],
      },
      {
        heading: '2. Information We Collect',
        body: '',
        bullets: [
          '**Personal Identifiers:** Name, email address, telephone number, mailing address, government ID for accredited certification verification.',
          '**Academic & Career Information:** Resume/CV, GitHub portfolio link, LinkedIn profile URL, educational background, and capstone project submissions.',
          '**Billing & Tuition Information:** Payment transaction records, billing addresses, and payment gateway invoice tokens (credit card details are processed directly by PCI-DSS compliant payment gateways).',
          '**Telemetry & Usage Data:** LMS progress telemetry, laboratory sandbox completion records, IP address, device telemetry, and session logs.',
        ],
      },
      {
        heading: '3. How We Use Your Data',
        body: 'We process your personal information strictly for legitimate educational, administrative, and placement purposes:',
        bullets: [
          'To evaluate fellowship cohort applications and deliver instructor-led live training.',
          'To issue verifiable, tamper-evident digital certificates registered under official American Futuretech LLC seals.',
          'To facilitate direct career placement introductions with vetted technology partner employers upon student consent.',
          'To maintain compliance with US corporate record-keeping and accreditation standards.',
        ],
      },
      {
        heading: '4. Data Retention & Security',
        body:
          'We implement enterprise-grade security protocols, including AES-256 encryption at rest, TLS 1.3 encryption in transit, and role-based access control (RBAC) to ensure unauthorized parties cannot access student academic files or personal identifiers.',
        bullets: [],
      },
      {
        heading: '5. Contact Institutional Privacy Officer',
        body: '',
        bullets: [],
        contactBlock: true,
      },
    ],
  },

  refund: {
    badge: 'Academic Tuition Guarantee',
    title: 'Refund & Return Policy',
    lastUpdated: 'January 1, 2026 • American Futuretech LLC (Wyoming, USA)',
    intro: '',
    sections: [
      {
        heading: '1. 14-Day Academic Trial Window',
        body:
          'American FutureTech offers a transparent, student-first admissions policy. If within the first 14 calendar days of your fellowship cohort start date you decide that the curriculum does not align with your professional goals, you are eligible for a 100% full refund of tuition fees paid, minus non-refundable third-party credential registration fees.',
        bullets: [],
      },
      {
        heading: '2. Refund Eligibility Criteria',
        body: '',
        bullets: [
          'Refund requests must be formally submitted in writing to info@americanfuturetechllc.com before the conclusion of Day 14 of the cohort.',
          'Students must have attended or viewed all orientation sessions and submitted initial diagnostic assessments to qualify for unconditional withdrawal.',
          'After the 14-day trial period, tuition payments are committed to reserving faculty instruction and live sandbox infrastructure; prorated refunds will be evaluated on a case-by-case basis under verified medical emergencies.',
        ],
      },
      {
        heading: '3. Processing Timeline',
        body:
          'Approved refund requests are credited back to the original method of payment (credit card, wire transfer, or financing provider) within 5 to 7 business days following formal approval by the Admissions Bursar.',
        bullets: [],
      },
      {
        heading: '4. Cohort Transfer & Deferral Option',
        body:
          'In lieu of cancellation, students in good standing may request a one-time cohort deferral to a future cohort date at no additional fee, provided written notice is submitted at least 7 days prior to scheduled batch commencement.',
        bullets: [],
      },
    ],
  },

  cookies: {
    badge: 'Digital Telemetry Disclosure',
    title: 'Cookie Policy',
    lastUpdated: 'January 1, 2026 • American Futuretech LLC (Wyoming, USA)',
    intro: '',
    sections: [
      {
        heading: '1. What Are Cookies?',
        body:
          'Cookies are small alphanumeric files placed on your device by your web browser when you visit websites. They enable the site to authenticate your session, remember your preferences, and maintain secure user authentication states across our Learning Management System.',
        bullets: [],
      },
      {
        heading: '2. Cookies We Utilize',
        body: '',
        bullets: [
          '**Essential Session Tokens:** Strictly necessary for authenticating student accounts, safeguarding JWT tokens, and keeping your session active in the LMS classroom.',
          '**Functional & Preference Cookies:** Remembers your UI display modes, sound preferences, and code editor themes.',
          '**Performance Telemetry:** Aggregated analytical metrics that help our engineering team diagnose page load performance and optimize interactive sandbox speeds.',
        ],
      },
      {
        heading: '3. Managing Your Cookie Preferences',
        body:
          'Most web browsers permit you to modify cookie controls through browser settings. Disabling essential cookies may impair access to your authenticated student dashboard and active lesson video player.',
        bullets: [],
      },
    ],
  },

  terms: {
    badge: 'Academic Fellowship Terms of Service',
    title: 'Terms & Conditions',
    lastUpdated: 'January 1, 2026 • American Futuretech LLC (Wyoming, USA)',
    intro: '',
    sections: [
      {
        heading: '1. Agreement to Terms',
        body:
          'By accessing the website, enrolling in educational fellowship cohorts, utilizing our Learning Management System (LMS), or applying for positions through the Partner Career Network of American Futuretech LLC ("American FutureTech", "we", "us"), you agree to be bound by these Terms and Conditions.',
        bullets: [],
      },
      {
        heading: '2. Academic Integrity & Code of Conduct',
        body:
          'Fellows are expected to maintain the highest standards of professional and academic honesty. Capstone submissions, code reviews, and laboratory assessments must reflect authentic original work. Plagiarism or unauthorized sharing of proprietary course code repositories results in immediate expulsion without refund.',
        bullets: [],
      },
      {
        heading: '3. Intellectual Property Rights',
        body:
          'All curriculum designs, lesson videos, laboratory virtual machines, and architectural documentation provided by American FutureTech are proprietary assets protected under United States and international copyright laws. Code produced independently by students in personal capstone projects remains the intellectual property of the student.',
        bullets: [],
      },
      {
        heading: '4. Certification & Credential Verification',
        body:
          'Completion certificates are conferred upon students who fulfill minimum attendance thresholds, pass technical capstone defenses, and resolve payment obligations. American FutureTech maintains permanent public verification endpoints allowing third-party employers to authenticate graduate credentials.',
        bullets: [],
      },
      {
        heading: '5. Governing Law & Jurisdiction',
        body:
          'These Terms shall be governed by and construed in accordance with the laws of the State of Wyoming, United States, without regard to its conflict of law provisions.',
        bullets: [],
      },
    ],
  },
};

/** Order + human labels used by the admin Legal & Policies tab. */
export const LEGAL_POLICY_PAGES = [
  { key: 'privacy', label: 'Privacy Policy', route: '/privacy' },
  { key: 'refund', label: 'Refund & Return Policy', route: '/refund-policy' },
  { key: 'cookies', label: 'Cookie Policy', route: '/cookie-policy' },
  { key: 'terms', label: 'Terms & Conditions', route: '/terms' },
];

/** Merge the saved (possibly partial) policy over the coded default. */
export const mergePolicy = (key, saved) => {
  const base = LEGAL_POLICY_DEFAULTS[key] || { badge: '', title: '', lastUpdated: '', intro: '', sections: [] };
  const incoming = saved || {};
  const sections = Array.isArray(incoming.sections) && incoming.sections.length > 0
    ? incoming.sections
    : base.sections;

  return {
    badge: incoming.badge || base.badge,
    title: incoming.title || base.title,
    lastUpdated: incoming.lastUpdated || base.lastUpdated,
    intro: incoming.intro || base.intro,
    // NOTE: no editor-only keys here — the whole settings document is PUT back
    // to the API, and a field the schema does not declare would be reported as
    // "not saved". React re-renders use the array index instead.
    sections: sections.map((section) => ({
      heading: section?.heading || '',
      body: section?.body || '',
      bullets: Array.isArray(section?.bullets) ? section.bullets : [],
      contactBlock: section?.contactBlock === true,
    })),
  };
};

export default LEGAL_POLICY_DEFAULTS;
