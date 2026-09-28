const mongoose = require('mongoose');

/**
 * Uploaded media (logos, card images, certificate art) kept in MongoDB.
 *
 * Container hosts — Render included — hand the API an ephemeral disk, so a file
 * uploaded from the admin panel was written to /uploads, served fine, and then
 * disappeared on the next deploy. The admin saw a broken image days later and
 * reported it as "the image option never worked". The bytes are stored here as
 * well, so the same /uploads/<file> URL keeps resolving for every visitor.
 *
 * The file is still written to disk on upload: local dev and the Vite preview
 * serve it statically, which is faster and keeps the CMS preview instant.
 */
const UploadedAssetSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true, index: true },
    mimetype: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UploadedAsset', UploadedAssetSchema);
