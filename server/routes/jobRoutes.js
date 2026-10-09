const express = require('express');
const router = express.Router();
const {
  getPublishedJobs,
  getJobById,
  getJobForAdmin,
  applyForJob,
  submitTalentPool,
  createJob,
  updateJob,
  duplicateJob,
  deleteJob,
  getAllApplications,
  updateApplicationStatus,
} = require('../controllers/jobController');
const { protect, checkPermission } = require('../middleware/auth');
const guardImages = require('../middleware/blockExternalImages');

// A companyLogo on another origin is refused by the live CSP (`img-src 'self'
// data:`), which is what the rows of empty tiles on /careers were. The write
// path now rejects it instead of storing a URL that can never render.

// Public routes
router.get('/', getPublishedJobs);
router.post('/talent-pool', submitTalentPool);

// Admin routes (declared before /:id so they are never swallowed by it)
router.get('/admin/applications', protect, checkPermission('JOBS_VIEW'), getAllApplications);
router.get('/admin/:id', protect, checkPermission('JOBS_VIEW'), getJobForAdmin);
router.post('/', protect, checkPermission('JOBS_CREATE'), guardImages, createJob);
router.post('/:id/duplicate', protect, checkPermission('JOBS_CREATE'), duplicateJob);
router.put('/:id', protect, checkPermission('JOBS_EDIT'), guardImages, updateJob);
router.delete('/:id', protect, checkPermission('JOBS_DELETE'), deleteJob);
router.patch('/applications/:id', protect, checkPermission('JOBS_EDIT'), updateApplicationStatus);

// Public detail + apply (kept last so admin paths win)
router.get('/:id', getJobById);
router.post('/:id/apply', applyForJob);

module.exports = router;
