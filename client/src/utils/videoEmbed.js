/**
 * Turns whatever an admin pastes into a URL the lesson player can actually
 * embed.
 *
 * Why this exists: the LMS renders `lesson.videoUrl` inside an <iframe>, so a
 * normal share link ("https://youtu.be/abc", "https://vimeo.com/12345") shows a
 * blank frame and looks broken. The admin should never have to know the embed
 * form, so we detect the provider and rewrite the link.
 *
 * The server keeps a mirror of this logic (server/utils/videoUrl.js) because it
 * validates the same field on save. Keep the two in step.
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

  // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
  const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : '';
};

const vimeoIdFromUrl = (url) => {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return '';

  // player.vimeo.com/video/<id> or vimeo.com/<id>
  const match = url.pathname.match(/(\d{6,})/);
  return match ? match[1] : '';
};

/**
 * @param {string} rawUrl what the admin typed
 * @returns {{ url: string, provider: 'YouTube'|'Vimeo'|'External'|'Invalid'|'None', isEmbed: boolean, warning: string }}
 */
export const parseVideoUrl = (rawUrl) => {
  const value = String(rawUrl || '').trim();
  if (!value) return { url: '', provider: 'None', isEmbed: false, warning: '' };

  if (!/^https:\/\//i.test(value)) {
    return {
      url: value,
      provider: 'Invalid',
      isEmbed: false,
      warning: 'Video links must start with https:// — anything else is blocked by the browser inside the player.',
    };
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { url: value, provider: 'Invalid', isEmbed: false, warning: 'This is not a valid URL.' };
  }

  const youtubeId = youtubeIdFromUrl(parsed);
  if (youtubeId) {
    return {
      url: `https://www.youtube.com/embed/${youtubeId}`,
      provider: 'YouTube',
      isEmbed: true,
      warning: '',
    };
  }

  const vimeoId = vimeoIdFromUrl(parsed);
  if (vimeoId) {
    return {
      url: `https://player.vimeo.com/video/${vimeoId}`,
      provider: 'Vimeo',
      isEmbed: true,
      warning: '',
    };
  }

  return {
    url: value,
    provider: 'External',
    isEmbed: true,
    warning:
      'Not a recognised YouTube/Vimeo link. It will load in an iframe only if that site allows embedding.',
  };
};

/** Convenience wrapper: the stored value for a lesson. */
export const toEmbedUrl = (rawUrl) => parseVideoUrl(rawUrl).url;

/** True when the value will not play inside the player. */
export const isProblematicVideoUrl = (rawUrl) => {
  const { provider } = parseVideoUrl(rawUrl);
  return provider === 'Invalid';
};
