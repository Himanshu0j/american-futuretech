/**
 * American FutureTech — Granular Admin RBAC Permissions Matrix
 */

const ALL_PERMISSIONS = [
  // Dashboard & Telemetry
  'DASHBOARD_VIEW',

  // Homepage CMS
  'HOMEPAGE_VIEW',
  'HOMEPAGE_EDIT',

  // Courses & Curricula
  'COURSES_VIEW',
  'COURSES_CREATE',
  'COURSES_EDIT',
  'COURSES_DELETE',

  // Programs & Cohorts
  'PROGRAMS_VIEW',
  'PROGRAMS_CREATE',
  'PROGRAMS_EDIT',
  'PROGRAMS_DELETE',

  // Partner Jobs Board
  'JOBS_VIEW',
  'JOBS_CREATE',
  'JOBS_EDIT',
  'JOBS_DELETE',

  // FAQs
  'FAQ_VIEW',
  'FAQ_CREATE',
  'FAQ_EDIT',
  'FAQ_DELETE',

  // Capstone & Sandboxes
  'CAPSTONE_VIEW',
  'CAPSTONE_CREATE',
  'CAPSTONE_EDIT',
  'CAPSTONE_DELETE',

  // Media & Asset Pipeline
  'MEDIA_VIEW',
  'MEDIA_UPLOAD',
  'MEDIA_EDIT',
  'MEDIA_DELETE',

  // Brand & Company Logos
  'COMPANY_LOGOS_VIEW',
  'COMPANY_LOGOS_CREATE',
  'COMPANY_LOGOS_EDIT',
  'COMPANY_LOGOS_DELETE',

  // Certifications
  'CERTIFICATIONS_VIEW',
  'CERTIFICATIONS_CREATE',
  'CERTIFICATIONS_EDIT',
  'CERTIFICATIONS_DELETE',

  // Students & LMS
  'STUDENTS_VIEW',
  'STUDENTS_EDIT',
  'STUDENTS_DELETE',

  // LMS / Academy control centre
  'LMS_VIEW',
  'LMS_CONTENT_EDIT',
  'LMS_QUIZ_EDIT',
  'LMS_ENROLL_EDIT',
  'LMS_PROGRESS_EDIT',
  'LMS_CERTIFICATE_ISSUE',
  'LMS_CERTIFICATE_REVOKE',
  'LMS_COMMS_EDIT',

  // Admissions Leads CRM
  'LEADS_VIEW',
  'LEADS_EDIT',
  'LEADS_DELETE',
  'LEADS_EXPORT',

  // Analytics
  'ANALYTICS_VIEW',

  // Settings & Configuration
  'SETTINGS_VIEW',
  'SETTINGS_EDIT',

  // Admin & Staff Management (SuperAdmin delegated)
  'ADMIN_MANAGEMENT_VIEW',
  'ADMIN_MANAGEMENT_CREATE',
  'ADMIN_MANAGEMENT_EDIT',
  'ADMIN_MANAGEMENT_DELETE',

  // Coupons & Promotions
  'COUPONS_VIEW',
  'COUPONS_CREATE',
  'COUPONS_EDIT',
  'COUPONS_DELETE',

  // Audit Logs
  'AUDIT_LOG_VIEW',
];

const PERMISSION_MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard & Telemetry',
    permissions: [
      { id: 'DASHBOARD_VIEW', label: 'View Dashboard & Telemetry' },
    ],
  },
  {
    id: 'homepage',
    label: 'Homepage CMS',
    permissions: [
      { id: 'HOMEPAGE_VIEW', label: 'View Homepage CMS' },
      { id: 'HOMEPAGE_EDIT', label: 'Edit Homepage Sections' },
    ],
  },
  {
    id: 'courses',
    label: 'Courses & Curricula',
    permissions: [
      { id: 'COURSES_VIEW', label: 'View Courses' },
      { id: 'COURSES_CREATE', label: 'Create Courses' },
      { id: 'COURSES_EDIT', label: 'Edit Courses' },
      { id: 'COURSES_DELETE', label: 'Delete Courses' },
    ],
  },
  {
    id: 'programs',
    label: 'Career Programs & Batches',
    permissions: [
      { id: 'PROGRAMS_VIEW', label: 'View Programs & Batches' },
      { id: 'PROGRAMS_CREATE', label: 'Create Batches' },
      { id: 'PROGRAMS_EDIT', label: 'Edit Batches' },
      { id: 'PROGRAMS_DELETE', label: 'Delete Batches' },
    ],
  },
  {
    id: 'jobs',
    label: 'Partner Jobs Board',
    permissions: [
      { id: 'JOBS_VIEW', label: 'View Jobs & Applications' },
      { id: 'JOBS_CREATE', label: 'Create Jobs' },
      { id: 'JOBS_EDIT', label: 'Edit Jobs' },
      { id: 'JOBS_DELETE', label: 'Delete Jobs' },
    ],
  },
  {
    id: 'faqs',
    label: 'FAQs & Content',
    permissions: [
      { id: 'FAQ_VIEW', label: 'View FAQs & Blogs' },
      { id: 'FAQ_CREATE', label: 'Create FAQ / Blog' },
      { id: 'FAQ_EDIT', label: 'Edit FAQ / Blog' },
      { id: 'FAQ_DELETE', label: 'Delete FAQ / Blog' },
    ],
  },
  {
    id: 'capstone',
    label: 'Capstone & Sandboxes',
    permissions: [
      { id: 'CAPSTONE_VIEW', label: 'View Capstones & Tools' },
      { id: 'CAPSTONE_CREATE', label: 'Create Capstones' },
      { id: 'CAPSTONE_EDIT', label: 'Edit Capstones' },
      { id: 'CAPSTONE_DELETE', label: 'Delete Capstones' },
    ],
  },
  {
    id: 'media',
    label: 'Media & Upload Pipeline',
    permissions: [
      { id: 'MEDIA_VIEW', label: 'View Media Library' },
      { id: 'MEDIA_UPLOAD', label: 'Upload Images & PNGs' },
      { id: 'MEDIA_EDIT', label: 'Edit Media' },
      { id: 'MEDIA_DELETE', label: 'Delete Media' },
    ],
  },
  {
    id: 'logos',
    label: 'Company Logos & Partners',
    permissions: [
      { id: 'COMPANY_LOGOS_VIEW', label: 'View Partner Logos' },
      { id: 'COMPANY_LOGOS_CREATE', label: 'Add Logos' },
      { id: 'COMPANY_LOGOS_EDIT', label: 'Edit Logos' },
      { id: 'COMPANY_LOGOS_DELETE', label: 'Delete Logos' },
    ],
  },
  {
    id: 'certifications',
    label: 'Certifications',
    permissions: [
      { id: 'CERTIFICATIONS_VIEW', label: 'View Certifications' },
      { id: 'CERTIFICATIONS_CREATE', label: 'Issue Certifications' },
      { id: 'CERTIFICATIONS_EDIT', label: 'Edit Certifications' },
      { id: 'CERTIFICATIONS_DELETE', label: 'Revoke Certifications' },
    ],
  },
  {
    id: 'students',
    label: 'Enrolled Students & LMS',
    permissions: [
      { id: 'STUDENTS_VIEW', label: 'View Students' },
      { id: 'STUDENTS_EDIT', label: 'Edit Students' },
      { id: 'STUDENTS_DELETE', label: 'Remove Students' },
    ],
  },
  {
    id: 'lms',
    label: 'LMS / Academy Control',
    permissions: [
      { id: 'LMS_VIEW', label: 'View the LMS control centre' },
      { id: 'LMS_CONTENT_EDIT', label: 'Author lessons, videos & resources' },
      { id: 'LMS_QUIZ_EDIT', label: 'Build quizzes & review attempts' },
      { id: 'LMS_ENROLL_EDIT', label: 'Enroll / unenroll students & batches' },
      { id: 'LMS_PROGRESS_EDIT', label: 'Reset or force lesson progress' },
      { id: 'LMS_CERTIFICATE_ISSUE', label: 'Issue certificates manually' },
      { id: 'LMS_CERTIFICATE_REVOKE', label: 'Revoke certificates' },
      { id: 'LMS_COMMS_EDIT', label: 'Send announcements & reply to tickets' },
    ],
  },
  {
    id: 'leads',
    label: 'Admissions Leads CRM',
    permissions: [
      { id: 'LEADS_VIEW', label: 'View Leads' },
      { id: 'LEADS_EDIT', label: 'Update Leads' },
      { id: 'LEADS_DELETE', label: 'Delete Leads' },
      { id: 'LEADS_EXPORT', label: 'Export Leads CSV' },
    ],
  },
  {
    id: 'analytics',
    label: 'Business Analytics',
    permissions: [
      { id: 'ANALYTICS_VIEW', label: 'View Analytics & Revenue' },
    ],
  },
  {
    id: 'coupons',
    label: 'Coupons & Promotions',
    permissions: [
      { id: 'COUPONS_VIEW', label: 'View Coupons & Usage' },
      { id: 'COUPONS_CREATE', label: 'Create Coupons' },
      { id: 'COUPONS_EDIT', label: 'Edit / Deactivate Coupons' },
      { id: 'COUPONS_DELETE', label: 'Delete Coupons' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings & Configurations',
    permissions: [
      { id: 'SETTINGS_VIEW', label: 'View System Settings' },
      { id: 'SETTINGS_EDIT', label: 'Update System Settings' },
    ],
  },
  {
    id: 'admin_management',
    label: 'Admin & Staff Management',
    permissions: [
      { id: 'ADMIN_MANAGEMENT_VIEW', label: 'View Staff & Admins' },
      { id: 'ADMIN_MANAGEMENT_CREATE', label: 'Create New Admin' },
      { id: 'ADMIN_MANAGEMENT_EDIT', label: 'Edit Admin & Permissions' },
      { id: 'ADMIN_MANAGEMENT_DELETE', label: 'Delete Admin Account' },
    ],
  },
  {
    id: 'audit_log',
    label: 'System Audit Log',
    permissions: [
      { id: 'AUDIT_LOG_VIEW', label: 'View System Audit Log' },
    ],
  },
];

module.exports = {
  ALL_PERMISSIONS,
  PERMISSION_MODULES,
};
