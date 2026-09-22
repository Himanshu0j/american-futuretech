const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Job = require('../models/Job');
const Course = require('../models/Course');

const additionalJobs = [
  {
    title: 'Data Platform & Analytics Engineer',
    company: 'QuantMatrix Capital',
    companyLogo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=80',
    location: 'Remote (US & Canada)',
    employmentType: 'Full-time',
    experienceLevel: 'Entry to Mid Level (1-3 Yrs)',
    salaryRange: '$105,000 - $135,000 / year',
    salaryMin: 105000,
    salaryMax: 135000,
    courseSlug: 'data-science-with-ai-integration',
    skills: ['Python', 'Pandas', 'SQL', 'Apache Spark', 'Airflow', 'Tableau'],
    technicalSkills: ['Python', 'SQL', 'Apache Spark', 'Airflow', 'PostgreSQL', 'Snowflake'],
    softSkills: ['Analytical problem solving', 'Clear stakeholder reporting', 'Cross-functional collaboration'],
    description: 'Join QuantMatrix quantitative analytics team engineering distributed ETL pipelines, automated feature extraction, and predictive business intelligence dashboards.',
    responsibilities: [
      'Design, construct, and maintain scalable data pipelines in Python and Apache Spark.',
      'Automate batch ingestion and stream processing across Snowflake and PostgreSQL data warehouses.',
      'Partner with quant analysts and portfolio managers to deploy predictive valuation models.',
      'Ensure data integrity, automated anomaly monitoring, and pipeline latency SLA compliance.'
    ],
    requirements: [
      'Proficiency in Python, SQL query optimization, and relational data modeling.',
      'Hands-on experience with Apache Spark, Pandas, or modern data stack tools (dbt, Airflow).',
      'American FutureTech Data Science with AI Integration Certification or equivalent degree.'
    ],
    keyRequirements: [
      'Proficiency in Python, SQL query optimization, and relational data modeling.',
      'Hands-on experience with Apache Spark, Pandas, or modern data stack tools (dbt, Airflow).',
      'American FutureTech Data Science with AI Integration Certification or equivalent degree.'
    ],
    preferredQualifications: [
      'Experience working in financial technology or quantitative modeling environments.',
      'Familiarity with cloud data warehousing (Snowflake, BigQuery) and dbt modeling.',
      'Contributions to open-source data engineering libraries.'
    ],
    requiredCertificates: [
      'American FutureTech Certified Data Science & AI Specialist (CDAS)',
      'Databricks Certified Data Engineer or AWS Certified Data Analytics'
    ],
    careerGrowth: 'Promotion pathway to Senior Data Architect or Quantitative Platform Lead within 24 months.',
    benefits: [
      '$105k - $135k competitive compensation + annual performance bonus.',
      '100% remote work flexibility with home office hardware stipend.',
      'Comprehensive healthcare, vision, and dental coverage.',
      '$3,500 annual continuous education and conference travel stipend.'
    ],
    applyLink: 'https://careers.americanfuturetech.com/apply/data-platform-engineer',
    applicantCount: 22,
    isPublished: true
  },
  {
    title: 'AI Governance & Compliance Auditor',
    company: 'Securitas Advisory Group',
    companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80',
    location: 'Remote / New York, NY',
    employmentType: 'Full-time',
    experienceLevel: 'Entry to Mid Level (0-2 Yrs)',
    salaryRange: '$90,000 - $120,000 / year',
    salaryMin: 90000,
    salaryMax: 120000,
    courseSlug: 'governance-risk-and-compliance-grc-with-ai',
    skills: ['NIST CSF', 'ISO 27001', 'SOC 2', 'HIPAA', 'EU AI Act', 'Risk Assessment'],
    technicalSkills: ['NIST CSF 2.0', 'ISO 27001', 'SOC 2 Type II', 'Drata', 'Vanta', 'ServiceNow'],
    softSkills: ['Auditing precision', 'Executive presentation', 'Regulatory compliance writing'],
    description: 'Conduct technical compliance assessments, vendor risk audits, and AI regulatory evaluations for multinational financial and healthcare clients.',
    responsibilities: [
      'Execute readiness audits for SOC 2 Type II, ISO 27001, and NIST Cybersecurity Framework 2.0.',
      'Evaluate enterprise AI deployments against EU AI Act safety, bias, and transparency standards.',
      'Coordinate audit evidence collection and interface with client CISOs and risk committees.',
      'Maintain corporate risk registers, vulnerability tracking, and vendor assessment workflows.'
    ],
    requirements: [
      'Foundational knowledge of cybersecurity frameworks (NIST, ISO 27001, SOC 2).',
      'Strong technical writing and analytical risk communication skills.',
      'Completion of American FutureTech GRC with AI Program or CISA/CRISC certification.'
    ],
    keyRequirements: [
      'Foundational knowledge of cybersecurity frameworks (NIST, ISO 27001, SOC 2).',
      'Strong technical writing and analytical risk communication skills.',
      'Completion of American FutureTech GRC with AI Program or CISA/CRISC certification.'
    ],
    preferredQualifications: [
      'Active CISA, CISM, or ISO 27001 Lead Auditor certification.',
      'Familiarity with automated governance tools like Vanta, Drata, or OneTrust.',
      'Understanding of machine learning lifecycle risk management and AI ethics.'
    ],
    requiredCertificates: [
      'American FutureTech Certified GRC & AI Auditor (CGAA)',
      'ISACA CISA or CompTIA Security+'
    ],
    careerGrowth: 'Clear track to Senior Risk Consultant or Virtual CISO Advisory Lead.',
    benefits: [
      '$90,000 - $120,000 base salary with biannual audit performance bonuses.',
      'Hybrid office flexibility (NYC Financial District) or fully remote US schedule.',
      '401(k) retirement plan with 6% company match.',
      'Company-sponsored professional certifications (CISA, CISM, CDPSE).'
    ],
    applyLink: 'https://careers.americanfuturetech.com/apply/ai-compliance-auditor',
    applicantCount: 16,
    isPublished: true
  },
  {
    title: 'AI Product Associate',
    company: 'Synthetix Systems',
    companyLogo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&auto=format&fit=crop&q=80',
    location: 'Remote (US, UK, & EU)',
    employmentType: 'Full-time',
    experienceLevel: 'Entry Level (0-2 Yrs)',
    salaryRange: '$90,000 - $115,000 / year',
    salaryMin: 90000,
    salaryMax: 115000,
    courseSlug: 'ai-product-manager',
    skills: ['Product Roadmapping', 'PRD Authoring', 'LLM Evaluation', 'Agile/Scrum', 'Figma', 'Mixpanel'],
    technicalSkills: ['Prompt Engineering', 'LangSmith', 'Figma', 'Jira', 'Postman', 'Mixpanel', 'SQL'],
    softSkills: ['User empathy', 'Strategic trade-off prioritization', 'Cross-functional diplomacy'],
    description: 'Help build next-generation enterprise AI software. Draft technical PRDs, run prompt evaluation benchmarks, and translate customer pain points into AI product features.',
    responsibilities: [
      'Collaborate with ML engineers and UX designers to define AI feature requirements and PRDs.',
      'Design and execute evaluation benchmarks for LLM response quality, latency, and hallucination rates.',
      'Analyze user engagement analytics to identify workflow drop-offs and feature iteration opportunities.',
      'Facilitate sprint planning, backlog grooming, and stakeholder demo sessions.'
    ],
    requirements: [
      'Clear understanding of modern AI/ML capabilities, prompt engineering, and LLM limitations.',
      'Outstanding verbal and written communication; ability to articulate complex technical trade-offs.',
      'American FutureTech AI Product Manager Fellowship or relevant PM background.'
    ],
    keyRequirements: [
      'Clear understanding of modern AI/ML capabilities, prompt engineering, and LLM limitations.',
      'Outstanding verbal and written communication; ability to articulate complex technical trade-offs.',
      'American FutureTech AI Product Manager Fellowship or relevant PM background.'
    ],
    preferredQualifications: [
      'Experience conducting user interviews and usability tests for generative AI applications.',
      'Familiarity with LangSmith, Weights & Biases, or similar LLM evaluation telemetry.',
      'Basic ability to write SQL queries to track cohort retention and feature adoption.'
    ],
    requiredCertificates: [
      'American FutureTech Certified AI Product Manager (CAPM)',
      'Scrum Alliance CSPO or Product School AI Certification'
    ],
    careerGrowth: 'Fast-track trajectory to Senior AI Product Manager within 18 months.',
    benefits: [
      '$90,000 - $115,000 base salary + early employee stock option equity.',
      'Flexible working hours across US and European time zones.',
      'Top-spec MacBook Pro M3 and home workspace budget.',
      'Unlimited PTO policy with 3 weeks minimum mandatory recharge time.'
    ],
    applyLink: 'https://careers.americanfuturetech.com/apply/ai-product-associate',
    applicantCount: 29,
    isPublished: true
  },
  {
    title: 'Cloud Security & Threat Hunter',
    company: 'DefenseShield AI',
    companyLogo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&auto=format&fit=crop&q=80',
    location: 'Remote / Washington, DC',
    employmentType: 'Full-time',
    experienceLevel: 'Mid Level (1-3 Yrs)',
    salaryRange: '$110,000 - $145,000 / year',
    salaryMin: 110000,
    salaryMax: 145000,
    courseSlug: 'cyber-security-and-artificial-intelligence',
    skills: ['Threat Hunting', 'AWS GuardDuty', 'Zeek', 'Python', 'YARA', 'MITRE ATT&CK', 'Wazuh'],
    technicalSkills: ['AWS Security Hub', 'Zeek', 'YARA', 'Python', 'Splunk', 'Wazuh', 'Metasploit'],
    softSkills: ['Adversarial mindset', 'High-pressure incident triage', 'Deep investigative curiosity'],
    description: 'Proactively hunt advanced persistent threats (APTs) across cloud workloads and train machine learning models to detect zero-day evasion techniques.',
    responsibilities: [
      'Perform hypothesis-driven threat hunting across AWS/Azure cloud environments using telemetry logs.',
      'Develop custom YARA rules and automated anomaly detection models in Python.',
      'Investigate suspicious cloud API activity, IAM privilege escalation, and container escape attempts.',
      'Contribute to enterprise threat intelligence playbooks mapped to MITRE ATT&CK.'
    ],
    requirements: [
      'Experience in cloud architecture security, network packet analysis, and threat intelligence.',
      'Hands-on scripting skills in Python or Bash for log analysis and automation.',
      'Completion of American FutureTech Cyber Security & AI Hybrid Program or equivalent credentials.'
    ],
    keyRequirements: [
      'Experience in cloud architecture security, network packet analysis, and threat intelligence.',
      'Hands-on scripting skills in Python or Bash for log analysis and automation.',
      'Completion of American FutureTech Cyber Security & AI Hybrid Program or equivalent credentials.'
    ],
    preferredQualifications: [
      'Active GIAC (GCIH/GCFA), AWS Certified Security Specialty, or OSCP.',
      'Demonstrated experience building machine learning anomaly detectors on network PCAPs.',
      'Active US government security clearance or eligibility for clearance.'
    ],
    requiredCertificates: [
      'American FutureTech Certified Cyber AI Defense Architect (CCADA)',
      'AWS Certified Security Specialty or GIAC Certified Incident Handler'
    ],
    careerGrowth: 'Direct pathway to Lead Cloud Threat Hunter or Director of Threat Intelligence.',
    benefits: [
      '$110,000 - $145,000 compensation package with annual equity refreshers.',
      '100% remote flexibility with optional DC security operations center access.',
      'Federal security clearance sponsorship opportunities.',
      'Full medical, dental, and wellness coverage with zero deductible.'
    ],
    applyLink: 'https://careers.americanfuturetech.com/apply/cloud-threat-hunter',
    applicantCount: 18,
    isPublished: true
  },
  {
    title: 'Full-Stack AI Application Engineer',
    company: 'NeuralFlow Labs',
    companyLogo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=120&auto=format&fit=crop&q=80',
    location: 'Remote / Austin, TX',
    employmentType: 'Full-time',
    experienceLevel: 'Entry to Mid Level (1-3 Yrs)',
    salaryRange: '$100,000 - $135,000 / year',
    salaryMin: 100000,
    salaryMax: 135000,
    courseSlug: 'advanced-generative-and-agentic-ai-master-program',
    skills: ['React', 'TypeScript', 'FastAPI', 'Python', 'LangChain', 'Tailwind CSS', 'PostgreSQL'],
    technicalSkills: ['React 18', 'TypeScript', 'FastAPI', 'Python', 'LangChain', 'Tailwind CSS', 'Docker', 'Redis'],
    softSkills: ['Product intuition', 'Rapid prototyping speed', 'Clear code documentation'],
    description: 'Build intuitive, real-time web applications that interface with autonomous agent swarms and multimodal generative AI models.',
    responsibilities: [
      'Architect responsive client interfaces in React and TypeScript with streaming LLM responses.',
      'Build high-throughput REST and WebSocket APIs using Python FastAPI and Redis Pub/Sub.',
      'Integrate vector database search pipelines and multi-agent coordination workflows.',
      'Implement robust client-side caching, optimistic UI updates, and error recovery states.'
    ],
    requirements: [
      'Demonstrated ability to build modern web applications using React and Python backend services.',
      'Familiarity with streaming token protocols, server-sent events (SSE), and LangChain.',
      'Completion of American FutureTech Agentic AI or Full Stack Program with GitHub portfolio.'
    ],
    keyRequirements: [
      'Demonstrated ability to build modern web applications using React and Python backend services.',
      'Familiarity with streaming token protocols, server-sent events (SSE), and LangChain.',
      'Completion of American FutureTech Agentic AI or Full Stack Program with GitHub portfolio.'
    ],
    preferredQualifications: [
      'Experience deploying serverless full-stack AI applications with Vercel and AWS Lambda.',
      'Understanding of client-side state machines and WebSocket state reconciliation.',
      'Active portfolio of side-projects with demonstrable live user traction.'
    ],
    requiredCertificates: [
      'American FutureTech Certified AI Full-Stack Developer (CAFSD)',
      'Meta Front-End Developer or AWS Certified Developer Associate'
    ],
    careerGrowth: 'Rapid advancement to Founding Full-Stack Lead or AI Engineering Manager.',
    benefits: [
      '$100,000 - $135,000 base salary with generous early-stage equity.',
      'Fully remote with quarterly team engineering summits in Austin and San Francisco.',
      'Comprehensive healthcare, 401(k), and life insurance benefits.',
      'Dedicated budget for generative AI API exploration and personal development.'
    ],
    applyLink: 'https://careers.americanfuturetech.com/apply/fullstack-ai-engineer',
    applicantCount: 31,
    isPublished: true
  }
];

async function seedJobs() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/american_futuretech';
    console.log(`Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    const allCourses = await Course.find({});
    const courseMap = {};
    allCourses.forEach(c => {
      courseMap[c.slug] = c;
    });

    console.log(`Found ${allCourses.length} courses in DB.`);

    for (const jobData of additionalJobs) {
      const existing = await Job.findOne({ title: jobData.title });
      const matchedCourse = courseMap[jobData.courseSlug];

      const jobPayload = {
        ...jobData,
        recommendedCourse: matchedCourse ? matchedCourse._id : null,
        recommendedCourseTitle: matchedCourse ? matchedCourse.title : ''
      };
      delete jobPayload.courseSlug;

      if (existing) {
        console.log(`Job already exists: ${jobData.title}, updating...`);
        await Job.findByIdAndUpdate(existing._id, jobPayload);
      } else {
        console.log(`Creating new job: ${jobData.title}`);
        await Job.create(jobPayload);
      }
    }

    const totalJobs = await Job.countDocuments({ isPublished: true });
    console.log(`Successfully seeded! Total published jobs now: ${totalJobs}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed additional jobs:', err);
    process.exit(1);
  }
}

seedJobs();
