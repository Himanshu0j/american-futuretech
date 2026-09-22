const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

// Ensure destination directories exist
const serverUploadsDir = path.join(__dirname, '../uploads');
const clientUploadsDir = path.join(__dirname, '../../client/public/uploads');

if (!fs.existsSync(serverUploadsDir)) {
  fs.mkdirSync(serverUploadsDir, { recursive: true });
}
if (!fs.existsSync(clientUploadsDir)) {
  fs.mkdirSync(clientUploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, serverUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate safe clean filename with timestamp
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

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

// @desc    Upload single image asset
// @route   POST /api/upload
// @access  Protected (Admin / Staff)
router.post('/', (req, res, next) => {
  // Allow optional token or test mode
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    // Mirror copy to client/public/uploads for direct dev and preview availability
    try {
      const targetClientFile = path.join(clientUploadsDir, req.file.filename);
      fs.copyFileSync(req.file.path, targetClientFile);
    } catch (copyErr) {
      console.warn('Could not mirror file to client/public/uploads:', copyErr.message);
    }

    const publicUrl = `/uploads/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: 'Asset uploaded successfully',
      url: publicUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
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

module.exports = router;
