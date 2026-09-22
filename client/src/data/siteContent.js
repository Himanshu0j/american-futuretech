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
 * Icon URLs use the same CDN pattern as the capstone tools CMS.
 */
const DEV = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

export const DEFAULT_TOOL_CATEGORIES = [
  {
    id: 'security',
    label: 'Cyber Security & Ethical Hacking',
    color: 'rose',
    tools: [
      { name: 'Kali Linux', logo: `${DEV}/linux/linux-original.svg` },
      { name: 'Wireshark', logo: `${DEV}/wireshark/wireshark-original.svg` },
      { name: 'Python', logo: `${DEV}/python/python-original.svg` },
      { name: 'Nmap', logo: 'https://cdn.simpleicons.org/nmap/4682B4' },
      { name: 'Burp Suite', logo: 'https://cdn.simpleicons.org/portswigger/FF6633' },
      { name: 'Metasploit', logo: 'https://cdn.simpleicons.org/metasploit/2596CD' },
    ],
  },
  {
    id: 'data',
    label: 'Data Science & Analytics',
    color: 'sky',
    tools: [
      { name: 'TensorFlow', logo: `${DEV}/tensorflow/tensorflow-original.svg` },
      { name: 'PyTorch', logo: `${DEV}/pytorch/pytorch-original.svg` },
      { name: 'pandas', logo: `${DEV}/pandas/pandas-original.svg` },
      { name: 'NumPy', logo: `${DEV}/numpy/numpy-original.svg` },
      { name: 'Power BI', logo: 'https://cdn.simpleicons.org/powerbi/F2C811' },
      { name: 'Tableau', logo: 'https://cdn.simpleicons.org/tableau/E97627' },
    ],
  },
  {
    id: 'genai',
    label: 'Generative & Agentic AI',
    color: 'violet',
    tools: [
      { name: 'LangChain', logo: 'https://cdn.simpleicons.org/langchain/1C3C3C' },
      { name: 'OpenAI', logo: 'https://cdn.simpleicons.org/openai/412991' },
      { name: 'Claude', logo: 'https://cdn.simpleicons.org/anthropic/D97757' },
      { name: 'Gemini', logo: 'https://cdn.simpleicons.org/googlegemini/8E75B2' },
      { name: 'Docker', logo: `${DEV}/docker/docker-original.svg` },
      { name: 'FastAPI', logo: `${DEV}/fastapi/fastapi-original.svg` },
    ],
  },
  {
    id: 'grc',
    label: 'Governance, Risk & Compliance',
    color: 'emerald',
    tools: [
      { name: 'OneTrust', logo: 'https://cdn.simpleicons.org/onetrust/6ABE45' },
      { name: 'ServiceNow GRC', logo: 'https://cdn.simpleicons.org/servicenow/62D84E' },
      { name: 'Drata', logo: 'https://cdn.simpleicons.org/drata/FF5A5F' },
      { name: 'Vanta', logo: 'https://cdn.simpleicons.org/vanta/1B1B1B' },
      { name: 'BigID', logo: 'https://cdn.simpleicons.org/bigid/0057FF' },
      { name: 'Collibra', logo: 'https://cdn.simpleicons.org/collibra/0072CE' },
    ],
  },
  {
    id: 'product',
    label: 'Product & Collaboration',
    color: 'amber',
    tools: [
      { name: 'Jira', logo: `${DEV}/jira/jira-original.svg` },
      { name: 'Figma', logo: `${DEV}/figma/figma-original.svg` },
      { name: 'Notion', logo: `${DEV}/notion/notion-original.svg` },
      { name: 'Miro', logo: 'https://cdn.simpleicons.org/miro/050038' },
      { name: 'Productboard', logo: 'https://cdn.simpleicons.org/productboard/4C6EF5' },
      { name: 'Mixpanel', logo: 'https://cdn.simpleicons.org/mixpanel/7856FF' },
    ],
  },
  {
    id: 'ops',
    label: 'Security Operations & Big Data',
    color: 'indigo',
    tools: [
      { name: 'Splunk', logo: 'https://cdn.simpleicons.org/splunk/000000' },
      { name: 'OWASP ZAP', logo: 'https://cdn.simpleicons.org/owasp/000000' },
      { name: 'scikit-learn', logo: `${DEV}/scikitlearn/scikitlearn-original.svg` },
      { name: 'Hadoop', logo: `${DEV}/hadoop/hadoop-original.svg` },
      { name: 'Apache Spark', logo: `${DEV}/apachespark/apachespark-original.svg` },
      { name: 'GitHub', logo: `${DEV}/github/github-original.svg` },
    ],
  },
];
