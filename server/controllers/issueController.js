const mongoose = require('mongoose');
const IssueReport = require('../models/IssueReport');
const AuditLog = require('../models/AuditLog');
const { sendError } = require('../utils/apiError');

/**
 * Client issue reports — the admin board the client types notes on and copies
 * briefs out of.
 *
 * Access model: any signed-in staff member can read and write. The board is a
 * notchpad for whoever is looking after the site, and the report it produces is
 * handed to the developer by hand, so there is nothing to leak to a student or
 * a visitor. The routes are `protect`-only for that reason (documented in
 * routes/issueRoutes.js); no staff permission id is introduced, because a
 * missing permission grant would hide the one screen the client needs.
 *
 * Every write is recorded in the audit log so "who changed this to Fixed" has
 * an answer, exactly like the rest of the admin panel.
 */

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));

const CATEGORIES = [
  'Content / Text',
  'Layout / Design',
  'Image / Media',
  'Bug / Not Working',
  'Pricing / Payments',
  'Course / Curriculum',
  'Other',
];
const SEVERITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['Open', 'In Progress', 'Fixed', 'Verified'];

const oneOf = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const text = (value, max) => String(value == null ? '' : value).trim().slice(0, max);

/**
 * Only the fields an admin form owns. Ids, timestamps and `reportedBy` are
 * server-owned: a posted `reportedBy` would let one staff account file notes
 * under another's name.
 */
const sanitizePayload = (body = {}, { partial = false } = {}) => {
  const payload = {};

  if (!partial || body.title !== undefined) payload.title = text(body.title, 160);
  if (!partial || body.description !== undefined) payload.description = text(body.description, 8000);
  if (!partial || body.page !== undefined) payload.page = text(body.page, 300);
  if (!partial || body.category !== undefined) {
    payload.category = oneOf(String(body.category || ''), CATEGORIES, 'Other');
  }
  if (!partial || body.severity !== undefined) {
    payload.severity = oneOf(String(body.severity || ''), SEVERITIES, 'Medium');
  }
  if (!partial || body.status !== undefined) {
    payload.status = oneOf(String(body.status || ''), STATUSES, 'Open');
  }
  if (!partial || body.resolution !== undefined) payload.resolution = text(body.resolution, 4000);

  if (!partial || body.images !== undefined) {
    // A malformed `images` value must never wipe the screenshots already stored:
    // only an explicit array replaces the gallery.
    if (Array.isArray(body.images)) {
      payload.images = body.images
        .map((image) => ({
          url: text(image?.url, 600),
          filename: text(image?.filename, 200),
          caption: text(image?.caption, 200),
        }))
        // A data/blob URL is a browser-local handle: it would render for the
        // admin who saved it and be broken for everyone else. `javascript:` is
        // refused for the same reason the rest of the panel refuses it — the
        // brief is pasted into tools we do not control.
        .filter((image) => image.url && !/^(data|blob|javascript):/i.test(image.url))
        .slice(0, 12);
    } else if (!partial) {
      payload.images = [];
    }
  }

  if (body.reportedAt !== undefined && body.reportedAt) {
    const parsed = new Date(body.reportedAt);
    if (!Number.isNaN(parsed.getTime())) payload.reportedAt = parsed;
  }

  return payload;
};

// @desc    List issue reports (newest first)
// @route   GET /api/issues
// @access  Protected (any signed-in staff member)
const getIssues = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'ALL') {
      filter.status = oneOf(String(req.query.status), STATUSES, 'Open');
    }
    if (req.query.q) {
      const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { page: { $regex: safe, $options: 'i' } },
      ];
    }

    const issues = await IssueReport.find(filter).sort({ createdAt: -1 }).limit(500);
    const counts = await IssueReport.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

    const byStatus = STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
    counts.forEach((row) => { if (row._id in byStatus) byStatus[row._id] = row.count; });

    return res.status(200).json({
      success: true,
      count: issues.length,
      total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
      byStatus,
      issues,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    One issue report
// @route   GET /api/issues/:id
// @access  Protected
const getIssue = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Issue report not found' });
    }
    const issue = await IssueReport.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue report not found' });
    return res.status(200).json({ success: true, issue });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    File a new issue report (screenshots + note)
// @route   POST /api/issues
// @access  Protected
const createIssue = async (req, res) => {
  try {
    const payload = sanitizePayload(req.body);
    if (!payload.title) {
      return res.status(400).json({ success: false, message: 'Give the issue a short title.' });
    }

    const issue = await IssueReport.create({
      ...payload,
      reportedBy: {
        name: req.user?.name || 'Admin',
        email: req.user?.email || '',
        id: req.user?._id ? String(req.user._id) : '',
      },
    });

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'ISSUE_REPORTED',
      entity: 'IssueReport',
      entityId: issue._id.toString(),
      details: `Filed issue report: ${issue.title}${issue.images.length ? ` (${issue.images.length} screenshot${issue.images.length === 1 ? '' : 's'})` : ''}`,
    });

    return res.status(201).json({ success: true, issue });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Update an issue report (status, resolution, text, screenshots)
// @route   PUT /api/issues/:id
// @access  Protected
const updateIssue = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Issue report not found' });
    }

    const payload = sanitizePayload(req.body, { partial: true });
    if (payload.title !== undefined && !payload.title) {
      return res.status(400).json({ success: false, message: 'Give the issue a short title.' });
    }

    const issue = await IssueReport.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue report not found' });

    Object.entries(payload).forEach(([key, value]) => { issue[key] = value; });
    await issue.save();

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'ISSUE_UPDATED',
      entity: 'IssueReport',
      entityId: issue._id.toString(),
      details: `Updated issue report: ${issue.title} (status: ${issue.status}${payload.status ? '' : ' unchanged'})`,
    });

    return res.status(200).json({ success: true, issue });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Delete an issue report
// @route   DELETE /api/issues/:id
// @access  Protected
const deleteIssue = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Issue report not found' });
    }
    const issue = await IssueReport.findByIdAndDelete(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue report not found' });

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'ISSUE_DELETED',
      entity: 'IssueReport',
      entityId: req.params.id,
      details: `Deleted issue report: ${issue.title}`,
    });

    return res.status(200).json({ success: true, message: 'Issue report deleted.' });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  // Exported for the contract test so its fixtures cannot drift from the enum.
  CATEGORIES,
  SEVERITIES,
  STATUSES,
};
