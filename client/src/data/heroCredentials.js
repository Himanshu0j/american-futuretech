import { getAlignedMicrosoftCert } from './microsoftCertificates';

/**
 * Programs the client wants badged with the Microsoft mark in the course hero.
 * Matched by slug keyword so a renamed slug keeps working, and the list is
 * deliberately keyword-based rather than exact-slug so "Cyber Security &
 * Artificial Intelligence Hybrid" is covered by the same "cyber" rule.
 */
const MICROSOFT_KEYWORDS = ['data-science', 'data science', 'cyber', 'security', 'generative', 'agentic', 'devops', 'cloud'];

/** The Microsoft four-square + wordmark shipped in /public/images. */
export const MICROSOFT_LOGO = '/images/microsoft-logo.svg';

/**
 * The Certified AI Governance Professional badge the client supplied for the
 * GRC track. The artwork has its own light plate, so the hero panel puts it on
 * a white tile instead of dropping a pale square onto the dark card.
 */
export const AIGP_LOGO = '/images/aigp-badge.png';

/** Used for the GRC track, which earns the course's own AIGP/GRC certificate. */
export const GRC_KEYWORDS = ['grc', 'governance', 'compliance'];

/**
 * What the hero credential panel shows for a course.
 *
 * Every field is admin-editable on the course (Curriculum & Courses CMS →
 * "Hero Credential Block"), and anything left blank falls back to a sensible
 * default so a course page never renders an empty box:
 *   - Microsoft-aligned tracks → Microsoft logo + "Microsoft Certificate"
 *   - GRC track               → the IAPP Certified AI Governance Professional
 *                                (AIGP) badge + "AIGP Certificate" — the client
 *                                asked for the certification body's mark here,
 *                                not our own company logo
 *   - certificate artwork      → this course's own certificate image, else the
 *                                Microsoft certificate that course aligns to
 */
export function getHeroCredential(course, certImages = {}) {
  const haystack = `${course?.slug || ''} ${course?.title || ''} ${course?.category || ''}`.toLowerCase();
  const alignedMsCert = getAlignedMicrosoftCert(course?.slug || course?.category || course?.title);

  const isGrc = GRC_KEYWORDS.some((word) => haystack.includes(word));
  const isMicrosoftTrack = !isGrc && MICROSOFT_KEYWORDS.some((word) => haystack.includes(word));

  const fallbackTitle = isGrc ? 'AIGP Certificate' : 'Microsoft Certificate';
  const fallbackLogo = isGrc ? AIGP_LOGO : MICROSOFT_LOGO;
  const fallbackSubtitle = isGrc
    ? 'Certified AI Governance Professional (AIGP) credential, awarded with your US Fellowship Diploma'
    : `${alignedMsCert.code} · ${alignedMsCert.title}`;

  // The artwork must match the credential named beside it: a Microsoft track
  // shows the Microsoft certificate, the GRC track shows whatever the team
  // uploaded for it (never the Microsoft one, which would contradict the
  // "AI GRC Certificate" title). With nothing uploaded yet the panel falls back
  // to the award mark instead of a mismatched picture.
  const certificateImage = course?.certificateImage
    || (isMicrosoftTrack
      ? (certImages?.microsoftImage || certImages?.completionImage || alignedMsCert.image || '')
      : '');

  const logo = course?.credentialLogo || fallbackLogo;

  return {
    logo,
    title: course?.credentialTitle || fallbackTitle,
    subtitle: course?.credentialSubtitle || fallbackSubtitle,
    certificateImage,
    // Optional second credential artwork (e.g. the US Fellowship diploma next to
    // the Microsoft certificate, or the AIGP seal next to the GRC certificate).
    // Only what the admin uploaded — never inherited from a fallback, so the
    // band shows one certificate unless a second one was deliberately added.
    certificateImage2: course?.certificateImage2 || '',
    // Badge-shaped artwork ships on its own light plate, so the dark hero needs
    // a white tile behind it. Only true when we fell back to the AIGP badge.
    logoOnLightTile: logo === AIGP_LOGO,
    // Only used for the accessible alt text / badge copy.
    isMicrosoftTrack,
  };
}

export default getHeroCredential;
