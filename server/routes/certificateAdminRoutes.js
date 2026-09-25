const express = require('express');
const router = express.Router();
const {
  listCertificates,
  listEligibility,
  issueCertificate,
  revokeCertificate,
  reinstateCertificate,
} = require('../controllers/certificateAdminController');
const { protect, authorizeScoped } = require('../middleware/auth');

// Issuing and revoking a credential are deliberately separated, and revoking is
// the narrower grant: a staff account that can hand out certificates does not
// automatically get to withdraw someone else's.
const VIEW_ROLES = ['SUPERADMIN', 'ADMIN', 'COUNSELOR'];

const canView = authorizeScoped(VIEW_ROLES, ['LMS_VIEW', 'STUDENTS_VIEW']);
const canIssue = authorizeScoped(['SUPERADMIN', 'ADMIN'], ['LMS_CERTIFICATE_ISSUE', 'STUDENTS_EDIT']);
const canRevoke = authorizeScoped(['SUPERADMIN', 'ADMIN'], ['LMS_CERTIFICATE_REVOKE']);

router.get('/', protect, canView, listCertificates);
router.get('/eligibility', protect, canView, listEligibility);
router.post('/issue', protect, canIssue, issueCertificate);
router.post('/:id/revoke', protect, canRevoke, revokeCertificate);
router.post('/:id/reinstate', protect, canIssue, reinstateCertificate);

module.exports = router;
