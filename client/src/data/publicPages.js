/**
 * Every public page the inline website editor can reach.
 *
 * Kept in one place so the editor's page picker and the admin "Website Editor"
 * overview never drift apart.
 */
export const PUBLIC_PAGES = [
  { path: '/', label: 'Home (landing page)', group: 'Main pages' },
  { path: '/courses', label: 'All Courses', group: 'Main pages' },
  { path: '/about', label: 'About Us', group: 'Main pages' },
  { path: '/careers', label: 'Career Program / Job Board', group: 'Main pages' },
  { path: '/career-support', label: 'Career Support', group: 'Main pages' },
  { path: '/success-stories', label: 'Success Stories', group: 'Main pages' },
  { path: '/blog', label: 'Blog', group: 'Main pages' },
  { path: '/faq', label: 'FAQs', group: 'Main pages' },
  { path: '/contact', label: 'Contact', group: 'Main pages' },
  { path: '/checkout', label: 'Checkout', group: 'Other' },
  { path: '/privacy', label: 'Privacy Policy', group: 'Legal' },
  { path: '/refund-policy', label: 'Refund Policy', group: 'Legal' },
  { path: '/cookie-policy', label: 'Cookie Policy', group: 'Legal' },
  { path: '/terms', label: 'Terms & Conditions', group: 'Legal' },
];

export const PAGE_LABELS = PUBLIC_PAGES.reduce((acc, page) => {
  acc[page.path] = page.label;
  return acc;
}, {});

export const labelForRoute = (route) => PAGE_LABELS[route] || route;

/** Build the editor URL for a route (the inline editor activates on ?edit=1). */
export const editorUrlFor = (route) => `${route}${route.includes('?') ? '&' : '?'}edit=1`;
