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

const SiteSettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'American FutureTech',
  },
  tagline: {
    type: String,
    default: 'Empowering Next-Gen Tech Leaders with AI, Cyber Security & Cloud',
  },
  contactEmail: {
    type: String,
    default: 'admissions@americanfuturetech.com',
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
  isMaintenanceMode: {
    type: Boolean,
    default: false,
  },

  // 🌟 HOMEPAGE HERO CMS
  hero: {
    eyebrow: { type: String, default: 'ACCREDITED US TECHNOLOGY INSTITUTE • SPRING 2026' },
    headline: { type: String, default: 'Master Applied Emerging Tech. Launch Elite Careers.' },
    subheadline: { type: String, default: 'Live instructor-led fellowships in Artificial Intelligence, Cyber Security, and Cloud Architecture. Master 40+ industry tools, defend real capstones, and access our vetted hiring partner network.' },
    primaryCtaText: { type: String, default: 'Reserve Your Seat — $99' },
    primaryCtaLink: { type: String, default: '/checkout' },
    secondaryCtaText: { type: String, default: 'Explore Programs' },
    secondaryCtaLink: { type: String, default: '/courses' },
    showAnimation: { type: Boolean, default: true },
  },

  // 🌟 PERSONALIZED LEARNING CMS (Separate Fee & Features)
  personalizedLearning: {
    title: { type: String, default: 'Personalized 1-on-1 Applied Mentorship Track' },
    subtitle: { type: String, default: 'Customized Curriculum Tailored to Your Prior Background & Target Tech Role' },
    duration: { type: String, default: 'Custom / 3 to 6 Months' },
    fee: { type: Number, default: 2199 },
    originalFee: { type: Number, default: 2999 },
    discount: { type: String, default: '27% Off Spring Cohort' },
    description: { type: String, default: 'A bespoke, private mentorship fellowship engineered for career switchers and accelerated upskilling. Includes 1-on-1 weekly code reviews, personalized capstone project architectures, and custom pacing.' },
    features: {
      type: [String],
      default: [
        'Dedicated 1-on-1 Senior Industry Practitioner Mentor',
        'Custom-tailored curriculum matching your exact career target',
        'Private weekly code reviews and live debugging sessions',
        'Bespoke production capstone designed for your domain',
        'Direct recruiter portfolio review and referral access'
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
    aboutText: { type: String, default: 'Founded with a singular standard: technical excellence forged through hands-on production code, verified by accredited US credentials, and accelerated into elite technology careers.' },
    missionTitle: { type: String, default: 'Building the next generation of applied technology leaders.' },
    missionText: { type: String, default: 'We combine the academic rigor of premier North American computer science curricula with the pragmatic urgency of Silicon Valley engineering sprints.' },
    visionTitle: { type: String, default: 'The Standard for Verified Technical Competence.' },
    visionText: { type: String, default: 'To become the gold standard global technology workforce accelerator, trusted by Fortune 500 engineering directors for verified, day-one production-ready technical talent.' },
  },

  // 🌟 GLOBAL CTAs CMS
  globalCtas: {
    depositButtonText: { type: String, default: 'Reserve Your Seat — $99' },
    enrollButtonText: { type: String, default: 'Enroll Now — $99' },
    seatsUrgencyText: { type: String, default: 'Spring 2026 Cohort • Limited to 25 Seats per Track' },
    careerAssistanceNotice: { type: String, default: '100% Placement Support & Direct Partner Introductions' },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);
