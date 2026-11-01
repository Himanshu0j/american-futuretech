/**
 * Resolve a stored class link into something the student portal can play itself.
 *
 * Classes are authored with whatever URL the instructor had — a YouTube
 * recording, a Vimeo upload, a Drive file, an uploaded MP4. Opening those in a
 * new tab pushed students out of the LMS in the middle of a lesson, so every URL
 * is normalised here into either an <iframe> player, a native <video>, or an
 * explicit "cannot be framed" result that the room renders as an in-portal join
 * panel instead of a dead link.
 *
 * Only http(s) is accepted: the admin API stores free text, and a `javascript:`
 * URL in an iframe src would be an injection vector.
 */

const HTTP_PROTOCOL = /^https?:$/i;

const parseUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(String(value).trim());
    return HTTP_PROTOCOL.test(url.protocol) ? url : null;
  } catch {
    return null;
  }
};

const bareHost = (url) => url.hostname.replace(/^(www|m)\./i, '').toLowerCase();

const youtubeId = (url) => {
  const host = bareHost(url);
  if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null;
  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return null;
  const fromQuery = url.searchParams.get('v');
  if (fromQuery) return fromQuery;
  const match = url.pathname.match(/^\/(?:embed|live|shorts|v)\/([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : null;
};

const VIDEO_FILE = /\.(mp4|webm|ogg|ogv|m4v|mov)$/i;

/**
 * @typedef {'iframe'|'video'|'external'|'none'} EmbedKind
 * @returns {{ kind: EmbedKind, provider: string, src: string }}
 */
export function resolveVideoSource(value) {
  const raw = String(value || '').trim();

  // A file shipped with the site (client/public/videos/…) is referenced as
  // `/videos/lesson.mp4`. It has no scheme, so the URL parser rejects it — but
  // it is same-origin media and must still play in the native <video> element.
  if (raw.startsWith('/') && !raw.startsWith('//') && VIDEO_FILE.test(raw.split(/[?#]/)[0])) {
    return { kind: 'video', provider: 'Video', src: raw };
  }

  const url = parseUrl(raw);
  if (!url) return { kind: 'none', provider: '', src: '' };

  const yt = youtubeId(url);
  if (yt) {
    return {
      kind: 'iframe',
      provider: 'YouTube',
      // youtube-nocookie keeps the ad/measurement cookies off our page; the
      // parameters strip the watch-next grid so a lesson does not turn into a
      // recommendation feed.
      src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1&playsinline=1&color=white`,
    };
  }

  const host = bareHost(url);

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.match(/(\d{6,})/);
    if (id) {
      return {
        kind: 'iframe',
        provider: 'Vimeo',
        src: `https://player.vimeo.com/video/${id[1]}?title=0&byline=0&portrait=0`,
      };
    }
  }

  if (host === 'loom.com') {
    const id = url.pathname.match(/^\/(?:share|embed)\/([A-Za-z0-9]+)/);
    if (id) return { kind: 'iframe', provider: 'Loom', src: `https://www.loom.com/embed/${id[1]}` };
  }

  if (host === 'drive.google.com') {
    const id = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (id) return { kind: 'iframe', provider: 'Google Drive', src: `https://drive.google.com/file/d/${id[1]}/preview` };
  }

  // Jitsi is one of the few meeting rooms that is designed to be framed.
  if (host === 'meet.jit.si' || host === '8x8.vc') {
    return { kind: 'iframe', provider: 'Jitsi', src: `https://${url.host}${url.pathname}${url.search}` };
  }

  if (VIDEO_FILE.test(url.pathname)) {
    return { kind: 'video', provider: 'Video', src: url.toString() };
  }

  const meeting = [
    [/zoom\.(us|com)$/i, 'Zoom'],
    [/meet\.google\.com$/i, 'Google Meet'],
    [/teams\.(microsoft|live)\.com$/i, 'Microsoft Teams'],
    [/whereby\.com$/i, 'Whereby'],
  ].find(([pattern]) => pattern.test(host));

  return {
    kind: 'external',
    provider: meeting ? meeting[1] : host,
    src: url.toString(),
  };
}
