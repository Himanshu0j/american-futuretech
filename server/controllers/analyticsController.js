const Lead = require('../models/Lead');
const Batch = require('../models/Batch');
const Course = require('../models/Course');

/**
 * Midnight on the day `daysAgo` before today.
 * All buckets below share this helper so “today” means the same thing in every
 * number on the dashboard.
 */
const dayStart = (daysAgo = 0) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
};

// @desc    Get executive analytics for admin dashboard
// @route   GET /api/analytics/dashboard
// @access  Private
//
// Every figure here is derived from real records. Nothing on this endpoint is
// synthesised: if the database has no data for a bucket, the bucket reports 0
// and the client shows an empty state rather than a plausible-looking number.
const getDashboardAnalytics = async (req, res) => {
  try {
    const todayStart = dayStart(0);
    const yesterdayStart = dayStart(1);
    const weekStart = dayStart(6); // rolling 7 days, today included
    const lastWeekStart = dayStart(13);

    const [
      totalLeads,
      todayLeads,
      yesterdayLeads,
      enrolledLeads,
      courses,
      batches,
      recentLeads,
      twoWeekLeads,
      leadsByCourse,
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ createdAt: { $gte: todayStart } }),
      Lead.countDocuments({ createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
      Lead.countDocuments({ status: 'Enrolled' }),
      Course.find(),
      Batch.find().populate('course', 'title'),
      Lead.find().populate('targetCourse', 'title').sort({ createdAt: -1 }).limit(8),
      // Two weeks of leads power both the 7-day flow chart and the
      // week-over-week comparison. One query instead of seven.
      Lead.find({ createdAt: { $gte: lastWeekStart } }).select('createdAt status').lean(),
      Lead.aggregate([
        { $match: { targetCourse: { $ne: null } } },
        { $group: { _id: '$targetCourse', count: { $sum: 1 } } },
      ]),
    ]);

    const leadCountByCourse = new Map(leadsByCourse.map((row) => [String(row._id), row.count]));

    // Calculate Active Batches
    const activeBatchesCount = batches.filter(b => b.status === 'Upcoming' || b.status === 'In Progress').length;

    // Calculate Total Pipeline Revenue
    let totalRevenue = 0;
    batches.forEach(b => {
      b.enrolledStudents.forEach(st => {
        totalRevenue += (st.feePaid || 0);
      });
    });

    // Admissions Rate
    const admissionsRate = totalLeads > 0 ? ((enrolledLeads / totalLeads) * 100).toFixed(1) : 0;

    // Funnel Data
    const contactedLeads = await Lead.countDocuments({ status: { $in: ['Contacted', 'Counseling Scheduled', 'Enrolled'] } });
    const scheduledLeads = await Lead.countDocuments({ status: { $in: ['Counseling Scheduled', 'Enrolled'] } });

    // Only stages the database actually records. Page views are not tracked
    // anywhere in this codebase, so a “Visits” bar would have to be invented.
    const funnelData = [
      { stage: 'Lead Enquiries', count: totalLeads, fill: '#0ea5e9' },
      { stage: 'Counselor Calls', count: contactedLeads, fill: '#6366f1' },
      { stage: 'Doubt & Interview', count: scheduledLeads, fill: '#8b5cf6' },
      { stage: 'Enrolled Students', count: enrolledLeads, fill: '#10b981' },
    ];

    // Course distribution — the real programme title with its real lead count.
    const courseDistribution = courses.map((c) => ({
      name: c.title,
      fullName: c.title,
      value: leadCountByCourse.get(String(c._id)) || 0,
      color: c.cardTheme === 'rose' ? '#f43f5e' : '#0ea5e9',
    }));

    // 7-day flow, bucketed from the real timestamps we just read. Keys are the
    // local-midnight epoch of each day, so a lead and its bucket are always
    // compared in the same timezone (an ISO string would drift by a day in
    // negative UTC offsets).
    const localDay = (value) => {
      const d = new Date(value);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };
    const flowDays = Array.from({ length: 7 }, (_, index) => dayStart(6 - index));
    const weeklyFlow = flowDays.map((date) => ({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      leads: 0,
      enrollments: 0,
    }));
    const flowByDay = new Map(flowDays.map((date, index) => [date.getTime(), weeklyFlow[index]]));

    for (const lead of twoWeekLeads) {
      const bucket = flowByDay.get(localDay(lead.createdAt));
      if (!bucket) continue;
      bucket.leads += 1;
      if (lead.status === 'Enrolled') bucket.enrollments += 1;
    }

    const leadsThisWeek = weeklyFlow.reduce((sum, row) => sum + row.leads, 0);
    const leadsLastWeek = twoWeekLeads.length - leadsThisWeek;

    return res.status(200).json({
      success: true,
      kpis: {
        totalLeadsToday: todayLeads,
        totalLeadsYesterday: yesterdayLeads,
        totalLeadsThisWeek: leadsThisWeek,
        totalLeadsLastWeek: leadsLastWeek,
        totalLeadsAllTime: totalLeads,
        admissionsRate: `${admissionsRate}%`,
        admissionsRateValue: Number(admissionsRate),
        activeBatches: activeBatchesCount,
        totalRevenuePipeline: `$${totalRevenue.toLocaleString()}`,
        totalRevenueValue: totalRevenue,
        totalEnrolled: enrolledLeads,
        monitoredCourses: courses.length,
      },
      funnelData,
      courseDistribution,
      weeklyFlow,
      recentLeadsStream: recentLeads.map(l => ({
        id: l._id,
        name: l.fullName,
        email: l.email,
        course: l.targetCourse ? l.targetCourse.title : 'Technology Track',
        preferredBatch: l.preferredBatch,
        status: l.status,
        timestamp: l.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardAnalytics,
};
