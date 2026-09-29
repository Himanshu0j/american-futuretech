const express = require('express');
const router = express.Router();
const {
  getIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue,
} = require('../controllers/issueController');
const { protect } = require('../middleware/auth');

/**
 * Client issue reports (the "write it down, then copy it out" board).
 *
 * Every route is `protect`-only rather than `checkPermission`-gated. This is an
 * internal scratchpad for whoever maintains the site, it never renders on the
 * public site or in the student portal, and the output is a text brief the
 * admin copies by hand. Gating it behind a new permission id would only create
 * a way to hide the screen the client asked for; the audit log still records
 * who filed and changed each report.
 */
router.get('/', protect, getIssues);
router.post('/', protect, createIssue);
router.get('/:id', protect, getIssue);
router.put('/:id', protect, updateIssue);
router.delete('/:id', protect, deleteIssue);

module.exports = router;
