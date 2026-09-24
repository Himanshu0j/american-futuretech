const express = require('express');
const router = express.Router();

const {
  getCoupons,
  createCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
  previewCoupon,
  getCouponPrograms,
} = require('../controllers/couponController');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * Coupons gate real money, so only staff with coupon (or settings) rights can
 * manage them. Already-existing admins keep working because SETTINGS_VIEW /
 * SETTINGS_EDIT are accepted as equivalent.
 */
const canView = [protect, checkPermission('COUPONS_VIEW', 'SETTINGS_VIEW', 'ANALYTICS_VIEW')];
const canCreate = [protect, checkPermission('COUPONS_CREATE', 'SETTINGS_EDIT')];
const canEdit = [protect, checkPermission('COUPONS_EDIT', 'SETTINGS_EDIT')];
const canDelete = [protect, checkPermission('COUPONS_DELETE', 'SETTINGS_EDIT')];

router.get('/programs', ...canView, getCouponPrograms);
router.post('/preview', ...canView, previewCoupon);
router.get('/', ...canView, getCoupons);
router.post('/', ...canCreate, createCoupon);
router.put('/:id', ...canEdit, updateCoupon);
router.patch('/:id/toggle', ...canEdit, toggleCoupon);
router.delete('/:id', ...canDelete, deleteCoupon);

module.exports = router;
