const mongoose = require('mongoose');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const AuditLog = require('../models/AuditLog');
const { sendError } = require('../utils/apiError');

// Public job board page size. The board always shows 8 postings per page.
const JOB_PAGE_SIZE = 8;
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A malformed :id — a crawler hitting /api/jobs/filters, or any typo — reaches
 * findById and throws a CastError, which used to surface as a 500 with the raw
 * mongoose message attached. Treat it as "not found" instead.
 */
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));

const toTrimmedList = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item == null ? '' : item).trim()).filter(Boolean);
};

const LIST_FIELDS = [
  'skills', 'responsibilities', 'requirements', 'benefits', 'qualifications',
  'preferredQualifications', 'keyRequirements', 'requiredCertificates',
  'technicalSkills', 'softSkills', 'tools', 'languages',
];

/**
 * Normalise an admin job payload: only whitelisted fields, no server-owned
 * values (ids, timestamps, applicant counters), lists always arrays, and a
 * posting date that can never sit in the future.
 */
const sanitizeJobPayload = (body = {}) => {
  const payload = {};
  const stringFields = [
    'title', 'company', 'companyLogo', 'department', 'location', 'employmentType',
    'experienceLevel', 'salaryRange', 'description', 'applyLink', 'careerGrowth',
    'recommendedCourseTitle',
  ];

  stringFields.forEach((field) => {
    if (body[field] !== undefined) payload[field] = String(body[field] == null ? '' : body[field]).trim();
  });

  if (body.type && !body.employmentType) payload.employmentType = String(body.type).trim();

  LIST_FIELDS.forEach((field) => {
    if (body[field] !== undefined) payload[field] = toTrimmedList(body[field]);
  });

  ['isPublished', 'isActive', 'isFeatured'].forEach((field) => {
    if (body[field] !== undefined) payload[field] = body[field] !== false && body[field] !== 'false';
  });

  ['salaryMin', 'salaryMax', 'order'].forEach((field) => {
    if (body[field] !== undefined) {
      if (body[field] === '' || body[field] === null) {
        payload[field] = field === 'order' ? 0 : null;
      } else {
        const num = Number(body[field]);
        payload[field] = isNaN(num) ? (field === 'order' ? 0 : null) : num;
      }
    }
  });

  if (body.recommendedCourse !== undefined) {
    payload.recommendedCourse = mongoose.Types.ObjectId.isValid(String(body.recommendedCourse))
      ? String(body.recommendedCourse)
      : null;
  }

  if (body.postedAt !== undefined) {
    const parsed = body.postedAt ? new Date(body.postedAt) : null;
    if (parsed && !isNaN(parsed.getTime())) {
      const oneHourAhead = Date.now() + 60 * 60 * 1000;
      if (parsed.getTime() > oneHourAhead) {
        const error = new Error('Posted date cannot be in the future. Pick today or an earlier date.');
        error.statusCode = 400;
        throw error;
      }
      payload.postedAt = parsed;
    } else if (body.postedAt === null || body.postedAt === '') {
      payload.postedAt = null;
    }
  }

  if (body.deadline !== undefined) {
    const parsed = body.deadline ? new Date(body.deadline) : null;
    payload.deadline = parsed && !isNaN(parsed.getTime()) ? parsed : null;
  }

  return payload;
};

// @desc    Get published jobs — search, filters, sort and pagination all run in
//          the database so page counts are computed from the FILTERED total
//          (search "Cloud" + Remote → 13 matches → 2 pages, never 13 of 100).
// @route   GET /api/jobs
// @access  Public
const getPublishedJobs = async (req, res) => {
  try {
    const {
      search, department, employmentType, experience, location, course, remoteOnly,
      salaryMin, sort, includeAll, page, limit,
    } = req.query;

    const conditions = [];
    if (!includeAll || includeAll === 'false') {
      conditions.push({ isPublished: { $ne: false } });
      conditions.push({ isActive: { $ne: false } });
    }

    if (department && department !== 'All') conditions.push({ department });
    if (employmentType && employmentType !== 'All') conditions.push({ employmentType });

    if (experience && experience !== 'All' && String(experience).trim()) {
      conditions.push({ experienceLevel: { $regex: escapeRegex(experience), $options: 'i' } });
    }

    if (String(remoteOnly) === 'true') {
      conditions.push({ location: { $regex: 'remote', $options: 'i' } });
    }

    if (location && location !== 'All' && String(location).trim()) {
      const keyword = String(location).split(',')[0].trim();
      if (keyword) conditions.push({ location: { $regex: escapeRegex(keyword), $options: 'i' } });
    }

    if (course && course !== 'All' && String(course).trim()) {
      const courseMatch = [
        { recommendedCourseTitle: { $regex: escapeRegex(String(course).trim()), $options: 'i' } },
      ];
      if (mongoose.Types.ObjectId.isValid(String(course))) {
        courseMatch.push({ recommendedCourse: String(course) });
      }
      conditions.push({ $or: courseMatch });
    }

    const threshold = Number(salaryMin);
    if (!isNaN(threshold) && threshold > 0) {
      // salaryFloor is derived on save; legacy rows without it are read from
      // salaryMin so an un-migrated record can never silently disappear.
      conditions.push({
        $or: [
          { salaryFloor: { $gte: threshold } },
          { salaryFloor: { $in: [0, null] }, salaryMin: { $gte: threshold } },
        ],
      });
    }

    const term = String(search || '').trim();
    if (term) {
      const rx = { $regex: escapeRegex(term), $options: 'i' };
      conditions.push({
        $or: [
          { title: rx },
          { company: rx },
          { location: rx },
          { experienceLevel: rx },
          { description: rx },
          { skills: rx },
          { technicalSkills: rx },
          { tools: rx },
        ],
      });
    }

    const query = conditions.length ? { $and: conditions } : {};

    const sortMap = {
      newest: { postedAt: -1, createdAt: -1 },
      oldest: { postedAt: 1, createdAt: 1 },
      salary: { salaryFloor: -1, postedAt: -1 },
      order: { order: 1, postedAt: -1 },
    };
    const sortSpec = sortMap[String(sort || 'newest')] || sortMap.newest;

    const total = await Job.countDocuments(query);

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 0, 0), 50);
    const paginate = parsedLimit > 0;
    const pageSize = paginate ? parsedLimit : total || 0;
    const totalPages = paginate ? Math.max(Math.ceil(total / pageSize), 1) : 1;
    const requestedPage = Math.max(parseInt(page, 10) || 1, 1);
    // Guard against a stale page number after a filter change or a delete.
    const currentPage = Math.min(requestedPage, totalPages);

    let jobsQuery = Job.find(query)
      .populate('recommendedCourse', 'title slug category duration badge pricing')
      .sort(sortSpec);
    if (paginate) jobsQuery = jobsQuery.skip((currentPage - 1) * pageSize).limit(pageSize);

    const jobs = await jobsQuery;

    // Departments for the filter dropdown come from ALL published postings, not
    // just the current page, so the dropdown never shrinks as you paginate.
    const departments = await Job.distinct('department', { isPublished: { $ne: false } });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
      pagination: {
        page: currentPage,
        pageSize: pageSize || JOB_PAGE_SIZE,
        total,
        totalPages,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages,
      },
      facets: {
        departments: departments.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    const job = await Job.findById(req.params.id)
      .populate('recommendedCourse', 'title slug category duration badge pricing shortDescription highlights tools');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    return res.status(200).json({ success: true, job });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Apply to job posting
// @route   POST /api/jobs/:id/apply
// @access  Public
const applyForJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { applicantName, email, phone, linkedinUrl, portfolioUrl, resumeUrl, coverNote } = req.body;

    if (!isObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (!applicantName || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and phone.' });
    }

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const application = await JobApplication.create({
      job: job._id,
      applicantName,
      email: email.toLowerCase(),
      phone,
      linkedinUrl: linkedinUrl || '',
      portfolioUrl: portfolioUrl || '',
      resumeUrl: resumeUrl || 'https://americanfuturetech.com/resumes/sample_applicant_resume.pdf',
      coverNote: coverNote || '',
      status: 'Submitted',
    });

    job.applicantCount = (job.applicantCount || 0) + 1;
    await job.save();

    return res.status(201).json({
      success: true,
      message: '🎉 Application submitted successfully! Our career placement team will review your profile.',
      applicationId: application._id,
      applicantCount: job.applicantCount,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Submit general talent network application (Fast-track concierge)
// @route   POST /api/jobs/talent-pool
// @access  Public
const submitTalentPool = async (req, res) => {
  try {
    const { applicantName, email, phone, targetDomain, linkedinUrl, resumeUrl, experienceLevel } = req.body;

    if (!applicantName || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and phone number.' });
    }

    const Lead = require('../models/Lead');
    // Also record in Lead CRM so admissions & career counselors get notified
    await Lead.create({
      fullName: applicantName,
      email: email.toLowerCase(),
      phone,
      preferredBatch: targetDomain || 'General Career Placement Network',
      status: 'New',
      marketingSource: 'Hiring Board Fast-Track Application',
      notes: `Target Domain: ${targetDomain || 'All'}. Experience: ${experienceLevel || 'Not specified'}. LinkedIn: ${linkedinUrl || 'N/A'}. Resume: ${resumeUrl || 'N/A'}`,
    });

    return res.status(201).json({
      success: true,
      message: '🚀 Fast-track application received! Our Enterprise Placement Officer will review your resume within 24 hours.',
    });
  } catch (error) {
    return sendError(res, error);
  }
};
// @route   POST /api/jobs
// @access  Private (Admin)
const createJob = async (req, res) => {
  try {
    const { salaryMin, salaryMax, applyLink, companyLogo } = req.body;
    if (salaryMin !== undefined && salaryMax !== undefined && Number(salaryMin) > 0 && Number(salaryMax) > 0) {
      if (Number(salaryMin) > Number(salaryMax)) {
        return res.status(400).json({ success: false, message: 'Minimum salary cannot exceed maximum salary.' });
      }
    }
    if (applyLink && applyLink.trim().toLowerCase().startsWith('javascript:')) {
      return res.status(400).json({ success: false, message: 'Invalid Apply Link URL protocol.' });
    }
    if (companyLogo && companyLogo.trim().toLowerCase().startsWith('javascript:')) {
      return res.status(400).json({ success: false, message: 'Invalid Company Logo URL protocol.' });
    }

    const newJob = await Job.create(sanitizeJobPayload(req.body));
    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'JOB_CREATED',
      entity: 'Job',
      entityId: newJob._id.toString(),
      details: `Created job posting: ${newJob.title}`,
    });
    return res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Admin: Update job
// @route   PUT /api/jobs/:id
// @access  Private (Admin)
const updateJob = async (req, res) => {
  try {
    const { salaryMin, salaryMax, applyLink, companyLogo } = req.body;
    if (salaryMin !== undefined && salaryMax !== undefined && Number(salaryMin) > 0 && Number(salaryMax) > 0) {
      if (Number(salaryMin) > Number(salaryMax)) {
        return res.status(400).json({ success: false, message: 'Minimum salary cannot exceed maximum salary.' });
      }
    }
    if (applyLink && applyLink.trim().toLowerCase().startsWith('javascript:')) {
      return res.status(400).json({ success: false, message: 'Invalid Apply Link URL protocol.' });
    }
    if (companyLogo && companyLogo.trim().toLowerCase().startsWith('javascript:')) {
      return res.status(400).json({ success: false, message: 'Invalid Company Logo URL protocol.' });
    }

    const existing = await Job.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Job not found' });

    Object.assign(existing, sanitizeJobPayload(req.body));
    const updated = await existing.save();
    await updated.populate('recommendedCourse', 'title slug category duration badge pricing');

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'JOB_UPDATED',
      entity: 'Job',
      entityId: updated._id.toString(),
      details: `Updated job posting: ${updated.title} at ${updated.company}`,
    });

    return res.status(200).json({ success: true, job: updated });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Admin: Duplicate a job posting as a fresh draft
// @route   POST /api/jobs/:id/duplicate
// @access  Private (Admin)
const duplicateJob = async (req, res) => {
  try {
    const source = await Job.findById(req.params.id);
    if (!source) return res.status(404).json({ success: false, message: 'Job not found' });

    const clone = source.toObject();
    delete clone._id;
    delete clone.createdAt;
    delete clone.updatedAt;
    delete clone.__v;

    const copy = await Job.create({
      ...clone,
      title: `${source.title} (Copy)`,
      isPublished: false,
      isActive: false,
      applicantCount: 0,
      postedAt: new Date(),
    });

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'JOB_CREATED',
      entity: 'Job',
      entityId: copy._id.toString(),
      details: `Duplicated job posting: ${source.title}`,
    });

    return res.status(201).json({ success: true, job: copy });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Admin: Get single job by id even when unpublished
// @route   GET /api/jobs/admin/:id
// @access  Private (Admin)
const getJobForAdmin = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    const job = await Job.findById(req.params.id)
      .populate('recommendedCourse', 'title slug category duration badge pricing');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    return res.status(200).json({ success: true, job });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Admin: Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Admin)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    await JobApplication.deleteMany({ job: req.params.id });

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'JOB_DELETED',
      entity: 'Job',
      entityId: req.params.id,
      details: `Deleted job posting: ${job.title} at ${job.company}`,
    });

    return res.status(200).json({ success: true, message: 'Job deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Admin: Get all applications
// @route   GET /api/jobs/admin/applications
// @access  Private (Admin)
const getAllApplications = async (req, res) => {
  try {
    const applications = await JobApplication.find()
      .populate('job', 'title company location department salaryRange')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, applications });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Admin: Update application status
// @route   PATCH /api/jobs/applications/:id
// @access  Private (Admin)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const application = await JobApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    if (status) application.status = status;
    if (notes) application.notes = notes;
    await application.save();

    return res.status(200).json({ success: true, application });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
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
};
