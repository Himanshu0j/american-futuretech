const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const Course = require('../models/Course');
const AuditLog = require('../models/AuditLog');
const {
  normalizeCode,
  evaluateCoupon,
  computeDiscount,
  describeCoupon,
} = require('../utils/couponEngine');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toList = (value) => (Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : undefined);

const logCouponAction = (req, action, coupon, details) =>
  AuditLog.create({
    actor: req.user?._id,
    actorName: req.user?.name || 'Admin',
    actorRole: req.user?.role || 'ADMIN',
    action,
    entity: 'Coupon',
    entityId: String(coupon?._id || ''),
    details,
  });

const sanitizeCouponPayload = (body = {}) => {
  const payload = {};

  if (body.code !== undefined) {
    const code = normalizeCode(body.code).replace(/\s+/g, '');
    if (code) payload.code = code;
  }
  if (body.description !== undefined) payload.description = String(body.description).trim();
  if (body.discountType !== undefined) {
    payload.discountType = body.discountType === 'flat' ? 'flat' : 'percent';
  }
  if (body.discountValue !== undefined) payload.discountValue = Number(body.discountValue) || 0;

  ['minAmount', 'maxDiscount', 'usageLimit', 'perStudentLimit'].forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field] === '' || body[field] === null ? 0 : Math.max(Number(body[field]) || 0, 0);
    }
  });

  ['startsAt', 'expiresAt'].forEach((field) => {
    if (body[field] !== undefined) {
      if (!body[field]) {
        payload[field] = null;
      } else {
        const parsed = new Date(body[field]);
        payload[field] = isNaN(parsed.getTime()) ? null : parsed;
      }
    }
  });

  if (body.active !== undefined) payload.active = body.active !== false && body.active !== 'false';

  if (body.applicableTiers !== undefined) {
    const tiers = toList(body.applicableTiers) || [];
    payload.applicableTiers = tiers.filter((t) => ['deposit', 'full', 'personalized'].includes(t));
  }

  if (body.applicableCourses !== undefined) {
    const ids = toList(body.applicableCourses) || [];
    payload.applicableCourses = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  }

  return payload;
};

const validateCouponRules = (payload, { isUpdate = false } = {}) => {
  if (!isUpdate && !payload.code) return 'Coupon code is required.';
  if (payload.code && !/^[A-Z0-9_-]{3,32}$/.test(payload.code)) {
    return 'Coupon code may only contain letters, numbers, dashes and underscores (3–32 characters).';
  }
  if (payload.discountType === 'flat' && payload.discountValue !== undefined && payload.discountValue <= 0) {
    return 'A flat discount must be greater than 0.';
  }
  if (payload.discountType === 'percent' && payload.discountValue !== undefined && payload.discountValue > 100) {
    return 'A percentage discount cannot be more than 100%.';
  }
  if (payload.discountValue === 0) return 'Discount value must be greater than 0.';
  if (payload.startsAt && payload.expiresAt && new Date(payload.startsAt) > new Date(payload.expiresAt)) {
    return 'The start date cannot be after the expiry date.';
  }
  return null;
};

// @desc    Admin: list coupons with search, status filter and pagination
// @route   GET /api/coupons
// @access  Private (Admin)
const getCoupons = async (req, res) => {
  try {
    const { search, status, page, limit } = req.query;
    const query = {};

    if (status === 'active') query.active = true;
    if (status === 'inactive') query.active = false;

    const term = String(search || '').trim();
    if (term) {
      const rx = { $regex: escapeRegex(term), $options: 'i' };
      query.$or = [{ code: rx }, { description: rx }];
    }

    const total = await Coupon.countDocuments(query);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 0, 0), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);

    let listQuery = Coupon.find(query)
      .populate('applicableCourses', 'title slug')
      .sort({ createdAt: -1 });
    if (parsedLimit > 0) {
      listQuery = listQuery.skip((parsedPage - 1) * parsedLimit).limit(parsedLimit);
    }

    const coupons = await listQuery.lean();
    const now = new Date();

    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons: coupons.map((coupon) => {
        const expired = coupon.expiresAt && new Date(coupon.expiresAt) < now;
        const exhausted = Number(coupon.usageLimit) > 0 && Number(coupon.usedCount) >= Number(coupon.usageLimit);
        return {
          ...coupon,
          summary: describeCoupon(coupon),
          state: !coupon.active ? 'inactive' : expired ? 'expired' : exhausted ? 'exhausted' : 'live',
        };
      }),
      pagination: {
        page: parsedPage,
        pageSize: parsedLimit || total,
        total,
        totalPages: parsedLimit ? Math.max(Math.ceil(total / parsedLimit), 1) : 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: create a coupon
// @route   POST /api/coupons
// @access  Private (Admin)
const createCoupon = async (req, res) => {
  try {
    const payload = sanitizeCouponPayload(req.body);
    const ruleError = validateCouponRules(payload);
    if (ruleError) return res.status(400).json({ success: false, message: ruleError });

    const existing = await Coupon.findOne({ code: payload.code });
    if (existing) {
      return res.status(409).json({ success: false, message: `Coupon ${payload.code} already exists.` });
    }

    const coupon = await Coupon.create({ ...payload, createdBy: req.user?._id || null });
    await logCouponAction(req, 'COUPON_CREATED', coupon, `Created coupon ${coupon.code} (${describeCoupon(coupon)})`);

    return res.status(201).json({ success: true, coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'That coupon code already exists.' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Admin: update a coupon
// @route   PUT /api/coupons/:id
// @access  Private (Admin)
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    const payload = sanitizeCouponPayload(req.body);
    const ruleError = validateCouponRules(
      { discountType: coupon.discountType, ...payload },
      { isUpdate: true },
    );
    if (ruleError) return res.status(400).json({ success: false, message: ruleError });

    if (payload.code && payload.code !== coupon.code) {
      const clash = await Coupon.findOne({ code: payload.code, _id: { $ne: coupon._id } });
      if (clash) return res.status(409).json({ success: false, message: `Coupon ${payload.code} already exists.` });
    }

    Object.assign(coupon, payload);
    await coupon.save();

    await logCouponAction(req, 'COUPON_UPDATED', coupon, `Updated coupon ${coupon.code}`);
    return res.status(200).json({ success: true, coupon });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Admin: activate / deactivate a coupon
// @route   PATCH /api/coupons/:id/toggle
// @access  Private (Admin)
const toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    coupon.active = req.body?.active !== undefined ? Boolean(req.body.active) : !coupon.active;
    await coupon.save();

    await logCouponAction(
      req,
      'COUPON_UPDATED',
      coupon,
      `${coupon.active ? 'Activated' : 'Deactivated'} coupon ${coupon.code}`,
    );
    return res.status(200).json({ success: true, coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Admin)
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    await logCouponAction(req, 'COUPON_DELETED', coupon, `Deleted coupon ${coupon.code}`);
    return res.status(200).json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: dry-run a coupon against a sample amount (no side effects)
// @route   POST /api/coupons/preview
// @access  Private (Admin)
const previewCoupon = async (req, res) => {
  try {
    const { couponId, amount, tier, courseId } = req.body || {};
    const coupon = couponId ? await Coupon.findById(couponId).lean() : null;
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    const sampleAmount = Number(amount) > 0 ? Number(amount) : 1000;
    const evaluation = evaluateCoupon(coupon, {
      amount: sampleAmount,
      tier: tier || 'full',
      courseId: courseId || null,
      studentUsage: 0,
    });

    return res.status(200).json({
      success: true,
      preview: {
        ...evaluation,
        sampleAmount,
        payable: computeDiscount(sampleAmount, coupon),
        finalAmount: Math.max(sampleAmount - (evaluation.ok ? evaluation.discountAmount : 0), 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: courses a coupon can be restricted to
// @route   GET /api/coupons/programs
// @access  Private (Admin)
const getCouponPrograms = async (req, res) => {
  try {
    const courses = await Course.find().select('title slug category').sort({ title: 1 }).lean();
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
  previewCoupon,
  getCouponPrograms,
};
