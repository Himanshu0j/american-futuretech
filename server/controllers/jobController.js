const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const AuditLog = require('../models/AuditLog');

// @desc    Get all published jobs with search & department filter
// @route   GET /api/jobs
// @access  Public
const getPublishedJobs = async (req, res) => {
  try {
    const { search, department, employmentType, includeAll } = req.query;
    let query = {};
    if (!includeAll || includeAll === 'false') {
      query.isPublished = true;
    }

    if (department && department !== 'All') {
      query.department = department;
    }
    if (employmentType && employmentType !== 'All') {
      query.employmentType = employmentType;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const jobs = await Job.find(query)
      .populate('recommendedCourse', 'title slug category duration badge pricing')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('recommendedCourse', 'title slug category duration badge pricing shortDescription highlights tools');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    return res.status(200).json({ success: true, job });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply to job posting
// @route   POST /api/jobs/:id/apply
// @access  Public
const applyForJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { applicantName, email, phone, linkedinUrl, portfolioUrl, resumeUrl, coverNote } = req.body;

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
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
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

    const newJob = await Job.create(req.body);
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
    return res.status(500).json({ success: false, message: error.message });
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

    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('recommendedCourse', 'title slug category duration badge pricing');
    if (!updated) return res.status(404).json({ success: false, message: 'Job not found' });
    return res.status(200).json({ success: true, job: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(200).json({ success: true, message: 'Job deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPublishedJobs,
  getJobById,
  applyForJob,
  submitTalentPool,
  createJob,
  updateJob,
  deleteJob,
  getAllApplications,
  updateApplicationStatus,
};
