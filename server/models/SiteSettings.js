const mongoose = require('mongoose');

const ToolItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: 'Data & AI' },
  logo: { type: String, default: '' },
  url: { type: String, default: '' },
  description: { type: String, default: '' },
  badge: { type: String, default: 'Core Standard' },
  order: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
}, { _id: true });

const RoadmapStepSchema = new mongoose.Schema({
  number: { type: String, default: '01' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  tag: { type: String, default: 'Orientation' },
  icon: { type: String, default: 'Compass' },
  order: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
}, { _id: true });

// Capstone showcase card (rendered on every course detail page when filled in).
// NOTE: this schema MUST stay in sync with the admin editors in
// CoursesCMS (course modal) and SettingsCMS (Capstone tab) — a field the UI can
// write but the schema does not declare is silently discarded by mongoose
// strict mode, which is exactly how capstone edits used to disappear.
const CapstoneProjectSchema = new mongoose.Schema({
  tag: { type: String, default: 'Machine Learning' },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  stack: [{ type: String }],
  color: { type: String, default: 'from-indigo-500 to-blue-500' },
  order: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
}, { _id: true });

// ── Footer CMS ──────────────────────────────────────────────────────────────
// The footer is fully admin-managed: columns, links, legal links, contact,
// copyright text and logo size all come from here. Reordering / hiding is done
// with `order` + `active`, so nothing is ever deleted just to hide it.
const FooterLinkSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  url: { type: String, default: '' },
  order: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
}, { _id: true });

const FooterColumnSchema = new mongoose.Schema({
  title: { type: String, default: 'New Column' },
  order: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
  links: { type: [FooterLinkSchema], default: [] },
}, { _id: true });

const FooterSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  logo: { type: String, default: '/images/logo-horizontal-white.webp' },
  logoWidth: { type: Number, default: 160 },
  description: {
    type: String,
    default:
      'An accredited US technology workforce institute providing rigorous cohort fellowships in applied AI engineering, offensive cybersecurity, and enterprise cloud architecture.',
  },
  badgeText: { type: String, default: 'Wyoming Registered Corporate Charter' },
  copyrightText: {
    type: String,
    default: '© 2026 American FutureTech LLC. All rights reserved. Registered in Wyoming, USA.',
  },
  hiringStrip: {
    enabled: { type: Boolean, default: true },
    text: {
      type: String,
      default:
        'Alumni Engineering at Leading Enterprise & High-Growth Technology Companies',
    },
  },
  cta: {
    enabled: { type: Boolean, default: true },
    label: { type: String, default: 'Contact Admissions Advisor' },
    url: { type: String, default: '' },
  },
  columns: { type: [FooterColumnSchema], default: [] },
  legalLinks: { type: [FooterLinkSchema], default: [] },
}, { _id: false });

const CompanyLogoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: { type: String, default: '' },
  website: { type: String, default: '' },
  order: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
}, { _id: true });

// Leadership & Faculty team member (About page)
const LeaderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: 'Leadership' },
  experience: { type: String, default: '' },
  badge: { type: String, default: 'Leadership' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  linkedin: { type: String, default: '' },
  image: { type: String, default: '' },
  order: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
}, { _id: true });

// Sister company / staffing alliance block
const SisterCompanySchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  eyebrow: { type: String, default: 'Sister Staffing Company • Strategic Alliance' },
  name: { type: String, default: 'Redmont Global Inc.' },
  badge: { type: String, default: 'Sister Company' },
  location: { type: String, default: 'Branchburg, New Jersey • Nationwide Reach' },
  headline: { type: String, default: 'Connecting Top Talent with Leading Companies Through Smart Recruitment' },
  tagline: { type: String, default: 'Connecting top talent with leading companies through smart recruitment and staffing solutions.' },
  description: { type: String, default: 'While American FutureTech provides live academy training and certifications, Redmont Global Inc. handles specialized enterprise recruitment, corporate C2C staffing, and direct placements with Fortune 500 companies.' },
  website: { type: String, default: '' },
  stats: {
    shortlistHours: { type: String, default: '48h' },
    shortlistLabel: { type: String, default: 'Shortlists' },
    vetted: { type: String, default: '100%' },
    vettedLabel: { type: String, default: 'Vetted' },
    placement: { type: String, default: 'Direct' },
    placementLabel: { type: String, default: 'Placement' },
  },
  services: {
    type: [{ title: { type: String }, desc: { type: String } }],
    default: [
      { title: 'IT Staffing & Recruitment', desc: 'Sourcing and screening specialized software engineers, data scientists, AI architects, and cybersecurity specialists.' },
      { title: 'C2C Staffing Solutions', desc: 'Corporation-to-Corporation contracts, vendor compliance, and dedicated technical contractors for corporate teams.' },
      { title: 'Direct Hire & Contract Staffing', desc: 'Flexible models including project contracts, contract-to-hire, and executive permanent placements.' },
      { title: 'Temporary & Permanent Placements', desc: 'Fast deployment for project spikes, seasonal surges, and long-term permanent full-time technical hires.' },
      { title: 'Workforce & Talent Solutions', desc: 'Strategic workforce planning, talent advisory, salary benchmarking, and customized hiring pipelines for enterprise employers.' },
    ],
  },
}, { _id: false });

// "Build-First" pedagogy block (About page)
const PedagogySchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  eyebrow: { type: String, default: 'Pedagogy' },
  title: { type: String, default: 'The "Build-First" Learning Approach' },
  description: { type: String, default: 'Traditional bootcamps rely heavily on pre-recorded videos and shallow toy examples. At American FutureTech, our methodology centers on 70% hands-on project building and 30% deep theoretical foundation.' },
  handsOnPercent: { type: Number, default: 70 },
  theoryPercent: { type: Number, default: 30 },
  pillars: {
    type: [{ title: { type: String }, desc: { type: String }, icon: { type: String } }],
    default: [
      { title: 'Production-Grade Capstones', desc: 'Build real AI agents, RAG systems, and virtual penetration testing labs that reflect enterprise environments.', icon: 'Terminal' },
      { title: 'Line-by-Line Code Reviews', desc: 'Receive direct instructor feedback on code efficiency, security vulnerabilities, and architectural patterns.', icon: 'FileCode2' },
      { title: 'Verifiable Credentialing', desc: 'Earn cryptographically verifiable certificates with unique IDs that prove your skills to recruiters.', icon: 'Award' },
    ],
  },
  stats: {
    type: [{ value: { type: String }, label: { type: String } }],
    default: [
      { value: '2,000+', label: 'Students Trained' },
      { value: '89.9%', label: 'Career Growth' },
      { value: '6+', label: 'Years Experience' },
      { value: '3', label: 'Countries Served' },
    ],
  },
}, { _id: false });

// Career Support (6-stage framework + transparency)
const CareerSupportSchema = new mongoose.Schema({
  title: { type: String, default: 'The Six Pillars of Career Acceleration' },
  subtitle: { type: String, default: 'Every enrolled learner receives direct, hands-on guidance through each phase of career preparation.' },
  stages: {
    type: [{ stage: { type: String }, title: { type: String }, tagline: { type: String }, points: [{ type: String }], icon: { type: String } }],
    default: [
      { stage: 'STAGE 01', title: 'Resume Development', tagline: 'Professional resume optimization', icon: 'FileText', points: ['ATS-optimized formatting engineered for tech recruiter software', 'Strategic alignment of technical keywords and project impacts', 'Quantified business outcome framing for all capstone deliverables', 'Multiple tailored versions for Data Science, AI, or Security job tracks'] },
      { stage: 'STAGE 02', title: 'LinkedIn Optimization', tagline: 'Profile positioning & recruiter visibility', icon: 'Linkedin', points: ['Keyword-dense headlines and about summaries designed for search rank', 'Featured projects and interactive GitHub portfolio showcase', 'Strategic skills endorsement and professional recommendation strategy', 'Network growth and recruiter inbound engagement playbooks'] },
      { stage: 'STAGE 03', title: 'Mock Interviews', tagline: 'Technical + HR preparation', icon: 'MessagesSquare', points: ['1-on-1 live technical mock interviews with senior engineers', 'Real-time feedback on code efficiency, logic explanation, and edge cases', 'Behavioral and leadership question practice using the STAR methodology', 'Post-interview scorecards highlighting strengths and improvement points'] },
      { stage: 'STAGE 04', title: 'Portfolio Development', tagline: 'Projects, GitHub, and deployable demos', icon: 'Code2', points: ['Clean, well-documented GitHub repositories with production READMEs', 'Live deployed web applications, ML APIs, and interactive dashboards', 'Architecture diagrams explaining enterprise design choices', 'End-to-end data pipelines and automated testing demonstrations'] },
      { stage: 'STAGE 05', title: 'Interview Preparation', tagline: 'Technical interview practice & drills', icon: 'Zap', points: ['Algorithmic problem-solving drills in Python and SQL', 'System design fundamentals for AI, ML, and Cyber Defense systems', 'Live debugging and live code execution assessments', 'Deep-dive preparation on machine learning theory and security frameworks'] },
      { stage: 'STAGE 06', title: 'Job Search Guidance', tagline: 'Application strategy and career roadmapping', icon: 'Compass', points: ['Targeted company prospecting across tech, finance, and healthcare', 'High-conversion cold email and LinkedIn outreach templates', 'Hiring partner referral introductions and application tracking', 'Offer evaluation, benefits analysis, and compensation negotiation support'] },
    ],
  },
  transparency: {
    title: { type: String, default: 'What "Placement Assistance" Actually Means' },
    description: { type: String, default: 'We believe in radical honesty. We do not use gimmicky "guaranteed job" promises. Here is the exact, comprehensive scope of what our career support delivers.' },
    whatWeProvide: { type: [String], default: ['Direct Resume Rewrites: 1-on-1 line-by-line editing to pass enterprise ATS scans.', '1-on-1 Mock Technical Interviews: Live coding sessions and system design evaluations with detailed feedback scorecards.', 'Hiring Partner Introductions: Referrals to our network of staffing partners and corporate hiring pipelines.', 'Offer & Salary Negotiation: Guidance on evaluating total compensation packages, stock options, and bonuses.'] },
    studentAccountability: { type: [String], default: ['Active Project Completion: Learners must complete all required capstone assignments and maintain clean GitHub code.', 'Dedicated Practice: Consistent effort on algorithmic drills, SQL queries, and interview question preparation.', 'Proactive Applications: Executing on targeted application strategies and responding promptly to recruiter screenings.', 'Merit-Based Outcomes: Final hiring decisions belong to employers; our framework maximizes your interview performance.'] },
  },
  transitions: {
    type: [{ name: { type: String }, fromRole: { type: String }, toRole: { type: String }, quote: { type: String }, company: { type: String }, linkedin: { type: String } }],
    default: [
      { name: 'Jessica Martinez', fromRole: 'Data Analyst', toRole: 'Data Analyst', quote: 'The Data Science program gave me the skills and confidence to move into an AI role. The support and mentorship were amazing!', company: 'Apex Financial Analytics' },
      { name: 'Rahul Sharma', fromRole: 'Software Engineer', toRole: 'Software Engineer', quote: 'Hands-on projects and expert mentors made all the difference. Highly recommended!', company: 'Synthetix Cloud Labs' },
      { name: 'Priya Sharma', fromRole: 'IT Consultant', toRole: 'IT Consultant', quote: 'A well-structured program with excellent instructors. I gained real-world skills and confidence to grow in my career.', company: 'Vanguard Cyber Defense' },
    ],
  },
}, { _id: false });

const SiteSettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'American FutureTech',
  },
  // Legal entity printed in the footer and on the policy pages.
  legalName: {
    type: String,
    default: 'American FutureTech LLC',
  },
  tagline: {
    type: String,
    default: 'Empowering Next-Gen Tech Leaders with AI, Cyber Security & Cloud',
  },
  contactEmail: {
    type: String,
    default: 'info@americantechgloballlc.com',
  },
  contactPhone: {
    type: String,
    default: '+1 (816) 846-6717',
  },
  headquartersAddress: {
    type: String,
    default: '30 N Gould St Ste R, Sheridan, WY 82801, United States',
  },
  announcementBanner: {
    enabled: { type: Boolean, default: true },
    text: { type: String, default: '🚀 Next Live Cohort Starts Soon — Reserve Your Seat with Only $99 Deposit!' },
    badge: { type: String, default: 'New Cohort' },
    linkText: { type: String, default: 'Explore Programs' },
    linkUrl: { type: String, default: '/courses' },
    // Older admin UI wrote these names; kept so an existing document still resolves.
    active: { type: Boolean },
    link: { type: String },
  },
  socialLinks: {
    linkedin: { type: String, default: 'https://linkedin.com/company/american-futuretech' },
    youtube: { type: String, default: 'https://youtube.com/@American_FutureTech' },
    instagram: { type: String, default: 'https://instagram.com/american_futuretech' },
    twitter: { type: String, default: 'https://x.com/americanfuturetech' },
  },
  depositPriceUSD: {
    type: Number,
    default: 99,
  },

  // 🌟 CAREER PROGRAMS SECTION CMS (headline + badge above the course grid)
  courses: {
    headline: { type: String, default: 'Flagship Career Programs' },
    subheadline: { type: String, default: 'Live, mentor-led fellowships engineered for hire-ready technical competence.' },
    badgeText: { type: String, default: 'Career Programs' },
  },

  // 🌟 VISUAL "EDIT ANYTHING" OVERRIDES
  // Free-form, route-scoped maps written by the inline site editor so an admin
  // can change any single text or image on the public site without a code edit.
  //
  //   textOverrides:  { "/courses": { "main>section>h1#0": { original, value, updatedAt } } }
  //   imageOverrides: { "/about":   { "main>img#0":           { original, value, updatedAt } } }
  //
  // Shape and size limits are enforced in settingsController before saving.
  textOverrides: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  imageOverrides: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isMaintenanceMode: {
    type: Boolean,
    default: false,
  },

  // 🌟 PAYMENT GATEWAY (Stripe) — configured from Admin → Payment Gateway.
  // Secrets are stored ENCRYPTED (utils/secretVault) and are never returned by
  // any API response; the admin only ever sees a masked hint.
  paymentGateway: {
    enabled: { type: Boolean, default: true },
    provider: { type: String, default: 'stripe' },
    mode: { type: String, enum: ['test', 'live'], default: 'test' },
    publishableKey: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
    checkoutNote: {
      type: String,
      default: 'Payment is processed by Stripe with 256-bit TLS and 3-D Secure. Your enrollment is confirmed instantly.',
    },
    disabledMessage: {
      type: String,
      default:
        'Online card payments are temporarily unavailable. Submit an admissions enquiry and our team will send you a secure payment link within 24 hours.',
    },
    secretKeyEncrypted: { type: String, default: '' },
    secretKeyHint: { type: String, default: '' },
    webhookSecretEncrypted: { type: String, default: '' },
    webhookSecretHint: { type: String, default: '' },
    lastUpdatedBy: { type: String, default: '' },
    lastUpdatedAt: { type: Date, default: null },
  },

  // 🌟 REGISTRATION CONTROLS
  // Student accounts are created by staff by default. Flip this only if the
  // client ever wants open public signups again.
  registration: {
    allowPublicStudentRegistration: { type: Boolean, default: false },
    closedMessage: {
      type: String,
      default:
        'Student accounts are created by our admissions team. Please submit an admission enquiry and a counselor will set up your access.',
    },
  },

  // 🌟 ABOUT PAGE SECTION VISIBILITY
  // Inactive sections are hidden on the public page but never deleted, so the
  // client can switch them back on later.
  aboutSections: {
    hero: { type: Boolean, default: true },
    missionVision: { type: Boolean, default: true },
    charter: { type: Boolean, default: true },
    pedagogy: { type: Boolean, default: true },
    story: { type: Boolean, default: true },
    stats: { type: Boolean, default: true },
    team: { type: Boolean, default: true },
    sisterCompany: { type: Boolean, default: true },
    certifications: { type: Boolean, default: true },
    cta: { type: Boolean, default: true },
    faqs: { type: Boolean, default: true },
  },

  // 🌟 HOMEPAGE SECTION VISIBILITY CONTROLS
  sectionVisibility: {
    hero: { type: Boolean, default: true },
    trustMarquee: { type: Boolean, default: true },
    metrics: { type: Boolean, default: true },
    learningJourney: { type: Boolean, default: true },
    courses: { type: Boolean, default: true },
    personalizedLearning: { type: Boolean, default: true },
    tools: { type: Boolean, default: true },
    roadmap: { type: Boolean, default: true },
    whyChooseUs: { type: Boolean, default: true },
    faqs: { type: Boolean, default: true },
    callToAction: { type: Boolean, default: true },
  },

  // 🌟 HOMEPAGE HERO CMS
  hero: {
    eyebrow: { type: String, default: 'ACCREDITED US TECHNOLOGY INSTITUTE • SPRING 2026' },
    eyebrowBadgeText: { type: String, default: 'AMERICAN FUTURETECH · 6-MONTH CAREER TRAINING & FELLOWSHIPS' },
    headline: { type: String, default: 'Master Applied Emerging Tech. Launch Elite Careers.' },
    subheadline: { type: String, default: 'Live instructor-led fellowships in Artificial Intelligence, Cyber Security, and Cloud Architecture. Master 40+ industry tools, defend real capstones, and access our vetted hiring partner network.' },
    primaryCtaText: { type: String, default: 'Reserve Your Seat — $99' },
    primaryCtaLink: { type: String, default: '/checkout' },
    secondaryCtaText: { type: String, default: 'Explore Programs' },
    secondaryCtaLink: { type: String, default: '/courses' },
    statsBadgeText: { type: String, default: '1,200+ Fellows Placed' },
    showAnimation: { type: Boolean, default: true },
  },

  // 🌟 PERSONALIZED LEARNING CMS (Separate Fee & Features)
  personalizedLearning: {
    title: { type: String, default: 'Personalized 1-on-1 Applied Mentorship Track' },
    subtitle: { type: String, default: 'Customized Curriculum Tailored to Your Prior Background & Target Tech Role' },
    duration: { type: String, default: 'Custom / 3 to 6 Months' },
    badgeText: { type: String, default: 'Exclusive 1-on-1 Mentorship Track' },
    fee: { type: Number, default: 5499 },
    price: { type: Number, default: 5499 },
    originalFee: { type: Number, default: 6999 },
    originalPrice: { type: Number, default: 6999 },
    depositPrice: { type: Number, default: 99 },
    discount: { type: String, default: 'Spring Cohort Offer' },
    description: { type: String, default: 'A bespoke, private mentorship fellowship engineered for career switchers and accelerated upskilling. Includes 1-on-1 weekly code reviews, personalized capstone project architectures, and custom pacing.' },
    features: {
      type: [String],
      default: [
        'Everything in the group programs (all live cohorts + recordings)',
        'Weekly private 1-on-1 mentorship with a senior industry practitioner',
        'Personalized interview preparation, system design and mock interviews',
        'Salary negotiation coaching and dedicated career support',
        'Bespoke production capstone designed for your exact domain',
        'Direct recruiter portfolio review and hiring partner referral access'
      ]
    },
    tools: {
      type: [String],
      default: ['Python', 'Docker', 'AWS', 'LangChain', 'PostgreSQL', 'Git']
    },
    certification: { type: String, default: 'US Verifiable Specialized Completion Credential' },
    ctaText: { type: String, default: 'Reserve Personalized Seat — $99' },
    ctaLink: { type: String, default: '/checkout' },
    active: { type: Boolean, default: true },
  },

  // 🌟 CAPSTONE & TOOLS CMS
  capstone: {
    title: { type: String, default: 'Production Capstone Defenses' },
    subtitle: { type: String, default: 'Build and Defend Real-World Production Systems — Not Toy Code' },
    description: { type: String, default: 'Every fellowship culminates in an enterprise-grade capstone project evaluated by external tech leaders. You demonstrate end-to-end architecture, automated testing, security benchmarks, and cloud deployment.' },
    outcomes: {
      type: [String],
      default: [
        'Deploy low-latency production inference pipelines on AWS / GCP',
        'Architect end-to-end containerized microservices with Docker & Kubernetes',
        'Conduct ethical penetration tests with Kali Linux and defend against live CVEs',
        'Live architectural defense panel evaluated by Silicon Valley engineering leads'
      ]
    },
    tools: {
      type: [ToolItemSchema],
      default: [
        { name: 'Python', category: 'Data & AI', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', badge: 'Core Standard', order: 1, active: true, description: 'Core programming language for AI, data systems, and automation.' },
        { name: 'Docker', category: 'DevOps & Cloud', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg', badge: 'DevOps Standard', order: 2, active: true, description: 'Enterprise container virtualization platform for immutable deployments.' },
        { name: 'AWS', category: 'DevOps & Cloud', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg', badge: 'Cloud Leader', order: 3, active: true, description: 'Production cloud infrastructure, ECS, EKS, and serverless compute.' },
        { name: 'PyTorch', category: 'Data & AI', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg', badge: 'Production AI', order: 4, active: true, description: 'Deep learning framework powering computer vision and LLM models.' },
        { name: 'Git', category: 'Development', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg', badge: 'Version Control', order: 5, active: true, description: 'Distributed version control and professional code collaboration.' },
        { name: 'GitHub', category: 'Development', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg', badge: 'CI/CD Platform', order: 6, active: true, description: 'Repository hosting, automated actions, and enterprise review workflows.' },
        { name: 'Jupyter', category: 'Data & AI', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original.svg', badge: 'Data Science', order: 7, active: true, description: 'Interactive computational notebooks for data exploration and analysis.' },
        { name: 'Hugging Face', category: 'Data & AI', logo: 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg', badge: 'Transformers', order: 8, active: true, description: 'Open-source ecosystem for transformer models, weights, and fine-tuning.' },
        { name: 'PostgreSQL', category: 'Data & Analytics', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg', badge: 'Relational DB', order: 9, active: true, description: 'Advanced open-source relational database with robust ACID compliance.' },
        { name: 'Kubernetes', category: 'DevOps & Cloud', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg', badge: 'Orchestration', order: 10, active: true, description: 'Automated container deployment, scaling, and cluster management.' }
      ]
    },
    // Empty by default so each course keeps showing its own curated capstone
    // cards until the admin publishes site-wide showcase cards here.
    projects: {
      type: [CapstoneProjectSchema],
      default: [],
    },
    ctaText: { type: String, default: 'Reserve Capstone Seat — $99' },
    ctaLink: { type: String, default: '/checkout' },
  },

  // 🌟 PLACEMENT ROADMAP CMS
  roadmap: {
    title: { type: String, default: '6-Step Roadmap to Your Dream Job' },
    subtitle: { type: String, default: 'Proven Career Transformation System' },
    steps: {
      type: [RoadmapStepSchema],
      default: [
        { number: '01', title: 'Choose Your Program', description: 'Explore our industry-aligned programs and select the track that matches your career aspirations.', tag: 'Orientation & Advisory', icon: 'Compass', order: 1, active: true },
        { number: '02', title: 'Learn & Build', description: 'Gain hands-on experience through live mentor-led classes, real-world projects, and industry tools.', tag: 'Hands-on Labs', icon: 'Code2', order: 2, active: true },
        { number: '03', title: 'Practice & Assess', description: 'Validate your skills with quizzes, coding challenges, and capstone projects reviewed by experts.', tag: 'Peer & Expert Review', icon: 'CheckSquare', order: 3, active: true },
        { number: '04', title: 'Get Certified', description: 'Earn a globally recognized certificate from American FutureTech to showcase your expertise to employers.', tag: 'US Digital Credential', icon: 'Award', order: 4, active: true },
        { number: '05', title: 'Get Job Ready', description: 'Receive 1-on-1 resume reviews, LinkedIn optimization, mock interviews, and career coaching.', tag: 'Career Architecture', icon: 'UserCheck', order: 5, active: true },
        { number: '06', title: 'Launch Your Career', description: 'Access our exclusive hiring partner network, attend placement drives, and land your dream tech job.', tag: 'Direct Introductions', icon: 'Rocket', order: 6, active: true }
      ]
    },
  },

  // 🌟 ABOUT / MISSION / VISION CMS
  aboutCMS: {
    aboutTitle: { type: String, default: 'Pioneering Applied Emerging Tech Education for the Global Workforce.' },
    // Read by the About page hero; without these the admin's About tab could not save at all.
    headline: { type: String, default: 'Bridging the Divide Between Academia and Global Industry' },
    bodyParagraphs: { type: [String], default: [] },
    missionTarget: { type: String, default: 'Target: 100,000+ Certified Tech Leaders' },
    visionTagline: { type: String, default: 'Global Workforce Transformation Standard' },
    aboutText: { type: String, default: 'Founded with a singular standard: technical excellence forged through hands-on production code, verified by accredited US credentials, and accelerated into elite technology careers.' },
    missionTitle: { type: String, default: 'Building the next generation of applied technology leaders.' },
    missionText: { type: String, default: 'We combine the academic rigor of premier North American computer science curricula with the pragmatic urgency of Silicon Valley engineering sprints.' },
    visionTitle: { type: String, default: 'The Standard for Verified Technical Competence.' },
    visionText: { type: String, default: 'To become the gold standard global technology workforce accelerator, trusted by Fortune 500 engineering directors for verified, day-one production-ready technical talent.' },
  },

  // 🌟 LEADERSHIP & FACULTY CMS (About page team)
  leadership: {
    type: [LeaderSchema],
    default: [
      {
        name: 'Mandeep Saraswat', role: 'Founder & CEO', badge: 'Leadership', experience: '8+ Years — Leadership & Business Growth', order: 1, active: true,
        bio: 'With 8+ years of experience in leadership, sales management, business development, and client relations, I lead with a strong focus on building meaningful partnerships and creating long-term value. As Founder and CEO, I am passionate about business growth, innovation, and delivering education and business solutions that make a real impact.',
        skills: ['Business Strategy', 'Sales Management', 'Client Relations', 'Business Development', 'Innovation', 'Partnership Building'], linkedin: '',
      },
      {
        name: 'Suresh Gupta', role: 'Business & Operations Director', badge: 'Leadership', experience: '15+ Years — Business & Operations Management', order: 2, active: true,
        bio: 'With 15+ years of experience in business management, project management, sales, and operations, I specialize in turning business strategies into practical results. I focus on building strong teams, improving operations, growing the business, and developing lasting relationships with clients and partners.',
        skills: ['Project Management', 'Operations', 'Sales Strategy', 'Team Building', 'Client Partnerships', 'Business Growth'], linkedin: '',
      },
      {
        name: 'Priyanshu Sharma', role: 'Managing Director — US Staffing & Recruitment', badge: 'Leadership', experience: '6+ Years — US Staffing & Talent Acquisition', order: 3, active: true,
        bio: 'With 6+ years of experience in US staffing and recruitment, I specialize in client management, talent acquisition, and delivering the right staffing solutions for business needs. As Managing Director, I focus on driving growth, developing strategic partnerships, and building strong, long-term relationships with clients.',
        skills: ['US Staffing', 'Talent Acquisition', 'Client Management', 'Recruitment Strategy', 'Strategic Partnerships', 'Business Development'], linkedin: '',
      },
      {
        name: 'Raja Ranjan', role: 'AI & Cybersecurity Lead', badge: 'Faculty Lead', experience: '15+ Years — Cybersecurity & AI Training', order: 4, active: true,
        bio: 'Certified Cybersecurity Expert and Corporate Trainer with 15+ years of experience in cybersecurity and AI, I specialize in helping professionals and enterprises build smarter security capabilities. My work focuses on AI-driven threat detection, automated incident response, and machine learning-based security analysis to create stronger, proactive defenses.',
        skills: ['Cybersecurity', 'AI & ML', 'Threat Detection', 'Incident Response', 'Ethical Hacking', 'Corporate Training'], linkedin: '',
      },
      {
        name: 'Ankit Kumar', role: 'AI Lead Architect', badge: 'Faculty Lead', experience: '6+ Years — Building & Teaching AI', order: 5, active: true,
        bio: 'With 6 years of experience, I work as a Senior AI Engineer and Technology Architect, specializing in enterprise machine learning and agentic AI systems. I focus on designing scalable AI solutions, solving complex technology challenges, and mentoring 10,000+ technology professionals worldwide through practical, industry-focused learning.',
        skills: ['Machine Learning', 'Deep Learning', 'Generative AI', 'LLMs', 'AI Agents', 'Python', 'Data Science'], linkedin: '',
      },
      {
        name: 'Prince Chaudhary', role: 'Client Relations Lead', badge: 'Leadership', experience: '4+ Years — Client Relations & Account Management', order: 6, active: true,
        bio: 'With 4+ years of experience in account management and client relationship management, I specialize in understanding client needs, building strong partnerships, and ensuring a positive client experience. I focus on clear communication, trust, and delivering consistent results that support both client satisfaction and business growth.',
        skills: ['Account Management', 'Client Relations', 'Communication', 'Trust Building', 'Customer Experience', 'Business Growth'], linkedin: '',
      },
    ],
  },

  // 🌟 SISTER COMPANY / STAFFING ALLIANCE CMS
  sisterCompany: {
    type: SisterCompanySchema,
    default: () => ({}),
  },

  // 🌟 "BUILD-FIRST" PEDAGOGY CMS
  pedagogy: {
    type: PedagogySchema,
    default: () => ({}),
  },

  // 🌟 CAREER SUPPORT CMS (6-stage framework)
  careerSupport: {
    type: CareerSupportSchema,
    default: () => ({}),
  },

  // 🌟 FOOTER CMS (columns, links, legal, contact, logo size)
  footer: {
    type: FooterSchema,
    default: () => ({
      columns: [
        {
          title: 'Engineering Fellowships',
          order: 1,
          active: true,
          links: [
            { label: 'Data Science with AI Integration', url: '/courses/data-science-with-ai-integration', order: 1 },
            { label: 'Cyber Security & Ethical Hacking', url: '/courses/cyber-security-with-ethical-hacking', order: 2 },
            { label: 'Cyber Security & AI Hybrid Track', url: '/courses/cyber-security-and-artificial-intelligence', order: 3 },
            { label: 'Advanced Generative & Agentic AI', url: '/courses/advanced-generative-and-agentic-ai-master-program', order: 4 },
            { label: 'View All Specializations', url: '/courses', order: 5 },
          ],
        },
        {
          title: 'Company',
          order: 2,
          active: true,
          links: [
            { label: 'About Us', url: '/about', order: 1 },
            { label: 'Registration & Tuition', url: '/checkout', order: 2 },
            { label: 'Careers & Live Jobs', url: '/careers', order: 3 },
            { label: 'Success Stories', url: '/success-stories', order: 4 },
            { label: 'Insights & Blog', url: '/blog', order: 5 },
            { label: 'Contact Admissions', url: '/contact', order: 6 },
          ],
        },
        {
          title: 'Student Resources',
          order: 3,
          active: true,
          links: [
            { label: 'Student LMS Classroom', url: '/student/login', order: 1 },
            { label: 'Digital Credential Verification', url: '/certificate/AFT-CERT-AI9821', order: 2 },
            { label: 'Frequently Asked Questions', url: '/faq', order: 3 },
            { label: 'Certifications', url: '/certifications/artificial-intelligence', order: 4 },
          ],
        },
        {
          title: 'Academy Portals',
          order: 4,
          active: true,
          links: [
            { label: 'Enterprise Staff Console', url: '/admin/login', order: 1 },
            { label: 'Verified Employer Jobs', url: '/careers', order: 2 },
            { label: 'Career Support Framework', url: '/career-support', order: 3 },
          ],
        },
      ],
      legalLinks: [
        { label: 'Privacy Policy', url: '/privacy', order: 1 },
        { label: 'Refund & Return Policy', url: '/refund-policy', order: 2 },
        { label: 'Cookie Policy', url: '/cookie-policy', order: 3 },
        { label: 'Terms & Conditions', url: '/terms', order: 4 },
        { label: 'About Us', url: '/about', order: 5 },
        { label: 'Live Jobs', url: '/careers', order: 6 },
      ],
    }),
  },

  // 🌟 GLOBAL CTAs CMS
  globalCtas: {
    depositButtonText: { type: String, default: 'Reserve Your Seat — $99' },
    enrollButtonText: { type: String, default: 'Enroll Now — $99' },
    seatsUrgencyText: { type: String, default: 'Spring 2026 Cohort • Limited to 25 Seats per Track' },
    careerAssistanceNotice: { type: String, default: '100% Placement Support & Direct Partner Introductions' },
    // Global reserve-seat controls used by the homepage CTAs.
    reserveSeatText: { type: String, default: 'Reserve Your Seat' },
    reserveSeatUrl: { type: String, default: '/checkout' },
    reserveSeatPrice: { type: Number, default: 99 },
    urgencyBannerText: { type: String, default: '' },
  },

  // 🌟 BRAND & COMPANY LOGOS CMS
  trustedCompanies: {
    heading: { type: String, default: 'TRUSTED BY LEARNERS FROM LEADING GLOBAL COMPANIES' },
    subheading: { type: String, default: 'Our alumni engineer mission-critical systems across Fortune 500 tech leaders' },
    companies: {
      type: [CompanyLogoSchema],
      default: [
        { name: 'Google', logoUrl: '/images/companies/google.svg', order: 1, active: true },
        { name: 'Microsoft', logoUrl: '/images/companies/microsoft.svg', order: 2, active: true },
        { name: 'Amazon Web Services', logoUrl: '/images/companies/aws.svg', order: 3, active: true },
        { name: 'IBM', logoUrl: '/images/companies/ibm.svg', order: 4, active: true },
        { name: 'Infosys', logoUrl: '/images/companies/infosys.svg', order: 5, active: true },
        { name: 'Accenture', logoUrl: '/images/companies/accenture.svg', order: 6, active: true },
        { name: 'Intel', logoUrl: '/images/companies/intel.svg', order: 7, active: true },
        { name: 'Meta', logoUrl: '/images/companies/meta.svg', order: 8, active: true }
      ]
    }
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);
