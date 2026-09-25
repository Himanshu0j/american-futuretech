/**
 * Server-side validation for lesson video links.
 *
 * The LMS plays `lesson.videoUrl` inside an <iframe>, so only an https URL that
 * the host allows to be framed will work. This mirrors
 * client/src/utils/videoEmbed.js: it normalises YouTube/Vimeo share links into
 * their embed form so the stored value is always playable, and refuses schemes
 * (javascript:, data:, http:) that a browser would block or that could be used
 * to inject script into the frame.
 *
 * Keep this in step with the client copy.
 */

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,}$/;

const youtubeIdFromUrl = (url) => {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0] || '';
    return YOUTUBE_ID_PATTERN.test(id) ? id : '';
  }

  if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'music.youtube.com') {
    return '';
  }

  if (url.pathname === '/watch') {
    const id = url.searchParams.get('v') || '';
    return YOUTUBE_ID_PATTERN.test(id) ? id : '';
  }

  const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : '';
};

const vimeoIdFromUrl = (url) => {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return '';
  const match = url.pathname.match(/(\d{6,})/);
  return match ? match[1] : '';
};

/**
 * @param {string} rawUrl
 * @returns {{ url: string, provider: string, isEmbed: boolean, valid: boolean, warning: string }}
 */
const normalizeVideoUrl = (rawUrl) => {
  const value = String(rawUrl || '').trim();
  if (!value) return { url: '', provider: 'None', isEmbed: false, valid: true, warning: '' };

  if (!/^https:\/\//i.test(value)) {
    return {
      url: value,
      provider: 'Invalid',
      isEmbed: false,
      valid: false,
      warning: 'Video links must use https:// — other schemes are blocked inside the lesson player.',
    };
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { url: value, provider: 'Invalid', isEmbed: false, valid: false, warning: 'Not a valid URL.' };
  }

  const youtubeId = youtubeIdFromUrl(parsed);
  if (youtubeId) {
    return {
      url: `https://www.youtube.com/embed/${youtubeId}`,
      provider: 'YouTube',
      isEmbed: true,
      valid: true,
      warning: '',
    };
  }

  const vimeoId = vimeoIdFromUrl(parsed);
  if (vimeoId) {
    return {
      url: `https://player.vimeo.com/video/${vimeoId}`,
      provider: 'Vimeo',
      isEmbed: true,
      valid: true,
      warning: '',
    };
  }

  return {
    url: value,
    provider: 'External',
    isEmbed: true,
    valid: true,
    warning: 'Unrecognised provider — it plays only if that site allows iframe embedding.',
  };
};

module.exports = { normalizeVideoUrl };
