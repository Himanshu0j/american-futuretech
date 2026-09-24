const User = require('../models/User');
const { generateSecurePassword, validatePassword } = require('./passwords');
const { getDbInfo } = require('../config/db');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Lead = require('../models/Lead');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Certificate = require('../models/Certificate');
const Payment = require('../models/Payment');
const Job = require('../models/Job');
const BlogPost = require('../models/BlogPost');
const FAQ = require('../models/FAQ');
const SuccessStory = require('../models/SuccessStory');
const SiteSettings = require('../models/SiteSettings');

const autoSeedIfEmpty = async () => {
  try {
    const courseCount = await Course.countDocuments();
    if (courseCount > 0) {
      console.log(
        `[Database Ready]: ${courseCount} courses already present — auto-seed skipped. Existing content (admin edits, curriculum, images) is never overwritten or deleted by the code.`
      );
      return;
    }

    console.log('[Auto-Seed Triggered]: Populating comprehensive American FutureTech enterprise dataset...');

    // 1. Staff & Demo Users
    // On a persistent database each demo account gets its own random,
    // policy-compliant password that is printed once below. Set
    // SEED_ADMIN_PASSWORD to force a specific value. On a throwaway in-memory
    // database the credentials are pinned instead (see below) so the panel
    // stays reachable without digging through server logs.
    const forcedSeedPassword = (process.env.SEED_ADMIN_PASSWORD || '').trim();

    // Throwaway (in-memory) deployments hold no real data, yet their random
    // seeded password was only ever printed to the server log — which left the
    // panel unreachable on hosts where those logs are not at hand. In that
    // ephemeral mode we pin a known demo password instead. On a persistent
    // database the random, printed-once behaviour is unchanged.
    const DEMO_FALLBACK_PASSWORD = 'admin123';
    const dbInfo = getDbInfo();
    const ephemeralDemoMode = !forcedSeedPassword && dbInfo.ephemeral;

    // A weak SEED_ADMIN_PASSWORD is refused on a persistent database. This
    // platform shipped a shared default ("admin123") in the past, and it was
    // published on a public login page — so re-creating it after a database
    // reset would silently undo every rotation performed in the admin panel.
    // Throwaway in-memory databases are unaffected: they hold no real data.
    let acceptedSeedPassword = forcedSeedPassword;
    let refusedSeedPassword = null;
    if (forcedSeedPassword && !dbInfo.ephemeral) {
      const strength = validatePassword(forcedSeedPassword, {
        email: 'admin@americanfuturetech.com',
        name: 'Alexander Pierce',
      });
      if (!strength.valid) {
        refusedSeedPassword = strength.errors[0];
        acceptedSeedPassword = '';
      }
    }

    const pinnedPassword = acceptedSeedPassword || (ephemeralDemoMode ? DEMO_FALLBACK_PASSWORD : '');

    const adminPassword = pinnedPassword || generateSecurePassword();
    const counselorPassword = pinnedPassword || generateSecurePassword();
    const studentPassword = pinnedPassword || generateSecurePassword();

    const superAdmin = await User.create({
      name: 'Alexander Pierce',
      email: 'admin@americanfuturetech.com',
      password: adminPassword,
      role: 'SUPERADMIN',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Principal Architect & Director of Academic Systems at American FutureTech.',
    });

    const counselor = await User.create({
      name: 'Sarah Jenkins',
      email: 'counselor@americanfuturetech.com',
      password: counselorPassword,
      role: 'COUNSELOR',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      bio: 'Senior Admissions & Tech Career Counselor.',
    });

    const demoStudent = await User.create({
      name: 'Ethan Hunt',
      email: 'student@americanfuturetech.com',
      password: studentPassword,
      phone: '+1 (415) 555-0192',
      role: 'STUDENT',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      studentDetails: {
        enrollmentNumber: 'AFT-892144',
        targetCareer: 'Senior AI Engineer',
      },
    });

    // Credentials are shown exactly once, here in the server log — never in the
    // repository, and never in an API response.
    if (refusedSeedPassword) {
      console.warn(
        `\n🚨 [Seed] SEED_ADMIN_PASSWORD was REFUSED — ${refusedSeedPassword}\n` +
        '   A guessable seed password is never written to a persistent database.\n' +
        '   Random, policy-compliant passwords were generated instead (below).\n',
      );
      console.log(
        `\n[Seed] Demo accounts created with RANDOM passwords (shown once, stored hashed):\n` +
        `   SUPERADMIN  admin@americanfuturetech.com      / ${adminPassword}\n` +
        `   COUNSELOR   counselor@americanfuturetech.com  / ${counselorPassword}\n` +
        `   STUDENT     student@americanfuturetech.com    / ${studentPassword}\n` +
        `   ⚠️  Save these now — they cannot be recovered. Change them after first login.\n`,
      );
    } else if (forcedSeedPassword) {
      console.log(
        `\n[Seed] Demo accounts created with SEED_ADMIN_PASSWORD:\n` +
        `   SUPERADMIN  admin@americanfuturetech.com\n` +
        `   COUNSELOR   counselor@americanfuturetech.com\n` +
        `   STUDENT     student@americanfuturetech.com\n` +
        `   ⚠️  Rotate these before going live (Admin → Staff & RBAC → Reset password).\n`,
      );
    } else if (ephemeralDemoMode) {
      console.log(
        `\n[Seed] EPHEMERAL DEMO database -- pinned credentials (no SEED_ADMIN_PASSWORD set):\n` +
        `   SUPERADMIN  admin@americanfuturetech.com      / ${adminPassword}\n` +
        `   COUNSELOR   counselor@americanfuturetech.com  / ${counselorPassword}\n` +
        `   STUDENT     student@americanfuturetech.com    / ${studentPassword}\n` +
        `   This database is in-memory: every restart wipes it and re-seeds these\n` +
        `   same credentials. Set MONGODB_URI for real content, then rotate the\n` +
        `   passwords in Admin > Staff & RBAC > Reset password.\n`,
      );
    } else {
      console.log(
        `\n[Seed] Demo accounts created with RANDOM passwords (shown once, stored hashed):\n` +
        `   SUPERADMIN  admin@americanfuturetech.com      / ${adminPassword}\n` +
        `   COUNSELOR   counselor@americanfuturetech.com  / ${counselorPassword}\n` +
        `   STUDENT     student@americanfuturetech.com    / ${studentPassword}\n` +
        `   ⚠️  Save these now — they cannot be recovered. Change them after first login.\n`,
      );
    }

    // 2. Global Site Settings
    await SiteSettings.create({
      siteName: 'American FutureTech',
      tagline: 'Live, build-first training in Data Science, AI, Generative AI, Cyber Security and Cloud',
      contactEmail: 'info@americantechgloballlc.com',
      contactPhone: '+1 (816) 846-6717',
      headquartersAddress: '30 N Gould St Ste R, Sheridan, WY 82801, United States',
      announcementBanner: {
        enabled: true,
        text: '🚀 Next Live Cohort Starts Soon — Reserve Your Seat with Only $99 Deposit!',
        badge: 'Spring 2026 Cohort',
        linkText: 'Explore Programs',
        linkUrl: '/courses',
      },
      depositPriceUSD: 99,
    });

    // 3. Flagship Courses
    const coursesData = [
      {
        title: 'Data Science with AI Integration',
        slug: 'data-science-with-ai-integration',
        category: 'Artificial Intelligence & Analytics',
        badge: 'Most Popular',
        cardTheme: 'cyan',
        duration: '6 Months',
        pricing: { basePrice: 1299, discountedPrice: 499, currency: '$' },
        shortDescription: 'Master modern Data Science from exploratory analytics to deep learning and production LLM integration.',
        description: 'Comprehensive 6-month hands-on master program engineered for career switchers and upskillers. Build enterprise predictive models, scalable analytics pipelines, and integrate state-of-the-art Generative AI with PyTorch and LangChain.',
        highlights: ['AI / ML & Deep Learning Core', 'Healthcare & Finance Capstone Projects', 'LangChain & Pinecone RAG Systems', 'US Industry Placement Assistance'],
        skills: ['Python', 'Pandas', 'PyTorch', 'Scikit-Learn', 'RAG Pipelines', 'MLOps', 'AWS SageMaker', 'SQL'],
        tools: ['Jupyter', 'PyTorch', 'HuggingFace', 'Docker', 'Tableau', 'Snowflake', 'PostgreSQL'],
        prerequisites: ['Basic problem-solving mindset; prior coding experience is helpful but not mandatory.'],
        outcomes: ['Design end-to-end predictive machine learning pipelines', 'Deploy production LLM architectures with Vector DBs', 'Pass technical interviews for Data Scientist and ML roles'],
        brochureUrl: '/brochures/American_FutureTech_Data_Science_AI_Brochure.pdf',
        isPublished: true,
        isFeatured: true,
        isPopular: true,
        displayOrder: 1,
        seatsUrgencyText: 'Only 3 seats remaining for upcoming weekend cohort',
        modules: [
          {
            number: 1,
            title: 'Python for Data Science & Advanced Analytics',
            desc: 'Core syntax, vector operations, data cleaning, and statistical distributions.',
            hours: 32,
            lessons: [
              { title: 'Environment Setup & Modern Python Workflows', duration: '40m', type: 'video', url: 'https://www.youtube.com/embed/rfscVS0vtbw' },
              { title: 'High-Performance NumPy Array Operations', duration: '55m', type: 'video', url: 'https://www.youtube.com/embed/QUT1VHiLmmI' },
              { title: 'Pandas Data Wrangling & Exploratory Analysis', duration: '60m', type: 'video', url: 'https://www.youtube.com/embed/vmEHCJofslg' },
              { title: 'Interactive Dashboards with Plotly & Seaborn', duration: '45m', type: 'video', url: 'https://www.youtube.com/embed/7D_r_k3K9t4' },
            ],
            quiz: {
              title: 'Module 1 Assessment: Python Analytics',
              questions: [
                {
                  questionText: 'Which NumPy method is primarily used for changing the dimensions of an array without modifying its underlying data?',
                  options: ['np.flatten()', 'np.reshape()', 'np.resize()', 'np.transpose()'],
                  correctOptionIndex: 1,
                  explanation: 'np.reshape() gives a new shape to an array without changing its data.',
                },
                {
                  questionText: 'In Pandas, which function handles missing values by replacing them with a specified value or statistical imputation?',
                  options: ['df.dropna()', 'df.fillna()', 'df.isnull()', 'df.replace()'],
                  correctOptionIndex: 1,
                  explanation: 'fillna() fills NA/NaN values using the specified method or value.',
                },
                {
                  questionText: 'What is the primary benefit of vectorized operations over standard Python loops?',
                  options: ['Uses more memory', 'Executed in compiled C at SIMD hardware speeds', 'Easier to debug step-by-step', 'Allows infinite recursion'],
                  correctOptionIndex: 1,
                  explanation: 'Vectorized computing utilizes pre-compiled C loops and SIMD vector registers.',
                },
              ],
            },
          },
          {
            number: 2,
            title: 'Machine Learning Architectures & Statistical Modeling',
            desc: 'Supervised, unsupervised, feature engineering, and regularization.',
            hours: 40,
            lessons: [
              { title: 'Linear & Logistic Regression Under the Hood', duration: '50m', type: 'video', url: 'https://www.youtube.com/embed/i_LwzRVP7bg' },
              { title: 'Decision Trees, Random Forests & XGBoost Tuning', duration: '65m', type: 'video', url: 'https://www.youtube.com/embed/g9c66TUylZ4' },
              { title: 'Cross-Validation & Hyperparameter Search Strategies', duration: '45m', type: 'video', url: 'https://www.youtube.com/embed/Gol_qOfhft4' },
            ],
            quiz: {
              title: 'Module 2 Assessment: Supervised Machine Learning',
              questions: [
                {
                  questionText: 'What does the L1 regularization penalty (Lasso) perform that L2 (Ridge) does not?',
                  options: ['Increases weights', 'Drives feature coefficients strictly to zero (Feature Selection)', 'Prevents gradient descent', 'Normalizes batch activations'],
                  correctOptionIndex: 1,
                  explanation: 'Lasso regularization drives non-essential weights to exact zero, performing automatic feature selection.',
                },
              ],
            },
          },
          {
            number: 3,
            title: 'Deep Learning, PyTorch & Generative AI Systems',
            desc: 'Neural networks, computer vision, transformers, and vector databases.',
            hours: 48,
            lessons: [
              { title: 'Deep Neural Architectures & Backpropagation Calculus', duration: '60m', type: 'video', url: 'https://www.youtube.com/embed/aircAruvnKk' },
              { title: 'PyTorch Tensors, Autograd & GPU Acceleration', duration: '55m', type: 'video', url: 'https://www.youtube.com/embed/V_xro1bcAuA' },
              { title: 'Building Retrieval-Augmented Generation (RAG) with LangChain', duration: '75m', type: 'video', url: 'https://www.youtube.com/embed/LhnCs76uhw8' },
            ],
            quiz: {
              title: 'Module 3 Assessment: Deep Learning & RAG',
              questions: [
                {
                  questionText: 'What is the primary role of a Vector Database in a RAG architecture?',
                  options: ['Store relational SQL tables', 'Index high-dimensional embeddings for semantic similarity search', 'Cache static frontend assets', 'Run Python scripts'],
                  correctOptionIndex: 1,
                  explanation: 'Vector databases store numerical embeddings and calculate cosine/Euclidean similarity rapidly.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Cyber Security with Ethical Hacking',
        slug: 'cyber-security-with-ethical-hacking',
        category: 'Information Security & Offensive Operations',
        badge: 'High Demand',
        cardTheme: 'rose',
        duration: '6 Months',
        pricing: { basePrice: 1299, discountedPrice: 499, currency: '$' },
        shortDescription: 'Defend enterprise infrastructure, perform penetration testing, and master offensive security tools.',
        description: 'Elite offensive and defensive cybersecurity training. Learn penetration testing methodologies, Linux security, network analysis, vulnerability assessment, web exploitation, and incident response.',
        highlights: ['Hands-on Virtual Penetration Labs', 'Real-world Bug Bounty & Active Directory Attacks', 'SOC Analyst & Incident Response Workflows', 'CompTIA Security+ & CEH Alignment'],
        skills: ['Kali Linux', 'Wireshark', 'Metasploit', 'Burp Suite', 'Network Security', 'SOC Operations', 'OWASP Top 10', 'Python Scripting'],
        tools: ['Kali Linux', 'Burp Suite Pro', 'Nmap', 'Metasploit', 'Snort', 'Splunk', 'Wireshark'],
        prerequisites: ['Basic understanding of operating systems and computer networks.'],
        outcomes: ['Conduct professional vulnerability assessments', 'Identify and exploit OWASP Top 10 vulnerabilities safely', 'Secure enterprise Active Directory and cloud perimeters'],
        brochureUrl: '/brochures/American_FutureTech_Cyber_Security_Brochure.pdf',
        isPublished: true,
        isFeatured: true,
        isPopular: true,
        displayOrder: 2,
        seatsUrgencyText: 'Only 4 seats remaining for this cohort',
        modules: [
          {
            number: 1,
            title: 'Network Fundamentals & Linux Hardening',
            desc: 'TCP/IP, subnetting, Wireshark packet dissection, and Linux security.',
            hours: 30,
            lessons: [
              { title: 'Kali Linux Mastery & Terminal Operations', duration: '45m', type: 'video', url: 'https://www.youtube.com/embed/lZAoFs75_cs' },
              { title: 'Network Protocols & Wireshark Deep Inspection', duration: '55m', type: 'video', url: 'https://www.youtube.com/embed/lb1Dw0elw0Q' },
              { title: 'Network Reconnaissance with Nmap & Zenmap', duration: '50m', type: 'video', url: 'https://www.youtube.com/embed/4t4kBkMsDbQ' },
            ],
            quiz: {
              title: 'Module 1 Assessment: Network Reconnaissance',
              questions: [
                {
                  questionText: 'Which Nmap scan flag initiates a TCP SYN Stealth scan?',
                  options: ['-sT', '-sS', '-sU', '-sP'],
                  correctOptionIndex: 1,
                  explanation: '-sS sends raw SYN packets without completing the 3-way handshake, making it stealthy.',
                },
              ],
            },
          },
          {
            number: 2,
            title: 'Web Application Exploitation & OWASP Top 10',
            desc: 'SQL Injection, XSS, CSRF, and Burp Suite automation.',
            hours: 40,
            lessons: [
              { title: 'Burp Suite Setup & HTTP Traffic Interception', duration: '50m', type: 'video', url: 'https://www.youtube.com/embed/G3hlpK_zH28' },
              { title: 'SQL Injection & Authentication Bypass Labs', duration: '65m', type: 'video', url: 'https://www.youtube.com/embed/2OPVVi_ebzk' },
              { title: 'Cross-Site Scripting (XSS) Stored & Reflected', duration: '55m', type: 'video', url: 'https://www.youtube.com/embed/EoaDgJP460A' },
            ],
            quiz: {
              title: 'Module 2 Assessment: Web Exploitation',
              questions: [
                {
                  questionText: 'What is the primary defense against SQL Injection in web applications?',
                  options: ['Input encryption', 'Parameterized Prepared Statements', 'Client-side JavaScript validation', 'Hiding database port'],
                  correctOptionIndex: 1,
                  explanation: 'Parameterized queries ensure user input is treated as literals rather than executable SQL syntax.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Cyber Security & Artificial Intelligence Hybrid',
        slug: 'cyber-security-and-artificial-intelligence',
        category: 'Applied AI & Defense',
        badge: 'Industry Next-Gen',
        cardTheme: 'indigo',
        duration: '6 Months',
        pricing: { basePrice: 1299, discountedPrice: 499, currency: '$' },
        shortDescription: 'Leverage machine learning to detect anomalies, automate threat hunting, and secure AI systems.',
        description: 'Pioneering curriculum bridging deep cybersecurity operations with autonomous AI models. Learn adversarial machine learning, automated malware analysis, AI-driven SIEM correlation, and prompt injection defenses.',
        highlights: ['AI-driven Threat Detection & Automated SIEM', 'Adversarial Machine Learning & Model Defenses', 'Autonomous Incident Response Workflows', 'Zero Trust Architecture Integration'],
        skills: ['AI Threat Hunting', 'Python Security Modeling', 'Splunk AI Assistant', 'Prompt Security', 'Anomaly Detection'],
        tools: ['Splunk', 'TensorFlow', 'Zeek', 'Wazuh', 'Jupyter', 'YARA'],
        prerequisites: ['Foundational understanding of networking and basic coding.'],
        outcomes: ['Deploy ML classifiers for real-time zero-day intrusion detection', 'Harden enterprise LLMs against prompt extraction and jailbreaks'],
        brochureUrl: '/brochures/American_FutureTech_AI_Cyber_Brochure.pdf',
        isPublished: true,
        isFeatured: true,
        isPopular: false,
        displayOrder: 3,
        seatsUrgencyText: 'Only 2 seats remaining for this cohort',
        modules: [
          {
            number: 1,
            title: 'Machine Learning for Network Intrusion Detection',
            desc: 'Feature extraction from PCAP datasets and Random Forest classifiers.',
            hours: 36,
            lessons: [
              { title: 'Data Preprocessing on NSL-KDD Network Traffic', duration: '50m', type: 'video', url: 'https://www.youtube.com/embed/7D_r_k3K9t4' },
              { title: 'Supervised Anomaly Detection Classifiers', duration: '60m', type: 'video', url: 'https://www.youtube.com/embed/i_LwzRVP7bg' },
            ],
            quiz: {
              title: 'Module 1 Assessment: AI Intrusion Detection',
              questions: [
                {
                  questionText: 'Why are precision and recall metrics preferred over accuracy in anomaly detection datasets?',
                  options: ['Accuracy is harder to calculate', 'Network traffic datasets suffer from extreme class imbalance (mostly normal, few attacks)', 'Precision always equals recall', 'None of the above'],
                  correctOptionIndex: 1,
                  explanation: 'Class imbalance makes naive 99% accuracy useless if all malicious packets are missed.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Advanced Generative & Agentic AI Master Program',
        slug: 'advanced-generative-and-agentic-ai-master-program',
        category: 'Next-Gen Artificial Intelligence',
        badge: 'Cutting-Edge',
        cardTheme: 'purple',
        duration: '6 Months',
        pricing: { basePrice: 1299, discountedPrice: 499, currency: '$' },
        shortDescription: 'Architect multi-agent autonomous systems, build production RAG, and fine-tune frontier models.',
        description: 'The definitive engineering masterclass for the Agentic AI revolution. Master LangGraph, CrewAI, AutoGen, fine-tuning with LoRA/QLoRA, context-aware memory, tool calling, and enterprise orchestration.',
        highlights: ['Multi-Agent Collaboration with CrewAI & LangGraph', 'Fine-Tuning Llama 3 & Mistral with QLoRA', 'Advanced Graph RAG & Hybrid Vector Search', 'Enterprise Agent Evaluation & Guardrails'],
        skills: ['LangGraph', 'CrewAI', 'AutoGen', 'LoRA / QLoRA', 'LlamaIndex', 'Prompt Engineering', 'FastAPI'],
        tools: ['LangChain', 'CrewAI', 'Ollama', 'Pinecone', 'vLLM', 'Weights & Biases'],
        prerequisites: ['Proficiency in Python and basic understanding of ML concepts.'],
        outcomes: ['Deploy autonomous multi-agent software engineering pipelines', 'Build resilient enterprise knowledge assistants with Graph RAG'],
        brochureUrl: '/brochures/American_FutureTech_Agentic_AI_Brochure.pdf',
        isPublished: true,
        isFeatured: true,
        isPopular: true,
        displayOrder: 4,
        seatsUrgencyText: 'Limited cohort: 5 seats open',
        modules: [
          {
            number: 1,
            title: 'Agentic Fundamentals & Tool Augmented LLMs',
            desc: 'Function calling, ReAct prompting loop, and structured JSON outputs.',
            hours: 32,
            lessons: [
              { title: 'ReAct Loop Architecture & Reasoning Traces', duration: '50m', type: 'video', url: 'https://www.youtube.com/embed/LhnCs76uhw8' },
              { title: 'Tool Calling & API Execution Frameworks', duration: '60m', type: 'video', url: 'https://www.youtube.com/embed/QUT1VHiLmmI' },
            ],
            quiz: {
              title: 'Module 1 Assessment: Agent Tool Calling',
              questions: [
                {
                  questionText: 'In the ReAct prompting paradigm, what does the agent generate at each iteration?',
                  options: ['Only code', 'Thought, Action, and Action Input, followed by Observation', 'Database schemas', 'Vector embeddings'],
                  correctOptionIndex: 1,
                  explanation: 'ReAct alternates between internal Thoughts, external Actions, and environment Observations.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'DevOps, Kubernetes & Cloud with AI',
        slug: 'devops-and-cloud-with-ai',
        category: 'Cloud Engineering & Infrastructure',
        badge: 'Enterprise Standard',
        cardTheme: 'emerald',
        duration: '6 Months',
        pricing: { basePrice: 1299, discountedPrice: 499, currency: '$' },
        shortDescription: 'Master modern CI/CD, Kubernetes clusters, Terraform IaC, and AIOps automated observability.',
        description: 'Engineer rock-solid cloud-native architectures on AWS and Azure. Automate infrastructure as code with Terraform, orchestrate multi-node Kubernetes clusters, and implement AIOps for self-healing infrastructure.',
        highlights: ['Production Kubernetes & Helm Deployment', 'Terraform Infrastructure as Code (IaC)', 'GitOps with ArgoCD & GitHub Actions', 'AIOps Predictive Failure Prevention'],
        skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD Pipelines', 'Prometheus & Grafana', 'Bash'],
        tools: ['AWS EKS', 'Docker', 'Terraform', 'ArgoCD', 'Prometheus', 'Grafana', 'Ansible'],
        prerequisites: ['Familiarity with computer hardware and command-line interfaces.'],
        outcomes: ['Deploy self-scaling Kubernetes microservice workloads', 'Automate entire AWS infrastructure via Terraform pipelines'],
        brochureUrl: '/brochures/American_FutureTech_DevOps_Cloud_Brochure.pdf',
        isPublished: true,
        isFeatured: false,
        isPopular: false,
        displayOrder: 5,
        seatsUrgencyText: 'Only 3 seats remaining for this cohort',
        modules: [
          {
            number: 1,
            title: 'Containerization with Docker & Multi-Stage Builds',
            desc: 'Images, layers, volumes, networking, and production security.',
            hours: 28,
            lessons: [
              { title: 'Docker Daemon Architecture & Container Lifecycle', duration: '45m', type: 'video', url: 'https://www.youtube.com/embed/3c-iBn73dDE' },
              { title: 'Optimizing Dockerfiles with Multi-Stage Builds', duration: '50m', type: 'video', url: 'https://www.youtube.com/embed/fqMOX6JJhGo' },
            ],
            quiz: {
              title: 'Module 1 Assessment: Docker',
              questions: [
                {
                  questionText: 'What is the primary advantage of multi-stage Docker builds?',
                  options: ['Faster compile speeds', 'Separating build tools from runtime image to produce lean production artifacts', 'Allows running multiple OS kernels', 'Disables root user'],
                  correctOptionIndex: 1,
                  explanation: 'Multi-stage builds leave compiler SDKs behind, resulting in minimal, secure production images.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'AI Product Manager with Agentic AI',
        slug: 'ai-product-manager',
        category: 'Product & Leadership',
        badge: 'High Impact',
        cardTheme: 'amber',
        duration: '4 Months',
        pricing: { basePrice: 1299, discountedPrice: 499, currency: '$' },
        shortDescription: 'Lead AI product strategy, user discovery, evaluation metrics, and cross-functional ML delivery.',
        description: 'Transition into high-paying AI Product Management. Learn how to write PRDs for non-deterministic AI models, manage LLM latency vs accuracy trade-offs, evaluate hallucinations, and build AI business cases.',
        highlights: ['AI PRD Writing & Evaluation Metrics', 'LLM Cost Estimation & Unit Economics', 'Human-in-the-Loop UX Design', 'Executive Product Portfolio Defense'],
        skills: ['AI Roadmapping', 'LLM Evaluation', 'User Research', 'Agile Delivery', 'PRD Authoring', 'Metrics & KPIs'],
        tools: ['Figma', 'Jira', 'Postman', 'Notion', 'LangSmith', 'Mixpanel'],
        prerequisites: ['Curiosity about technology products; no engineering background required.'],
        outcomes: ['Write technical PRDs for LLMs and autonomous agents', 'Manage ROI, latency budgets, and compliance for AI features'],
        brochureUrl: '/brochures/American_FutureTech_AI_Product_Manager_Brochure.pdf',
        isPublished: true,
        isFeatured: false,
        isPopular: false,
        displayOrder: 6,
        seatsUrgencyText: 'Cohort starting next month',
        modules: [
          {
            number: 1,
            title: 'Foundations of AI Product Strategy',
            desc: 'Deterministic vs non-deterministic systems, hallucination management.',
            hours: 24,
            lessons: [
              { title: 'The Modern AI Product Lifecycle', duration: '40m', type: 'video', url: 'https://www.youtube.com/embed/LhnCs76uhw8' },
            ],
            quiz: {
              title: 'Module 1 Assessment: AI Product Principles',
              questions: [
                {
                  questionText: 'What distinguishes managing an AI product from traditional software?',
                  options: ['AI products never fail', 'Non-deterministic outputs require probabilistic acceptance thresholds and continuous evaluation', 'No user research needed', 'Free infrastructure'],
                  correctOptionIndex: 1,
                  explanation: 'AI features output probabilistic answers requiring rigorous evaluation benchmarks.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Governance, Risk, and Compliance (GRC) with AI',
        slug: 'governance-risk-and-compliance-grc-with-ai',
        category: 'Cyber Governance & Legal Tech',
        badge: 'Enterprise Security',
        cardTheme: 'cyan',
        duration: '4 Months',
        pricing: { basePrice: 1299, discountedPrice: 499, currency: '$' },
        shortDescription: 'Master NIST, ISO 27001, SOC 2, HIPAA, and EU AI Act compliance powered by automated audit tools.',
        description: 'Bridge legal compliance and information security. Learn how to audit enterprise tech stacks against NIST CSF, ISO 27001, SOC 2 Type II, and the new European EU AI Act regulations using AI compliance agents.',
        highlights: ['ISO 27001 & SOC 2 Type II Readiness Audits', 'EU AI Act & NIST AI RMF Governance Frameworks', 'Third-Party Vendor Risk Assessment Automation', 'CISO Advisory & Board Presentation Skills'],
        skills: ['NIST CSF', 'ISO 27001', 'SOC 2 Auditing', 'HIPAA', 'EU AI Act', 'Risk Registers', 'Vendor Auditing'],
        tools: ['Vanta', 'Drata', 'ServiceNow', 'Excel', 'OneTrust'],
        prerequisites: ['Interest in cybersecurity governance, auditing, or compliance policy.'],
        outcomes: ['Lead SOC 2 and ISO 27001 security audits for enterprise clients', 'Build compliant AI risk management programs under EU regulations'],
        brochureUrl: '/brochures/American_FutureTech_GRC_AI_Brochure.pdf',
        isPublished: true,
        isFeatured: false,
        isPopular: false,
        displayOrder: 7,
        seatsUrgencyText: 'Only 3 seats remaining for this cohort',
        modules: [
          {
            number: 1,
            title: 'Cybersecurity Governance Frameworks (NIST & ISO)',
            desc: 'Controls, risk assessment methodology, and audit evidence gathering.',
            hours: 24,
            lessons: [
              { title: 'Navigating the NIST Cybersecurity Framework 2.0', duration: '45m', type: 'video', url: 'https://www.youtube.com/embed/lZAoFs75_cs' },
            ],
            quiz: {
              title: 'Module 1 Assessment: GRC Core Frameworks',
              questions: [
                {
                  questionText: 'What is the newest sixth core function introduced in NIST CSF 2.0?',
                  options: ['Attack', 'Govern', 'Deceive', 'Calculate'],
                  correctOptionIndex: 1,
                  explanation: 'NIST CSF 2.0 added the "Govern" function alongside Identify, Protect, Detect, Respond, and Recover.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Placement Support',
        slug: 'placement-support',
        category: 'Career Services',
        badge: 'Career Accelerator',
        cardTheme: 'emerald',
        duration: '3 Months',
        pricing: { basePrice: 1299, discountedPrice: 499, currency: '$' },
        shortDescription: 'Comprehensive technical placement assistance, ATS resume overhaul, mock interviews, and direct employer referrals.',
        description: 'A dedicated 3-month career engineering track. Includes line-by-line ATS resume rewrites, LinkedIn positioning, 1-on-1 mock technical interviews, portfolio development, interview drills, and direct introductions across our vetted hiring partner network.',
        highlights: ['ATS Resume Engineering & LinkedIn Optimization', '1-on-1 Mock Technical Interviews with Scorecards', 'Portfolio, GitHub & Deployable Demo Reviews', 'Direct Hiring Partner Referral Introductions'],
        skills: ['Resume Engineering', 'Mock Interviews', 'LinkedIn Optimization', 'Portfolio Development', 'System Design Prep', 'Salary Negotiation'],
        tools: ['GitHub', 'LinkedIn', 'Notion', 'Jira'],
        prerequisites: ['Open to all learners preparing for technology job interviews.'],
        outcomes: ['Pass enterprise ATS screening with an optimized technical resume', 'Defend technical and behavioral interviews with confidence', 'Execute a structured, high-conversion job search strategy'],
        brochureUrl: '/brochures/American_FutureTech_Placement_Support_Brochure.pdf',
        isPublished: true,
        isFeatured: false,
        isPopular: false,
        displayOrder: 8,
        seatsUrgencyText: 'Capped at 25 fellows per career cohort',
        modules: [
          {
            number: 1,
            title: 'Resume, LinkedIn & Portfolio Engineering',
            desc: 'ATS formatting, keyword mapping, and recruiter-facing positioning.',
            hours: 20,
            lessons: [
              { title: 'ATS Resume Rewrite: Line-by-Line Optimization', duration: '50m', type: 'video', url: 'https://www.youtube.com/embed/rfscVS0vtbw' },
              { title: 'LinkedIn Positioning & Recruiter Inbound Playbook', duration: '45m', type: 'video', url: 'https://www.youtube.com/embed/vmEHCJofslg' },
            ],
            quiz: {
              title: 'Module 1 Assessment: Career Positioning',
              questions: [
                {
                  questionText: 'Which resume practice most improves pass-through on enterprise Applicant Tracking Systems (ATS)?',
                  options: ['Graphic-heavy multi-column layouts', 'Role-specific keyword alignment with quantified impact', 'Adding a photo and personal hobbies', 'Using a single generic resume for every job'],
                  correctOptionIndex: 1,
                  explanation: 'ATS platforms parse role-specific keywords and measurable impact far more reliably than decorative layouts.',
                },
              ],
            },
          },
          {
            number: 2,
            title: 'Technical Mock Interviews & Offer Negotiation',
            desc: 'Live coding drills, system design defense, STAR behavioral practice, and compensation strategy.',
            hours: 24,
            lessons: [
              { title: 'Live Technical Mock Interviews with Scorecards', duration: '60m', type: 'video', url: 'https://www.youtube.com/embed/aircAruvnKk' },
              { title: 'System Design Defense & Salary Negotiation Scripts', duration: '55m', type: 'video', url: 'https://www.youtube.com/embed/g9c66TUylZ4' },
            ],
            quiz: {
              title: 'Module 2 Assessment: Interview Execution',
              questions: [
                {
                  questionText: 'Which framework is recommended for structuring behavioral interview answers?',
                  options: ['REST', 'STAR', 'SOLID', 'CAP'],
                  correctOptionIndex: 1,
                  explanation: 'The STAR method (Situation, Task, Action, Result) structures behavioral answers concisely and persuasively.',
                },
              ],
            },
          },
        ],
      },
    ];

    let createdCourses = [];

    for (const cData of coursesData) {
      const { modules, ...courseFields } = cData;
      const course = await Course.create(courseFields);
      createdCourses.push(course);

      // Create modules, lessons, and quizzes
      if (modules && modules.length > 0) {
        for (const mData of modules) {
          const mod = await Module.create({
            course: course._id,
            moduleNumber: mData.number,
            title: mData.title,
            description: mData.desc,
            durationHours: mData.hours,
            order: mData.number,
          });

          if (mData.lessons && mData.lessons.length > 0) {
            let lIdx = 1;
            for (const lData of mData.lessons) {
              await Lesson.create({
                course: course._id,
                module: mod._id,
                title: lData.title,
                lessonNumber: lIdx,
                description: `Hands-on lesson covering ${lData.title} with production code walkthroughs and downloadable lab files.`,
                contentType: lData.type || 'video',
                videoUrl: lData.url || 'https://www.youtube.com/embed/rfscVS0vtbw',
                videoDuration: lData.duration || '45m',
                textContent: `### Overview: ${lData.title}\n\nIn this lesson, you will master production principles and real-world architectures. Follow along with the video, complete the lab exercises, and verify your implementation with the resources provided.`,
                pdfUrl: '/brochures/American_FutureTech_Sample_Lecture_Notes.pdf',
                resources: [
                  { title: 'Lecture Notes & Lab Guide (PDF)', url: '/brochures/American_FutureTech_Sample_Lecture_Notes.pdf', fileType: 'PDF', fileSize: '1.8 MB' },
                  { title: 'Starter GitHub Repository', url: 'https://github.com/american-futuretech', fileType: 'CODE', fileSize: '0.4 MB' },
                ],
                isPreview: lIdx === 1,
                order: lIdx,
                isPublished: true,
              });
              lIdx++;
            }
          }

          if (mData.quiz) {
            await Quiz.create({
              course: course._id,
              module: mod._id,
              title: mData.quiz.title,
              description: 'Pass with at least 70% to validate your module mastery.',
              timeLimitMinutes: 15,
              passingScorePercent: 70,
              questions: mData.quiz.questions,
              isPublished: true,
            });
          }
        }
      }
    }

    // 4. Cohorts / Batches for each Course
    const dataScienceCourse = createdCourses[0];
    const cyberSecurityCourse = createdCourses[1];

    const dsBatch1 = await Batch.create({
      course: dataScienceCourse._id,
      batchCode: 'DS-2026-WKND-01',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      timing: 'Sat & Sun: 10:00 AM - 12:00 PM EST',
      maxCapacity: 25,
      status: 'Upcoming',
      enrolledStudents: [
        {
          studentName: demoStudent.name,
          email: demoStudent.email,
          phone: demoStudent.phone,
          feePaid: 1899,
          totalFee: 1899,
          paymentStatus: 'Paid',
          invoiceId: 'INV-2026-89102',
          enrolledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    const csBatch1 = await Batch.create({
      course: cyberSecurityCourse._id,
      batchCode: 'CS-2026-WKND-02',
      startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      timing: 'Sat & Sun: 1:00 PM - 3:00 PM EST',
      maxCapacity: 25,
      status: 'Upcoming',
      enrolledStudents: [],
    });

    // 5. Enroll Demo Student in Data Science Course
    const dsEnrollment = await Enrollment.create({
      student: demoStudent._id,
      course: dataScienceCourse._id,
      batch: dsBatch1._id,
      status: 'Active',
      enrolledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    // Student Progress
    const dsLessons = await Lesson.find({ course: dataScienceCourse._id });
    const completedLessonIds = dsLessons.slice(0, 3).map(l => l._id);

    await Progress.create({
      student: demoStudent._id,
      course: dataScienceCourse._id,
      completedLessons: completedLessonIds,
      lastAccessedLesson: dsLessons[2]?._id || dsLessons[0]?._id,
      progressPercent: Math.round((completedLessonIds.length / dsLessons.length) * 100),
      isCompleted: false,
    });

    // Demo Verified Certificate
    await Certificate.create({
      certificateId: 'AFT-CERT-AI9821',
      student: demoStudent._id,
      studentName: demoStudent.name,
      course: dataScienceCourse._id,
      courseTitle: dataScienceCourse.title,
      enrollment: dsEnrollment._id,
      grade: 'Distinction with Honors',
      verificationUrl: '/certificate/AFT-CERT-AI9821',
      issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      // Seeded demo record — must never read as a real conferred credential.
      isSample: true,
    });

    // Demo Payment & Invoice
    await Payment.create({
      student: demoStudent._id,
      studentName: demoStudent.name,
      email: demoStudent.email,
      phone: demoStudent.phone,
      course: dataScienceCourse._id,
      courseTitle: dataScienceCourse.title,
      batch: dsBatch1._id,
      tier: 'full',
      amount: 1899,
      currency: 'USD',
      status: 'Paid',
      transactionId: 'TXN-9841289412',
      invoiceNumber: 'INV-2026-89102',
      paymentMethod: 'Credit Card (Stripe Verified)',
      paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    // 6. Realistic Admissions Leads
    const leadsData = [
      {
        fullName: 'Marcus Sterling',
        email: 'marcus.sterling@gmail.com',
        phone: '+1 (202) 555-0143',
        targetCourse: dataScienceCourse._id,
        preferredBatch: 'Weekend Live (2 Hours)',
        status: 'Counseling Scheduled',
        marketingSource: 'Google Search Ads - Data Science Masters',
        assignedCounselor: counselor._id,
        notes: 'Senior QA Analyst looking to transition into AI/ML. Highly interested in Weekend batch.',
        callLogs: [
          {
            caller: 'Sarah Jenkins',
            note: 'Spoke with Marcus. Discussed curriculum module 3 PyTorch labs. Scheduled Zoom counseling for Friday 3 PM EST.',
            callOutcome: 'Counseling Scheduled',
            followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        ],
      },
      {
        fullName: 'Samantha Brooks',
        email: 's.brooks@outlook.com',
        phone: '+1 (312) 555-0188',
        targetCourse: cyberSecurityCourse._id,
        preferredBatch: 'Weekday Evening (1.5 Hours)',
        status: 'Contacted',
        marketingSource: 'LinkedIn Tech Career Webinar',
        assignedCounselor: counselor._id,
        notes: 'IT Support specialist wanting to break into SOC Analyst role. Asked about CEH alignment.',
        callLogs: [
          {
            caller: 'Sarah Jenkins',
            note: 'Sent Cyber Security syllabus PDF. Requested callback tomorrow evening.',
            callOutcome: 'Interested',
            followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          },
        ],
      },
      {
        fullName: 'David Kowalski',
        email: 'david.kowalski@proton.me',
        phone: '+1 (718) 555-0199',
        targetCourse: createdCourses[3]._id, // Agentic AI
        preferredBatch: 'Weekend Live (2 Hours)',
        status: 'New',
        marketingSource: 'Direct Website Landing Page',
        notes: 'Software engineer wanting to master LangGraph and Multi-Agent deployment.',
      },
      {
        fullName: 'Aaliyah Patel',
        email: 'aaliyah.patel@techcorp.io',
        phone: '+1 (408) 555-0174',
        targetCourse: createdCourses[4]._id, // DevOps
        preferredBatch: 'Weekend Live (2 Hours)',
        status: 'New',
        marketingSource: 'Alumni Referral',
        notes: 'Referred by alumni Priya Sharma. Ready to enroll in DevOps cohort.',
      },
    ];

    for (const l of leadsData) {
      await Lead.create(l);
    }

    // 7. Tech Career Jobs
    const jobsData = [
      {
        title: 'Junior Machine Learning Engineer',
        company: 'Apex Intelligence Labs',
        department: 'AI Research & Deployment',
        location: 'Remote (US & Global)',
        employmentType: 'Full-time',
        experienceLevel: 'Entry to Mid Level (0-2 Yrs)',
        salaryRange: '$95,000 - $125,000 / year',
        skills: ['Python', 'PyTorch', 'FastAPI', 'Vector Databases', 'Docker'],
        description: 'Join a fast-growing AI startup deploying retrieval-augmented generative systems and fine-tuned open-source models for Fortune 500 financial clients.',
        responsibilities: [
          'Build and evaluate RAG pipelines using LangChain and Pinecone.',
          'Optimize model inference latencies with vLLM and TensorRT.',
          'Collaborate with product designers to ship agentic AI features.',
        ],
        requirements: [
          'Proficiency in Python and deep learning frameworks.',
          'Demonstrated capstone projects in modern ML or NLP.',
          'American FutureTech Data Science or AI Certification preferred.',
        ],
        benefits: ['100% Remote flexibility', 'Comprehensive health/dental/vision', '$3,000 annual learning stipend'],
        isPublished: true,
      },
      {
        title: 'Cyber Security Analyst (SOC Tier 1)',
        company: 'Vanguard Cyber Defense',
        department: 'Security Operations',
        location: 'Remote / Dallas, TX',
        employmentType: 'Full-time',
        experienceLevel: 'Entry Level',
        salaryRange: '$85,000 - $110,000 / year',
        skills: ['Splunk', 'Wireshark', 'Incident Response', 'Kali Linux', 'SIEM'],
        description: 'Monitor, analyze, and triage security telemetry across enterprise endpoints and cloud workloads.',
        responsibilities: [
          'Investigate intrusion alerts generated by Splunk and EDR agents.',
          'Perform initial triage and contain compromised host endpoints.',
          'Draft incident post-mortem reports and update threat intelligence feeds.',
        ],
        requirements: [
          'Understanding of TCP/IP, common web attack vectors, and Linux systems.',
          'Hands-on lab experience with Kali Linux and packet analysis.',
        ],
        benefits: ['401(k) matching 5%', 'Full equipment allowance', 'Certification bonus program'],
        isPublished: true,
      },
      {
        title: 'Cloud DevOps Associate',
        company: 'HyperScale Cloud Partners',
        department: 'Infrastructure & SRE',
        location: 'Remote (US Timezones)',
        employmentType: 'Full-time',
        experienceLevel: 'Entry to Mid Level',
        salaryRange: '$100,000 - $130,000 / year',
        skills: ['AWS', 'Terraform', 'Kubernetes', 'Docker', 'GitHub Actions'],
        description: 'Automate zero-downtime CI/CD deployment pipelines and scale multi-tenant Kubernetes clusters.',
        responsibilities: [
          'Maintain infrastructure as code with Terraform modules.',
          'Implement automated rollbacks and canary deployments in ArgoCD.',
          'Manage Prometheus and Grafana alerts for SRE observability.',
        ],
        requirements: [
          'Practical experience deploying containerized microservices to AWS.',
        ],        benefits: ['Flexible PTO', 'Annual tech retreat in Wyoming', 'Home office setup grant'],
        isPublished: true,
      },
      // ── Corporate partner openings (career network) ──
      {
        title: 'Cloud DevOps Engineer – AI Automation',
        company: 'Intel',
        department: 'Infrastructure & SRE',
        location: 'United States (Remote)',
        employmentType: 'Full-time',
        experienceLevel: 'Mid-Level',
        salaryMin: 180000,
        salaryMax: 250000,
        salaryRange: '$180,000 - $250,000 / year',
        skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD'],
        description: 'Build and operate the automation platform that powers AI workload deployment across Intel engineering teams. Drive infrastructure reliability, cost efficiency, and developer velocity.',
        responsibilities: ['Automate AI workload provisioning across multi-cloud environments.', 'Harden CI/CD pipelines with security and cost guardrails.', 'Partner with ML platform teams on GPU scheduling and observability.'],
        requirements: ['Strong AWS and Kubernetes production experience.', 'Infrastructure as code (Terraform) and container security fundamentals.'],
        benefits: ['Remote-first culture', 'Annual performance equity', 'Certification reimbursement'],
        isPublished: true,
      },
      {
        title: 'Senior Data Scientist – Analytics & Experimentation',
        company: 'Snowflake',
        department: 'Data & Analytics',
        location: 'United States (Remote)',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        salaryMin: 165000,
        salaryMax: 215000,
        salaryRange: '$165,000 - $215,000 / year',
        skills: ['SQL', 'Python', 'Experimentation', 'Snowflake', 'Statistics'],
        description: 'Design and analyze large-scale experiments that shape the Snowflake data cloud roadmap, partnering with product and engineering leadership.',
        responsibilities: ['Design experiment frameworks and causal analysis methodologies.', 'Build scalable analytics models on the Snowflake platform.', 'Translate findings into product strategy recommendations.'],
        requirements: ['5+ years applied data science or analytics engineering.', 'Advanced SQL and statistical experimentation expertise.'],
        benefits: ['Remote flexibility', 'Equity package', 'Learning stipend'],
        isPublished: true,
      },
      {
        title: 'Staff Data Scientist – Lakehouse Intelligence',
        company: 'Databricks',
        department: 'Data & Analytics',
        location: 'San Francisco, CA (Hybrid)',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        salaryRange: '$190,000 - $245,000 / year',
        skills: ['Spark', 'Python', 'MLflow', 'Delta Lake', 'ML'],
        description: 'Own data science strategy for lakehouse intelligence products, from model prototyping through production deployment on Databricks.',
        responsibilities: ['Ship production ML systems on Delta Lake and MLflow.', 'Lead model evaluation and monitoring standards.', 'Mentor data scientists across the organization.'],
        requirements: ['Production ML lifecycle experience at scale.', 'Deep Spark and distributed data engineering skills.'],
        benefits: ['Hybrid flexibility', 'RSUs', 'Conference budget'],
        isPublished: true,
      },
      {
        title: 'Senior ML Engineer – GPU Acceleration',
        company: 'NVIDIA',
        department: 'AI Research & Deployment',
        location: 'Santa Clara, CA (Hybrid)',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        salaryRange: '$200,000 - $270,000 / year',
        skills: ['CUDA', 'PyTorch', 'C++', 'Python', 'Deep Learning'],
        description: 'Optimize deep learning kernels and training throughput for the next generation of GPU-accelerated AI systems.',
        responsibilities: ['Profile and optimize PyTorch training workloads on GPU clusters.', 'Collaborate with framework teams on kernel-level improvements.', 'Publish benchmarking methodology for internal and partner teams.'],
        requirements: ['Strong C++/CUDA and PyTorch internals knowledge.', 'Experience with large-scale distributed training.'],
        benefits: ['Hybrid work', 'ESP', 'GPU hardware allowance'],
        isPublished: true,
      },
      {
        title: 'Senior Penetration Tester – Red Team Operator',
        company: 'CrowdStrike',
        department: 'Security Operations',
        location: 'Remote (US)',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        salaryRange: '$150,000 - $195,000 / year',
        skills: ['Red Teaming', 'Burp Suite', 'Metasploit', 'Python', 'Active Directory'],
        description: 'Execute adversary simulation engagements for Fortune 500 clients, emulating advanced persistent threat tradecraft against hardened enterprise environments.',
        responsibilities: ['Plan and execute full-scope red team operations.', 'Develop custom tooling and payloads for evasion testing.', 'Deliver executive-level findings and remediation guidance.'],
        requirements: ['OSCP or equivalent offensive security certification.', 'Active Directory attack path expertise.'],
        benefits: ['Remote-first', 'Training budget', 'Bug bounty support'],
        isPublished: true,
      },
      {
        title: 'Senior Incident Response Specialist – Cyber Defense',
        company: 'Google',
        department: 'Security Operations',
        location: 'United States (Remote)',
        employmentType: 'Full-time',
        experienceLevel: 'Mid to Senior',
        salaryRange: '$160,000 - $210,000 / year',
        skills: ['Incident Response', 'SIEM', 'Threat Hunting', 'Splunk', 'Forensics'],
        description: 'Lead containment and eradication of complex intrusions across Google-scale infrastructure, driving detection engineering improvements after every engagement.',
        responsibilities: ['Lead live incident response for high-severity events.', 'Build detection rules from threat hunting findings.', 'Automate triage workflows with SOAR playbooks.'],
        requirements: ['Hands-on DFIR experience in cloud-native environments.', 'SIEM query and detection engineering proficiency.'],
        benefits: ['Remote eligibility', 'Health & wellness stipend', 'Learning sabbatical'],
        isPublished: true,
      },
      {
        title: 'Algorithmic Risk & AI Governance Specialist',
        company: 'Accenture',
        department: 'Cyber Governance & Legal Tech',
        location: 'New York, NY (Hybrid)',
        employmentType: 'Full-time',
        experienceLevel: 'Mid-Level',
        salaryRange: '$135,000 - $175,000 / year',
        skills: ['NIST AI RMF', 'EU AI Act', 'Model Risk', 'Data Governance'],
        description: 'Advise enterprise clients on AI governance programs, algorithmic risk assessments, and regulatory readiness for emerging AI legislation.',
        responsibilities: ['Assess AI use cases against NIST AI RMF and EU AI Act controls.', 'Design model inventory and monitoring programs.', 'Present governance roadmaps to client executives.'],
        requirements: ['Governance, risk, or compliance experience in technology.', 'Familiarity with AI/ML lifecycle risk management.'],
        benefits: ['Hybrid flexibility', 'Annual bonus', 'Training academy access'],
        isPublished: true,
      },
      {
        title: 'Autonomous AI Agents Engineer – LangGraph & Tool Use',
        company: 'OpenAI',
        department: 'AI Research & Deployment',
        location: 'San Francisco, CA (Hybrid)',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        salaryRange: '$210,000 - $290,000 / year',
        skills: ['Python', 'LangGraph', 'LLMs', 'Tool Use', 'Evaluation'],
        description: 'Design and ship autonomous agent systems with reliable tool use, evaluation harnesses, and production guardrails.',
        responsibilities: ['Build agent architectures with robust tool-calling and recovery.', 'Create evaluation and red-teaming harnesses for agent behavior.', 'Partner with safety teams on guardrail implementation.'],
        requirements: ['Production experience with LLM agent systems.', 'Strong Python engineering and evaluation discipline.'],
        benefits: ['Equity', 'Hybrid work', 'Wellness benefits'],
        isPublished: true,
      },
      {
        title: 'Principal Cloud Solutions Architect – HPC',
        company: 'Amazon Web Services',
        department: 'Infrastructure & SRE',
        location: 'Austin, TX (Hybrid)',
        employmentType: 'Full-time',
        experienceLevel: 'Principal',
        salaryRange: '$195,000 - $260,000 / year',
        skills: ['AWS', 'HPC', 'Kubernetes', 'Networking', 'Terraform'],
        description: 'Architect high-performance computing solutions for enterprise customers running large-scale AI training and simulation workloads.',
        responsibilities: ['Design HPC and GPU cluster architectures for customers.', 'Lead migration of simulation workloads to AWS.', 'Author reference architectures and best practices.'],
        requirements: ['Deep AWS architecture and HPC clustering expertise.', 'Customer-facing solution design experience.'],
        benefits: ['Hybrid', 'RSUs', 'Certification support'],
        isPublished: true,
      },
      {
        title: 'Senior Multi-Cloud DevOps Consultant',
        company: 'Deloitte',
        department: 'Infrastructure & SRE',
        location: 'Remote (US)',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        salaryRange: '$145,000 - $190,000 / year',
        skills: ['Azure', 'AWS', 'Terraform', 'Kubernetes', 'GitOps'],
        description: 'Deliver multi-cloud DevOps transformations for Fortune 500 clients, modernizing release pipelines and platform reliability practices.',
        responsibilities: ['Assess and modernize client delivery pipelines.', 'Implement GitOps platform standards across clouds.', 'Coach client engineering teams on SRE practices.'],
        requirements: ['Consulting or enterprise platform engineering experience.', 'Multi-cloud Terraform and Kubernetes depth.'],
        benefits: ['Remote', 'Utilization bonus', 'Learning budget'],
        isPublished: true,
      },
      {
        title: 'Senior GRC & Security Compliance Specialist',
        company: 'PwC',
        department: 'Cyber Governance & Legal Tech',
        location: 'Remote (US)',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        salaryRange: '$140,000 - $185,000 / year',
        skills: ['SOC 2', 'ISO 27001', 'Vendor Risk', 'Audit', 'Vanta'],
        description: 'Lead security compliance readiness and third-party risk programs for cloud-native enterprise clients.',
        responsibilities: ['Run SOC 2 and ISO 27001 readiness engagements.', 'Automate evidence collection and control monitoring.', 'Advise CISOs on risk remediation priorities.'],
        requirements: ['Audit or compliance program leadership experience.', 'Working knowledge of cloud control frameworks.'],
        benefits: ['Remote flexibility', 'Annual bonus', 'Tuition reimbursement'],
        isPublished: true,
      },
      {
        title: 'MLOps Platform Engineer – Enterprise Infrastructure',
        company: 'Apple',
        department: 'AI Research & Deployment',
        location: 'Cupertino, CA (On-site)',
        employmentType: 'Full-time',
        experienceLevel: 'Mid to Senior',
        salaryRange: '$170,000 - $225,000 / year',
        skills: ['MLOps', 'Kubernetes', 'Python', 'Kubeflow', 'Observability'],
        description: 'Operate the training and serving platform behind Apple-scale machine learning products, with a focus on reliability and developer experience.',
        responsibilities: ['Build self-service model training and deployment tooling.', 'Harden GPU scheduling and model serving reliability.', 'Define monitoring standards for production ML.'],
        requirements: ['Kubernetes and MLOps platform engineering experience.', 'Strong Python and distributed systems fundamentals.'],
        benefits: ['On-site campus perks', 'RSUs', 'Product discounts'],
        isPublished: true,
      },
      {
        title: 'Senior Production Machine Learning Engineer',
        company: 'Stripe',
        department: 'AI Research & Deployment',
        location: 'Remote (US)',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        salaryRange: '$185,000 - $240,000 / year',
        skills: ['Python', 'Feature Stores', 'ML Pipelines', 'Kafka', 'Model Serving'],
        description: 'Ship fraud and risk ML models that process billions of payment events, owning the full lifecycle from feature engineering to serving.',
        responsibilities: ['Build low-latency model serving paths for risk decisions.', 'Design streaming feature pipelines with strict freshness SLAs.', 'Establish model monitoring and rollback practices.'],
        requirements: ['Production ML serving at scale.', 'Streaming data and feature store experience.'],
        benefits: ['Remote-first', 'Equity', 'Annual learning stipend'],
        isPublished: true,
      },
      {
        title: 'Senior Computer Vision Engineer – Edge Perception',
        company: 'Tesla',
        department: 'AI Research & Deployment',
        location: 'Austin, TX (On-site)',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        salaryRange: '$175,000 - $235,000 / year',
        skills: ['Computer Vision', 'PyTorch', 'C++', 'CUDA', 'Perception'],
        description: 'Develop real-time edge perception models for autonomous systems, optimizing architectures for latency and power-constrained hardware.',
        responsibilities: ['Train and quantize perception models for embedded inference.', 'Improve data pipelines for large-scale fleet training.', 'Validate model performance on real-world edge cases.'],
        requirements: ['Deep computer vision and embedded deployment expertise.', 'PyTorch and C++ optimization skills.'],
        benefits: ['On-site roles with relocation support', 'Equity', 'Vehicle discount program'],
        isPublished: true,
      },
      {
        title: 'Cybersecurity Threat Intelligence Analyst',
        company: 'Microsoft',
        department: 'Security Operations',
        location: 'Remote (US)',
        employmentType: 'Full-time',
        experienceLevel: 'Mid-Level',
        salaryRange: '$130,000 - $170,000 / year',
        skills: ['Threat Intelligence', 'KQL', 'MITRE ATT&CK', 'Python', 'OSINT'],
        description: 'Track adversary infrastructure and tradecraft, converting intelligence into detections that protect millions of enterprise endpoints.',
        responsibilities: ['Produce actionable intelligence reports for defenders.', 'Map observed tradecraft to MITRE ATT&CK techniques.', 'Feed detection engineering with high-fidelity indicators.'],
        requirements: ['Threat intelligence or SOC analysis background.', 'KQL/SIEM query proficiency.'],
        benefits: ['Remote-first', 'Health benefits', 'Certification sponsorship'],
        isPublished: true,
      },

    ];

    for (const j of jobsData) {
      await Job.create(j);
    }

    // 8. Success Stories / Testimonials
    const storiesData = [
      {
        studentName: 'Priya Sharma',
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
        course: 'Data Science with AI Integration',
        role: 'AI Engineer',
        company: 'Microsoft',
        salaryHikePercent: 145,
        testimonial: 'The capstone projects and mentor code reviews transformed my understanding of machine learning. The career support team conducted 4 rigorous mock interviews that directly helped me crack Microsoft!',
        rating: 5,
        isFeatured: true,
        graduationYear: '2025',
      },
      {
        studentName: 'Marcus Bennett',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        course: 'Cyber Security with Ethical Hacking',
        role: 'Security Operations Analyst',
        company: 'Palo Alto Networks',
        salaryHikePercent: 120,
        testimonial: 'Coming from non-tech retail, American FutureTech gave me real hands-on penetration testing experience. Within 3 weeks of graduation, I received two job offers in cybersecurity!',
        rating: 5,
        isFeatured: true,
        graduationYear: '2025',
      },
      {
        studentName: 'Daniel Chen',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        course: 'Advanced Generative & Agentic AI Master Program',
        role: 'Senior LLM Systems Engineer',
        company: 'Amazon Web Services (AWS)',
        salaryHikePercent: 160,
        testimonial: 'Agentic AI is moving fast, and this is the only program that taught LangGraph, multi-agent frameworks, and vector architectures at a true production engineering level.',
        rating: 5,
        isFeatured: true,
        graduationYear: '2025',
      },
    ];

    for (const s of storiesData) {
      await SuccessStory.create(s);
    }

    // 9. Categorized FAQs
    const faqsData = [
      {
        question: 'Are American FutureTech training programs beginner-friendly?',
        answer: 'Yes. All programs are structured progressively from core foundations up through enterprise capstone projects. Our instructors provide personalized 1-on-1 office hours and guided lab walkthroughs.',
        category: 'Admissions & Fees',
        order: 1,
      },
      {
        question: 'How does the $99 Seat Reservation Deposit work?',
        answer: 'You can reserve your seat in the upcoming cohort with an initial deposit of only $99. The remaining tuition can be completed before classes start or split into convenient interest-free monthly installments.',
        category: 'Admissions & Fees',
        order: 2,
      },
      {
        question: 'Are the classes live or pre-recorded?',
        answer: 'All master programs feature live, interactive weekend lectures with industry instructors. In addition, all sessions are recorded in 4K and uploaded to your Student LMS within 2 hours with code repositories and lecture notes.',
        category: 'Curriculum & Projects',
        order: 3,
      },
      {
        question: 'What career and placement support is provided?',
        answer: 'Our dedicated Career Network provides comprehensive ATS-optimized resume rewrites, LinkedIn profile optimization, 1-on-1 technical mock interviews, and direct candidate referrals to our 100+ hiring partners in the US and globally.',
        category: 'Career & Placement',
        order: 4,
      },
      {
        question: 'How are American FutureTech certificates verified?',
        answer: 'Every graduate receives an accredited certificate with a unique verification code and public registry link (e.g., americanfuturetech.com/certificate/AFT-CERT-XXXX) which can be added to LinkedIn and verified instantly by recruiters.',
        category: 'Certifications',
        order: 5,
      },
      {
        question: 'How does the corporate placement referral process work?',
        answer: 'Once you complete 70% of your program curriculum and pass your capstone review, our Corporate Placement Office directly introduces your vetted portfolio and ATS-optimized resume to verified hiring partners across our network of 140+ technology companies.',
        category: 'Live Jobs',
        order: 6,
      },
      {
        question: 'What types of roles and companies hire American FutureTech graduates?',
        answer: 'Graduates are hired into high-growth engineering roles including Data Scientist, Machine Learning Engineer, SOC Analyst, Penetration Tester, Cloud DevOps Engineer, and AI Product Manager across Fortune 500 enterprises and high-growth technology companies.',
        category: 'Live Jobs',
        order: 7,
      },
      {
        question: 'Are these positions open to international candidates or US-only?',
        answer: 'We list a mix of on-site US, hybrid, and global remote opportunities. Each job card clearly outlines work authorization requirements, OPT/CPT eligibility, and visa sponsorship availability (e.g. H1B transfer support or international contractor agreements).',
        category: 'Live Jobs',
        order: 8,
      },
      {
        question: 'What compensation ranges can I expect for these partner roles?',
        answer: 'Entry-level engineering packages typically range from $85,000 to $115,000 base. Mid-to-senior specialized roles in Applied AI, Cybersecurity, and Cloud Architecture command $130,000 to $185,000+ total compensation.',
        category: 'Live Jobs',
        order: 9,
      },
      {
        question: 'How does the Fast-Track Placement Concierge work if I do not see my exact role?',
        answer: 'Submit your resume through the Fast-Track Application form on the sidebar. Our placement directors conduct an unlisted partner scan and pair your background directly with upcoming openings within 48 to 72 business hours.',
        category: 'Live Jobs',
        order: 10,
      },
      {
        question: 'Do hiring partners directly review American FutureTech capstone projects?',
        answer: 'Yes! Our curriculum capstones are built to enterprise production specifications. Hiring partner engineering leads review your GitHub repositories, architecture documentation, and live demo recordings during technical evaluation.',
        category: 'Live Jobs',
        order: 11,
      },
    ];

    for (const f of faqsData) {
      await FAQ.create(f);
    }

    // 10. Tech Blog Articles
    const blogsData = [
      {
        title: 'Building Autonomous Multi-Agent Workflows with LangGraph in 2026',
        slug: 'building-autonomous-multi-agent-workflows-langgraph-2026',
        excerpt: 'Explore how state machines and cyclical graph architectures overcome the reliability bottlenecks of linear LLM prompting.',
        category: 'Artificial Intelligence',
        tags: ['LangGraph', 'Agentic AI', 'Python', 'LLMs'],
        content: `### Why Linear Prompting Fails in Enterprise Systems\n\nTraditional linear LLM chains struggle when dealing with complex, multi-step problem solving that requires dynamic backtracking, human verification, and tool retries. State-machine based multi-agent frameworks like LangGraph provide cyclical graphs where independent agents specialize in planning, coding, reviewing, and executing.\n\n### The Anatomy of an Agent Graph\n\n1. **State Definition**: A centralized typed schema tracking message history and execution context.\n2. **Nodes**: Modular LLM agents equipped with specific toolkits.\n3. **Conditional Edges**: Decision pathways routing execution based on test results or validation checks.\n\nAt American FutureTech, our students implement these architectures across real enterprise codebases.`,
        readTimeMinutes: 6,
        isPublished: true,
      },
      {
        title: 'Top 7 Active Directory Attack Vectors and How Enterprise SOCs Stop Them',
        slug: 'top-7-active-directory-attack-vectors-and-soc-defenses',
        excerpt: 'Deconstruct Kerberoasting, AS-REP roasting, and delegation pitfalls used to compromise enterprise domains.',
        category: 'Cyber Security',
        tags: ['Cyber Security', 'Active Directory', 'Kerberos', 'SOC'],
        content: `### Modern Identity Threat Surfaces\n\nOver 90% of Fortune 500 enterprises rely on Active Directory. Attackers exploit Kerberoasting, AS-REP Roasting, and unconstrained delegation to escalate privileges from a compromised workstation to Domain Admin.\n\n### Essential Hardening Principles\n\n- Enforce AES-256 for Kerberos authentication tickets.\n- Implement Tiered Administration models to isolate domain controllers.\n- Deploy real-time behavioral honey accounts to detect reconnaissance activity.`,
        readTimeMinutes: 5,
        isPublished: true,
      },
      {
        title: 'The Evolution of Cloud Infrastructure: Why Terraform + GitOps is Non-Negotiable',
        slug: 'evolution-of-cloud-infrastructure-terraform-gitops',
        excerpt: 'Understand why declarative Terraform models combined with ArgoCD eliminate configuration drift across distributed clusters.',
        category: 'Cloud & DevOps',
        tags: ['DevOps', 'Terraform', 'Kubernetes', 'GitOps'],
        content: `### Eliminating Manual Cloud Drift\n\nManual cloud configuration in web consoles inevitably leads to unversioned configuration drift and security blind spots. Modern SRE teams treat infrastructure as immutable code.\n\nCombining declarative Terraform modules with GitOps automation tools like ArgoCD ensures your Kubernetes clusters are always in lock-step with peer-reviewed Git repositories.`,
        readTimeMinutes: 7,
        isPublished: true,
      },
      {
        title: 'The 2026 Enterprise Guide to Ethical Hacking and Penetration Testing',
        slug: 'the-2026-enterprise-guide-to-ethical-hacking-and-penetration-testing',
        excerpt: 'A comprehensive masterclass on offensive cyber security in 2026: modern reconnaissance, OWASP Top 10 web exploits, virtual lab configurations, and automated threat defense.',
        category: 'Cyber Security',
        tags: ['Ethical Hacking', 'Penetration Testing', 'OWASP', 'Kali Linux'],
        content: `### Modern Offensive Security in 2026\n\nEnterprise offensive security now spans cloud identity, container escape paths, and AI-assisted exploit discovery. This guide walks through building a realistic lab and executing a full engagement.\n\n### Reconnaissance to Exploitation\n\n1. **Passive Recon**: OSINT, subdomain enumeration, and exposed credential discovery.\n2. **Active Scanning**: Nmap service fingerprinting and vulnerability correlation.\n3. **Web Exploitation**: OWASP Top 10 drills including injection, broken access control, and SSRF.\n4. **Post-Exploitation**: Active Directory attack paths, lateral movement, and evidence collection.\n\nEvery phase maps to a client deliverable: scope document, findings register, executive summary, and remediation roadmap.`,
        readTimeMinutes: 8,
        isPublished: true,
      },
      {
        title: 'How to Become a Data Scientist in 2026',
        slug: 'how-to-become-a-data-scientist-in-2026',
        excerpt: 'A complete, step-by-step roadmap to breaking into Data Science in 2026 — from Python and SQL foundations to generative machine learning, production pipelines, and cracking technical interviews.',
        category: 'Data Science',
        tags: ['Data Science', 'Python', 'SQL', 'Career Roadmap'],
        content: `### The 2026 Data Science Roadmap\n\nStart with fundamentals, move into statistical modelling, then build production-grade pipelines that include generative AI components.\n\n1. **Foundations**: Python, pandas, SQL, and statistical reasoning.\n2. **Modelling**: Regression, trees, ensembles, and evaluation discipline.\n3. **Production**: Feature pipelines, model serving, and monitoring.\n4. **Generative Layer**: Embeddings, RAG retrieval, and LLM evaluation.\n\nPortfolio matters more than certificates alone — ship at least three deployed projects with clean READMEs.`,
        readTimeMinutes: 10,
        isPublished: true,
      },
      {
        title: "Data Science vs AI: What's the Difference?",
        slug: 'data-science-vs-ai-whats-the-difference',
        excerpt: 'Understanding the core differences between Data Science and Artificial Intelligence: Compare skill sets, daily responsibilities, tool stacks, and career trajectories to find your optimal path.',
        category: 'Career Guidance',
        tags: ['Data Science', 'Artificial Intelligence', 'Careers'],
        content: `### Two Overlapping Disciplines\n\nData Science focuses on extracting insight and building predictive models from data. AI engineering focuses on building systems that perceive, reason, and act — frequently using deep learning and LLMs.\n\n### How to Choose\n\n- Choose **Data Science** if you enjoy statistics, experimentation, and business insight.\n- Choose **AI Engineering** if you enjoy model architecture, deployment, and agentic systems.\n- Most senior roles in 2026 blend both: strong fundamentals plus production AI skills.`,
        readTimeMinutes: 8,
        isPublished: true,
      },
      {
        title: 'Best AI Skills to Learn in 2026',
        slug: 'best-ai-skills-to-learn-in-2026',
        excerpt: "A technical hiring manager's breakdown of the top high-demand AI skills for 2026: Multi-agent systems, advanced RAG architectures, model evaluation, and parameter-efficient fine-tuning.",
        category: 'Artificial Intelligence',
        tags: ['AI Skills', 'RAG', 'Agents', 'Fine-Tuning'],
        content: `### What Hiring Managers Actually Screen For\n\n1. **Multi-agent orchestration** — reliable tool use, state management, and recovery.\n2. **Advanced RAG** — hybrid retrieval, reranking, and retrieval evaluation.\n3. **Model evaluation** — offline harnesses, regression suites, and red-teaming.\n4. **PEFT** — LoRA/QLoRA fine-tuning with disciplined dataset curation.\n\nDepth in two of these beats shallow familiarity with all four.`,
        readTimeMinutes: 9,
        isPublished: true,
      },
      {
        title: 'How to Become an ML Engineer',
        slug: 'how-to-become-an-ml-engineer',
        excerpt: 'The ultimate technical blueprint to becoming a Machine Learning Engineer in 2026: Math fundamentals, Python systems programming, distributed training, and production MLOps.',
        category: 'Machine Learning',
        tags: ['ML Engineer', 'MLOps', 'Distributed Training'],
        content: `### Engineering First\n\nML engineering is software engineering applied to models. Expect to write more infrastructure code than notebook code.\n\n1. **Fundamentals**: linear algebra, probability, optimization.\n2. **Systems**: Python packaging, testing, containerization, CI/CD.\n3. **Scale**: distributed training, GPU scheduling, checkpointing.\n4. **Operations**: model registries, drift detection, rollback strategy.`,
        readTimeMinutes: 11,
        isPublished: true,
      },
      {
        title: 'Generative AI Career Roadmap',
        slug: 'generative-ai-career-roadmap',
        excerpt: 'From prompt engineering and embeddings to custom foundation models and autonomous multi-agent swarms: A structured step-by-step career path in Generative AI.',
        category: 'Generative AI',
        tags: ['Generative AI', 'LLMs', 'Career Roadmap'],
        content: `### Step-by-Step GenAI Path\n\n1. **Prompt engineering** with evaluation discipline.\n2. **Embeddings & vector search** for retrieval systems.\n3. **RAG architectures** with reranking and citation.\n4. **Fine-tuning** via LoRA and dataset curation.\n5. **Agentic systems** with tool use and multi-agent orchestration.`,
        readTimeMinutes: 9,
        isPublished: true,
      },
      {
        title: 'Cyber Security Career Roadmap',
        slug: 'cyber-security-career-roadmap',
        excerpt: 'A complete guide to launching a cybersecurity career in 2026: Networking fundamentals, Linux hardening, ethical hacking, SOC operations, and industry certifications.',
        category: 'Cyber Security',
        tags: ['Cyber Security', 'SOC', 'Ethical Hacking', 'Certifications'],
        content: `### Launching a Security Career\n\n1. **Foundations**: networking, Linux, scripting.\n2. **Defensive**: SIEM, log analysis, incident response.\n3. **Offensive**: exploitation, red teaming, reporting.\n4. **Credentials**: hands-on labs plus recognised certifications.\n\nBuild a home lab and document every engagement — hiring managers read write-ups.`,
        readTimeMinutes: 10,
        isPublished: true,
      },
      {
        title: 'RAG vs Fine-Tuning: Which One Do You Actually Need?',
        slug: 'rag-vs-fine-tuning-which-one-do-you-actually-need',
        excerpt: 'Retrieval-augmented generation and fine-tuning solve different problems. Here is how to choose the right tool for your use case.',
        category: 'Generative AI',
        tags: ['RAG', 'Fine-Tuning', 'LLMs'],
        content: `### RAG = Knowledge. Fine-Tuning = Behaviour.\n\nUse RAG when the model needs access to facts that change, are private, or must be cited. Use fine-tuning when you need consistent format, tone, or domain-specific reasoning patterns.\n\nMany production systems need both: a fine-tuned model for format reliability, backed by retrieval for accuracy.`,
        readTimeMinutes: 6,
        isPublished: true,
      },
      {
        title: 'What Makes a Great AI Agent? Lessons from Production',
        slug: 'what-makes-a-great-ai-agent-lessons-from-production',
        excerpt: 'Building agents that work in the real world is about more than clever prompts. Here are the engineering principles that matter.',
        category: 'Agentic AI',
        tags: ['AI Agents', 'Tool Use', 'Reliability'],
        content: `### Production Agent Principles\n\n1. **Narrow tools** with strict schemas beat broad, ambiguous tools.\n2. **Deterministic guardrails** around every irreversible action.\n3. **Evaluation harnesses** that replay real failure cases.\n4. **Observability** — full trace of planning, tool calls, and cost.\n\nAgents fail in production because observability and recovery paths were missing, not because prompts were weak.`,
        readTimeMinutes: 7,
        isPublished: true,
      },
      {
        title: 'The 2026 Roadmap to Becoming an AI Engineer',
        slug: 'the-2026-roadmap-to-becoming-an-ai-engineer',
        excerpt: 'A practical, no-hype roadmap to break into AI engineering — what to learn, in what order, and what actually gets you hired.',
        category: 'Career',
        tags: ['AI Engineer', 'Roadmap', 'Hiring'],
        content: `### No-Hype AI Engineering Path\n\n1. Python engineering fundamentals and testing.\n2. Data handling, evaluation, and experiment tracking.\n3. LLM application patterns: RAG, tool calling, agents.\n4. Deployment: containers, CI/CD, cost and latency control.\n\nWhat gets you hired: a deployed system with metrics, a clean repo, and a clear explanation of trade-offs.`,
        readTimeMinutes: 8,
        isPublished: true,
      },
      {
        title: 'From Excel to Power BI: Level Up Your Analytics Career',
        slug: 'from-excel-to-power-bi-level-up-your-analytics-career',
        excerpt: 'Move from spreadsheet reporting to governed, scalable business intelligence with Power BI semantic models and DAX.',
        category: 'Business Intelligence',
        tags: ['Power BI', 'DAX', 'Analytics'],
        content: `### Beyond Spreadsheets\n\nExcel remains the fastest prototyping tool, but enterprise reporting requires governed semantic models.\n\n1. **Model**: star schemas, relationships, and clean measure design.\n2. **DAX**: time intelligence and context transition mastery.\n3. **Governance**: gateway refresh, row-level security, and deployment pipelines.`,
        readTimeMinutes: 7,
        isPublished: true,
      },
      {
        title: 'Modern Data Science in 2026: Bridging Classical ML and Generative AI',
        slug: 'modern-data-science-in-2026-bridging-classical-ml-and-generative-ai',
        excerpt: 'Classical machine learning still powers most production decisions. Here is how modern teams combine it with generative AI systems.',
        category: 'Data Science',
        tags: ['ML', 'Generative AI', 'Production'],
        content: `### Hybrid Architectures Win\n\nGradient-boosted models remain best-in-class for tabular prediction, while LLMs excel at unstructured reasoning and generation. High-performing teams route each task to the right tool and evaluate both with the same rigour.`,
        readTimeMinutes: 8,
        isPublished: true,
      },
    ];

    for (const b of blogsData) {
      await BlogPost.create(b);
    }

    // Coupons are admin-managed now. The legacy promo codes are imported ONCE
    // so existing campaigns keep working and can be edited from the panel.
    const Coupon = require('../models/Coupon');
    if ((await Coupon.countDocuments({})) === 0) {
      await Coupon.insertMany([
        { code: 'FUTURETECH10', description: 'FutureTech 10% Off', discountType: 'percent', discountValue: 10, perStudentLimit: 1 },
        { code: 'WELCOME10', description: 'Welcome 10% Off', discountType: 'percent', discountValue: 10, perStudentLimit: 1 },
        { code: 'AI2026', description: 'AI 2026 — $50 Off', discountType: 'flat', discountValue: 50, perStudentLimit: 1 },
        { code: 'TECH50', description: 'Tech Cohort — $50 Off', discountType: 'flat', discountValue: 50, perStudentLimit: 1 },
      ]);
      console.log('[Auto-Seed] Imported 4 legacy promo codes into the Coupons manager.');
    }

    console.log('[Auto-Seed Completed]: All 7 flagship courses, modules, lessons, quizzes, batches, leads, jobs, blogs, and settings successfully created in database!');
  } catch (error) {
    console.error(`[Auto-Seed Error]: ${error.message}`);
  }
};

module.exports = { autoSeedIfEmpty };
