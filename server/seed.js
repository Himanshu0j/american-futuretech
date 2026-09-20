require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Course = require('./models/Course');
const Lead = require('./models/Lead');
const Batch = require('./models/Batch');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seeding Started]: Clearing existing collections...');

    await User.deleteMany();
    await Course.deleteMany();
    await Lead.deleteMany();
    await Batch.deleteMany();

    // 1. Create SuperAdmin and Counselors
    console.log('[Seeding]: Creating Staff & RBAC Accounts...');
    const superAdmin = await User.create({
      name: 'Alexander Pierce (Principal Admin)',
      email: 'admin@americanfuturetech.com',
      password: 'admin123',
      role: 'SuperAdmin',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    const counselor1 = await User.create({
      name: 'Sarah Jenkins',
      email: 'counselor@americanfuturetech.com',
      password: 'admin123',
      role: 'Counselor',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    });

    const instructor1 = await User.create({
      name: 'Dr. Marcus Vance (Head of AI)',
      email: 'instructor@americanfuturetech.com',
      password: 'admin123',
      role: 'Instructor',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });

    console.log('✓ SuperAdmin created: admin@americanfuturetech.com / admin123');

    // 2. Create the 2 Primary Programs matching user's visual reference
    console.log('[Seeding]: Creating Core Programs...');
    const dataScienceCourse = await Course.create({
      title: 'Data Science with AI Integration',
      slug: 'data-science-with-ai-integration',
      category: 'Artificial Intelligence & Analytics',
      badge: 'Most Popular',
      cardTheme: 'cyan',
      duration: '6 Months',
      pricing: {
        basePrice: 2499,
        discountedPrice: 1899,
        currency: '$',
      },
      highlights: [
        'AI / ML, Deep Learning',
        'Real Data Projects',
        'Healthcare & Finance Focus',
      ],
      curriculum: [
        {
          moduleNumber: 1,
          moduleTitle: 'Python for Data Science & Advanced Analytics',
          topics: ['Vectorized Computing with NumPy', 'Pandas Exploratory Data Analysis (EDA)', 'Interactive Visualizations with Plotly & Seaborn', 'SQL for Enterprise Data Warehouses'],
          hours: 32,
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Machine Learning Architectures & Statistical Modeling',
          topics: ['Supervised & Unsupervised Learning', 'Scikit-Learn Production Pipelines', 'Feature Engineering & Dimension Reduction', 'Model Optimization & Hyperparameter Tuning'],
          hours: 40,
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Deep Learning, PyTorch, Computer Vision & NLP',
          topics: ['Artificial Neural Networks & Backprop', 'PyTorch Tensor Computing', 'CNNs for Computer Vision Applications', 'Transformers, BERT & Sequence Models'],
          hours: 48,
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Enterprise Generative AI, LLMs & MLOps Deployment',
          topics: ['LangChain & LlamaIndex Orchestration', 'RAG (Retrieval-Augmented Generation) Architectures', 'Vector Databases (Pinecone & Milvus)', 'Docker, FastAPI & AWS SageMaker MLOps'],
          hours: 40,
        },
      ],
      brochureUrl: '/brochures/American_FutureTech_Data_Science_AI_Brochure.pdf',
      isPublished: true,
      seatsUrgencyText: 'Only 3 seats left for upcoming weekend cohort',
    });

    const cyberSecurityCourse = await Course.create({
      title: 'Cyber Security with Ethical Hacking',
      slug: 'cyber-security-with-ethical-hacking',
      category: 'Information Security & Offensive Operations',
      badge: 'High Demand',
      cardTheme: 'rose',
      duration: '6 Months',
      pricing: {
        basePrice: 2499,
        discountedPrice: 1899,
        currency: '$',
      },
      highlights: [
        'Network Security',
        'Ethical Hacking Tools',
        'Real-World Simulations',
      ],
      curriculum: [
        {
          moduleNumber: 1,
          moduleTitle: 'Offensive Security Fundamentals & Linux Hardening',
          topics: ['Kali Linux Architecture & Bash Scripting', 'TCP/IP Protocol Stack & Deep Packet Inspection', 'Reconnaissance & OSINT Methodology', 'Network Mapping with Nmap & Wireshark'],
          hours: 32,
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Vulnerability Assessment & Penetration Testing',
          topics: ['Metasploit Framework Mastery', 'Privilege Escalation (Windows & Linux)', 'Buffer Overflows & Memory Exploitation', 'Wireless Network Security (WPA2/3 Auditing)'],
          hours: 40,
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Web Application Exploitation (OWASP Top 10)',
          topics: ['Burp Suite Professional Workflows', 'SQL Injection, XSS & CSRF Exploitation', 'Server-Side Request Forgery (SSRF)', 'API Security Auditing & Bug Bounty Strategies'],
          hours: 48,
        },
        {
          moduleNumber: 4,
          moduleTitle: 'SOC Operations, Threat Hunting & Incident Response',
          topics: ['Splunk & Elastic SIEM Architecture', 'Threat Hunting with MITRE ATT&CK', 'Digital Forensics & Malware Reverse Engineering', 'Zero Trust Architecture & Cloud Security (AWS/Azure)'],
          hours: 40,
        },
      ],
      brochureUrl: '/brochures/American_FutureTech_Cyber_Security_Brochure.pdf',
      isPublished: true,
      seatsUrgencyText: 'Only 4 seats left for upcoming cohort',
    });

    console.log('✓ 2 Core Programs created');

    // 3. Create Batches with Enrolled Students
    console.log('[Seeding]: Creating Batches & Cohorts...');
    const now = new Date();
    const batch1Start = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
    const batch2Start = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now

    const dsBatch = await Batch.create({
      course: dataScienceCourse._id,
      batchCode: 'DS-2026-OCT-A',
      startDate: batch1Start,
      timing: 'Sat & Sun: 10:00 AM - 12:00 PM EST',
      maxCapacity: 25,
      status: 'Upcoming',
      enrolledStudents: [
        {
          studentName: 'Elena Rostova',
          email: 'elena.rostova@techcorp.io',
          phone: '+1 (555) 234-8901',
          feePaid: 1899,
          totalFee: 1899,
          paymentStatus: 'Paid',
          invoiceId: 'INV-849102',
          enrolledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          studentName: 'David Chen',
          email: 'david.chen@mit.alumni.edu',
          phone: '+1 (555) 782-4419',
          feePaid: 950,
          totalFee: 1899,
          paymentStatus: 'Partial',
          invoiceId: 'INV-849103',
          enrolledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          studentName: 'Sophia Williams',
          email: 'sophia.w@cloudscale.net',
          phone: '+1 (555) 390-1123',
          feePaid: 1899,
          totalFee: 1899,
          paymentStatus: 'Paid',
          invoiceId: 'INV-849104',
          enrolledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        }
      ],
    });

    const csBatch = await Batch.create({
      course: cyberSecurityCourse._id,
      batchCode: 'CS-2026-OCT-B',
      startDate: batch2Start,
      timing: 'Sat & Sun: 02:00 PM - 04:00 PM EST',
      maxCapacity: 25,
      status: 'Upcoming',
      enrolledStudents: [
        {
          studentName: 'Marcus Sterling',
          email: 'm.sterling@defenseops.gov',
          phone: '+1 (555) 912-7744',
          feePaid: 1899,
          totalFee: 1899,
          paymentStatus: 'Paid',
          invoiceId: 'INV-902111',
          enrolledAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          studentName: 'Chloe Dupont',
          email: 'chloe.dupont@fintechsec.com',
          phone: '+1 (555) 441-2098',
          feePaid: 0,
          totalFee: 1899,
          paymentStatus: 'Pending',
          invoiceId: 'INV-902112',
          enrolledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        }
      ],
    });

    console.log('✓ 2 Batches created with initial student enrollments');

    // 4. Create 10 realistic leads with mixed statuses and call logs
    console.log('[Seeding]: Creating Realistic Leads for CRM Pipeline...');
    const dummyLeads = [
      {
        fullName: 'Jordan Miller',
        email: 'jordan.miller@quantum.io',
        phone: '+1 (555) 301-4492',
        targetCourse: dataScienceCourse._id,
        preferredBatch: 'Weekend Live (2 Hours)',
        status: 'New',
        marketingSource: 'Google Search Ads',
        assignedCounselor: counselor1._id,
        notes: 'Looking to transition from Senior BI Analyst to AI Engineer.',
        callLogs: [],
      },
      {
        fullName: 'Samantha Ray',
        email: 'samantha.ray@cybervault.org',
        phone: '+1 (555) 443-8109',
        targetCourse: cyberSecurityCourse._id,
        preferredBatch: 'Evening Batch',
        status: 'Contacted',
        marketingSource: 'LinkedIn Campaign',
        assignedCounselor: counselor1._id,
        notes: 'Has CompTIA Security+, wants real-world ethical hacking practice.',
        callLogs: [
          {
            caller: counselor1.name,
            note: 'Introduced syllabus and 24/7 lab access. She asked about bug bounty coverage in Module 3.',
            callOutcome: 'Answered',
            followUpDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
            timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          }
        ],
      },
      {
        fullName: 'Alexander Wright',
        email: 'a.wright@vanguardtech.co',
        phone: '+1 (555) 781-9920',
        targetCourse: dataScienceCourse._id,
        preferredBatch: 'Weekend Live (2 Hours)',
        status: 'Counseling Scheduled',
        marketingSource: 'Organic Website',
        assignedCounselor: counselor1._id,
        notes: 'Scheduled 1-on-1 curriculum walk with Dr. Vance.',
        callLogs: [
          {
            caller: counselor1.name,
            note: 'Discussed scholarship criteria. Booked 30-min Zoom demo with faculty.',
            callOutcome: 'Counseling Scheduled',
            followUpDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
            timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          }
        ],
      },
      {
        fullName: 'Elena Rostova',
        email: 'elena.rostova@techcorp.io',
        phone: '+1 (555) 234-8901',
        targetCourse: dataScienceCourse._id,
        preferredBatch: 'Weekend Live (2 Hours)',
        status: 'Enrolled',
        marketingSource: 'Direct Apply Modal',
        assignedCounselor: counselor1._id,
        notes: 'Enrolled in DS-2026-OCT-A. Paid in full.',
        callLogs: [
          {
            caller: counselor1.name,
            note: 'Completed enrollment onboarding. Sent LMS access credentials.',
            callOutcome: 'Answered',
            timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000),
          }
        ],
      },
      {
        fullName: 'Michael Becker',
        email: 'mbecker@netguard.de',
        phone: '+1 (555) 670-3321',
        targetCourse: cyberSecurityCourse._id,
        preferredBatch: 'Weekend Live (2 Hours)',
        status: 'Contacted',
        marketingSource: 'YouTube Tech Review',
        assignedCounselor: counselor1._id,
        notes: 'Wants to check company sponsorship policy.',
        callLogs: [
          {
            caller: counselor1.name,
            note: 'Sent employer reimbursement letter template.',
            callOutcome: 'Callback Requested',
            followUpDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
          }
        ],
      },
      {
        fullName: 'Priya Sharma',
        email: 'priya.sharma@finai.com',
        phone: '+1 (555) 892-0044',
        targetCourse: dataScienceCourse._id,
        preferredBatch: 'Morning Batch',
        status: 'Counseling Scheduled',
        marketingSource: 'Referral',
        assignedCounselor: counselor1._id,
        notes: 'Wants focus on Healthcare & Financial algorithmic forecasting.',
        callLogs: [
          {
            caller: counselor1.name,
            note: 'Reviewed Module 4 RAG and fine-tuning projects. She was very excited.',
            callOutcome: 'Interested',
            followUpDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
            timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
          }
        ],
      },
      {
        fullName: 'Lucas Oliveira',
        email: 'lucas.o@saasecurity.br',
        phone: '+1 (555) 551-8273',
        targetCourse: cyberSecurityCourse._id,
        preferredBatch: 'Weekend Live (2 Hours)',
        status: 'New',
        marketingSource: 'Reddit Organic Tech Community',
        notes: 'Inquiring if classes include live cloud penetration testing.',
        callLogs: [],
      },
      {
        fullName: 'Emily Thorne',
        email: 'emily.thorne@biomedanalytics.org',
        phone: '+1 (555) 129-4500',
        targetCourse: dataScienceCourse._id,
        preferredBatch: 'Flexible',
        status: 'New',
        marketingSource: 'Organic Search',
        notes: 'Master in Biology seeking AI & genomic data science training.',
        callLogs: [],
      },
      {
        fullName: 'Brandon Taylor',
        email: 'b.taylor@legacyfinance.com',
        phone: '+1 (555) 998-1122',
        targetCourse: cyberSecurityCourse._id,
        preferredBatch: 'Evening Batch',
        status: 'Lost',
        marketingSource: 'Facebook Ads',
        assignedCounselor: counselor1._id,
        notes: 'Timing conflict with current international project.',
        callLogs: [
          {
            caller: counselor1.name,
            note: 'Cannot commit to weekend hours at this time. Recommended checking back Q1 2027.',
            callOutcome: 'Not Interested',
            timestamp: new Date(now.getTime() - 96 * 60 * 60 * 1000),
          }
        ],
      },
      {
        fullName: 'Aisha Al-Mansoor',
        email: 'aisha.mansoor@dubai-ai.ae',
        phone: '+1 (555) 774-3200',
        targetCourse: dataScienceCourse._id,
        preferredBatch: 'Weekend Live (2 Hours)',
        status: 'Contacted',
        marketingSource: 'LinkedIn Campaign',
        assignedCounselor: counselor1._id,
        notes: 'Wants to register together with a teammate.',
        callLogs: [
          {
            caller: counselor1.name,
            note: 'Discussed 10% team enrollment discount. Follow-up pending invoice approval.',
            callOutcome: 'Answered',
            followUpDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
            timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000),
          }
        ],
      },
    ];

    await Lead.insertMany(dummyLeads);
    console.log('✓ 10 Realistic leads with call logs injected into CRM');

    console.log(`
=============================================================
  AMERICAN FUTURETECH SEED COMPLETED SUCCESSFULLY!
  -----------------------------------------------------------
  SuperAdmin: admin@americanfuturetech.com / admin123
  Counselor:  counselor@americanfuturetech.com / admin123
  Instructor: instructor@americanfuturetech.com / admin123
=============================================================
    `);

    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
