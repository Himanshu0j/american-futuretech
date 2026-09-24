import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  Tag,
  Sparkles,
  DollarSign,
  Calendar,
  Layers,
  X,
  Save,
  Briefcase,
} from 'lucide-react';
import api from '../lib/api';
import ListItemsEditor from './components/ListItemsEditor';

export default function CoursesCMS() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Technology');
  const [badge, setBadge] = useState('Most Popular');
  const [cardTheme, setCardTheme] = useState('cyan');
  const [duration, setDuration] = useState('6 Months');
  const [basePrice, setBasePrice] = useState(1299);
  const [discountedPrice, setDiscountedPrice] = useState(499);
  const [highlights, setHighlights] = useState(['AI & ML Capstones', 'Real Data Projects', 'Placement Assistance']);

  // Which "ways to learn" this course offers, and the per-course "Who Can Apply" block.
  const [viewOptions, setViewOptions] = useState({ groupBatch: true, personalizedMentor: true });
  const [eligibility, setEligibility] = useState({
    eyebrow: 'Eligibility & Candidate Profile',
    title: 'Who Can Apply for this Course?',
    subtitle: 'Our fellowship is designed to bridge learners from diverse professional and academic backgrounds into high-tier technology roles.',
    points: [],
    certificationTitle: 'Globally Recognised Certification',
    certificationText: 'Earn a verified credential recognized by Fortune 500 employers across the United States, Europe, and Asia. Accelerate your career with measurable credentials.',
    certificationPoints: [],
    audiences: [],
  });
  const [modules, setModules] = useState([
    { moduleNumber: 1, moduleTitle: 'Module 1: Foundations', topics: 'Topic 1, Topic 2, Topic 3', hours: 30 },
  ]);

  // Capstone showcase cards — editable from the same course modal, saved via /api/settings
  const [capstoneProjects, setCapstoneProjects] = useState([]);
  const [saveFeedback, setSaveFeedback] = useState(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses/admin/all');
      if (res.data.success) {
        setCourses(res.data.courses);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCapstones = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        setCapstoneProjects(res.data.settings?.capstone?.projects || []);
      }
    } catch (err) {
      console.error('Failed to load capstone projects:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchCapstones();
  }, []);

  const openCreateModal = () => {
    setEditingCourse(null);
    setTitle('');
    setSlug('');
    setCategory('Technology');
    setBadge('');
    setCardTheme('cyan');
    setDuration('6 Months');
    setBasePrice(2499);
    setDiscountedPrice(1899);
    setHighlights(['AI & ML Capstones', 'Real Data Projects', 'Placement Assistance']);
    setViewOptions({ groupBatch: true, personalizedMentor: true });
    setEligibility({
      eyebrow: 'Eligibility & Candidate Profile',
      title: 'Who Can Apply for this Course?',
      subtitle: 'Our fellowship is designed to bridge learners from diverse professional and academic backgrounds into high-tier technology roles.',
      points: [],
      certificationTitle: 'Globally Recognised Certification',
      certificationText: 'Earn a verified credential recognized by Fortune 500 employers across the United States, Europe, and Asia. Accelerate your career with measurable credentials.',
      certificationPoints: [],
      audiences: [],
    });
    setModules([
      { moduleNumber: 1, moduleTitle: 'Module 1: Foundations & Architecture', topics: 'Topic 1, Topic 2, Topic 3', hours: 32 },
    ]);
    setModalOpen(true);
  };

  const openEditModal = async (course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setSlug(course.slug);
    setCategory(course.category || 'Technology');
    setBadge(course.badge || '');
    setCardTheme(course.cardTheme || 'cyan');
    setDuration(course.duration || '6 Months');
    setBasePrice(course.pricing?.basePrice || 2499);
    setDiscountedPrice(course.pricing?.discountedPrice || 1899);
    setHighlights(Array.isArray(course.highlights) ? course.highlights : (course.highlights ? [course.highlights] : []));
    setViewOptions({
      groupBatch: course.viewOptions?.groupBatch !== false,
      personalizedMentor: course.viewOptions?.personalizedMentor !== false,
    });
    setEligibility({
      eyebrow: course.eligibility?.eyebrow || 'Eligibility & Candidate Profile',
      title: course.eligibility?.title || 'Who Can Apply for this Course?',
      subtitle: course.eligibility?.subtitle
        || 'Our fellowship is designed to bridge learners from diverse professional and academic backgrounds into high-tier technology roles.',
      points: course.eligibility?.points || [],
      certificationTitle: course.eligibility?.certificationTitle || 'Globally Recognised Certification',
      certificationText: course.eligibility?.certificationText
        || 'Earn a verified credential recognized by Fortune 500 employers across the United States, Europe, and Asia. Accelerate your career with measurable credentials.',
      certificationPoints: course.eligibility?.certificationPoints || [],
      audiences: course.eligibility?.audiences || [],
    });
    setModules(
      course.curriculum?.map((m) => ({
        moduleNumber: m.moduleNumber,
        moduleTitle: m.moduleTitle,
        topics: m.topics?.join(', ') || '',
        hours: m.hours || 30,
      })) || []
    );
    setModalOpen(true);

    // Modules live in their own collection — that is what the course page and
    // the student LMS render. The embedded copy on the course can be stale or
    // empty, so load the real curriculum and prefill the composer from it.
    try {
      const res = await api.get(`/curriculum/courses/${course._id}`);
      const live = res.data?.modules;
      if (Array.isArray(live)) {
        setModules(
          live.map((m, idx) => ({
            _id: m._id,
            moduleNumber: m.moduleNumber || idx + 1,
            moduleTitle: m.title || `Module ${idx + 1}`,
            topics: (m.lessons || []).map((l) => l.title).filter(Boolean).join(', '),
            // Kept so an untouched save round-trips the lessons exactly. Joining
            // them with commas and splitting again would break any lesson whose
            // own title contains a comma.
            lessonTitles: (m.lessons || []).map((l) => l.title).filter(Boolean),
            topicsDirty: false,
            hours: m.durationHours || 30,
          }))
        );
      }
    } catch (err) {
      console.error('Could not load the live curriculum — using the embedded copy:', err);
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      const res = await api.patch(`/courses/${course._id}/badge`, {
        isPublished: !course.isPublished,
      });
      if (res.data.success) {
        setCourses((prev) =>
          prev.map((c) => (c._id === course._id ? { ...c, isPublished: !course.isPublished } : c))
        );
      }
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const handleQuickBadgeChange = async (course, newBadge) => {
    try {
      const res = await api.patch(`/courses/${course._id}/badge`, {
        badge: newBadge,
      });
      if (res.data.success) {
        setCourses((prev) =>
          prev.map((c) => (c._id === course._id ? { ...c, badge: newBadge } : c))
        );
      }
    } catch (err) {
      console.error('Failed to change badge:', err);
    }
  };

  // ── Capstone helpers (shared site-wide showcase cards) ──
  const addCapstone = () => {
    setCapstoneProjects((prev) => [
      ...prev,
      { tag: 'Machine Learning', title: 'New Capstone Project', desc: 'Describe what students will build.', stack: ['Python'], color: 'from-indigo-500 to-blue-500' },
    ]);
  };

  const updateCapstone = (idx, field, value) => {
    setCapstoneProjects((prev) => {
      const updated = [...prev];
      if (field === 'stack') {
        updated[idx] = { ...updated[idx], stack: value.split(',').map((s) => s.trim()).filter(Boolean) };
      } else {
        updated[idx] = { ...updated[idx], [field]: value };
      }
      return updated;
    });
  };

  const removeCapstone = (idx) => {
    setCapstoneProjects((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();

    const formattedModules = modules.map((m, idx) => ({
      // The id lets the server update the existing module/lessons in place
      // instead of recreating them (which would drop lesson videos).
      _id: m._id,
      moduleNumber: idx + 1,
      moduleTitle: m.moduleTitle,
      // Untouched rows send the lesson titles verbatim; edited rows are split on
      // commas, which is the contract the composer's placeholder documents.
      topics: !m.topicsDirty && Array.isArray(m.lessonTitles)
        ? m.lessonTitles
        : (Array.isArray(m.topics) ? m.topics : String(m.topics || '').split(','))
            .map((t) => String(t).trim())
            .filter(Boolean),
      hours: Number(m.hours) || 30,
    }));

    const formattedHighlights = Array.isArray(highlights)
      ? highlights.filter(Boolean)
      : typeof highlights === 'string'
      ? highlights.split('\n').map((h) => h.trim()).filter(Boolean)
      : [];

    const payload = {
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category,
      badge,
      cardTheme,
      duration,
      pricing: {
        basePrice: Number(basePrice),
        discountedPrice: Number(discountedPrice),
      },
      highlights: formattedHighlights,
      curriculum: formattedModules,
      viewOptions,
      eligibility: {
        ...eligibility,
        points: eligibility.points.filter((p) => p && String(p).trim()),
        certificationPoints: eligibility.certificationPoints.filter((p) => p && String(p).trim()),
        audiences: eligibility.audiences.filter((a) => a && String(a).trim()),
      },
    };

    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse._id}`, payload);
      } else {
        await api.post('/courses', payload);
      }

      // Persist the capstone showcase cards from the same modal. Only the
      // capstone branch is sent (the endpoint merges), so a concurrent save from
      // SettingsCMS cannot be clobbered. The course is already saved at this
      // point, so any failure here must be surfaced instead of swallowed.
      let feedback = null;
      try {
        const settingsRes = await api.get('/settings');
        const currentCapstone = settingsRes.data?.settings?.capstone || {};
        const putRes = await api.put('/settings', {
          capstone: {
            ...currentCapstone,
            projects: capstoneProjects.map((proj, idx) => ({ ...proj, order: idx + 1, active: proj.active !== false })),
          },
        });
        if (putRes.data?.ignoredPaths?.length) {
          feedback = {
            type: 'error',
            message: `Capstone cards saved, but the server ignored these fields: ${putRes.data.ignoredPaths.join(', ')}`,
          };
        }
      } catch (capErr) {
        console.error('Capstone save failed:', capErr);
        feedback = {
          type: 'error',
          message: `The course was saved, but the capstone cards could NOT be saved: ${
            capErr.response?.data?.message || capErr.message
          }`,
        };
      }

      setSaveFeedback(
        feedback || {
          type: 'success',
          message: `Course saved. ${capstoneProjects.length} capstone card(s) published to the course pages.`,
        },
      );

      setModalOpen(false);
      fetchCourses();
      fetchCapstones();
    } catch (err) {
      console.error('Save course failed:', err);
      setSaveFeedback({
        type: 'error',
        message: `Save failed: ${err.response?.data?.message || err.message}`,
      });
    }
  };

  const addModuleField = () => {
    setModules((prev) => [
      ...prev,
      {
        moduleNumber: prev.length + 1,
        moduleTitle: `Module ${prev.length + 1}: Advanced Topics`,
        topics: 'Topic A, Topic B, Topic C',
        hours: 40,
      },
    ]);
  };

  const removeModuleField = (index) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 text-left">
      {/* Save feedback — admins must never be told "saved" for data the server dropped */}
      {saveFeedback && (
        <div
          className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border text-xs font-semibold ${
            saveFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          }`}
        >
          <span>{saveFeedback.message}</span>
          <button type="button" onClick={() => setSaveFeedback(null)} className="text-slate-400 hover:text-white shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
            Course & Curriculum CMS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Author courses, visually compose curriculum modules, and toggle badges on the live landing page.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Program</span>
        </button>
      </div>

      {/* Course Catalog Table */}
      <div className="rounded-2xl bg-[#0B1220]/80 backdrop-blur-xl border border-white/[0.08] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#070C17] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
            <tr>
              <th className="px-6 py-4 font-bold">Course Title & Category</th>
              <th className="px-6 py-4 font-bold">Theme & Badge</th>
              <th className="px-6 py-4 font-bold">Duration</th>
              <th className="px-6 py-4 font-bold">Tuition Fee</th>
              <th className="px-6 py-4 font-bold">Curriculum</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {loading && (
              [1, 2, 3, 4].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-800 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-800 rounded-lg" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-800/70 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-800/80 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-800/60 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-5 w-16 bg-slate-800/60 rounded-full" /></td>
                  <td className="px-6 py-4"><div className="h-6 w-6 bg-slate-800 rounded ml-auto" /></td>
                </tr>
              ))
            )}
            {courses.map((course) => (
              <tr key={course._id} className="hover:bg-slate-800/30 transition-colors">
                {/* Title */}
                <td className="px-6 py-4">
                  <div className="font-bold text-white text-sm">{course.title}</div>
                  <div className="text-[11px] text-slate-400">{course.category}</div>
                </td>

                {/* Badge Switcher */}
                <td className="px-6 py-4">
                  <select
                    value={course.badge || ''}
                    onChange={(e) => handleQuickBadgeChange(course, e.target.value)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-[11px] text-indigo-300 font-bold focus:outline-none"
                  >
                    <option value="">No Badge</option>
                    <option value="Most Popular">Most Popular</option>
                    <option value="High Demand">High Demand</option>
                    <option value="Filling Fast">Filling Fast</option>
                    <option value="New Launch">New Launch</option>
                  </select>
                </td>

                {/* Duration */}
                <td className="px-6 py-4 text-slate-300">
                  {course.duration || '6 Months'}
                </td>

                {/* Pricing */}
                <td className="px-6 py-4">
                  <span className="font-bold text-white">${course.pricing?.discountedPrice || 1899}</span>
                  <span className="text-slate-500 line-through ml-2 text-[10px]">
                    ${course.pricing?.basePrice || 2499}
                  </span>
                </td>

                {/* Curriculum summary */}
                <td className="px-6 py-4 text-slate-300">
                  <span className="font-semibold text-indigo-400">
                    {course.moduleCount ?? course.curriculum?.length ?? 0} Modules
                  </span>
                </td>

                {/* Publish Toggle */}
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleTogglePublish(course)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                      course.isPublished
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {course.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{course.isPublished ? 'Live on Site' : 'Draft'}</span>
                  </button>
                </td>

                {/* Edit Button */}
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openEditModal(course)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Edit Course & Curriculum"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Course & Curriculum Visual Composer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[92vh] rounded-3xl bg-[#0B1220] border border-white/[0.12] shadow-2xl flex flex-col overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="p-6 bg-[#070C17] border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingCourse ? `Edit Course: ${editingCourse.title}` : 'Create New Certification Track'}
                </h3>
                <p className="text-xs text-slate-400">
                  Update syllabus modules, topics, live pricing, and visual tokens.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveCourse} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">URL Slug</label>
                  <input
                    type="text"
                    placeholder="auto-generated-if-blank"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Theme & Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Card Theme Glow</label>
                  <select
                    value={cardTheme}
                    onChange={(e) => setCardTheme(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  >
                    <option value="cyan">Neon Cyan (Data Science)</option>
                    <option value="rose">Cyber Rose (Cyber Security)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Promotional Badge</label>
                  <select
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  >
                    <option value="">None</option>
                    <option value="Most Popular">Most Popular</option>
                    <option value="High Demand">High Demand</option>
                    <option value="Filling Fast">Filling Fast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Base Tuition ($)</label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Discounted Offer Price ($)</label>
                  <input
                    type="number"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              {/* Highlights */}
              <div className="pt-2 border-t border-white/[0.08]">
                <ListItemsEditor
                  label="Card Key Highlights & Learning Outcomes"
                  helperText="Add bullet points or click 'Paste Multiple Lines' to auto-split text into bullet points."
                  items={highlights}
                  onChange={setHighlights}
                  placeholder="Enter program highlight or outcome..."
                />
              </div>

              {/* Learning options + Who Can Apply (per course) */}
              <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Learning Options On This Course Page
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tick karo jo website par dikhana hai — dono, ya sirf ek. Unticked option course page par nahi aayega.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 border border-white/10 px-4 py-3 cursor-pointer">
                    <span className="text-xs">
                      <span className="block font-bold text-white">Group Batch</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">Full immersive journey card</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={viewOptions.groupBatch}
                      onChange={(e) => setViewOptions((v) => ({ ...v, groupBatch: e.target.checked }))}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 border border-white/10 px-4 py-3 cursor-pointer">
                    <span className="text-xs">
                      <span className="block font-bold text-white">Personalized Mentor</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">1-on-1 mentor track card</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={viewOptions.personalizedMentor}
                      onChange={(e) => setViewOptions((v) => ({ ...v, personalizedMentor: e.target.checked }))}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-0"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Section Eyebrow</label>
                    <input
                      type="text"
                      value={eligibility.eyebrow}
                      onChange={(e) => setEligibility((prev) => ({ ...prev, eyebrow: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Section Title</label>
                    <input
                      type="text"
                      value={eligibility.title}
                      onChange={(e) => setEligibility((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Section Subtitle</label>
                  <textarea
                    rows={2}
                    value={eligibility.subtitle}
                    onChange={(e) => setEligibility((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  />
                </div>

                <ListItemsEditor
                  label="Who Can Apply — Numbered Points"
                  helperText="Har course ke liye alag ho sakta hai. 'Paste Multiple Lines' se ek saath kaafi points daal sakte ho."
                  items={eligibility.points}
                  onChange={(items) => setEligibility((prev) => ({ ...prev, points: items }))}
                  placeholder="Individuals already working in IT, software development…"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Certification Card Title</label>
                    <input
                      type="text"
                      value={eligibility.certificationTitle}
                      onChange={(e) => setEligibility((prev) => ({ ...prev, certificationTitle: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Certification Card Text</label>
                    <textarea
                      rows={2}
                      value={eligibility.certificationText}
                      onChange={(e) => setEligibility((prev) => ({ ...prev, certificationText: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <ListItemsEditor
                  label="Certification Bullet Points"
                  helperText="Khali chhodne par default diploma/exam bullets dikhte hain."
                  items={eligibility.certificationPoints}
                  onChange={(items) => setEligibility((prev) => ({ ...prev, certificationPoints: items }))}
                  placeholder="Official American FutureTech US Fellowship Diploma"
                />

                <ListItemsEditor
                  label="Target Audiences (coloured chips)"
                  helperText="Jaise: Graduates, Working Professionals, Career Switchers, Fresh Learners."
                  items={eligibility.audiences}
                  onChange={(items) => setEligibility((prev) => ({ ...prev, audiences: items }))}
                  placeholder="Working Professionals"
                />
              </div>

              {/* Capstone Projects Editor (course page showcase cards) */}
              <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-teal-400" />
                      <span>Capstone Projects (Showcase Cards)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      These cards render in the Capstone Projects section on all course pages.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addCapstone}
                    className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-teal-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                {capstoneProjects.length === 0 && (
                  <div className="text-xs text-slate-500 text-center py-4 border border-dashed border-slate-700 rounded-xl">
                    No capstone cards yet — add one, or course defaults will show.
                  </div>
                )}

                <div className="space-y-3">
                  {capstoneProjects.map((proj, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-400 text-xs">Project {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeCapstone(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Category Tag (e.g. Computer Vision)"
                          value={proj.tag || ''}
                          onChange={(e) => updateCapstone(idx, 'tag', e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Project Title"
                          value={proj.title || ''}
                          onChange={(e) => updateCapstone(idx, 'title', e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                        />
                      </div>

                      <textarea
                        rows={2}
                        placeholder="What do students build?"
                        value={proj.desc || ''}
                        onChange={(e) => updateCapstone(idx, 'desc', e.target.value)}
                        className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-slate-300 text-xs resize-none"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Tech Stack (comma-separated)"
                          value={(proj.stack || []).join(', ')}
                          onChange={(e) => updateCapstone(idx, 'stack', e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Gradient (e.g. from-blue-500 to-indigo-500)"
                          value={proj.color || ''}
                          onChange={(e) => updateCapstone(idx, 'color', e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Curriculum Composer */}
              <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Curriculum Module Composer</span>
                  </h4>

                  <button
                    type="button"
                    onClick={addModuleField}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-indigo-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Module</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {modules.map((mod, index) => (
                    <div key={index} className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-indigo-400">Module {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeModuleField(index)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Module Title"
                            value={mod.moduleTitle}
                            onChange={(e) => {
                              const updated = [...modules];
                              updated[index].moduleTitle = e.target.value;
                              setModules(updated);
                            }}
                            className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                          />
                        </div>

                        <div>
                          <input
                            type="number"
                            placeholder="Hours"
                            value={mod.hours}
                            onChange={(e) => {
                              const updated = [...modules];
                              updated[index].hours = e.target.value;
                              setModules(updated);
                            }}
                            className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Topics (separated by commas)"
                          value={mod.topics}
                          onChange={(e) => {
                            const updated = [...modules];
                            updated[index] = {
                              ...updated[index],
                              topics: e.target.value,
                              topicsDirty: true,
                            };
                            setModules(updated);
                          }}
                          className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-slate-300 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 text-white font-bold flex items-center gap-2 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Course</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
