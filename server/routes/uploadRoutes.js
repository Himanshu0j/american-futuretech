const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, checkPermission } = require('../middleware/auth');
const UploadedAsset = require('../models/UploadedAsset');
const AuditLog = require('../models/AuditLog');
const { sendError } = require('../utils/apiError');
const { buildUsageIndex, usageFor, findAssetUsage } = require('../utils/mediaUsage');

// Ensure destination directories exist
const serverUploadsDir = path.join(__dirname, '../uploads');
const clientUploadsDir = path.join(__dirname, '../../client/public/uploads');
// The built copy of the same folder. `vite build` copies public/ into dist/, and
// the preview server serves dist/ — so a file deleted from the two real stores
// could still be served locally out of a stale build. Deleting here too keeps
// "deleted" honest in the preview without needing a rebuild.
const clientDistUploadsDir = path.join(__dirname, '../../client/dist/uploads');

if (!fs.existsSync(serverUploadsDir)) {
  fs.mkdirSync(serverUploadsDir, { recursive: true });
}
if (!fs.existsSync(clientUploadsDir)) {
  fs.mkdirSync(clientUploadsDir, { recursive: true });
}

/**
 * Files are buffered in memory rather than streamed straight to disk so the same
 * bytes can be written twice: to /uploads for local dev and into MongoDB, which
 * is what makes the asset survive a redeploy (container disks are ephemeral).
 */
const storage = multer.memoryStorage();

// File filter: accept only standard image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|svg|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only valid image files (PNG, JPG, JPEG, WEBP, SVG, GIF) are permitted'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB maximum
  fileFilter,
});

// Build a safe, collision-free filename from the original one.
const buildFilename = (originalname) => {
  const ext = path.extname(originalname).toLowerCase();
  const base = path.basename(originalname, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
  return `${base}-${uniqueSuffix}${ext}`;
};

// @desc    Upload single image asset
// @route   POST /api/upload
// @access  Protected (Admin / Staff with MEDIA_UPLOAD permission)
router.post('/', protect, checkPermission('MEDIA_UPLOAD'), (req, res, next) => {
  // Allow optional token or test mode
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    const filename = buildFilename(req.file.originalname);
    const buffer = req.file.buffer;

    // Disk copy first — local dev, the Vite preview and the /uploads static
    // middleware all read it from here.
    try {
      fs.writeFileSync(path.join(serverUploadsDir, filename), buffer);
      // Mirror copy to client/public/uploads for direct dev and preview availability
      fs.copyFileSync(path.join(serverUploadsDir, filename), path.join(clientUploadsDir, filename));
    } catch (copyErr) {
      console.warn('Could not store uploaded file on disk:', copyErr.message);
    }

    // Durable copy — this is the one that survives a redeploy.
    let persisted = true;
    try {
      await UploadedAsset.create({
        filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: buffer,
      });
    } catch (dbErr) {
      persisted = false;
      console.warn('Could not persist uploaded file in MongoDB:', dbErr.message);
    }

    const publicUrl = `/uploads/${filename}`;
    return res.status(200).json({
      success: true,
      message: persisted
        ? 'Asset uploaded successfully'
        : 'Asset uploaded for this session only (durable storage unavailable).',
      url: publicUrl,
      filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      persisted,
    });
  });
});

const EXTENSION_MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

/**
 * The library is the union of two stores, not just the disk.
 *
 * A container's disk is wiped on every redeploy, so listing the disk alone made
 * files the app was still happily serving (from MongoDB) look deleted, and the
 * admin had no way to manage them at all. Each row says which copy it has, so
 * "durable" and "disk only" are distinguishable instead of guesswork.
 */
const listDiskFiles = () => {
  try {
    return fs
      .readdirSync(serverUploadsDir)
      .filter((name) => !name.startsWith('.'))
      .map((name) => {
        const stats = fs.statSync(path.join(serverUploadsDir, name));
        return { filename: name, size: stats.size, createdAt: stats.birthtime || stats.mtime };
      });
  } catch (error) {
    return [];
  }
};

// @desc    List uploaded media assets (disk + durable storage, with usage)
// @route   GET /api/upload/media
// @access  Protected (Admin / Staff with MEDIA_VIEW permission)
//
// This used to be public. Filenames carry a timestamp and a random suffix so
// they are not guessable, but there is no reason to hand the client's whole
// asset list to an unauthenticated caller, so it now requires a staff session.
router.get('/media', protect, checkPermission('MEDIA_VIEW'), async (req, res) => {
  try {
    const [diskFiles, durable] = await Promise.all([
      // Read the two stores in parallel; both are cheap and independent.
      Promise.resolve(listDiskFiles()),
      UploadedAsset.find({}).select('filename mimetype size createdAt').lean(),
    ]);

    const byFilename = new Map();
    durable.forEach((asset) => {
      byFilename.set(asset.filename, {
        filename: asset.filename,
        size: asset.size || 0,
        mimetype: asset.mimetype || EXTENSION_MIME[path.extname(asset.filename).toLowerCase()] || 'image/*',
        createdAt: asset.createdAt,
        onDisk: false,
        persisted: true,
      });
    });
    diskFiles.forEach((file) => {
      const existing = byFilename.get(file.filename);
      if (existing) {
        existing.onDisk = true;
        if (!existing.size) existing.size = file.size;
        return;
      }
      byFilename.set(file.filename, {
        filename: file.filename,
        size: file.size,
        mimetype: EXTENSION_MIME[path.extname(file.filename).toLowerCase()] || 'image/*',
        createdAt: file.createdAt,
        onDisk: true,
        persisted: false,
      });
    });

    const files = [...byFilename.values()].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );

    const usageIndex = await buildUsageIndex();
    files.forEach((file) => {
      file.url = `/uploads/${file.filename}`;
      file.usedBy = usageFor(usageIndex, file.filename);
    });

    return res.status(200).json({
      success: true,
      count: files.length,
      summary: {
        total: files.length,
        inUse: files.filter((file) => file.usedBy.length > 0).length,
        unused: files.filter((file) => file.usedBy.length === 0).length,
        // Present in MongoDB only — the disk copy is already gone (redeploy).
        durableOnly: files.filter((file) => file.persisted && !file.onDisk).length,
        // On disk only — never made it into durable storage, so it is at risk.
        diskOnly: files.filter((file) => file.onDisk && !file.persisted).length,
      },
      files,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

/**
 * Only a bare file name is ever accepted — no directory parts, no traversal.
 * The resolved paths are built from a fixed directory plus that name, so a
 * crafted `../../` can never reach outside the uploads folder.
 */
const safeFilename = (value) => {
  const name = path.basename(String(value || '').trim());
  if (!name || name === '.' || name === '..') return '';
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return '';
  return name;
};

// @desc    Delete one media asset from disk and durable storage
// @route   DELETE /api/upload/media/:filename
// @access  Protected (Admin / Staff with MEDIA_DELETE permission)
//
// A file that is still referenced by a course, logo, news post or issue report
// is refused with 409 and the list of references. `?force=1` deletes anyway,
// which the panel only sends after showing the admin exactly what will break.
router.delete('/media/:filename', protect, checkPermission('MEDIA_DELETE'), async (req, res) => {
  try {
    const filename = safeFilename(req.params.filename);
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Invalid file name.' });
    }
    const force = ['1', 'true', 'yes'].includes(String(req.query.force || '').toLowerCase());

    const diskPaths = [
      path.join(serverUploadsDir, filename),
      path.join(clientUploadsDir, filename),
      path.join(clientDistUploadsDir, filename),
    ];
    const onDisk = diskPaths.filter((candidate) => fs.existsSync(candidate));
    const stored = await UploadedAsset.findOne({ filename }).select('_id');

    if (!onDisk.length && !stored) {
      return res.status(404).json({ success: false, message: 'That file is not in the media library.' });
    }

    const usedBy = await findAssetUsage(filename);
    if (usedBy.length && !force) {
      return res.status(409).json({
        success: false,
        requiresForce: true,
        usedBy,
        message: `This file is still used in ${usedBy.length} place${usedBy.length === 1 ? '' : 's'}.`,
      });
    }

    const removedFromDisk = [];
    onDisk.forEach((candidate) => {
      try {
        fs.unlinkSync(candidate);
        removedFromDisk.push(candidate);
      } catch (error) {
        console.warn(`Could not delete ${candidate} from disk:`, error.message);
      }
    });

    let removedDurable = false;
    if (stored) {
      await UploadedAsset.deleteOne({ filename });
      removedDurable = true;
    }

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'MEDIA_DELETED',
      entity: 'UploadedAsset',
      entityId: filename,
      details:
        `Deleted media asset ${filename}` +
        (usedBy.length ? ` — still referenced by: ${usedBy.join('; ')}` : '') +
        (removedFromDisk.length ? '' : ' (nothing was on disk)'),
    });

    // Every copy is gone, but the site may still point at it: say so plainly
    // instead of reporting a clean success.
    return res.status(200).json({
      success: true,
      usedBy,
      removed: { disk: removedFromDisk.length, durable: removedDurable },
      message: usedBy.length
        ? `File deleted, but the site still points at it in ${usedBy.length} place${usedBy.length === 1 ? '' : 's'} — those images will now be broken.`
        : 'File deleted from storage.',
    });
  } catch (error) {
    return sendError(res, error);
  }
});

/**
 * Last-resort handler for /uploads/<file>, mounted after the static middleware.
 *
 * express.static answers from disk when it can and calls next() when it cannot,
 * which is exactly the case after a redeploy wiped the disk: the file is still in
 * MongoDB, so a stored logo or card image keeps rendering instead of 404-ing.
 */
const serveStored = async (req, res, next) => {
  try {
    const filename = path.basename(String(req.params.filename || ''));
    if (!filename) return next();

    const asset = await UploadedAsset.findOne({ filename }).select('data mimetype size');
    if (!asset || !asset.data) return next();

    res.set('Content-Type', asset.mimetype || 'application/octet-stream');
    res.set('Content-Length', String(asset.size || asset.data.length));
    // Safe to cache hard: the filename already carries a timestamp + random suffix.
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(asset.data);
  } catch (err) {
    return next();
  }
};

module.exports = router;
module.exports.serveStored = serveStored;
