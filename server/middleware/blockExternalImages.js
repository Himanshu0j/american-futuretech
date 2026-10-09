#!/usr/bin/env node

/**
 * American FutureTech — refuse to STORE an image the browser will not load.
 *
 *   const guardImages = require('../middleware/blockExternalImages');
 *   router.put('/:id', protect, guardImages, updateCourse);
 *
 * The live CSP is `img-src 'self' data:`. A hotlinked image is therefore not a
 * slow image, it is an invisible one: the browser refuses the request and the
 * visitor gets an empty tile. Every blank logo on /careers, every empty circle
 * on the alumni wall, and the whole broken tool grid came from this — the CMS
 * happily accepted `https://…/logo.png`, saved it, and the site rendered
 * nothing.
 *
 * Fixing the data once (which is what self-hosting every image did) does not
 * stop it happening again: the admin's URL field is right there in the panel.
 * So the write path rejects it instead, with a message that says what to do.
 *
 * What is rejected
 * ----------------
 * A string in the request body that the browser would treat as an image and
 * cannot load: an image extension (.png .jpg .svg .webp …), a known image-CDN
 * host, or an image-ish key (`logo`, `avatar`, `photo`, `cover`, …) pointing
 * off-site.
 *
 * What is deliberately allowed
 * ----------------------------
 * Relative paths (`/images/…`, `/uploads/…`), anything on this site's own
 * origin, and every non-image URL — apply links, LinkedIn profiles, YouTube
 * embeds, Stripe dashboards. Those are navigation, not `img-src`, so the CSP
 * never had an opinion about them.
 *
 * The same rules live in scripts/verify-no-hotlinks.js, which stops such a URL
 * reaching the build. This one stops one reaching the database, where a build
 * check cannot see it.
 */

const OWN_ORIGIN = /americanfuturetechllc\.com/;

const IMAGE_CDNS = [
  'cdn.jsdelivr.net',
  'cdn.simpleicons.org',
  'images.unsplash.com',
  'randomuser.me',
  'media.licdn.com',
  'i.ytimg.com',
  'api.dicebear.com',
  'encrypted-tbn0.gstatic.com',
  'huggingface.co',
  'pngimg.com',
  'pngmart.com',
  'pngall.com',
  'freepnglogo.com',
  'freelogopng.com',
  'logos-world.net',
  'logodix.com',
  'companieslogo.com',
  'techdaily.com.au',
  'securepayments.com',
];

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)([?#].*)?$/i;
const IMAGE_KEY = /^(logo|logoUrl|companyLogo|avatar|photo|image|imageURL|imageUrl|picture|coverImage|cover|banner|thumbnail|icon|artwork|illustration)$/i;

const MAX_DEPTH = 12;

const looksLikeHost = (value) => {
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value);
    return url.host && url.host.includes('.');
  } catch {
    return false;
  }
};

const isImageUrl = (value, key = '') => {
  if (typeof value !== 'string') return false;
  if (!/^(https?:)?\/\//i.test(value)) return false;   // relative paths are ours
  if (OWN_ORIGIN.test(value)) return false;            // same origin is 'self'
  if (/\s/.test(value)) return false;                  // prose, not a request
  if (IMAGE_EXT.test(value)) return true;
  if (!looksLikeHost(value)) return false;
  const host = new URL(value.startsWith('//') ? `https:${value}` : value).host.toLowerCase();
  if (IMAGE_CDNS.some((cdn) => host === cdn || host.endsWith(`.${cdn}`))) return true;
  return IMAGE_KEY.test(key);
};

/** Every offending `path.to.field = url`, so the 400 can name all of them. */
const findExternalImages = (body, prefix = '', depth = 0, out = []) => {
  if (!body || typeof body !== 'object' || depth > MAX_DEPTH) return out;
  if (Array.isArray(body)) {
    body.forEach((item, index) => findExternalImages(item, `${prefix}[${index}]`, depth + 1, out));
    return out;
  }
  for (const [key, value] of Object.entries(body)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isImageUrl(value, key)) {
      out.push(`${path} = ${String(value).slice(0, 120)}`);
    } else if (value && typeof value === 'object') {
      findExternalImages(value, path, depth + 1, out);
    }
  }
  return out;
};

const blockExternalImages = (req, res, next) => {
  // Only JSON bodies are inspected: a multipart upload carries files, not URLs.
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return next();

  const found = findExternalImages(req.body);
  if (!found.length) return next();

  return res.status(400).json({
    success: false,
    message:
      'Image URLs must point at this site. The live Content-Security-Policy only ' +
      'allows images from our own origin, so an external link would save but never ' +
      'appear. Upload the file (it is stored under /uploads) or use a path like ' +
      '/images/companies/aws.svg. Offending fields: ' + found.join('; '),
    offending: found,
  });
};

module.exports = blockExternalImages;
module.exports.findExternalImages = findExternalImages;
