// client/src/data/courseContentData.js
// Provides comprehensive data for course details sections matching the live American FutureTech portal

export const TOOL_LOGOS = {
  python: "/images/tools/python.svg",
  numpy: "/images/tools/numpy.svg",
  pandas: "/images/tools/pandas.svg",
  tensorflow: "/images/tools/tensorflow.svg",
  pytorch: "/images/tools/pytorch.svg",
  "scikit-learn": "/images/tools/scikitlearn.svg",
  scikitlearn: "/images/tools/scikitlearn.svg",
  sklearn: "/images/tools/scikitlearn.svg",
  tableau: "/images/tools/tableau.svg",
  "power bi": "/images/tools/powerbi.svg",
  powerbi: "/images/tools/powerbi.svg",
  jupyter: "/images/tools/jupyter.svg",
  sql: "/images/tools/sql.svg",
  spark: "/images/tools/spark.svg",
  "apache spark": "/images/tools/spark.svg",
  openai: "/images/tools/openai.svg",
  "openai / llms": "/images/tools/openai.svg",
  "openai/llms": "/images/tools/openai.svg",
  llm: "/images/tools/openai.svg",
  langchain: "/images/tools/langchain.svg",
  huggingface: "/images/tools/huggingface.svg",
  "hugging face": "/images/tools/huggingface.svg",
  docker: "/images/tools/docker.svg",
  kubernetes: "/images/tools/kubernetes.svg",
  aws: "/images/tools/aws.svg",
  azure: "/images/tools/azure.svg",
  "microsoft azure": "/images/tools/azure.svg",
  git: "/images/tools/git.svg",
  linux: "/images/tools/linux.svg",
  bash: "/images/tools/bash.svg",
  jenkins: "/images/tools/jenkins.svg",
  "github actions": "/images/tools/githubactions.svg",
  githubactions: "/images/tools/githubactions.svg",
  ansible: "/images/tools/ansible.svg",
  terraform: "/images/tools/terraform.svg",
  helm: "/images/tools/helm.svg",
  grafana: "/images/tools/grafana.svg",
  prometheus: "/images/tools/prometheus.svg",
  wireshark: "/images/tools/wireshark.svg",
  metasploit: "/images/tools/metasploit.svg",
  nmap: "/images/tools/nmap.svg",
  "burp suite": "/images/tools/burpsuite.svg",
  burpsuite: "/images/tools/burpsuite.svg",
  "kali linux": "/images/tools/kali.svg",
  kali: "/images/tools/kali.svg",
  nessus: "/images/tools/nessus.svg",
  hashcat: "/images/tools/hashcat.svg",
  nikto: "/images/tools/nmap.svg",
};

export function getToolLogo(toolName = "") {
  const normalized = toolName.toLowerCase().trim();
  return TOOL_LOGOS[normalized] || "/images/tools/python.svg";
}

/**
 * Same lookup as getToolLogo, but returns '' when we genuinely have no logo for
 * the name. Courses can now list their own tools (Vanta, Splunk, Snowflake…),
 * and showing the Python logo beside "Snowflake" would be worse than showing a
 * neutral initials badge.
 */
export function findToolLogo(toolName = "") {
  return TOOL_LOGOS[String(toolName).toLowerCase().trim()] || "";
}

export const COURSE_DETAILED_DATA = {
  // -------------------------------------------------------------
  // Data Science & Artificial Intelligence
  // -------------------------------------------------------------
  DATA_SCIENCE_AI: {
    heroTitle: "Data Science and Artificial Intelligence Program",
    category: "Career Program",
    tools: [
      { name: "Python", icon: "/images/tools/python.svg" },
      { name: "TensorFlow", icon: "/images/tools/tensorflow.svg" },
      { name: "PyTorch", icon: "/images/tools/pytorch.svg" },
      { name: "Scikit-Learn", icon: "/images/tools/scikitlearn.svg" },
      { name: "Pandas", icon: "/images/tools/pandas.svg" },
      { name: "NumPy", icon: "/images/tools/numpy.svg" },
      { name: "Jupyter", icon: "/images/tools/jupyter.svg" },
      { name: "Tableau", icon: "/images/tools/tableau.svg" },
      { name: "Power BI", icon: "/images/tools/powerbi.svg" },
      { name: "OpenAI / LLMs", icon: "/images/tools/openai.svg" },
      { name: "LangChain", icon: "/images/tools/langchain.svg" },
      { name: "Hugging Face", icon: "/images/tools/huggingface.svg" },
      { name: "SQL", icon: "/images/tools/sql.svg" },
      { name: "Apache Spark", icon: "/images/tools/spark.svg" },
      { name: "Docker", icon: "/images/tools/docker.svg" },
      { name: "Microsoft Azure", icon: "/images/tools/azure.svg" },
    ],
    whyChoose: [
      {
        title: "Doubt Clearing Sessions",
        desc: "Get your questions answered live by expert AI mentors anytime during the program with 1-on-1 personalized attention.",
        gradient: "from-red-500 to-red-500",
        bgLight: "bg-red-50/80",
        borderLight: "border-red-100",
        icon: "MessageSquare",
      },
      {
        title: "Industry Relevant Projects",
        desc: "Build a production-grade portfolio with enterprise projects mirroring real-world predictive AI systems and pipelines.",
        gradient: "from-blue-500 to-blue-500",
        bgLight: "bg-blue-50/80",
        borderLight: "border-blue-100",
        icon: "ShieldCheck",
      },
      {
        title: "Assignment Evaluation",
        desc: "Every notebook, model script, and deployment pipeline is thoroughly reviewed with granular code quality and performance feedback.",
        gradient: "from-blue-500 to-blue-500",
        bgLight: "bg-blue-50/80",
        borderLight: "border-blue-100",
        icon: "CheckCircle2",
      },
      {
        title: "Virtual Lab For Practice",
        desc: "Access cloud GPU compute instances and pre-configured JupyterHub environments to train heavy deep learning models safely.",
        gradient: "from-blue-500 to-blue-500",
        bgLight: "bg-blue-50/80",
        borderLight: "border-blue-100",
        icon: "Monitor",
      },
      {
        title: "Industry Experts Live",
        desc: "Learn directly from active Silicon Valley and Fortune 500 AI Architects and Principal Data Scientists in live interactive workshops.",
        gradient: "from-red-500 to-yellow-500",
        bgLight: "bg-red-50/80",
        borderLight: "border-red-100",
        icon: "GraduationCap",
      },
      {
        title: "3+ Career Sessions",
        desc: "ATS-optimized tech resume rewrite, portfolio Git review, behavioral coaching, and mock technical interview grilling.",
        gradient: "from-red-500 to-red-500",
        bgLight: "bg-red-50/80",
        borderLight: "border-red-100",
        icon: "Briefcase",
      },
    ],
    whoCanApply: [
      "Individuals already working in IT, software development, network administration, or related fields who want to specialize in Data Science.",
      "IT professionals who want to upgrade their careers. Graduates with at least 50% marks in the graduation final result.",
      "Individuals with a quantitative or analytical background and at least 60% marks in higher secondary education.",
      "Individuals who want to get ample career options, high upward mobility, and earn competitive global salaries.",
      "Those who want to master practical Data Science, Machine Learning, Deep Learning, and Generative AI technologies.",
    ],
    audiencePills: [
      { tag: "Graduates", color: "from-blue-600 to-blue-600" },
      { tag: "Working Professionals", color: "from-blue-600 to-blue-600" },
      { tag: "Career Switchers", color: "from-red-600 to-red-600" },
      { tag: "Fresh Learners", color: "from-blue-600 to-blue-600" },
    ],
    capstoneProjects: [
      {
        tag: "Machine Learning",
        title: "US Health Care Analysis",
        desc: "Analyze real-world U.S. healthcare data to uncover patterns in patient outcomes, treatment costs, and regional clinical resource optimization.",
        stack: ["Python", "Pandas", "Scikit-Learn", "Seaborn"],
        color: "from-blue-500 to-blue-500",
      },
      {
        tag: "Computer Vision",
        title: "Emotion Recognition",
        desc: "Build a deep convolutional neural network that classifies human facial emotions in real time for empathetic customer interaction systems.",
        stack: ["TensorFlow", "OpenCV", "Keras", "Python"],
        color: "from-blue-500 to-blue-500",
      },
      {
        tag: "Computer Vision",
        title: "Distracted Driver Recognition",
        desc: "Detect driver distractions and dangerous mobile behaviors in real-time camera streams using AI computer vision to elevate road transit safety.",
        stack: ["PyTorch", "YOLOv8", "OpenCV", "CNN"],
        color: "from-red-500 to-red-500",
      },
      {
        tag: "NLP & Transformers",
        title: "Customer Sentiment Analysis",
        desc: "Mine millions of customer reviews and social media comments using fine-tuned BERT transformers to quantify real-time customer brand sentiment.",
        stack: ["BERT", "Hugging Face", "NLTK", "Tableau"],
        color: "from-blue-500 to-blue-500",
      },
      {
        tag: "Business Intelligence",
        title: "Sales Forecasting Dashboard",
        desc: "Build an executive enterprise BI dashboard forecasting quarterly multi-region revenue using ARIMA and Prophet time-series models.",
        stack: ["Power BI", "ARIMA", "SQL", "Excel"],
        color: "from-red-500 to-red-500",
      },
      {
        tag: "Time Series",
        title: "Stock Price Prediction",
        desc: "Apply LSTM recurrent neural networks with quantitative indicators to forecast financial equity price movements from historical market tick data.",
        stack: ["Python", "LSTM", "yfinance", "Matplotlib"],
        color: "from-blue-500 to-blue-500",
      },
      {
        tag: "Machine Learning",
        title: "Customer Churn Prediction",
        desc: "Predict subscriber churn for a 100k+ customer telecom dataset using gradient boosting and interpret feature drivers using SHAP values.",
        stack: ["XGBoost", "SHAP", "Scikit-Learn", "Pandas"],
        color: "from-blue-500 to-blue-500",
      },
      {
        tag: "Recommendation AI",
        title: "E-Commerce Recommendation Engine",
        desc: "Design a production hybrid collaborative-filtering engine that personalizes product feeds and drives digital commerce conversion uplift.",
        stack: ["Python", "Surprise", "FastAPI", "Cosine Similarity"],
        color: "from-red-500 to-red-500",
      },
    ],
    careerRoles: [
      { name: "Machine Learning Engineer", color: "from-blue-500 to-blue-500" },
      { name: "Data Scientist", color: "from-blue-500 to-blue-500" },
      { name: "AI Research Scientist", color: "from-blue-500 to-blue-500" },
      { name: "NLP Engineer", color: "from-red-500 to-yellow-500" },
      { name: "Computer Vision Engineer", color: "from-red-500 to-red-500" },
      { name: "Data Engineer", color: "from-blue-500 to-blue-500" },
      { name: "Business Intelligence Analyst", color: "from-blue-500 to-blue-500" },
      { name: "MLOps Engineer", color: "from-blue-500 to-blue-500" },
      { name: "AI Product Manager", color: "from-blue-500 to-blue-500" },
      { name: "AI Solutions Architect", color: "from-red-500 to-red-500" },
    ],
    certificates: {
      completionImage: "/static/images/dsai.jpeg",
      completionTitle: "Certificate of Completion",
      completionIssuer: "American FutureTech",
      completionBadge: "Accredited US Fellowship",
      completionDesc: "Awarded to learners who successfully complete the Data Science and Artificial Intelligence Program, demonstrating mastery of enterprise ML pipelines.",
      microsoftImage: "/static/images/microsoftcertificate.jpg",
      microsoftTitle: "Microsoft Certified Professional",
      microsoftIssuer: "Microsoft",
      microsoftCode: "AI-102 / DP-100",
      microsoftDesc: "Earn official Microsoft certification validating your engineering capabilities on Azure AI, Azure OpenAI Service, and modern machine learning frameworks.",
    },
  },

  // -------------------------------------------------------------
  // Cyber Security with Ethical Hacking
  // -------------------------------------------------------------
  CYBER_ETHICAL_HACKING: {
    heroTitle: "Cyber Security with Ethical Hacking Program",
    category: "Career Program",
    tools: [
      { name: "Kali Linux", icon: "/images/tools/kali.svg" },
      { name: "Wireshark", icon: "/images/tools/wireshark.svg" },
      { name: "Metasploit", icon: "/images/tools/metasploit.svg" },
      { name: "Nmap", icon: "/images/tools/nmap.svg" },
      { name: "Burp Suite", icon: "/images/tools/burpsuite.svg" },
      { name: "Nessus", icon: "/images/tools/nessus.svg" },
      { name: "Hashcat", icon: "/images/tools/hashcat.svg" },
      { name: "Python", icon: "/images/tools/python.svg" },
      { name: "Linux", icon: "/images/tools/linux.svg" },
      { name: "Bash", icon: "/images/tools/bash.svg" },
      { name: "Docker", icon: "/images/tools/docker.svg" },
      { name: "AWS Security", icon: "/images/tools/aws.svg" },
    ],
    whyChoose: [
      {
        title: "Doubt Clearing Sessions",
        desc: "Live walkthroughs of exploit payloads, defensive configurations, and network traces with senior cybersecurity instructors.",
        gradient: "from-red-500 to-red-500",
        bgLight: "bg-red-50/80",
        borderLight: "border-red-100",
        icon: "MessageSquare",
      },
      {
        title: "Industry Relevant Projects",
        desc: "Perform authorized penetration testing, vulnerability scanning, and incident forensics on realistic enterprise test networks.",
        gradient: "from-blue-500 to-blue-500",
        bgLight: "bg-blue-50/80",
        borderLight: "border-blue-100",
        icon: "ShieldCheck",
      },
      {
        title: "Assignment Evaluation",
        desc: "Detailed rubric evaluations of your pen test reports, vulnerability assessments, and remediation code.",
        gradient: "from-blue-500 to-blue-500",
        bgLight: "bg-blue-50/80",
        borderLight: "border-blue-100",
        icon: "CheckCircle2",
      },
      {
        title: "Virtual Lab For Practice",
        desc: "Dedicated isolated sandbox environment for running offensive exploits, network packet capturing, and live threat simulations safely.",
        gradient: "from-blue-500 to-blue-500",
        bgLight: "bg-blue-50/80",
        borderLight: "border-blue-100",
        icon: "Monitor",
      },
      {
        title: "Industry Experts Live",
        desc: "Taught by active CISOs, certified ethical hackers (CEH), and enterprise SOC leads protecting global critical infrastructure.",
        gradient: "from-red-500 to-yellow-500",
        bgLight: "bg-red-50/80",
        borderLight: "border-red-100",
        icon: "GraduationCap",
      },
      {
        title: "3+ Career Sessions",
        desc: "Security clearance preparation guidance, resume re-alignment for SOC & Pen-Test positions, and simulated technical grillings.",
        gradient: "from-red-500 to-red-500",
        bgLight: "bg-red-50/80",
        borderLight: "border-red-100",
        icon: "Briefcase",
      },
    ],
    whoCanApply: [
      "Individuals already working in IT, software development, network administration, or related fields who want to specialize in cybersecurity.",
      "IT professionals seeking to pivot into high-demand security roles. Graduates with at least 50% marks in their final results.",
      "Individuals with basic computing literacy and at least 60% marks in higher secondary education.",
      "Those who want high-paying roles in ethical hacking, cyber defense, and penetration testing.",
      "Anyone passionate about securing critical systems, web infrastructure, and enterprise data.",
    ],
    audiencePills: [
      { tag: "Graduates", color: "from-blue-600 to-blue-600" },
      { tag: "IT Professionals", color: "from-blue-600 to-blue-600" },
      { tag: "System Admins", color: "from-red-600 to-red-600" },
      { tag: "Career Switchers", color: "from-blue-600 to-blue-600" },
    ],
    capstoneProjects: [
      {
        tag: "Network Security",
        title: "Network Intrusion Detection System",
        desc: "Build an automated ML-powered IDS that classifies malicious traffic patterns and generates instant alerts from packet streams.",
        stack: ["Python", "Scapy", "Wireshark", "Scikit-Learn"],
        color: "from-blue-500 to-blue-500",
      },
      {
        tag: "Cryptography",
        title: "Zero-Knowledge Password Vault",
        desc: "Design a high-security credential manager utilizing AES-256-GCM encryption and PBKDF2 key derivation.",
        stack: ["Python", "PyCryptodome", "SQLite", "Argon2"],
        color: "from-red-500 to-red-500",
      },
      {
        tag: "Threat Intel",
        title: "Malware Analysis Sandbox",
        desc: "Build an automated sandbox pipeline executing suspicious PE binaries, harvesting IOCs, and producing structured threat reports.",
        stack: ["Python", "YARA", "Cuckoo", "Docker"],
        color: "from-blue-500 to-blue-500",
      },
      {
        tag: "Application Security",
        title: "OWASP Top 10 Vulnerability Scanner",
        desc: "Develop an automated security auditing tool scanning web applications for SQLi, XSS, CSRF, and broken access controls.",
        stack: ["Python", "Burp Suite API", "Selenium", "OWASP ZAP"],
        color: "from-red-500 to-red-500",
      },
    ],
    careerRoles: [
      { name: "Ethical Hacker", color: "from-blue-500 to-blue-500" },
      { name: "Cyber Security Analyst", color: "from-blue-500 to-blue-500" },
      { name: "Penetration Tester", color: "from-blue-500 to-blue-500" },
      { name: "SOC Analyst", color: "from-red-500 to-yellow-500" },
      { name: "Security Engineer", color: "from-red-500 to-red-500" },
      { name: "Incident Responder", color: "from-blue-500 to-blue-500" },
      { name: "Vulnerability Assessor", color: "from-blue-500 to-blue-500" },
      { name: "Security Consultant", color: "from-blue-500 to-blue-500" },
    ],
    certificates: {
      completionImage: "/static/images/cseh.jpeg",
      completionTitle: "Certificate of Completion",
      completionIssuer: "American FutureTech",
      completionBadge: "Accredited US Fellowship",
      completionDesc: "Awarded to candidates who demonstrate hands-on competence in ethical hacking, defensive security, and network triage.",
      microsoftImage: "/static/images/microsoftsc.jpg",
      microsoftTitle: "Microsoft Certified: Security Operations Analyst",
      microsoftIssuer: "Microsoft",
      microsoftCode: "SC-200 / AZ-500",
      microsoftDesc: "Validate your ability to collaborate with organizational stakeholders to secure information technology systems and mitigate threats using Microsoft Defender and Sentinel.",
    },
  },
};

/**
 * Every other program, built on one of the two full content sets above.
 *
 * These existed only as a fallback to Data Science before, so DevOps, AI Product
 * Management and GRC all rendered the SAME capstone cards (and the client spotted
 * it immediately: "Capstone project saare courses me same dikh rha hai"). Each
 * program now carries its own projects; assignment happens after the literal so
 * the entries can spread a finished base object.
 */
COURSE_DETAILED_DATA.CYBER_AI_HYBRID = {
  ...COURSE_DETAILED_DATA.CYBER_ETHICAL_HACKING,
  heroTitle: "Cyber Security & Artificial Intelligence Hybrid Program",
  capstoneProjects: [
    {
      tag: "Applied AI & Defense",
      title: "AI-Powered Threat Detection Platform",
      desc: "Train unsupervised anomaly models on Zeek and firewall telemetry to surface intrusions that static signatures miss, with an analyst review queue.",
      stack: ["Python", "Zeek", "Scikit-Learn", "Splunk"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Applied AI & Defense",
      title: "Phishing & Deepfake Detection Engine",
      desc: "Classify malicious email, cloned login pages and synthetic voice samples using transformer models, then auto-quarantine confirmed attacks.",
      stack: ["Hugging Face", "PyTorch", "YARA", "FastAPI"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Applied AI & Defense",
      title: "Adversarial ML & Model Defense Lab",
      desc: "Attack a production fraud model with evasion and poisoning techniques, then harden it with adversarial training and input validation.",
      stack: ["TensorFlow", "ART", "NumPy", "Jupyter"],
      color: "from-red-500 to-red-500",
    },
    {
      tag: "Applied AI & Defense",
      title: "Autonomous Incident Response Workflows",
      desc: "Wire an LLM triage assistant into SOAR playbooks so alerts are enriched, summarised and escalated with a full audit trail.",
      stack: ["LangChain", "SOAR", "Cortex XSOAR", "REST APIs"],
      color: "from-blue-500 to-blue-500",
    },
  ],
  careerRoles: [
    { name: "AI Security Engineer", color: "from-blue-500 to-blue-500" },
    { name: "Threat Detection Engineer", color: "from-blue-500 to-blue-500" },
    { name: "Security Data Scientist", color: "from-blue-500 to-blue-500" },
    { name: "SOC Tier 2 / Tier 3 Analyst", color: "from-red-500 to-yellow-500" },
    { name: "Detection & Response Automation Engineer", color: "from-red-500 to-red-500" },
  ],
  certificates: {
    ...COURSE_DETAILED_DATA.CYBER_ETHICAL_HACKING.certificates,
    completionImage: "/static/images/csai.jpeg",
  },
};

COURSE_DETAILED_DATA.ADVANCED_GENERATIVE_AI = {
  ...COURSE_DETAILED_DATA.DATA_SCIENCE_AI,
  heroTitle: "Advanced Generative & Agentic AI Master Program",
  capstoneProjects: [
    {
      tag: "Agentic Systems",
      title: "Multi-Agent Research Copilot",
      desc: "Build a planner-plus-workers agent team that researches a market question, cites its sources and produces a reviewed executive brief.",
      stack: ["LangGraph", "CrewAI", "GPT-4 class LLM", "Pinecone"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Retrieval & RAG",
      title: "Enterprise RAG Knowledge Assistant",
      desc: "Ship a hybrid search (vector + keyword) assistant over internal documents with citation grounding and an automated answer-quality evaluation harness.",
      stack: ["LlamaIndex", "pgvector", "RAGAS", "FastAPI"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Model Fine-Tuning",
      title: "Fine-Tuned Domain LLM with Guardrails",
      desc: "Fine-tune an open-weight model with LoRA/QLoRA on a domain corpus, then add safety filters, PII redaction and an eval scorecard before release.",
      stack: ["PyTorch", "LoRA / QLoRA", "Llama 3.1", "vLLM"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Agentic Systems",
      title: "Autonomous Workflow Agent with Tool Use",
      desc: "Give an agent safe tools (SQL, email, ticketing) with policy checks, retries and human approval gates so it can complete a real back-office workflow end to end.",
      stack: ["OpenAI Tools API", "Temporal", "PostgreSQL", "Docker"],
      color: "from-red-500 to-red-500",
    },
  ],
  careerRoles: [
    { name: "Generative AI Engineer", color: "from-blue-500 to-blue-500" },
    { name: "AI Agent Architect", color: "from-blue-500 to-blue-500" },
    { name: "LLM Platform Engineer", color: "from-blue-500 to-blue-500" },
    { name: "Prompt & Evaluation Engineer", color: "from-red-500 to-yellow-500" },
    { name: "Applied AI Solutions Lead", color: "from-red-500 to-red-500" },
  ],
};

COURSE_DETAILED_DATA.DEVOPS_CLOUD = {
  ...COURSE_DETAILED_DATA.DATA_SCIENCE_AI,
  heroTitle: "DevOps, Kubernetes & Cloud with AI Program",
  capstoneProjects: [
    {
      tag: "Platform Engineering",
      title: "Production Kubernetes Platform on EKS",
      desc: "Stand up a multi-tenant cluster with namespaces, RBAC, ingress, autoscaling and cost guardrails, then prove it survives a node failure drill.",
      stack: ["Kubernetes", "EKS", "Helm", "Istio"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Infrastructure as Code",
      title: "Terraform Cloud Blueprint",
      desc: "Codify a repeatable VPC, database and compute environment with remote state, modules and policy checks so a new region deploys in one command.",
      stack: ["Terraform", "AWS", "Terragrunt", "OPA"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "CI / CD",
      title: "GitOps Delivery Pipeline with ArgoCD",
      desc: "Wire commit-to-production delivery with GitHub Actions, container scanning, progressive rollouts and automatic rollback on failed health checks.",
      stack: ["GitHub Actions", "ArgoCD", "Docker", "Trivy"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "AIOps",
      title: "AIOps Observability & Auto-Scaling Lab",
      desc: "Stream metrics and logs into an anomaly detector that predicts saturation and scales workloads before customers ever see latency.",
      stack: ["Prometheus", "Grafana", "Loki", "Scikit-Learn"],
      color: "from-red-500 to-red-500",
    },
  ],
  careerRoles: [
    { name: "DevOps Engineer", color: "from-blue-500 to-blue-500" },
    { name: "Site Reliability Engineer", color: "from-blue-500 to-blue-500" },
    { name: "Cloud Platform Engineer", color: "from-blue-500 to-blue-500" },
    { name: "Infrastructure Automation Engineer", color: "from-red-500 to-yellow-500" },
    { name: "AIOps Engineer", color: "from-red-500 to-red-500" },
  ],
};

COURSE_DETAILED_DATA.AI_PRODUCT_MANAGER = {
  ...COURSE_DETAILED_DATA.DATA_SCIENCE_AI,
  heroTitle: "AI Product Manager Program",
  capstoneProjects: [
    {
      tag: "Discovery",
      title: "AI Product Discovery & Roadmap Case Study",
      desc: "Run user interviews, define the problem statement and ship a prioritised AI roadmap with success metrics a hiring panel can challenge.",
      stack: ["Jira", "Figma", "Amplitude", "User Interviews"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Unit Economics",
      title: "LLM Cost & Unit-Economics Model",
      desc: "Model token cost, latency and margin per active user, then design caching, routing and tier limits that keep the AI feature profitable.",
      stack: ["Excel", "Python", "OpenAI API", "Looker"],
      color: "from-red-500 to-red-500",
    },
    {
      tag: "Responsible AI",
      title: "AI Feature Evaluation & Guardrail Scorecard",
      desc: "Define acceptance thresholds for accuracy, hallucination rate, bias and safety, then instrument them into a release gate used by engineering.",
      stack: ["Eval Harness", "Notion", "SQL", "RAGAS"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Experience Design",
      title: "Human-in-the-Loop UX Prototype",
      desc: "Prototype an AI assistant that explains its reasoning, accepts corrections and hands control back to the user at the right moment.",
      stack: ["Figma", "React", "LLM API", "Usability Testing"],
      color: "from-blue-500 to-blue-500",
    },
  ],
  careerRoles: [
    { name: "AI Product Manager", color: "from-blue-500 to-blue-500" },
    { name: "Technical Product Owner", color: "from-blue-500 to-blue-500" },
    { name: "AI Program Manager", color: "from-blue-500 to-blue-500" },
    { name: "Product Analytics Lead", color: "from-red-500 to-yellow-500" },
    { name: "Responsible AI Lead", color: "from-red-500 to-red-500" },
  ],
};

/**
 * GRC projects come straight from the governance brief the client supplied with
 * the course format document, so the cards read the way their material does.
 */
COURSE_DETAILED_DATA.GRC_AI = {
  ...COURSE_DETAILED_DATA.DATA_SCIENCE_AI,
  heroTitle: "Governance, Risk and Compliance (GRC) with AI Program",
  capstoneProjects: [
    {
      tag: "Entry-Level",
      title: "AI-Powered Risk Register & Risk Scoring System",
      desc: "Build an AI-assisted register that ingests organisational risks, scores likelihood and impact, and produces a ranked treatment plan for the risk committee.",
      stack: ["Python", "NLP", "Excel", "Power BI"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Entry-Level",
      title: "AI Compliance Gap Assessment",
      desc: "Compare internal policies against ISO 27001, SOC 2 and GDPR control sets, then output an evidence-backed gap report with owners and due dates.",
      stack: ["LLM Assist", "SQL", "OneTrust", "ServiceNow"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Mid-Level",
      title: "AI-Powered Regulatory Change Management",
      desc: "Monitor regulatory feeds, classify what changed, route impact to the right control owners and track remediation to closure.",
      stack: ["Python", "NLP", "Jira", "Archer"],
      color: "from-red-500 to-red-500",
    },
    {
      tag: "Advanced-Level",
      title: "Enterprise AI GRC Platform",
      desc: "Design an AI-system inventory with ownership, model risk tiering and continuous evidence collection that satisfies internal audit and external regulators.",
      stack: ["OneTrust", "Vanta", "Drata", "Snowflake"],
      color: "from-blue-500 to-blue-500",
    },
  ],
  careerRoles: [
    { name: "GRC Analyst", color: "from-blue-500 to-blue-500" },
    { name: "AI Governance Specialist", color: "from-blue-500 to-blue-500" },
    { name: "Risk & Compliance Manager", color: "from-blue-500 to-blue-500" },
    { name: "Internal Audit Analyst", color: "from-red-500 to-yellow-500" },
    { name: "IT Control Assurance Lead", color: "from-red-500 to-red-500" },
  ],
};

COURSE_DETAILED_DATA.PLACEMENT_SUPPORT = {
  ...COURSE_DETAILED_DATA.DATA_SCIENCE_AI,
  heroTitle: "Placement Support Program",
  capstoneProjects: [
    {
      tag: "Personal Branding",
      title: "ATS-Ready Technical Resume Rebuild",
      desc: "Rewrite your resume around measurable outcomes, pass the automated screening filters and land a recruiter call-back rate you can track.",
      stack: ["ATS Optimisation", "STAR Method", "LinkedIn"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Portfolio",
      title: "Portfolio & GitHub Code Review Sprint",
      desc: "Turn coursework into three interview-ready repositories with clean READMEs, tests and deployed demos a hiring manager can click through.",
      stack: ["GitHub", "Docker", "Vercel", "CI"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Interview Prep",
      title: "Mock Interview & Technical Grilling Series",
      desc: "Face structured behavioural and live technical interviews with industry mentors, then work the written feedback loop before the next attempt.",
      stack: ["System Design", "DSA", "Behavioural"],
      color: "from-blue-500 to-blue-500",
    },
    {
      tag: "Negotiation",
      title: "Offer & Salary Negotiation Simulation",
      desc: "Practise the counter-offer conversation with real market benchmarks so you accept the right number instead of the first one.",
      stack: ["Market Benchmarks", "Role Play", "Comp Data"],
      color: "from-red-500 to-red-500",
    },
  ],
};

/**
 * Resolve detailed content object based on course title or slug.
 *
 * Order matters: the more specific program has to be matched before the generic
 * "cyber" fallback, and every program must resolve to its OWN set so two course
 * pages never render the same capstone cards.
 */
export function getDetailedCourseData(course) {
  if (!course) return COURSE_DETAILED_DATA.DATA_SCIENCE_AI;

  const t = (course.title || "").toLowerCase();
  const s = (course.slug || "").toLowerCase();

  if (s.includes("placement") || t.includes("placement support")) {
    return COURSE_DETAILED_DATA.PLACEMENT_SUPPORT;
  }

  if (s.includes("grc") || t.includes("governance")) {
    return COURSE_DETAILED_DATA.GRC_AI;
  }

  if (s.includes("devops") || t.includes("devops")) {
    return COURSE_DETAILED_DATA.DEVOPS_CLOUD;
  }

  if (s.includes("product-manager") || t.includes("product manager")) {
    return COURSE_DETAILED_DATA.AI_PRODUCT_MANAGER;
  }

  if (t.includes("generative") || s.includes("generative") || s.includes("agentic")) {
    return COURSE_DETAILED_DATA.ADVANCED_GENERATIVE_AI;
  }

  if (t.includes("cyber") && (s.includes("hybrid") || s.includes("artificial-intelligence") || t.includes("artificial intelligence"))) {
    return COURSE_DETAILED_DATA.CYBER_AI_HYBRID;
  }

  if (t.includes("data science") || s.includes("data-science") || s === "8") {
    return COURSE_DETAILED_DATA.DATA_SCIENCE_AI;
  }

  if (t.includes("cyber") && (t.includes("ethical hacking") || s.includes("ethical-hacking"))) {
    return COURSE_DETAILED_DATA.CYBER_ETHICAL_HACKING;
  }

  if (t.includes("cyber")) {
    return COURSE_DETAILED_DATA.CYBER_ETHICAL_HACKING;
  }

  // Fallback defaults with Data Science & AI high quality content
  return COURSE_DETAILED_DATA.DATA_SCIENCE_AI;
}
