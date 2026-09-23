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
        gradient: "from-orange-500 to-amber-500",
        bgLight: "bg-orange-50/80",
        borderLight: "border-orange-100",
        icon: "MessageSquare",
      },
      {
        title: "Industry Relevant Projects",
        desc: "Build a production-grade portfolio with enterprise projects mirroring real-world predictive AI systems and pipelines.",
        gradient: "from-emerald-500 to-teal-500",
        bgLight: "bg-emerald-50/80",
        borderLight: "border-emerald-100",
        icon: "ShieldCheck",
      },
      {
        title: "Assignment Evaluation",
        desc: "Every notebook, model script, and deployment pipeline is thoroughly reviewed with granular code quality and performance feedback.",
        gradient: "from-blue-500 to-indigo-500",
        bgLight: "bg-blue-50/80",
        borderLight: "border-blue-100",
        icon: "CheckCircle2",
      },
      {
        title: "Virtual Lab For Practice",
        desc: "Access cloud GPU compute instances and pre-configured JupyterHub environments to train heavy deep learning models safely.",
        gradient: "from-purple-500 to-violet-500",
        bgLight: "bg-purple-50/80",
        borderLight: "border-purple-100",
        icon: "Monitor",
      },
      {
        title: "Industry Experts Live",
        desc: "Learn directly from active Silicon Valley and Fortune 500 AI Architects and Principal Data Scientists in live interactive workshops.",
        gradient: "from-amber-500 to-yellow-500",
        bgLight: "bg-amber-50/80",
        borderLight: "border-amber-100",
        icon: "GraduationCap",
      },
      {
        title: "3+ Career Sessions",
        desc: "ATS-optimized tech resume rewrite, portfolio Git review, behavioral coaching, and mock technical interview grilling.",
        gradient: "from-rose-500 to-pink-500",
        bgLight: "bg-rose-50/80",
        borderLight: "border-rose-100",
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
      { tag: "Graduates", color: "from-blue-600 to-indigo-600" },
      { tag: "Working Professionals", color: "from-emerald-600 to-teal-600" },
      { tag: "Career Switchers", color: "from-rose-600 to-pink-600" },
      { tag: "Fresh Learners", color: "from-violet-600 to-fuchsia-600" },
    ],
    capstoneProjects: [
      {
        tag: "Machine Learning",
        title: "US Health Care Analysis",
        desc: "Analyze real-world U.S. healthcare data to uncover patterns in patient outcomes, treatment costs, and regional clinical resource optimization.",
        stack: ["Python", "Pandas", "Scikit-Learn", "Seaborn"],
        color: "from-blue-500 to-indigo-500",
      },
      {
        tag: "Computer Vision",
        title: "Emotion Recognition",
        desc: "Build a deep convolutional neural network that classifies human facial emotions in real time for empathetic customer interaction systems.",
        stack: ["TensorFlow", "OpenCV", "Keras", "Python"],
        color: "from-violet-500 to-fuchsia-500",
      },
      {
        tag: "Computer Vision",
        title: "Distracted Driver Recognition",
        desc: "Detect driver distractions and dangerous mobile behaviors in real-time camera streams using AI computer vision to elevate road transit safety.",
        stack: ["PyTorch", "YOLOv8", "OpenCV", "CNN"],
        color: "from-rose-500 to-pink-500",
      },
      {
        tag: "NLP & Transformers",
        title: "Customer Sentiment Analysis",
        desc: "Mine millions of customer reviews and social media comments using fine-tuned BERT transformers to quantify real-time customer brand sentiment.",
        stack: ["BERT", "Hugging Face", "NLTK", "Tableau"],
        color: "from-emerald-500 to-teal-500",
      },
      {
        tag: "Business Intelligence",
        title: "Sales Forecasting Dashboard",
        desc: "Build an executive enterprise BI dashboard forecasting quarterly multi-region revenue using ARIMA and Prophet time-series models.",
        stack: ["Power BI", "ARIMA", "SQL", "Excel"],
        color: "from-amber-500 to-orange-500",
      },
      {
        tag: "Time Series",
        title: "Stock Price Prediction",
        desc: "Apply LSTM recurrent neural networks with quantitative indicators to forecast financial equity price movements from historical market tick data.",
        stack: ["Python", "LSTM", "yfinance", "Matplotlib"],
        color: "from-indigo-500 to-blue-500",
      },
      {
        tag: "Machine Learning",
        title: "Customer Churn Prediction",
        desc: "Predict subscriber churn for a 100k+ customer telecom dataset using gradient boosting and interpret feature drivers using SHAP values.",
        stack: ["XGBoost", "SHAP", "Scikit-Learn", "Pandas"],
        color: "from-indigo-500 to-indigo-500",
      },
      {
        tag: "Recommendation AI",
        title: "E-Commerce Recommendation Engine",
        desc: "Design a production hybrid collaborative-filtering engine that personalizes product feeds and drives digital commerce conversion uplift.",
        stack: ["Python", "Surprise", "FastAPI", "Cosine Similarity"],
        color: "from-red-500 to-orange-500",
      },
    ],
    careerRoles: [
      { name: "Machine Learning Engineer", color: "from-blue-500 to-indigo-500" },
      { name: "Data Scientist", color: "from-violet-500 to-purple-500" },
      { name: "AI Research Scientist", color: "from-emerald-500 to-green-500" },
      { name: "NLP Engineer", color: "from-amber-500 to-yellow-500" },
      { name: "Computer Vision Engineer", color: "from-rose-500 to-pink-500" },
      { name: "Data Engineer", color: "from-indigo-500 to-blue-500" },
      { name: "Business Intelligence Analyst", color: "from-teal-500 to-emerald-500" },
      { name: "MLOps Engineer", color: "from-fuchsia-500 to-violet-500" },
      { name: "AI Product Manager", color: "from-indigo-500 to-indigo-500" },
      { name: "AI Solutions Architect", color: "from-orange-500 to-amber-500" },
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
        gradient: "from-orange-500 to-amber-500",
        bgLight: "bg-orange-50/80",
        borderLight: "border-orange-100",
        icon: "MessageSquare",
      },
      {
        title: "Industry Relevant Projects",
        desc: "Perform authorized penetration testing, vulnerability scanning, and incident forensics on realistic enterprise test networks.",
        gradient: "from-emerald-500 to-teal-500",
        bgLight: "bg-emerald-50/80",
        borderLight: "border-emerald-100",
        icon: "ShieldCheck",
      },
      {
        title: "Assignment Evaluation",
        desc: "Detailed rubric evaluations of your pen test reports, vulnerability assessments, and remediation code.",
        gradient: "from-blue-500 to-indigo-500",
        bgLight: "bg-blue-50/80",
        borderLight: "border-blue-100",
        icon: "CheckCircle2",
      },
      {
        title: "Virtual Lab For Practice",
        desc: "Dedicated isolated sandbox environment for running offensive exploits, network packet capturing, and live threat simulations safely.",
        gradient: "from-purple-500 to-violet-500",
        bgLight: "bg-purple-50/80",
        borderLight: "border-purple-100",
        icon: "Monitor",
      },
      {
        title: "Industry Experts Live",
        desc: "Taught by active CISOs, certified ethical hackers (CEH), and enterprise SOC leads protecting global critical infrastructure.",
        gradient: "from-amber-500 to-yellow-500",
        bgLight: "bg-amber-50/80",
        borderLight: "border-amber-100",
        icon: "GraduationCap",
      },
      {
        title: "3+ Career Sessions",
        desc: "Security clearance preparation guidance, resume re-alignment for SOC & Pen-Test positions, and simulated technical grillings.",
        gradient: "from-rose-500 to-pink-500",
        bgLight: "bg-rose-50/80",
        borderLight: "border-rose-100",
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
      { tag: "Graduates", color: "from-blue-600 to-indigo-600" },
      { tag: "IT Professionals", color: "from-emerald-600 to-teal-600" },
      { tag: "System Admins", color: "from-rose-600 to-pink-600" },
      { tag: "Career Switchers", color: "from-violet-600 to-fuchsia-600" },
    ],
    capstoneProjects: [
      {
        tag: "Network Security",
        title: "Network Intrusion Detection System",
        desc: "Build an automated ML-powered IDS that classifies malicious traffic patterns and generates instant alerts from packet streams.",
        stack: ["Python", "Scapy", "Wireshark", "Scikit-Learn"],
        color: "from-blue-500 to-indigo-500",
      },
      {
        tag: "Cryptography",
        title: "Zero-Knowledge Password Vault",
        desc: "Design a high-security credential manager utilizing AES-256-GCM encryption and PBKDF2 key derivation.",
        stack: ["Python", "PyCryptodome", "SQLite", "Argon2"],
        color: "from-amber-500 to-orange-500",
      },
      {
        tag: "Threat Intel",
        title: "Malware Analysis Sandbox",
        desc: "Build an automated sandbox pipeline executing suspicious PE binaries, harvesting IOCs, and producing structured threat reports.",
        stack: ["Python", "YARA", "Cuckoo", "Docker"],
        color: "from-indigo-500 to-blue-500",
      },
      {
        tag: "Application Security",
        title: "OWASP Top 10 Vulnerability Scanner",
        desc: "Develop an automated security auditing tool scanning web applications for SQLi, XSS, CSRF, and broken access controls.",
        stack: ["Python", "Burp Suite API", "Selenium", "OWASP ZAP"],
        color: "from-rose-500 to-pink-500",
      },
    ],
    careerRoles: [
      { name: "Ethical Hacker", color: "from-blue-500 to-indigo-500" },
      { name: "Cyber Security Analyst", color: "from-violet-500 to-purple-500" },
      { name: "Penetration Tester", color: "from-emerald-500 to-green-500" },
      { name: "SOC Analyst", color: "from-amber-500 to-yellow-500" },
      { name: "Security Engineer", color: "from-rose-500 to-pink-500" },
      { name: "Incident Responder", color: "from-indigo-500 to-blue-500" },
      { name: "Vulnerability Assessor", color: "from-teal-500 to-emerald-500" },
      { name: "Security Consultant", color: "from-fuchsia-500 to-violet-500" },
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
 * Resolve detailed content object based on course title or slug
 */
export function getDetailedCourseData(course) {
  if (!course) return COURSE_DETAILED_DATA.DATA_SCIENCE_AI;

  const t = (course.title || "").toLowerCase();
  const s = (course.slug || "").toLowerCase();

  if (t.includes("data science") || s.includes("data-science") || s === "8") {
    return COURSE_DETAILED_DATA.DATA_SCIENCE_AI;
  }

  if (t.includes("cyber") && (t.includes("ethical hacking") || s.includes("ethical-hacking"))) {
    return COURSE_DETAILED_DATA.CYBER_ETHICAL_HACKING;
  }

  if (t.includes("cyber")) {
    return {
      ...COURSE_DETAILED_DATA.CYBER_ETHICAL_HACKING,
      certificates: {
        ...COURSE_DETAILED_DATA.CYBER_ETHICAL_HACKING.certificates,
        completionImage: "/static/images/csai.jpeg",
      },
    };
  }

  // Fallback defaults with Data Science & AI high quality content
  return COURSE_DETAILED_DATA.DATA_SCIENCE_AI;
}
