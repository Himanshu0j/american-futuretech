const express = require('express');
const router = express.Router();
const {
  getPublishedJobs,
  getJobById,
  applyForJob,
  submitTalentPool,
  createJob,
  updateJob,
  deleteJob,
  getAllApplications,
  updateApplicationStatus,
} = require('../controllers/jobController');
const { protect, checkPermission } = require('../middleware/auth');

// Public routes
router.get('/', getPublishedJobs);
router.post('/talent-pool', submitTalentPool);
router.get('/:id', getJobById);
router.post('/:id/apply', applyForJob);

// Admin routes
router.post('/', protect, checkPermission('JOBS_CREATE'), createJob);
router.put('/:id', protect, checkPermission('JOBS_EDIT'), updateJob);
router.delete('/:id', protect, checkPermission('JOBS_DELETE'), deleteJob);
router.get('/admin/applications', protect, checkPermission('JOBS_VIEW'), getAllApplications);
router.patch('/applications/:id', protect, checkPermission('JOBS_EDIT'), updateApplicationStatus);

module.exports = router;
