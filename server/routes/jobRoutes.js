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

// Public routes
router.get('/', getPublishedJobs);
router.post('/talent-pool', submitTalentPool);

// Admin routes (declared before /:id so they are never swallowed by it)
router.get('/admin/applications', protect, checkPermission('JOBS_VIEW'), getAllApplications);
router.get('/admin/:id', protect, checkPermission('JOBS_VIEW'), getJobForAdmin);
router.post('/', protect, checkPermission('JOBS_CREATE'), createJob);
router.post('/:id/duplicate', protect, checkPermission('JOBS_CREATE'), duplicateJob);
router.put('/:id', protect, checkPermission('JOBS_EDIT'), updateJob);
router.delete('/:id', protect, checkPermission('JOBS_DELETE'), deleteJob);
router.patch('/applications/:id', protect, checkPermission('JOBS_EDIT'), updateApplicationStatus);

// Public detail + apply (kept last so admin paths win)
router.get('/:id', getJobById);
router.post('/:id/apply', applyForJob);

module.exports = router;
