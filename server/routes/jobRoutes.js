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
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getPublishedJobs);
router.post('/talent-pool', submitTalentPool);
router.get('/:id', getJobById);
router.post('/:id/apply', applyForJob);

// Admin routes
router.post('/', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), createJob);
router.put('/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), updateJob);
router.delete('/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), deleteJob);
router.get('/admin/applications', protect, authorize('SUPERADMIN', 'ADMIN', 'COUNSELOR', 'SuperAdmin'), getAllApplications);
router.patch('/applications/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'COUNSELOR', 'SuperAdmin'), updateApplicationStatus);

module.exports = router;
