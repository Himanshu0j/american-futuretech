'use strict';

/**
 * The brand logo variants, and the recipe that derives them.
 *
 * `logo-horizontal.png` is the master lockup: the crest plus a wordmark set in
 * navy ink. Dark surfaces (the footer, the admin console, the student LMS
 * shell) cannot show navy ink on a near-black background, so they use a
 * "white" variant instead.
 *
 * That variant has now gone stale twice, and both times for the same reason:
 * it was produced by hand, in an image editor, and nothing tied it back to the
 * master. The second time the whole crest was bleached as well as the wordmark,
 * which left the footer badge looking like a washed-out ghost next to the crisp
 * header logo.
 *
 * So the recipe lives here, in code, and is applied deterministically:
 *
 *   * the crest keeps the master's pixels, untouched. It carries its own white
 *     fill, so it already reads correctly on a dark background — and keeping it
 *     byte-identical to the header logo is the whole point.
 *   * only the wordmark ink is recoloured to white, and the brand accent (the
 *     red in "FUTURE") is detected rather than hardcoded, so it survives.
 *   * the alpha channel is never touched, so the silhouette cannot shift.
 *
 * The mark/wordmark split is measured from the artwork itself: the mark is the
 * first block of inked columns, and everything after the first transparent gap
 * is the wordmark. Nothing here is tied to the current 1024x372 master, so a
 * re-cut logo flows through the same recipe.
 *
 * `verify-logo-variants.js` re-derives from the master and compares pixel by
 * pixel, which is what makes a stale or hand-edited variant fail instead of
 * quietly shipping. That check is pure Node — no browser, no dependencies — so
 * it can also run as a build gate.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/** Where the brand assets live. */
const IMAGES_DIR = path.join(__dirname, '..', '..', 'client', 'public', 'images');

/** Every derived asset, and the master it must stay true to. */
const VARIANTS = [
  {
    id: 'logo-horizontal-white',
    summary: 'The lockup for dark surfaces: crest unchanged, wordmark inked white.',
    source: 'logo-horizontal.png',
    png: 'logo-horizontal-white.png',
    webp: 'logo-horizontal-white.webp',
    /** WebP quality. The artwork is flat, so this stays visually lossless. */
    webpQuality: 0.95,
  },
];

/** A run of empty columns at least this wide separates the mark from the wordmark. */
const MIN_MARK_GAP = 12;
/** Alpha at or below this counts as empty when profiling columns. */
const ALPHA_FLOOR = 10;
/** Ink is the brand accent when red leads green and blue by at least this much. */
const ACCENT_LEAD = 30;

const abs = (file) => path.join(IMAGES_DIR, file);

/* ------------------------------------------------------------------ *
 * PNG
 * ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function chunk(type, data) {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/**
 * Decode an 8-bit, non-interlaced PNG into straight RGBA.
 *
 * Colours are normalised so that a fully transparent pixel is always
 * (0, 0, 0, 0): two encoders may otherwise leave junk RGB under a zero alpha,
 * which would make an otherwise identical pair of images compare unequal.
 */
function decodePng(buffer) {
  if (buffer.length < 8 || buffer.readUInt32BE(0) !== 0x89504e47) {
    throw new Error('not a PNG file');
  }
  let offset = 8;
  let header = null;
  const idat = [];
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += length + 12;
  }
  if (!header) throw new Error('PNG has no IHDR chunk');
  if (header.interlace !== 0) throw new Error('interlaced PNGs are not supported');
  if (header.bitDepth !== 8) throw new Error(`unsupported bit depth ${header.bitDepth}`);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[header.colorType];
  if (!channels) throw new Error(`unsupported PNG colour type ${header.colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width, height } = header;
  const stride = width * channels;
  const data = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  let pos = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[pos];
    pos += 1;
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const cur = Buffer.alloc(stride);
    for (let i = 0; i < stride; i += 1) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      const v = line[i];
      cur[i] =
        filter === 0 ? v
        : filter === 1 ? (v + a) & 0xff
        : filter === 2 ? (v + b) & 0xff
        : filter === 3 ? (v + ((a + b) >> 1)) & 0xff
        : filter === 4 ? (v + paeth(a, b, c)) & 0xff
        : (() => { throw new Error(`unknown PNG filter ${filter} on row ${y}`); })();
    }
    cur.copy(data, y * stride);
    prev = cur;
  }

  // Straight to RGBA.
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const s = i * channels;
    const d = i * 4;
    if (channels === 1) {
      rgba[d] = rgba[d + 1] = rgba[d + 2] = data[s];
      rgba[d + 3] = 255;
    } else if (channels === 2) {
      rgba[d] = rgba[d + 1] = rgba[d + 2] = data[s];
      rgba[d + 3] = data[s + 1];
    } else if (channels === 3) {
      data.copy(rgba, d, s, s + 3);
      rgba[d + 3] = 255;
    } else {
      data.copy(rgba, d, s, s + 4);
    }
    if (rgba[d + 3] === 0) rgba[d] = rgba[d + 1] = rgba[d + 2] = 0;
  }
  return { width, height, data: rgba };
}

/**
 * Encode RGBA as 8-bit PNG, choosing the cheapest filter per scanline.
 *
 * The master is flat artwork, so filtering is what keeps the file small: a
 * single unfiltered deflate pass comes out roughly twice the size.
 */
function encodePng({ width, height, data }) {
  const bpp = 4;
  const stride = width * bpp;
  const raw = Buffer.alloc(height * (stride + 1));
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const line = data.subarray(y * stride, (y + 1) * stride);
    let bestFilter = 0;
    let bestScore = Infinity;
    let best = null;
    for (let f = 0; f < 5; f += 1) {
      const candidate = Buffer.alloc(stride);
      let score = 0;
      for (let i = 0; i < stride; i += 1) {
        const a = i >= bpp ? line[i - bpp] : 0;
        const b = prev[i];
        const c = i >= bpp ? prev[i - bpp] : 0;
        const v =
          (f === 0 ? line[i]
          : f === 1 ? line[i] - a
          : f === 2 ? line[i] - b
          : f === 3 ? line[i] - ((a + b) >> 1)
          : line[i] - paeth(a, b, c)) & 0xff;
        candidate[i] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        bestFilter = f;
        best = candidate;
      }
    }
    raw[y * (stride + 1)] = bestFilter;
    best.copy(raw, y * (stride + 1) + 1);
    prev = line;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ *
 * WebP
 * ------------------------------------------------------------------ */

/**
 * Read the canvas size from a WebP container.
 *
 * There is no WebP codec in Node's standard library, so the guard can only read
 * the header — but the header is exactly what drifts when a variant is replaced
 * by a differently-sized one (the previous stale copy was 800x291 against a
 * 1024x372 master, which this catches).
 */
function readWebpSize(buffer) {
  if (buffer.length < 16 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('not a WebP file');
  }
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const fourcc = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const p = offset + 8;
    if (fourcc === 'VP8X' && p + 10 <= buffer.length) {
      return {
        width: 1 + (buffer[p + 4] | (buffer[p + 5] << 8) | (buffer[p + 6] << 16)),
        height: 1 + (buffer[p + 7] | (buffer[p + 8] << 8) | (buffer[p + 9] << 16)),
      };
    }
    if (fourcc === 'VP8L' && p + 5 <= buffer.length && buffer[p] === 0x2f) {
      const bits = buffer.readUInt32LE(p + 1);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
    }
    if (fourcc === 'VP8 ' && p + 10 <= buffer.length && buffer[p + 3] === 0x9d && buffer[p + 4] === 0x01 && buffer[p + 5] === 0x2a) {
      return {
        width: buffer.readUInt16LE(p + 6) & 0x3fff,
        height: buffer.readUInt16LE(p + 8) & 0x3fff,
      };
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error('WebP has no readable VP8, VP8L or VP8X frame');
}

/* ------------------------------------------------------------------ *
 * The recipe
 * ------------------------------------------------------------------ */

/**
 * The x where the wordmark begins: the first empty column after the mark.
 *
 * Returns null when the artwork has no separating gap, which means the recipe
 * cannot be applied safely — that is a hard failure, not a guess.
 */
function findMarkBoundary({ width, height, data }) {
  const inked = new Array(width).fill(false);
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      if (data[(y * width + x) * 4 + 3] > ALPHA_FLOOR) {
        inked[x] = true;
        break;
      }
    }
  }
  let run = 0;
  let sawMark = false;
  for (let x = 0; x < width; x += 1) {
    if (!inked[x]) {
      if (sawMark && run >= MIN_MARK_GAP) return x - run + 1;
      run += 1;
      continue;
    }
    sawMark = true;
    run = 0;
  }
  return null;
}

/** Ink is the brand accent when red clearly leads green and blue. */
function isAccentInk(r, g, b) {
  return r - g > ACCENT_LEAD && r - b > ACCENT_LEAD;
}

/**
 * Derive the on-dark lockup: the mark is copied through untouched, and every
 * non-accent wordmark pixel becomes white. Alpha is preserved exactly.
 */
function deriveOnDark(image, boundary) {
  const { width, height, data } = image;
  const out = Buffer.from(data);
  let recoloured = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = boundary; x < width; x += 1) {
      const o = (y * width + x) * 4;
      if (out[o + 3] === 0) continue;
      if (isAccentInk(out[o], out[o + 1], out[o + 2])) continue;
      out[o] = 255;
      out[o + 1] = 255;
      out[o + 2] = 255;
      recoloured += 1;
    }
  }
  return { data: out, recoloured };
}

/**
 * Compare a derived image against what the recipe produces.
 *
 * Differences are split either side of the boundary because the two sides mean
 * different things: a mismatch before it means the crest artwork has drifted
 * (the washed-out bug), after it means the wordmark ink has.
 */
function compareDerived(expected, actual, boundary) {
  if (expected.width !== actual.width || expected.height !== actual.height) {
    return {
      sizeMismatch: { expected: `${expected.width}x${expected.height}`, actual: `${actual.width}x${actual.height}` },
      total: 0,
      mark: 0,
      wordmark: 0,
      alpha: 0,
    };
  }
  const { width, height } = expected;
  let total = 0;
  let mark = 0;
  let wordmark = 0;
  let alpha = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const o = (y * width + x) * 4;
      if (expected.data[o + 3] !== actual.data[o + 3]) alpha += 1;
      const same =
        expected.data[o] === actual.data[o] &&
        expected.data[o + 1] === actual.data[o + 1] &&
        expected.data[o + 2] === actual.data[o + 2] &&
        expected.data[o + 3] === actual.data[o + 3];
      if (same) continue;
      total += 1;
      if (x < boundary) mark += 1;
      else wordmark += 1;
    }
  }
  return { sizeMismatch: null, total, mark, wordmark, alpha };
}

const readPng = (file) => decodePng(fs.readFileSync(abs(file)));

module.exports = {
  IMAGES_DIR,
  VARIANTS,
  MIN_MARK_GAP,
  ALPHA_FLOOR,
  ACCENT_LEAD,
  crc32,
  decodePng,
  encodePng,
  readWebpSize,
  findMarkBoundary,
  isAccentInk,
  deriveOnDark,
  compareDerived,
  readPng,
  abs,
};
