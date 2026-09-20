const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'American FutureTech',
  },
  tagline: {
    type: String,
    default: 'Empowering Next-Gen Tech Leaders with AI, Cyber Security & Cloud',
  },
  contactEmail: {
    type: String,
    default: 'admissions@americanfuturetech.com',
  },
  contactPhone: {
    type: String,
    default: '+1 (816) 846-6717',
  },
  headquartersAddress: {
    type: String,
    default: '30 N Gould St Ste R, Sheridan, WY 82801, United States',
  },
  announcementBanner: {
    enabled: { type: Boolean, default: true },
    text: { type: String, default: '🚀 Next Live Cohort Starts Soon — Reserve Your Seat with Only $99 Deposit!' },
    badge: { type: String, default: 'New Cohort' },
    linkText: { type: String, default: 'Explore Programs' },
    linkUrl: { type: String, default: '/courses' },
  },
  socialLinks: {
    linkedin: { type: String, default: 'https://linkedin.com/company/american-futuretech' },
    youtube: { type: String, default: 'https://youtube.com/@American_FutureTech' },
    instagram: { type: String, default: 'https://instagram.com/american_futuretech' },
    twitter: { type: String, default: 'https://x.com/americanfuturetech' },
  },
  depositPriceUSD: {
    type: Number,
    default: 99,
  },
  isMaintenanceMode: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);
