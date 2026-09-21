export const MICROSOFT_CERTIFICATES = [
  {
    id: 'ms-sc100',
    code: 'SC-100',
    title: 'Microsoft Certified: Cybersecurity Architect Expert',
    level: 'Expert',
    badge: 'Expert Credential',
    category: 'Cybersecurity & Cloud Defense',
    image: '/images/certificates/ms-cert-sc100.png',
    staticImage: '/static/images/certificates/ms-cert-sc100.png',
    description: 'Validates elite architecture capability to design zero-trust security strategies, evaluate governance risk and compliance (GRC), and protect enterprise hybrid multicloud environments.',
    alignedCourses: ['cybersecurity', 'cloud-computing-aws-azure-gcp', 'devops-cloud-engineering'],
    skills: ['Zero-Trust Architecture', 'Hybrid Cloud Security', 'Identity Governance', 'Data Protection Strategy']
  },
  {
    id: 'ms-dp750',
    code: 'DP-750',
    title: 'Microsoft Certified: Azure Databricks Data Engineer Associate',
    level: 'Associate',
    badge: 'Associate Credential',
    category: 'Data Engineering & Machine Learning',
    image: '/images/certificates/ms-cert-dp750.png',
    staticImage: '/static/images/certificates/ms-cert-dp750.png',
    description: 'Demonstrates end-to-end expertise in architecting high-throughput data pipelines, Apache Spark workloads, Delta Lake architectures, and data engineering on Azure Databricks.',
    alignedCourses: ['data-science-with-ai-integration', 'ai-machine-learning-mastery'],
    skills: ['Apache Spark', 'Delta Lake', 'ETL/ELT Optimization', 'Azure Data Factory Integration']
  },
  {
    id: 'ms-dp900',
    code: 'DP-900',
    title: 'Microsoft Certified: Azure Data Fundamentals',
    level: 'Fundamentals',
    badge: 'Foundational Credential',
    category: 'Database & Analytical Systems',
    image: '/images/certificates/ms-cert-dp900.png',
    staticImage: '/static/images/certificates/ms-cert-dp900.png',
    description: 'Mastery of foundational relational and non-relational database concepts, large-scale data analytics, and cloud data warehousing workloads on Azure.',
    alignedCourses: ['data-science-with-ai-integration', 'full-stack-software-engineering'],
    skills: ['Relational Data', 'NoSQL Architectures', 'Modern Data Warehousing', 'Power BI Integration']
  },
  {
    id: 'ms-az900',
    code: 'AZ-900',
    title: 'Microsoft Certified: Azure Fundamentals',
    level: 'Fundamentals',
    badge: 'Foundational Credential',
    category: 'Cloud Infrastructure & Architecture',
    image: '/images/certificates/ms-cert-az900.png',
    staticImage: '/static/images/certificates/ms-cert-az900.png',
    description: 'Comprehensive validation of core cloud computing concepts, Azure architecture components, core services, enterprise governance, compliance, and cost management.',
    alignedCourses: ['cloud-computing-aws-azure-gcp', 'devops-cloud-engineering', 'full-stack-software-engineering'],
    skills: ['Cloud Architecture', 'Core Azure Services', 'Security & Governance', 'Cost Optimization']
  },
  {
    id: 'ms-sc900',
    code: 'SC-900',
    title: 'Microsoft Certified: Security, Compliance, and Identity Fundamentals',
    level: 'Fundamentals',
    badge: 'Foundational Credential',
    category: 'Security & Identity Governance',
    image: '/images/certificates/ms-cert-sc900.png',
    staticImage: '/static/images/certificates/ms-cert-sc900.png',
    description: 'Demonstrates comprehensive understanding of Microsoft Entra identity and access management, Microsoft Defender threat protection, and Purview compliance solutions.',
    alignedCourses: ['cybersecurity', 'cloud-computing-aws-azure-gcp'],
    skills: ['Identity & Access Management', 'Threat Protection', 'Information Protection', 'Compliance Management']
  }
];

export const getAlignedMicrosoftCert = (courseSlugOrCategory) => {
  if (!courseSlugOrCategory) return MICROSOFT_CERTIFICATES[0];
  const slug = courseSlugOrCategory.toLowerCase();
  if (slug.includes('cyber') || slug.includes('security')) {
    return MICROSOFT_CERTIFICATES[0]; // SC-100
  }
  if (slug.includes('data') || slug.includes('ai') || slug.includes('machine')) {
    return MICROSOFT_CERTIFICATES[1]; // DP-750
  }
  if (slug.includes('cloud') || slug.includes('devops')) {
    return MICROSOFT_CERTIFICATES[3]; // AZ-900
  }
  return MICROSOFT_CERTIFICATES[0];
};
