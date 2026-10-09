/**
 * Central fallback content for sections ported from the American Tech Global
 * content set (leadership & faculty, sister staffing company, "build-first"
 * pedagogy, six-stage career support framework and the enterprise tool stack).
 *
 * The admin CMS (Settings → About & Mission / Career Support / Capstone & Tools)
 * overrides every block below whenever saved values exist.
 */

export const DEFAULT_LEADERSHIP = [
  {
    name: 'Mandeep Saraswat',
    role: 'Founder & CEO',
    badge: 'Leadership',
    experience: '8+ Years — Leadership & Business Growth',
    bio: 'With 8+ years of experience in leadership, sales management, business development, and client relations, I lead with a strong focus on building meaningful partnerships and creating long-term value. As Founder and CEO, I am passionate about business growth, innovation, and delivering education and business solutions that make a real impact.',
    skills: ['Business Strategy', 'Sales Management', 'Client Relations', 'Business Development', 'Innovation', 'Partnership Building'],
    linkedin: '',
  },
  {
    name: 'Suresh Gupta',
    role: 'Business & Operations Director',
    badge: 'Leadership',
    experience: '15+ Years — Business & Operations Management',
    bio: 'With 15+ years of experience in business management, project management, sales, and operations, I specialize in turning business strategies into practical results. I focus on building strong teams, improving operations, growing the business, and developing lasting relationships with clients and partners.',
    skills: ['Project Management', 'Operations', 'Sales Strategy', 'Team Building', 'Client Partnerships', 'Business Growth'],
    linkedin: '',
  },
  {
    name: 'Priyanshu Sharma',
    role: 'Managing Director — US Staffing & Recruitment',
    badge: 'Leadership',
    experience: '6+ Years — US Staffing & Talent Acquisition',
    bio: 'With 6+ years of experience in US staffing and recruitment, I specialize in client management, talent acquisition, and delivering the right staffing solutions for business needs. As Managing Director, I focus on driving growth, developing strategic partnerships, and building strong, long-term relationships with clients.',
    skills: ['US Staffing', 'Talent Acquisition', 'Client Management', 'Recruitment Strategy', 'Strategic Partnerships', 'Business Development'],
    linkedin: '',
  },
  {
    name: 'Raja Ranjan',
    role: 'AI & Cybersecurity Lead',
    badge: 'Faculty Lead',
    experience: '15+ Years — Cybersecurity & AI Training',
    bio: 'Certified Cybersecurity Expert and Corporate Trainer with 15+ years of experience in cybersecurity and AI, I specialize in helping professionals and enterprises build smarter security capabilities. My work focuses on AI-driven threat detection, automated incident response, and machine-learning-based security analysis to create stronger, proactive defenses.',
    skills: ['Cybersecurity', 'AI & ML', 'Threat Detection', 'Incident Response', 'Ethical Hacking', 'Corporate Training'],
    linkedin: '',
  },
  {
    name: 'Ankit Kumar',
    role: 'AI Lead Architect',
    badge: 'Faculty Lead',
    experience: '6+ Years — Building & Teaching AI',
    bio: 'With 6 years of experience, I work as a Senior AI Engineer and Technology Architect, specializing in enterprise machine learning and agentic AI systems. I focus on designing scalable AI solutions, solving complex technology challenges, and mentoring 10,000+ technology professionals worldwide through practical, industry-focused learning.',
    skills: ['Machine Learning', 'Deep Learning', 'Generative AI', 'LLMs', 'AI Agents', 'Python', 'Data Science'],
    linkedin: '',
  },
  {
    name: 'Prince Chaudhary',
    role: 'Client Relations Lead',
    badge: 'Leadership',
    experience: '4+ Years — Client Relations & Account Management',
    bio: 'With 4+ years of experience in account management and client relationship management, I specialize in understanding client needs, building strong partnerships, and ensuring a positive client experience. I focus on clear communication, trust, and delivering consistent results that support both client satisfaction and business growth.',
    skills: ['Account Management', 'Client Relations', 'Communication', 'Trust Building', 'Customer Experience', 'Business Growth'],
    linkedin: '',
  },
];

export const DEFAULT_SISTER_COMPANY = {
  enabled: true,
  eyebrow: 'Sister Staffing Company • Strategic Alliance',
  name: 'Redmont Global Inc.',
  badge: 'Sister Company',
  location: 'Branchburg, New Jersey • Nationwide Reach',
  headline: 'Connecting Top Talent with Leading Companies Through Smart Recruitment',
  tagline: 'Connecting top talent with leading companies through smart recruitment and staffing solutions.',
  description:
    'While American FutureTech provides live academy training and certifications, Redmont Global Inc. handles specialized enterprise recruitment, corporate C2C staffing, and direct placements with Fortune 500 companies.',
  website: '',
  stats: {
    shortlistHours: '48h',
    shortlistLabel: 'Shortlists',
    vetted: '100%',
    vettedLabel: 'Vetted',
    placement: 'Direct',
    placementLabel: 'Placement',
  },
  services: [
    { title: 'IT Staffing & Recruitment', desc: 'Sourcing and screening specialized software engineers, data scientists, AI architects, and cybersecurity specialists.' },
    { title: 'C2C Staffing Solutions', desc: 'Corporation-to-Corporation contracts, vendor compliance, and dedicated technical contractors for corporate teams.' },
    { title: 'Direct Hire & Contract Staffing', desc: 'Flexible models including project contracts, contract-to-hire, and executive permanent placements.' },
    { title: 'Temporary & Permanent Placements', desc: 'Fast deployment for project spikes, seasonal surges, and long-term permanent full-time technical hires.' },
    { title: 'Workforce & Talent Solutions', desc: 'Strategic workforce planning, talent advisory, salary benchmarking, and customized hiring pipelines for enterprise employers.' },
  ],
};

export const DEFAULT_PEDAGOGY = {
  enabled: true,
  eyebrow: 'Pedagogy',
  title: 'The "Build-First" Learning Approach',
  description:
    'Traditional bootcamps rely heavily on pre-recorded videos and shallow toy examples. At American FutureTech, our methodology centers on 70% hands-on project building and 30% deep theoretical foundation.',
  handsOnPercent: 70,
  theoryPercent: 30,
  pillars: [
    { title: 'Production-Grade Capstones', desc: 'Build real AI agents, RAG systems, and virtual penetration testing labs that reflect enterprise environments.', icon: 'Terminal' },
    { title: 'Line-by-Line Code Reviews', desc: 'Receive direct instructor feedback on code efficiency, security vulnerabilities, and architectural patterns.', icon: 'FileCode2' },
    { title: 'Verifiable Credentialing', desc: 'Earn cryptographically verifiable certificates with unique IDs that prove your skills to recruiters.', icon: 'Award' },
  ],
  stats: [
    { value: '2,000+', label: 'Students Trained' },
    { value: '89.9%', label: 'Career Growth' },
    { value: '6+', label: 'Years Experience' },
    { value: '3', label: 'Countries Served' },
  ],
};

export const DEFAULT_CAREER_SUPPORT = {
  title: 'The Six Pillars of Career Acceleration',
  subtitle: 'Every enrolled learner receives direct, hands-on guidance through each phase of career preparation.',
  stages: [
    {
      stage: 'STAGE 01', title: 'Resume Development', tagline: 'Professional resume optimization', icon: 'FileText',
      points: [
        'ATS-optimized formatting engineered for tech recruiter software',
        'Strategic alignment of technical keywords and project impacts',
        'Quantified business outcome framing for all capstone deliverables',
        'Multiple tailored versions for Data Science, AI, or Security job tracks',
      ],
    },
    {
      stage: 'STAGE 02', title: 'LinkedIn Optimization', tagline: 'Profile positioning & recruiter visibility', icon: 'Linkedin',
      points: [
        'Keyword-dense headlines and about summaries designed for search rank',
        'Featured projects and interactive GitHub portfolio showcase',
        'Strategic skills endorsement and professional recommendation strategy',
        'Network growth and recruiter inbound engagement playbooks',
      ],
    },
    {
      stage: 'STAGE 03', title: 'Mock Interviews', tagline: 'Technical + HR preparation', icon: 'MessagesSquare',
      points: [
        '1-on-1 live technical mock interviews with senior engineers',
        'Real-time feedback on code efficiency, logic explanation, and edge cases',
        'Behavioral and leadership question practice using the STAR methodology',
        'Post-interview scorecards highlighting strengths and improvement points',
      ],
    },
    {
      stage: 'STAGE 04', title: 'Portfolio Development', tagline: 'Projects, GitHub, and deployable demos', icon: 'Code2',
      points: [
        'Clean, well-documented GitHub repositories with production READMEs',
        'Live deployed web applications, ML APIs, and interactive dashboards',
        'Architecture diagrams explaining enterprise design choices',
        'End-to-end data pipelines and automated testing demonstrations',
      ],
    },
    {
      stage: 'STAGE 05', title: 'Interview Preparation', tagline: 'Technical interview practice & drills', icon: 'Zap',
      points: [
        'Algorithmic problem-solving drills in Python and SQL',
        'System design fundamentals for AI, ML, and Cyber Defense systems',
        'Live debugging and live code execution assessments',
        'Deep-dive preparation on machine learning theory and security frameworks',
      ],
    },
    {
      stage: 'STAGE 06', title: 'Job Search Guidance', tagline: 'Application strategy and career roadmapping', icon: 'Compass',
      points: [
        'Targeted company prospecting across tech, finance, and healthcare',
        'High-conversion cold email and LinkedIn outreach templates',
        'Hiring partner referral introductions and application tracking',
        'Offer evaluation, benefits analysis, and compensation negotiation support',
      ],
    },
  ],
  transparency: {
    title: 'What "Placement Assistance" Actually Means',
    description: 'We believe in radical honesty. We do not use gimmicky "guaranteed job" promises. Here is the exact, comprehensive scope of what our career support delivers.',
    whatWeProvide: [
      'Direct Resume Rewrites: 1-on-1 line-by-line editing to pass enterprise ATS scans.',
      '1-on-1 Mock Technical Interviews: Live coding sessions and system design evaluations with detailed feedback scorecards.',
      'Hiring Partner Introductions: Referrals to our network of staffing partners and corporate hiring pipelines.',
      'Offer & Salary Negotiation: Guidance on evaluating total compensation packages, stock options, and bonuses.',
    ],
    studentAccountability: [
      'Active Project Completion: Learners must complete all required capstone assignments and maintain clean GitHub code.',
      'Dedicated Practice: Consistent effort on algorithmic drills, SQL queries, and interview question preparation.',
      'Proactive Applications: Executing on targeted application strategies and responding promptly to recruiter screenings.',
      'Merit-Based Outcomes: Final hiring decisions belong to employers; our framework maximizes your interview performance.',
    ],
  },
  transitions: [
    { name: 'Jessica Martinez', fromRole: 'Data Analyst', toRole: 'Data Analyst', quote: 'The Data Science program gave me the skills and confidence to move into an AI role. The support and mentorship were amazing!', company: 'Apex Financial Analytics', linkedin: '' },
    { name: 'Rahul Sharma', fromRole: 'Software Engineer', toRole: 'Software Engineer', quote: 'Hands-on projects and expert mentors made all the difference. Highly recommended!', company: 'Synthetix Cloud Labs', linkedin: '' },
    { name: 'Priya Sharma', fromRole: 'IT Consultant', toRole: 'IT Consultant', quote: 'A well-structured program with excellent instructors. I gained real-world skills and confidence to grow in my career.', company: 'Vanguard Cyber Defense', linkedin: '' },
  ],
};

/**
 * Enterprise tool stack grouped by discipline (Courses page "Tools & Tech Stack").
 *
 * Every mark is served from this site, under /images/tools. No logo is fetched
 * from cdn.jsdelivr.net or cdn.simpleicons.org any more: that section draws 36
 * logos in six lanes, so the CDNs sat on the critical path of the page's most
 * image-dense area — a fresh DNS lookup and TLS handshake per host on top of the
 * download — and any CDN hiccup or corporate/mobile block turned the lanes into
 * broken-image icons, which is what "aadhi images nahi dikh rahi" looked like.
 * Local SVGs are cacheable, tiny, and cannot 404 because a CDN moved a path.
 *
 * A brand we have no right to ship keeps `logo: ''`; the page then draws a
 * letter monogram tile, so a lane can never show a broken image. Non-empty
 * values still win: the admin "Capstone & Tools" CMS can supply its own logo.
 */
const TOOL_ICONS = '/images/tools';

/**
 * Marks the third-party CDNs refused (404/403 — mostly trademark takedowns) and
 * that therefore live in /images/tools instead. Kept as the record of which
 * brands MUST stay local: putting any of these back on a CDN URL brings the
 * broken tiles straight back. Verified dead on the CDNs 2026-09-24.
 */
export const VERIFIED_DEAD_TOOL_LOGOS = [
  'nmap', 'wireshark', 'powerbi', 'tableau', 'openai', 'onetrust', 'servicenow',
  'drata', 'vanta', 'bigid', 'collibra', 'productboard',
];

export const DEFAULT_TOOL_CATEGORIES = [
  {
    id: 'security',
    label: 'Cyber Security & Ethical Hacking',
    color: 'rose',
    tools: [
      { name: 'Kali Linux', logo: `${TOOL_ICONS}/linux.svg` },
      { name: 'Wireshark', logo: `${TOOL_ICONS}/wireshark.svg` },
      { name: 'Python', logo: `${TOOL_ICONS}/python.svg` },
      { name: 'Nmap', logo: `${TOOL_ICONS}/nmap.svg` },
      { name: 'Burp Suite', logo: `${TOOL_ICONS}/burpsuite.svg` },
      { name: 'Metasploit', logo: `${TOOL_ICONS}/metasploit.svg` },
    ],
  },
  {
    id: 'data',
    label: 'Data Science & Analytics',
    color: 'sky',
    tools: [
      { name: 'TensorFlow', logo: `${TOOL_ICONS}/tensorflow.svg` },
      { name: 'PyTorch', logo: `${TOOL_ICONS}/pytorch.svg` },
      { name: 'pandas', logo: `${TOOL_ICONS}/pandas.svg` },
      { name: 'NumPy', logo: `${TOOL_ICONS}/numpy.svg` },
      { name: 'Power BI', logo: `${TOOL_ICONS}/powerbi.svg` },
      { name: 'Tableau', logo: `${TOOL_ICONS}/tableau.svg` },
    ],
  },
  {
    id: 'genai',
    label: 'Generative & Agentic AI',
    color: 'violet',
    tools: [
      { name: 'LangChain', logo: `${TOOL_ICONS}/langchain.svg` },
      { name: 'OpenAI', logo: `${TOOL_ICONS}/openai.svg` },
      { name: 'Claude', logo: `${TOOL_ICONS}/claude.svg` },
      { name: 'Gemini', logo: `${TOOL_ICONS}/gemini.svg` },
      { name: 'Docker', logo: `${TOOL_ICONS}/docker.svg` },
      { name: 'FastAPI', logo: `${TOOL_ICONS}/fastapi.svg` },
    ],
  },
  {
    id: 'grc',
    label: 'Governance, Risk & Compliance',
    color: 'emerald',
    tools: [
      { name: 'OneTrust', logo: '' },
      { name: 'ServiceNow GRC', logo: '' },
      { name: 'Drata', logo: '' },
      { name: 'Vanta', logo: '' },
      { name: 'BigID', logo: '' },
      { name: 'Collibra', logo: '' },
    ],
  },
  {
    id: 'product',
    label: 'Product & Collaboration',
    color: 'amber',
    tools: [
      { name: 'Jira', logo: `${TOOL_ICONS}/jira.svg` },
      { name: 'Figma', logo: `${TOOL_ICONS}/figma.svg` },
      { name: 'Notion', logo: `${TOOL_ICONS}/notion.svg` },
      { name: 'Miro', logo: `${TOOL_ICONS}/miro.svg` },
      { name: 'Productboard', logo: '' },
      { name: 'Mixpanel', logo: `${TOOL_ICONS}/mixpanel.svg` },
    ],
  },
  {
    id: 'ops',
    label: 'Security Operations & Big Data',
    color: 'indigo',
    tools: [
      { name: 'Splunk', logo: `${TOOL_ICONS}/splunk.svg` },
      { name: 'OWASP ZAP', logo: `${TOOL_ICONS}/owasp.svg` },
      { name: 'scikit-learn', logo: `${TOOL_ICONS}/scikitlearn.svg` },
      { name: 'Hadoop', logo: `${TOOL_ICONS}/hadoop.svg` },
      { name: 'Apache Spark', logo: `${TOOL_ICONS}/spark.svg` },
      { name: 'GitHub', logo: `${TOOL_ICONS}/github.svg` },
    ],
  },
];

/**
 * Starting point for the admin's "Career Paths" list (Settings → Career Paths).
 *
 * The complete coded list of the flagship Data Science track — the positions the
 * client reviewed — so pressing "Load default positions" in the admin puts every
 * one of them in the editor as a real row, renameable/removable, instead of the
 * admin retyping the list to change a single job title.
 *
 * The list must stay COMPLETE: seeding only the rows visible in a screenshot
 * would silently delete the rest from the page the first time the admin saves.
 * It is only a seed for the editor; whatever the admin saves takes over.
 */
export const DEFAULT_CAREER_OPPORTUNITIES = {
  eyebrow: 'Career Opportunities',
  heading: 'Unlock Your Potential — What Can You Become?',
  subtitle: '',
  roles: [
    { name: 'Machine Learning Engineer', color: 'from-blue-500 to-blue-500', order: 1, active: true },
    { name: 'Data Scientist', color: 'from-blue-500 to-blue-500', order: 2, active: true },
    { name: 'AI Research Scientist', color: 'from-blue-500 to-blue-500', order: 3, active: true },
    { name: 'NLP Engineer', color: 'from-red-500 to-yellow-500', order: 4, active: true },
    { name: 'Computer Vision Engineer', color: 'from-red-500 to-red-500', order: 5, active: true },
    { name: 'Data Engineer', color: 'from-blue-500 to-blue-500', order: 6, active: true },
    { name: 'Business Intelligence Analyst', color: 'from-blue-500 to-blue-500', order: 7, active: true },
    { name: 'MLOps Engineer', color: 'from-blue-500 to-blue-500', order: 8, active: true },
    { name: 'AI Product Manager', color: 'from-blue-500 to-blue-500', order: 9, active: true },
    { name: 'AI Solutions Architect', color: 'from-red-500 to-red-500', order: 10, active: true },
  ],
};
