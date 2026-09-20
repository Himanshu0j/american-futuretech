const Batch = require('../models/Batch');
const Course = require('../models/Course');

// @desc    Get all batches
// @route   GET /api/batches
// @access  Public / Private
const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate('course', 'title slug badge cardTheme pricing')
      .sort({ startDate: 1 });

    return res.status(200).json({
      success: true,
      count: batches.length,
      batches,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new batch
// @route   POST /api/batches
// @access  Private (SuperAdmin)
const createBatch = async (req, res) => {
  try {
    const { course, batchCode, startDate, timing, maxCapacity, status } = req.body;

    const existing = await Batch.findOne({ batchCode: batchCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Batch code already exists',
      });
    }

    const batch = await Batch.create({
      course,
      batchCode: batchCode.toUpperCase(),
      startDate,
      timing,
      maxCapacity: maxCapacity || 25,
      status: status || 'Upcoming',
      enrolledStudents: [],
    });

    const populatedBatch = await Batch.findById(batch._id).populate('course', 'title slug');

    return res.status(201).json({
      success: true,
      batch: populatedBatch,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Private (SuperAdmin)
const updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('course', 'title slug');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    return res.status(200).json({
      success: true,
      batch,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Private (SuperAdmin)
const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    await batch.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Batch removed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get frontend live urgency seat statistics
// @route   GET /api/batches/urgency
// @access  Public
const getFrontendUrgency = async (req, res) => {
  try {
    const upcomingBatches = await Batch.find({ status: 'Upcoming' }).populate('course', 'title slug');
    const urgencyList = upcomingBatches.map((b) => {
      const remaining = Math.max(0, b.maxCapacity - b.enrolledStudents.length);
      return {
        batchId: b._id,
        courseTitle: b.course ? b.course.title : 'Program',
        batchCode: b.batchCode,
        startDate: b.startDate,
        remainingSeats: remaining,
        urgencyMessage: `Only ${remaining} seats left for ${b.batchCode}!`,
      };
    });

    return res.status(200).json({
      success: true,
      urgency: urgencyList,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getFrontendUrgency,
};
