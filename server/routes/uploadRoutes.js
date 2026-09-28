const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, checkPermission } = require('../middleware/auth');
const UploadedAsset = require('../models/UploadedAsset');

// Ensure destination directories exist
const serverUploadsDir = path.join(__dirname, '../uploads');
const clientUploadsDir = path.join(__dirname, '../../client/public/uploads');

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

// @desc    List uploaded and available media assets
// @route   GET /api/upload/media
// @access  Public / Protected
router.get('/media', (req, res) => {
  try {
    const files = fs.readdirSync(serverUploadsDir)
      .filter((f) => !f.startsWith('.'))
      .map((f) => {
        const stats = fs.statSync(path.join(serverUploadsDir, f));
        return {
          filename: f,
          url: `/uploads/${f}`,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ success: true, count: files.length, files });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
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
