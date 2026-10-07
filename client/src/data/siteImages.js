/**
 * Admin-managed website images.
 *
 * The client asked for one place in the admin where a photo can be dropped in —
 * by pasting a link or uploading a file — and then simply appears on the site,
 * in many places. That place is Admin → Content → "Website Images"
 * (client/src/admin/SiteImagesCMS.jsx) and it writes `SiteSettings.siteImages`.
 *
 * This module is the single source of truth the public site reads:
 *   • DEFAULT_SITE_IMAGES — the photos the site ships with, so the homepage
 *     showcase is never an empty band before the client adds their own
 *   • SITE_IMAGE_BANNERS  — the inner pages that accept a banner photo
 *   • resolveSiteImages() — saved settings merged over those defaults
 *   • bannerImageFor()    — one page's banner URL ('' when unset)
 *
 * Nothing here is required: a course page, a banner or the whole showcase
 * disappears whenever no image is configured.
 */

/** The photos shipped with the site (all live in client/public/images). */
export const DEFAULT_SITE_IMAGES = {
  enabled: true,
  eyebrow: 'Inside The Program',
  heading: 'Life at American FutureTech',
  subheading:
    'Live cohort labs, 1-on-1 mentor reviews and capstone defenses — real classrooms, real mentors, real shipped work.',
  // Entry 1 is the tall lead photo; 2 and 3 sit stacked beside it.
  feature: [
    {
      image: '/images/classroom-lab.jpg',
      caption: 'Live cohort lab — mentors on screen, code on yours',
      alt: 'Live online cohort lab with mentors and learners',
      order: 1,
      active: true,
    },
    {
      image: '/images/mentorship-session.jpg',
      caption: 'Weekly 1-on-1 mentor review',
      alt: 'One-on-one mentorship review session',
      order: 2,
      active: true,
    },
    {
      image: '/images/fellows-collaborating.jpg',
      caption: 'Capstone team shipping together',
      alt: 'Fellows collaborating on a capstone project',
      order: 3,
      active: true,
    },
  ],
  gallery: [
    {
      image: '/images/hero-graduation.jpg',
      caption: 'Fellowship graduation day',
      alt: 'Graduates celebrating fellowship completion',
      order: 1,
      active: true,
    },
    {
      image: '/images/career-network-hero.jpg',
      caption: 'Hiring-partner introductions',
      alt: 'Career network and hiring partner introductions',
      order: 2,
      active: true,
    },
    {
      image: '/images/career-acceleration.jpg',
      caption: 'Career acceleration workshop',
      alt: 'Career acceleration workshop in progress',
      order: 3,
      active: true,
    },
    {
      image: '/images/floating-laptop-code.webp',
      caption: 'Production-grade code reviews',
      alt: 'Production code review on a laptop',
      order: 4,
      active: true,
    },
    {
      image: '/images/hero-innovator.jpg',
      caption: 'Innovation sprint week',
      alt: 'Learner working through an innovation sprint',
      order: 5,
      active: true,
    },
    {
      image: '/images/grad-cap-diploma.webp',
      caption: 'Accredited US Fellowship diploma',
      alt: 'American FutureTech fellowship diploma and cap',
      order: 6,
      active: true,
    },
    {
      image: '/images/hero-technologist.jpg',
      caption: 'Hands-on lab environment',
      alt: 'Learner in a hands-on technology lab',
      order: 7,
      active: true,
    },
    {
      image: '/images/course-data-science.jpg',
      caption: 'Applied AI project review',
      alt: 'Applied AI project review session',
      order: 8,
      active: true,
    },
  ],
  banners: [],
};

/** Banner slots the admin can fill — one per inner page. */
export const SITE_IMAGE_BANNERS = [
  { key: 'courses', label: 'Academy Programs (/courses)' },
  { key: 'about', label: 'About Us (/about)' },
  { key: 'careers', label: 'Careers & Hiring Partners (/careers)' },
  { key: 'success-stories', label: 'Alumni Success Stories (/success-stories)' },
  { key: 'contact', label: 'Contact & Admissions (/contact)' },
];

const cleanList = (list, fallback = []) => {
  const source = Array.isArray(list) ? list : fallback;
  return source
    .map((item, idx) => ({
      key: String(item?.key || '').trim(),
      image: String(item?.image || '').trim(),
      caption: String(item?.caption || '').trim(),
      alt: String(item?.alt || '').trim(),
      order: Number(item?.order) || idx + 1,
      active: item?.active !== false,
    }))
    .filter((item) => item.image && item.active)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
};

/**
 * What the site should render.
 *
 * A settings document that has never been touched keeps the shipped defaults;
 * the moment the client saves anything in the Website Images section their own
 * lists win — including an intentionally emptied gallery, so deleting a photo
 * really deletes it.
 */
export function resolveSiteImages(settings) {
  const raw = settings?.siteImages || {};
  const configured =
    Boolean(raw.heading) ||
    Boolean(raw.subheading) ||
    Boolean(raw.eyebrow) ||
    raw.enabled === false ||
    (Array.isArray(raw.feature) && raw.feature.length > 0) ||
    (Array.isArray(raw.gallery) && raw.gallery.length > 0) ||
    (Array.isArray(raw.banners) && raw.banners.length > 0);

  if (!configured) return DEFAULT_SITE_IMAGES;

  return {
    enabled: raw.enabled !== false,
    eyebrow: raw.eyebrow || DEFAULT_SITE_IMAGES.eyebrow,
    heading: raw.heading || DEFAULT_SITE_IMAGES.heading,
    subheading: raw.subheading || DEFAULT_SITE_IMAGES.subheading,
    feature: cleanList(raw.feature, []),
    gallery: cleanList(raw.gallery, []),
    banners: cleanList(raw.banners, []),
  };
}

/** The banner photo configured for one page ('' when the admin left it blank). */
export function bannerImageFor(settings, key) {
  const { banners } = resolveSiteImages(settings);
  const match = banners.find((entry) => entry.key === key && entry.image);
  return match ? match.image : '';
}

/** The whole banner entry for one page (image + caption), or null when unset. */
export function bannerFor(settings, key) {
  const { banners } = resolveSiteImages(settings);
  return banners.find((entry) => entry.key === key && entry.image) || null;
}

/** Human label for a banner slot (falls back to the raw key). */
export const bannerLabelFor = (key) =>
  SITE_IMAGE_BANNERS.find((slot) => slot.key === key)?.label || key;

export default resolveSiteImages;
