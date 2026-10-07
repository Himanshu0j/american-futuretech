const mongoose = require('mongoose');

const CurriculumModuleSchema = new mongoose.Schema({
  moduleNumber: { type: Number, required: true },
  moduleTitle: { type: String, required: true },
  topics: [{ type: String }],
  hours: { type: Number, default: 20 }
}, { _id: false });

// ── Per-course "Tools Covered" block ──
// Every course used to render the same hard-coded tool grid (the Data Science
// one, for any course the static data did not recognise) with no way to change
// it. Tools now live on the course, so each program shows its own stack.
const CourseToolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: '' },
}, { _id: false });

/**
 * Legacy rows (and the seeder) store the stack as plain names —
 * `tools: ['Python', 'Docker']`. Accept both shapes so an old course keeps
 * loading and the seed can still write its string list.
 */
const normalizeCourseTool = (tool) => {
  if (typeof tool === 'string') return { name: tool.trim(), icon: '' };
  if (tool && typeof tool === 'object') {
    let name = tool.name;
    // Older releases cast a name string into a sub-document by spreading it,
    // producing rows like `{ 0: 'V', 1: 'a', ..., icon: '' }`. Those rows are
    // already in the database, so rebuild the name from the numeric keys
    // instead of showing every course a blank tool. Saving the course then
    // rewrites it as a normal `{ name, icon }` row.
    if (!name) {
      const rebuilt = Object.keys(tool)
        .filter((key) => /^\d+$/.test(key))
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => tool[key])
        .join('');
      if (rebuilt) name = rebuilt;
    }
    return {
      name: String(name || '').trim(),
      icon: String(tool.icon || '').trim(),
    };
  }
  return tool;
};

/** Apply the tool normaliser to a whole list (writes, and reads below). */
const normalizeCourseTools = (list) =>
  Array.isArray(list) ? list.map(normalizeCourseTool) : list;

// ── Per-course capstone showcase cards ──
// The site-wide capstone list made every course show identical projects; this
// lets a course carry its own, with the global list kept as a fallback.
const CourseCapstoneSchema = new mongoose.Schema({
  tag: { type: String, default: 'Capstone' },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  stack: [{ type: String }],
  color: { type: String, default: 'from-indigo-500 to-blue-500' },
  order: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
}, { _id: false });

// Target-role pill in the "What Can You Become?" block. `color` is the Tailwind
// gradient of the badge, so the admin can recolour a role without a deploy.
const CareerRoleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: 'from-emerald-500 to-teal-500' },
  order: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
}, { _id: true });

// ── Per-course certificate showcase ──
// Every program page shows the credentials a graduate earns. The first two
// cards used to be hard-coded artwork, so the client could only change them from
// the code. This list is what the course page renders instead: the first two
// entries refine the built-in cards (their titles/descriptions stay the default
// when a field is left blank) and the third is the extra credential the client
// asked for — every course can now show THREE certificates.
const CourseCertificateSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  title: { type: String, default: '' },
  issuer: { type: String, default: '' },
  code: { type: String, default: '' },
  description: { type: String, default: '' },
  order: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
}, { _id: false });

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  category: {
    type: String,
    default: 'Technology',
  },
  shortDescription: {
    type: String,
    default: 'Industry-leading practical program engineered for high-demand tech careers with hands-on capstone projects.',
  },
  description: {
    type: String,
    default: 'Comprehensive live training covering core foundational principles through advanced production-grade architectures. Master cutting-edge tools, build a robust professional portfolio, and achieve accredited US certifications under direct industry mentorship.',
  },
  thumbnail: {
    type: String,
    default: '',
  },
  banner: {
    type: String,
    default: '',
  },
  // Rectangle course image shown above the title in the course hero (requested
  // in the client's course-format document: "course image add kariye").
  heroImage: {
    type: String,
    default: '',
  },
  // Optional artwork for the six "Why Get … Certification" advantage cards,
  // aligned by index (card 1 Doubt Clearing, card 2 Industry Relevant Projects…).
  advantageImages: {
    type: [String],
    default: [],
  },

  // ── Hero credential block ──
  // The hero used to leave an empty band under the skill pills. This is the
  // partner mark shown there (Microsoft logo, or the AI GRC certificate mark)
  // plus the credential wording under it, and the certificate artwork rendered
  // beside it. Everything is per course and beats the built-in default, so a
  // new program never needs a code change to advertise its own credential.
  credentialLogo: {
    type: String,
    default: '',
  },
  credentialTitle: {
    type: String,
    default: '',
  },
  credentialSubtitle: {
    type: String,
    default: '',
  },
  certificateImage: {
    type: String,
    default: '',
  },
  // Some tracks hand out two credentials (Microsoft + the US Fellowship diploma,
  // or the GRC's AIGP seal beside its own certificate). The second artwork is
  // uploaded per course and rendered next to the first one. Left blank, the band
  // looks exactly as it did with a single certificate.
  certificateImage2: {
    type: String,
    default: '',
  },
  // The certificate showcase cards on the course page (up to three, in order).
  // This is the CMS field the client fills in: image + title + issuer + code +
  // description per credential. Empty list = the course keeps the built-in
  // American FutureTech + Microsoft/partner cards.
  certificates: {
    type: [CourseCertificateSchema],
    default: [],
  },
  badge: {
    type: String,
    default: '',
  },
  cardTheme: {
    type: String,
    enum: ['cyan', 'rose', 'emerald', 'indigo', 'amber', 'purple'],
    default: 'cyan',
  },
  duration: {
    type: String,
    default: '6 Months',
  },
  pricing: {
    basePrice: { type: Number, default: 2499 },
    discountedPrice: { type: Number, default: 1899 },
    currency: { type: String, default: '$' },
  },
  instructor: {
    name: { type: String, default: 'Dr. Marcus Vance' },
    role: { type: String, default: 'Chief AI Architect & Ex-FAANG Lead' },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    bio: { type: String, default: '15+ years engineering scalable distributed intelligence and cybersecurity architectures.' },
  },
  rating: {
    type: Number,
    default: 4.9,
  },
  reviewsCount: {
    type: Number,
    default: 348,
  },
  highlights: [{
    type: String,
  }],
  skills: [{
    type: String,
  }],
  tools: [{
    type: String,
  }],
  prerequisites: [{
    type: String,
  }],
  outcomes: [{
    type: String,
  }],
  curriculum: [CurriculumModuleSchema],
  brochureUrl: {
    type: String,
    default: '/brochures/American_FutureTech_Syllabus.pdf',
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: true,
  },
  isPopular: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 1,
  },
  seatsUrgencyText: {
    type: String,
    default: 'Only 3 seats remaining for this cohort',
  },

  // ── "Choose your learning experience" block on the course detail page ──
  // Admin ticks decide which of the two ways to learn this course offers.
  // Both default to true so an existing course keeps showing both cards.
  viewOptions: {
    groupBatch: { type: Boolean, default: true },
    personalizedMentor: { type: Boolean, default: true },
  },

  // ── "Tools Covered" block (heading + grid) ──
  // Empty title falls back to "<Course title> Program Tools Covered"; an empty
  // tools array keeps the static/legacy icon grid so no course renders blank.
  toolsTitle: {
    type: String,
    default: '',
  },
  toolsSubtitle: {
    type: String,
    default: '',
  },
  tools: {
    type: [CourseToolSchema],
    default: [],
    set: normalizeCourseTools,
  },

  // ── Per-course Capstone Projects ──
  capstoneProjects: {
    type: [CourseCapstoneSchema],
    default: [],
  },

  // ── "What Can You Become?" career-roles block ──
  // Each track advertises its own target roles; the client wanted to edit the
  // pills (wording + colour badge) from the admin instead of a code change.
  careerRoles: {
    type: [CareerRoleSchema],
    default: [],
  },
  careerRolesHeading: {
    type: String,
    default: '',
  },
  careerRolesSubtitle: {
    type: String,
    default: '',
  },

  // ── "Who Can Apply for this Course?" block ──
  // Different for every course, so it is edited on the course itself.
  eligibility: {
    eyebrow: { type: String, default: 'Eligibility & Candidate Profile' },
    title: { type: String, default: 'Who Can Apply for this Course?' },
    subtitle: {
      type: String,
      default: 'Our fellowship is designed to bridge learners from diverse professional and academic backgrounds into high-tier technology roles.',
    },
    points: [{ type: String }],
    certificationTitle: { type: String, default: 'Globally Recognised Certification' },
    certificationText: {
      type: String,
      default: 'Earn a verified credential recognized by Fortune 500 employers across the United States, Europe, and Asia. Accelerate your career with measurable credentials.',
    },
    certificationPoints: [{
      type: String,
    }],
    audiences: [{
      type: String,
    }],
  },
}, {
  timestamps: true,
  // Mongoose does not run field setters when it hydrates documents from the
  // database, so the legacy corrupt rows above would otherwise reach the site
  // and the CMS untouched. Normalising on serialisation fixes both read paths
  // at once and heals the row for good as soon as the course is saved.
  toJSON: {
    transform: (doc, ret) => {
      ret.tools = normalizeCourseTools(ret.tools);
      return ret;
    },
  },
  toObject: {
    transform: (doc, ret) => {
      ret.tools = normalizeCourseTools(ret.tools);
      return ret;
    },
  },
});

module.exports = mongoose.model('Course', CourseSchema);
module.exports.normalizeCourseTool = normalizeCourseTool;
