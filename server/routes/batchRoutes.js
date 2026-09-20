const express = require('express');
const router = express.Router();
const {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getFrontendUrgency,
} = require('../controllers/batchController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getBatches);
router.get('/urgency', getFrontendUrgency);
router.post('/', protect, authorize('SuperAdmin'), createBatch);
router.put('/:id', protect, authorize('SuperAdmin'), updateBatch);
router.delete('/:id', protect, authorize('SuperAdmin'), deleteBatch);

module.exports = router;
