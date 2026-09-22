const SiteSettings = require('../models/SiteSettings');
const AuditLog = require('../models/AuditLog');

// @desc    Get site settings
// @route   GET /api/settings
// @access  Public
const getSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    } else {
      let modified = false;
      const schemaDefaults = new SiteSettings().toObject();
      const keysToCheck = ['hero', 'personalizedLearning', 'capstone', 'roadmap', 'aboutCMS', 'globalCtas', 'trustedCompanies'];
      
      for (const key of keysToCheck) {
        if (!settings[key] || (typeof settings[key] === 'object' && Object.keys(settings[key].toObject ? settings[key].toObject() : settings[key]).length === 0)) {
          settings[key] = schemaDefaults[key];
          modified = true;
        }
      }

      // Check specifically if capstone.tools or roadmap.steps or trustedCompanies.companies are empty
      if (!settings.capstone?.tools || settings.capstone.tools.length === 0) {
        if (!settings.capstone) settings.capstone = {};
        settings.capstone.tools = schemaDefaults.capstone.tools;
        modified = true;
      }
      if (!settings.roadmap?.steps || settings.roadmap.steps.length === 0) {
        if (!settings.roadmap) settings.roadmap = {};
        settings.roadmap.steps = schemaDefaults.roadmap.steps;
        modified = true;
      }
      if (!settings.trustedCompanies?.companies || settings.trustedCompanies.companies.length === 0) {
        if (!settings.trustedCompanies) settings.trustedCompanies = {};
        settings.trustedCompanies.companies = schemaDefaults.trustedCompanies.companies;
        modified = true;
      }

      if (modified) {
        await settings.save();
      }
    }
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update site settings
// @route   PUT /api/settings
// @access  Private (SuperAdmin, Admin)
const updateSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create(req.body);
    } else {
      settings = await SiteSettings.findByIdAndUpdate(settings._id, { $set: req.body }, { new: true, runValidators: true });
    }

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'SuperAdmin',
      actorRole: req.user?.role || 'SUPERADMIN',
      action: 'SITE_SETTINGS_UPDATED',
      entity: 'SiteSettings',
      details: 'Global site configuration, CMS sections, and banners updated',
    });

    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get audit logs
// @route   GET /api/settings/audit-logs
// @access  Private (SuperAdmin, Admin)
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSiteSettings,
  updateSiteSettings,
  getAuditLogs,
};
