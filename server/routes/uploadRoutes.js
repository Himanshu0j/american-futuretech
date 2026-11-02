const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { protect, checkPermission, authorizeScoped } = require('../middleware/auth');
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

/*
 * ── Lesson videos ─────────────────────────────────────────────────────────
 *
 * Videos cannot use the image path above: that buffers the whole file in RAM
 * and stores it inside a MongoDB document, which caps out at 16 MB. They also
 * cannot live only in `server/uploads`: Hostinger replaces the app directory on
 * every deploy, so a 150 MB recording would silently disappear after the next
 * push (docs/DEPLOY-HOSTINGER.md documents that behaviour for images already).
 *
 * So the file is streamed into MongoDB GridFS instead. GridFS is the same
 * durable store the image mirror uses, has no 16 MB document limit, and streams
 * back with HTTP Range support so a student can seek without downloading the
 * whole lesson first. The URL is the GridFS id, which is unguessable.
 */
const VIDEO_MAX_BYTES = 200 * 1024 * 1024; // 200 MB
const VIDEO_MAX_MB = Math.round(VIDEO_MAX_BYTES / (1024 * 1024));
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.ogv', '.m4v'];
const VIDEO_MIME_BY_EXT = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.ogv': 'video/ogg',
  '.m4v': 'video/x-m4v',
};
const GRIDFS_BUCKET = 'lmsVideos';

const videoTempDir = path.join(serverUploadsDir, 'tmp');
if (!fs.existsSync(videoTempDir)) {
  fs.mkdirSync(videoTempDir, { recursive: true });
}

// Stream straight to a temp file instead of RAM: a 200 MB upload buffered in
// memory would take the whole API process down under a little concurrency.
const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, videoTempDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `upload-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: VIDEO_MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Some browsers/OS combinations send application/octet-stream for a video
    // picked from disk; the extension check still gates the actual format.
    const mimeOk = /^video\//i.test(file.mimetype) || file.mimetype === 'application/octet-stream';
    if (VIDEO_EXTENSIONS.includes(ext) && mimeOk) return cb(null, true);
    return cb(new Error('Only MP4, WebM, OGG or M4V video files are allowed.'));
  },
});

const videoBucket = () =>
  new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: GRIDFS_BUCKET });

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
const persistImage = (req, res) => {
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
};

// The LMS authoring screens need the same image upload for a student photo or a
// class thumbnail, but their staff accounts hold LMS_* grants rather than
// MEDIA_UPLOAD. This alias accepts either capability; the original `/upload`
// route keeps its stricter media-library permission.
const canUploadImage = authorizeScoped(
  ['SUPERADMIN', 'ADMIN', 'INSTRUCTOR', 'COUNSELOR'],
  ['MEDIA_UPLOAD', 'LMS_CONTENT_EDIT', 'LMS_ENROLL_EDIT'],
);

router.post('/', protect, checkPermission('MEDIA_UPLOAD'), persistImage);
router.post('/image', protect, canUploadImage, persistImage);

// @desc    Upload one lesson video file, stored durably in MongoDB GridFS
// @route   POST /api/upload/video
// @access  Protected (LMS authoring staff)
const canUploadVideo = authorizeScoped(
  ['SUPERADMIN', 'ADMIN', 'INSTRUCTOR'],
  ['LMS_CONTENT_EDIT', 'MEDIA_UPLOAD', 'COURSES_EDIT'],
);

router.post('/video', protect, canUploadVideo, (req, res) => {
  videoUpload.single('video')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `That video is too large. The maximum is ${VIDEO_MAX_MB} MB — compress it or use a YouTube/Vimeo link instead.`
          : `Upload error: ${err.message}`;
      return res.status(400).json({ success: false, code: err.code, message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a video file to upload.' });
    }

    const tempPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = buildFilename(req.file.originalname);
    const mimetype =
      /^video\//i.test(req.file.mimetype || '')
        ? req.file.mimetype
        : VIDEO_MIME_BY_EXT[ext] || 'video/mp4';

    try {
      const bucket = videoBucket();
      const uploadStream = bucket.openUploadStreamWithId(
        new mongoose.Types.ObjectId(),
        filename,
        {
          contentType: mimetype,
          metadata: {
            mimetype,
            size: req.file.size,
            originalName: req.file.originalname,
            uploadedBy: String(req.user?._id || ''),
          },
        },
      );

      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(tempPath);
        readStream.on('error', reject);
        uploadStream.on('error', reject);
        uploadStream.on('finish', resolve);
        readStream.pipe(uploadStream);
      });

      const id = String(uploadStream.id);
      const url = `/api/upload/video/${id}${ext}`;

      AuditLog.create({
        actor: req.user?._id,
        actorName: req.user?.name || 'Admin',
        actorRole: req.user?.role || 'ADMIN',
        action: 'LMS_VIDEO_UPLOADED',
        entity: 'LmsVideo',
        entityId: id,
        details: `Uploaded lesson video ${filename} (${Math.round(req.file.size / (1024 * 1024))} MB)`,
      }).catch(() => {});

      return res.status(201).json({
        success: true,
        message: 'Video uploaded and stored durably.',
        url,
        id,
        filename,
        size: req.file.size,
        mimetype,
        maxBytes: VIDEO_MAX_BYTES,
        storage: 'mongodb-gridfs',
      });
    } catch (uploadErr) {
      console.error('Video upload failed:', uploadErr.message);
      return res.status(500).json({
        success: false,
        message: 'The video could not be stored. Please try again, or paste a YouTube/Vimeo link.',
      });
    } finally {
      // The temp copy is only a staging file; GridFS now owns the bytes.
      fs.unlink(tempPath, () => {});
    }
  });
});

/**
 * Play an uploaded lesson video, with HTTP Range support.
 *
 * A <video> element seeks by requesting `Range: bytes=…`; answering the whole
 * 200 MB file for every seek made seeking unusable (and re-downloaded the whole
 * lesson). The gridfs id is random and is the only thing in the URL, so the
 * stream is unlisted, matching how the LMS already treats unlisted YouTube
 * links. Batch/enrollment enforcement stays on the lesson API that hands the
 * URL to the student.
 */
router.get('/video/:file', async (req, res, next) => {
  try {
    const fileParam = String(req.params.file || '');
    const match = fileParam.match(/^([a-f0-9]{24})(\.[a-z0-9]+)?$/i);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    const id = new mongoose.Types.ObjectId(match[1]);
    const bucket = videoBucket();
    const found = await bucket.find({ _id: id }).limit(1).toArray();
    const file = found[0];
    if (!file) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    const total = file.length;
    const contentType = file.metadata?.mimetype || file.contentType || 'video/mp4';
    res.set('Content-Type', contentType);
    res.set('Accept-Ranges', 'bytes');
    // The id never changes for a given upload, so this can be cached hard.
    res.set('Cache-Control', 'public, max-age=31536000, immutable');

    const range = req.headers.range;
    if (range) {
      const rangeMatch = String(range).match(/^bytes=(\d*)-(\d*)$/);
      let start = rangeMatch && rangeMatch[1] ? parseInt(rangeMatch[1], 10) : null;
      let end = rangeMatch && rangeMatch[2] ? parseInt(rangeMatch[2], 10) : null;

      if (!rangeMatch) {
        res.set('Content-Range', `bytes */${total}`);
        return res.status(416).end();
      }

      // `bytes=-N` means the last N bytes of the file.
      if (start === null && end !== null) {
        start = Math.max(0, total - end);
        end = total - 1;
      }
      if (start === null) start = 0;
      if (end === null) end = total - 1;
      end = Math.min(end, total - 1);

      if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= total) {
        res.set('Content-Range', `bytes */${total}`);
        return res.status(416).end();
      }

      res.status(206);
      res.set('Content-Range', `bytes ${start}-${end}/${total}`);
      res.set('Content-Length', String(end - start + 1));
      const stream = bucket.openDownloadStream(id, { start, end: end + 1 });
      stream.on('error', () => res.destroy());
      return stream.pipe(res);
    }

    res.set('Content-Length', String(total));
    const stream = bucket.openDownloadStream(id);
    stream.on('error', () => res.destroy());
    return stream.pipe(res);
  } catch (error) {
    return next(error);
  }
});

/*
 * ── Lesson / class documents ────────────────────────────────────────────
 *
 * PDFs, slide decks and worksheets belong in the same durable place as the
 * videos: a redeploy replaces the app directory, so a file written only to
 * `server/uploads` disappears after the next push. These are kept in their own
 * GridFS bucket, with a 50 MB cap and a strict extension allowlist. HTML, SVG
 * and scripts are deliberately not accepted — the download is served inline,
 * so an active document must never be reachable from this origin.
 */
const DOCUMENT_MAX_BYTES = 50 * 1024 * 1024;
const DOCUMENT_MAX_MB = Math.round(DOCUMENT_MAX_BYTES / (1024 * 1024));
const DOCUMENT_MIME_BY_EXT = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.zip': 'application/zip',
};
const DOCUMENT_EXTENSIONS = Object.keys(DOCUMENT_MIME_BY_EXT);
const DOCUMENT_BUCKET = 'lmsDocuments';

const documentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, videoTempDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: DOCUMENT_MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (DOCUMENT_EXTENSIONS.includes(ext)) return cb(null, true);
    return cb(
      new Error(`Only ${DOCUMENT_EXTENSIONS.join(', ').replace(/\./g, '').toUpperCase()} files are allowed.`),
    );
  },
});

const documentBucket = () =>
  new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: DOCUMENT_BUCKET });

const canUploadDocument = authorizeScoped(
  ['SUPERADMIN', 'ADMIN', 'INSTRUCTOR', 'COUNSELOR'],
  ['LMS_CONTENT_EDIT', 'MEDIA_UPLOAD', 'COURSES_EDIT', 'LMS_ENROLL_EDIT'],
);

// @desc    Upload one PDF / slide deck / worksheet, stored durably in GridFS
// @route   POST /api/upload/document
// @access  Protected (LMS authoring / enrollment staff)
router.post('/document', protect, canUploadDocument, (req, res) => {
  documentUpload.single('document')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `That file is too large. The maximum is ${DOCUMENT_MAX_MB} MB.`
          : `Upload error: ${err.message}`;
      return res.status(400).json({ success: false, code: err.code, message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a document to upload.' });
    }

    const tempPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = buildFilename(req.file.originalname);
    const mimetype = DOCUMENT_MIME_BY_EXT[ext] || 'application/octet-stream';

    try {
      const bucket = documentBucket();
      const uploadStream = bucket.openUploadStreamWithId(
        new mongoose.Types.ObjectId(),
        filename,
        {
          contentType: mimetype,
          metadata: {
            mimetype,
            size: req.file.size,
            originalName: req.file.originalname,
            uploadedBy: String(req.user?._id || ''),
          },
        },
      );

      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(tempPath);
        readStream.on('error', reject);
        uploadStream.on('error', reject);
        uploadStream.on('finish', resolve);
        readStream.pipe(uploadStream);
      });

      const id = String(uploadStream.id);
      const url = `/api/upload/document/${id}${ext}`;

      AuditLog.create({
        actor: req.user?._id,
        actorName: req.user?.name || 'Admin',
        actorRole: req.user?.role || 'ADMIN',
        action: 'LMS_DOCUMENT_UPLOADED',
        entity: 'LmsDocument',
        entityId: id,
        details: `Uploaded LMS document ${filename} (${Math.round(req.file.size / 1024)} KB)`,
      }).catch(() => {});

      return res.status(201).json({
        success: true,
        message: 'Document uploaded and stored durably.',
        url,
        id,
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype,
        fileType: ext.replace('.', '').toUpperCase(),
        maxBytes: DOCUMENT_MAX_BYTES,
        storage: 'mongodb-gridfs',
      });
    } catch (uploadErr) {
      console.error('Document upload failed:', uploadErr.message);
      return res.status(500).json({
        success: false,
        message: 'The document could not be stored. Please try again.',
      });
    } finally {
      fs.unlink(tempPath, () => {});
    }
  });
});

/** Stream an uploaded document inline (PDF viewers and browser previews). */
router.get('/document/:file', async (req, res, next) => {
  try {
    const match = String(req.params.file || '').match(/^([a-f0-9]{24})(\.[a-z0-9]+)?$/i);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const id = new mongoose.Types.ObjectId(match[1]);
    const bucket = documentBucket();
    const found = await bucket.find({ _id: id }).limit(1).toArray();
    const file = found[0];
    if (!file) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const total = file.length;
    const contentType =
      file.metadata?.mimetype || file.contentType || 'application/octet-stream';
    const safeName = String(file.filename || 'document').replace(/["\\\r\n]/g, '-');
    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `inline; filename="${safeName}"`);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Accept-Ranges', 'bytes');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');

    const range = req.headers.range;
    if (range) {
      const rangeMatch = String(range).match(/^bytes=(\d*)-(\d*)$/);
      if (!rangeMatch) {
        res.set('Content-Range', `bytes */${total}`);
        return res.status(416).end();
      }
      let start = rangeMatch[1] ? parseInt(rangeMatch[1], 10) : null;
      let end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : null;
      if (start === null && end !== null) {
        start = Math.max(0, total - end);
        end = total - 1;
      }
      if (start === null) start = 0;
      if (end === null) end = total - 1;
      end = Math.min(end, total - 1);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= total) {
        res.set('Content-Range', `bytes */${total}`);
        return res.status(416).end();
      }
      res.status(206);
      res.set('Content-Range', `bytes ${start}-${end}/${total}`);
      res.set('Content-Length', String(end - start + 1));
      const stream = bucket.openDownloadStream(id, { start, end: end + 1 });
      stream.on('error', () => res.destroy());
      return stream.pipe(res);
    }

    res.set('Content-Length', String(total));
    const stream = bucket.openDownloadStream(id);
    stream.on('error', () => res.destroy());
    return stream.pipe(res);
  } catch (error) {
    return next(error);
  }
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
