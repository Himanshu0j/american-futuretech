import { useSiteSettings } from '../context/SiteSettingsContext';

/**
 * Company identity, read from the admin's "General & Identity" tab.
 *
 * Every component that prints an address, phone number, email, legal entity or
 * social profile goes through this hook — that is what makes those admin fields
 * actually visible on the site (they used to sit in the database while the
 * components kept showing hard-coded text).
 */
export const COMPANY_FALLBACK = {
  siteName: 'American FutureTech',
  legalName: 'American FutureTech LLC',
  tagline: 'Empowering Next-Gen Tech Leaders with AI, Cyber Security & Cloud',
  phone: '+1 (816) 846-6717',
  email: 'info@americantechgloballlc.com',
  address: '30 N Gould St Ste R, Sheridan, WY 82801, United States',
  socials: {
    linkedin: 'https://linkedin.com/company/american-futuretech',
    youtube: 'https://youtube.com/@American_FutureTech',
    instagram: 'https://instagram.com/american_futuretech',
    twitter: 'https://x.com/americanfuturetech',
  },
};

/** Strip everything except digits so `tel:` and `wa.me` links stay valid. */
export const digitsOnly = (value) => String(value || '').replace(/[^\d]/g, '');

export default function useCompanyInfo() {
  const { settings } = useSiteSettings() || {};

  const phone = settings?.contactPhone || COMPANY_FALLBACK.phone;
  const email = settings?.contactEmail || COMPANY_FALLBACK.email;
  const address = settings?.headquartersAddress || COMPANY_FALLBACK.address;
  const socials = { ...COMPANY_FALLBACK.socials, ...(settings?.socialLinks || {}) };

  return {
    siteName: settings?.siteName || COMPANY_FALLBACK.siteName,
    legalName: settings?.legalName || COMPANY_FALLBACK.legalName,
    tagline: settings?.tagline || COMPANY_FALLBACK.tagline,
    phone,
    phoneHref: `tel:+${digitsOnly(phone)}`,
    phoneDigits: digitsOnly(phone),
    email,
    emailHref: `mailto:${email}`,
    address,
    socials,
    maintenance:
      settings?.isMaintenanceMode === true ||
      settings?.isMaintenanceMode === 'true',
  };
}
