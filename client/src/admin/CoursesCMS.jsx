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
  Image as ImageIcon,
  Award,
} from 'lucide-react';
import api from '../lib/api';
import ListItemsEditor from './components/ListItemsEditor';
import ImageUploadInput from './components/ImageUploadInput';
import { getDetailedCourseData } from '../data/courseContentData';

/**
 * Badge gradients offered for the "What Can You Become?" role pills.
 * These strings are Tailwind utility classes (not free text) so the stored value
 * can never render an unstyled badge — the same palette the coded lists use.
 */
const CAREER_ROLE_COLORS = [
  { label: 'Emerald', value: 'from-blue-500 to-blue-500' },
  { label: 'Blue', value: 'from-blue-500 to-blue-500' },
  { label: 'Violet', value: 'from-blue-500 to-blue-500' },
  { label: 'Amber', value: 'from-red-500 to-yellow-500' },
  { label: 'Rose', value: 'from-red-500 to-red-500' },
  { label: 'Teal', value: 'from-blue-500 to-blue-500' },
  { label: 'Indigo', value: 'from-blue-500 to-blue-500' },
  { label: 'Orange', value: 'from-red-500 to-red-500' },
  { label: 'Fuchsia', value: 'from-blue-500 to-blue-500' },
  { label: 'Red', value: 'from-red-500 to-red-500' },
];

/**
 * Split the composer's bulk "topics" text into lesson titles.
 *
 * The separator is a FULL STOP (a comma appears inside far too many real
 * lesson titles — "Data Warehouse; Data Lake & Lakehouse, Conceptual; Logical" —
 * and comma-splitting was silently inventing extra lessons). A full stop only
 * splits when it ends a topic, so "NIST Cybersecurity Framework 2.0" survives.
 */
const splitTopics = (text) =>
  String(text || '')
    .split(/(?:\.\s+|\r?\n+|\.\s*$)/)
    .map((topic) => topic.trim())
    .filter(Boolean);

/** Keep the lesson list and its Free Preview ticks in step with edited text. */
const mergeLessons = (titles, previous = []) =>
  titles.map((title, index) => {
    const sameTitle = previous.find((lesson) => lesson.title === title);
    const fallback = previous[index];
    return {
      _id: sameTitle?._id || fallback?._id || '',
      title,
      isPreview: Boolean(sameTitle ? sameTitle.isPreview : fallback?.isPreview),
    };
  });

/**
 * The three certificate rows every course page can show. Row 3 starts empty —
 * as soon as the client gives it an artwork the course page grows a third
 * certificate card, which is exactly what was asked for.
 */
const emptyCertificateRows = () => [0, 1, 2].map(() => ({
  image: '',
  title: '',
  issuer: '',
  code: '',
  description: '',
  active: true,
}));

const CERTIFICATE_ROLE_LABELS = [
  '1st — US Fellowship diploma (shown beside the credential mark in the hero)',
  '2nd — Microsoft / partner credential',
  '3rd — extra certificate (this is the new card on every course page)',
];

export default function CoursesCMS() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  // Two-step delete: the trash icon arms the row, the second click deletes.
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    { moduleNumber: 1, moduleTitle: 'Module 1: Foundations', topics: 'Topic 1. Topic 2. Topic 3', lessons: [], hours: 30 },
  ]);

  // Capstone showcase cards — edited per course from this same modal and saved
  // on the course document (they used to be written to the site-wide settings,
  // which is why every course showed identical projects).
  const [capstoneProjects, setCapstoneProjects] = useState([]);
  // Per-course "Tools Covered" heading + icon grid.
  const [toolsTitle, setToolsTitle] = useState('');
  const [toolsSubtitle, setToolsSubtitle] = useState('');
  const [tools, setTools] = useState([]);
  // Optional image shown at the top of this course's card on /courses.
  const [cardImage, setCardImage] = useState('');
  // Rectangle image shown above the course title in the course hero.
  const [heroImage, setHeroImage] = useState('');
  // Artwork for the six "Why Get … Certification" advantage cards, index-aligned
  // with that list (card 1 = Doubt Clearing Sessions, card 2 = Industry Relevant
  // Projects, …). An empty slot keeps the coloured icon tile.
  const [advantageImages, setAdvantageImages] = useState([]);
  // Hero credential block: the partner mark shown in the course hero (Microsoft
  // logo, or the AI GRC certificate mark) with its wording, plus the certificate
  // artwork rendered beside it. Everything here is per course.
  const [credentialLogo, setCredentialLogo] = useState('');
  const [credentialTitle, setCredentialTitle] = useState('');
  const [credentialSubtitle, setCredentialSubtitle] = useState('');
  const [certificateImage, setCertificateImage] = useState('');
  // Optional second credential artwork (Microsoft + US Fellowship, GRC AIGP +
  // its own certificate). Blank keeps the single-certificate layout.
  const [certificateImage2, setCertificateImage2] = useState('');
  // The three certificate cards shown on the course page (Curriculum & Courses
  // CMS → "Certificates"). Row 1 & 2 refine the built-in US Fellowship and
  // Microsoft/partner cards, row 3 is the extra credential the client asked for;
  // they are also what the hero band renders.
  const [certificates, setCertificates] = useState(() => emptyCertificateRows());
  // "What Can You Become?" career-role pills + that block's heading/subtitle.
  const [careerRolesHeading, setCareerRolesHeading] = useState('');
  const [careerRolesSubtitle, setCareerRolesSubtitle] = useState('');
  const [careerRoles, setCareerRoles] = useState([]);
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

  useEffect(() => {
    fetchCourses();
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
    setCardImage('');
    setHeroImage('');
    setAdvantageImages([]);
    setCredentialLogo('');
    setCredentialTitle('');
    setCredentialSubtitle('');
    setCertificateImage('');
    setCertificateImage2('');
    setCertificates(emptyCertificateRows());
    setToolsTitle('');
    setToolsSubtitle('');
    setTools([]);
    setCapstoneProjects([]);
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
      { moduleNumber: 1, moduleTitle: 'Module 1: Foundations & Architecture', topics: 'Topic 1. Topic 2. Topic 3', lessons: [], hours: 32 },
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
    setCardImage(course.cardImage || course.thumbnail || '');
    setHeroImage(course.heroImage || '');
    setAdvantageImages(Array.isArray(course.advantageImages) ? course.advantageImages : []);
    setCredentialLogo(course.credentialLogo || '');
    setCredentialTitle(course.credentialTitle || '');
    setCredentialSubtitle(course.credentialSubtitle || '');
    setCertificateImage(course.certificateImage || '');
    setCertificateImage2(course.certificateImage2 || '');
    // Prefill the three rows from what the course already has, so an existing
    // course opens with its own artwork in the new section instead of looking
    // empty (and the client only has to fill the third slot).
    {
      // Rows are positional: a course whose ONLY filled row is the 3rd must open
      // with that artwork in row 3, not pulled up into row 1.
      const savedRows = Array.isArray(course.certificates) ? course.certificates : [];
      const bySlot = {};
      savedRows.forEach((cert, idx) => {
        const slot = Math.min(3, Math.max(1, Number(cert?.order) || idx + 1));
        bySlot[slot] = cert;
      });
      const legacy = [course.certificateImage || '', course.certificateImage2 || ''];
      setCertificates([1, 2, 3].map((slot) => ({
        image: String(bySlot[slot]?.image || '').trim() || legacy[slot - 1] || '',
        title: bySlot[slot]?.title || '',
        issuer: bySlot[slot]?.issuer || '',
        code: bySlot[slot]?.code || '',
        description: bySlot[slot]?.description || '',
        active: bySlot[slot]?.active !== false,
      })));
    }
    setCareerRolesHeading(course.careerRolesHeading || '');
    setCareerRolesSubtitle(course.careerRolesSubtitle || '');
    setCareerRoles(
      (Array.isArray(course.careerRoles) ? course.careerRoles : []).map((role, idx) => ({
        name: role?.name || '',
        color: role?.color || 'from-blue-500 to-blue-500',
        order: Number(role?.order) || idx + 1,
        active: role?.active !== false,
      })),
    );
    setToolsTitle(course.toolsTitle || '');
    setToolsSubtitle(course.toolsSubtitle || '');
    setTools(Array.isArray(course.tools) ? course.tools : []);
    setCapstoneProjects(
      (Array.isArray(course.capstoneProjects) ? course.capstoneProjects : []).map((proj) => ({
        ...proj,
        stack: Array.isArray(proj.stack) ? proj.stack : [],
      })),
    );
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
        topics: (m.topics || []).join('. '),
        lessons: (m.topics || []).map((title) => ({ _id: '', title, isPreview: false })),
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
          live.map((m, idx) => {
            const lessons = (m.lessons || [])
              .filter((l) => l.title)
              .map((l) => ({ _id: l._id, title: l.title, isPreview: Boolean(l.isPreview) }));
            return {
              _id: m._id,
              moduleNumber: m.moduleNumber || idx + 1,
              moduleTitle: m.title || `Module ${idx + 1}`,
              topics: lessons.map((l) => l.title).join('. '),
              // The lesson rows below the text field are what is actually saved
              // (id + title + Free Preview), so an untouched save round-trips
              // every lesson exactly — including the preview badge.
              lessons,
              topicsDirty: false,
              hours: m.durationHours || 30,
            };
          })
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

  /**
   * Delete a course for good (curriculum included). The server refuses when
   * students are enrolled, and that refusal is shown verbatim so the admin
   * knows to hide the course instead.
   */
  const handleDeleteCourse = async (course) => {
    try {
      setDeleting(true);
      const res = await api.delete(`/courses/${course._id}`);
      setCourses((prev) => prev.filter((c) => c._id !== course._id));
      setSaveFeedback({
        type: 'success',
        message: res.data?.message || `Deleted "${course.title}" and its curriculum.`,
      });
    } catch (err) {
      setSaveFeedback({
        type: 'error',
        message: err.response?.data?.message || `Could not delete "${course.title}": ${err.message}`,
      });
    } finally {
      setDeleting(false);
      setPendingDelete(null);
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
      { tag: 'Machine Learning', title: 'New Capstone Project', desc: 'Describe what students will build.', stack: ['Python'], color: 'from-blue-500 to-blue-500' },
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

    const formattedModules = modules.map((m, idx) => {
      // Lessons are the source of truth: each one carries its id (so the server
      // updates it in place instead of recreating it and dropping the video) and
      // its Free Preview tick.
      const lessons = (Array.isArray(m.lessons) ? m.lessons : [])
        .map((lesson) => ({
          _id: lesson._id || '',
          title: String(lesson.title || '').trim(),
          isPreview: Boolean(lesson.isPreview),
        }))
        .filter((lesson) => lesson.title);

      return {
        _id: m._id,
        moduleNumber: idx + 1,
        moduleTitle: m.moduleTitle,
        lessons,
        // The embedded mirror on the course document still reads `topics`.
        topics: lessons.map((lesson) => lesson.title),
        hours: Number(m.hours) || 30,
      };
    });

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
      // Card image + hero image + advantage-card artwork + per-course "Tools
      // Covered" block + capstone cards.
      thumbnail: cardImage,
      heroImage: String(heroImage || '').trim(),
      advantageImages: advantageImages.map((url) => String(url || '').trim()),
      credentialLogo: String(credentialLogo || '').trim(),
      credentialTitle: String(credentialTitle || '').trim(),
      credentialSubtitle: String(credentialSubtitle || '').trim(),
      certificateImage: String(certificateImage || '').trim(),
      certificateImage2: String(certificateImage2 || '').trim(),
      // Up to three showcase certificates. `order` is the SLOT (1–3), not a
      // position in the list: leaving row 1 blank must not pull row 3 up into
      // the first card. Rows carry no content at all are simply dropped.
      certificates: certificates
        .slice(0, 3)
        .map((cert, idx) => ({
          image: String(cert.image || '').trim(),
          title: String(cert.title || '').trim(),
          issuer: String(cert.issuer || '').trim(),
          code: String(cert.code || '').trim(),
          description: String(cert.description || '').trim(),
          order: idx + 1,
          active: cert.active !== false,
        }))
        .filter((cert) => cert.image || cert.title || cert.issuer || cert.code || cert.description),
      careerRolesHeading: String(careerRolesHeading || '').trim(),
      careerRolesSubtitle: String(careerRolesSubtitle || '').trim(),
      careerRoles: careerRoles
        .map((role, idx) => ({
          name: String(role.name || '').trim(),
          color: role.color || 'from-blue-500 to-blue-500',
          order: Number(role.order) || idx + 1,
          active: role.active !== false,
        }))
        .filter((role) => role.name),
      toolsTitle,
      toolsSubtitle,
      tools: tools
        .map((tool) => ({ name: String(tool.name || '').trim(), icon: String(tool.icon || '').trim() }))
        .filter((tool) => tool.name),
      capstoneProjects: capstoneProjects
        .map((proj, idx) => ({
          tag: proj.tag || 'Capstone',
          title: String(proj.title || '').trim(),
          desc: proj.desc || '',
          stack: Array.isArray(proj.stack) ? proj.stack : [],
          color: proj.color || 'from-blue-500 to-blue-500',
          order: idx + 1,
          active: proj.active !== false,
        }))
        .filter((proj) => proj.title),
      eligibility: {
        ...eligibility,
        points: eligibility.points.filter((p) => p && String(p).trim()),
        certificationPoints: eligibility.certificationPoints.filter((p) => p && String(p).trim()),
        audiences: eligibility.audiences.filter((a) => a && String(a).trim()),
      },
    };

    try {
      let summary = null;
      if (editingCourse) {
        const res = await api.put(`/courses/${editingCourse._id}`, payload);
        summary = res.data?.curriculumSummary;
      } else {
        const res = await api.post('/courses', payload);
        summary = res.data?.curriculumSummary;
      }

      setSaveFeedback({
        type: 'success',
        message: `Course saved. ${payload.tools.length} tool(s), ${payload.capstoneProjects.length} capstone card(s) and ${
          summary ? summary.lessons.created + summary.lessons.updated : formattedModules.length
        } lesson(s) are live on the course page.`,
      });

      setModalOpen(false);
      fetchCourses();
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
        topics: 'Topic A. Topic B. Topic C',
        lessons: [
          { _id: '', title: 'Topic A', isPreview: false },
          { _id: '', title: 'Topic B', isPreview: false },
          { _id: '', title: 'Topic C', isPreview: false },
        ],
        hours: 40,
      },
    ]);
  };

  const removeModuleField = (index) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Lesson rows inside a module (title + Free Preview tick) ──
  const updateModuleRow = (index, updater) => {
    setModules((prev) => {
      const updated = [...prev];
      updated[index] = updater(updated[index]);
      return updated;
    });
  };

  /** Bulk-paste box: text → lessons (Free Preview ticks are carried over). */
  const setModuleTopics = (index, text) => {
    updateModuleRow(index, (mod) => ({
      ...mod,
      topics: text,
      lessons: mergeLessons(splitTopics(text), mod.lessons || []),
      topicsDirty: true,
    }));
  };

  const setLessonTitle = (index, lessonIndex, value) => {
    updateModuleRow(index, (mod) => {
      const lessons = [...(mod.lessons || [])];
      lessons[lessonIndex] = { ...lessons[lessonIndex], title: value };
      return { ...mod, lessons, topics: lessons.map((l) => l.title).join('. '), topicsDirty: true };
    });
  };

  const toggleLessonPreview = (index, lessonIndex, checked) => {
    updateModuleRow(index, (mod) => {
      const lessons = [...(mod.lessons || [])];
      lessons[lessonIndex] = { ...lessons[lessonIndex], isPreview: checked };
      return { ...mod, lessons };
    });
  };

  const addLessonRow = (index) => {
    updateModuleRow(index, (mod) => ({
      ...mod,
      lessons: [...(mod.lessons || []), { _id: '', title: '', isPreview: false }],
    }));
  };

  const removeLessonRow = (index, lessonIndex) => {
    updateModuleRow(index, (mod) => {
      const lessons = (mod.lessons || []).filter((_, i) => i !== lessonIndex);
      return { ...mod, lessons, topics: lessons.map((l) => l.title).join('. '), topicsDirty: true };
    });
  };

  // ── Per-course "Tools Covered" grid ──
  const addTool = () => {
    setTools((prev) => [...prev, { name: 'New Tool', icon: '' }]);
  };

  const updateTool = (index, field, value) => {
    setTools((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeTool = (index) => {
    setTools((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Advantage card artwork ("Why Get …" cards) ──
  // Titles come from the same data the public page renders, so the labels here
  // always match the card they belong to.
  const advantageCardTitles = (getDetailedCourseData({ title, slug })?.whyChoose || [])
    .map((card) => card.title);

  const setAdvantageImage = (index, url) => {
    setAdvantageImages((prev) => {
      // Slots are positional, so keep the array dense up to the edited index.
      const next = [];
      const length = Math.max(prev.length, index + 1);
      for (let i = 0; i < length; i += 1) next[i] = prev[i] || '';
      next[index] = url;
      return next;
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Save feedback — admins must never be told "saved" for data the server dropped */}
      {saveFeedback && (
        <div
          className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border text-xs font-semibold ${
            saveFeedback.type === 'success'
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              : 'bg-red-500/10 border-red-500/30 text-red-200'
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
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Program</span>
        </button>
      </div>

      {/* Course Catalog Table */}
      <div className="rounded-2xl bg-[#002060]/80 backdrop-blur-xl border border-white/[0.08] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#001845] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
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
                    aria-label={`Badge for ${course.title}`}
                    value={course.badge || ''}
                    onChange={(e) => handleQuickBadgeChange(course, e.target.value)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-[11px] text-blue-300 font-bold focus:outline-none"
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
                  <span className="text-slate-400 line-through ml-2 text-[10px]">
                    ${course.pricing?.basePrice || 2499}
                  </span>
                </td>

                {/* Curriculum summary */}
                <td className="px-6 py-4 text-slate-300">
                  <span className="font-semibold text-blue-400">
                    {course.moduleCount ?? course.curriculum?.length ?? 0} Modules
                  </span>
                </td>

                {/* Publish / Hide Toggle — an inactive course disappears from the
                    public site but keeps every enrollment and its curriculum. */}
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleTogglePublish(course)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      course.isPublished
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                    title={
                      course.isPublished
                        ? 'Live on the public website — click to hide it (mark inactive)'
                        : 'Hidden from the public website — click to publish it again'
                    }
                  >
                    {course.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{course.isPublished ? 'Live on Site' : 'Hidden (Inactive)'}</span>
                  </button>
                </td>

                {/* Actions: edit + delete */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(course)}
                      className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Edit Course & Curriculum"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {pendingDelete === course._id ? (
                      <span className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          disabled={deleting}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-bold hover:bg-red-500/30 disabled:opacity-60 cursor-pointer"
                          title="Delete this course and its curriculum permanently"
                        >
                          {deleting ? 'Deleting…' : 'Confirm delete'}
                        </button>
                        <button
                          onClick={() => setPendingDelete(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-semibold hover:bg-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setPendingDelete(course._id)}
                        className="p-2 rounded-lg bg-slate-800 text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Delete course — or use the status button to hide it instead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Course & Curriculum Visual Composer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[92vh] rounded-3xl bg-[#002060] border border-white/[0.12] shadow-2xl flex flex-col overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="p-6 bg-[#001845] border-b border-white/[0.08] flex items-center justify-between">
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
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">URL Slug</label>
                  <input
                    type="text"
                    placeholder="auto-generated-if-blank"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-400"
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

              {/* Card image + per-course "Tools Covered" grid */}
              <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                <ImageUploadInput
                  label="Course Card Image (course cards: home page + /courses)"
                  value={cardImage}
                  onChange={setCardImage}
                  placeholder="https://… or upload a JPG / PNG / WebP from your computer"
                  previewSize="w-24 h-16"
                />

                <ImageUploadInput
                  label="Course Image — hero, shown above the course title"
                  value={heroImage}
                  onChange={setHeroImage}
                  placeholder="Rectangle image (about 1600×600) — URL or upload"
                  previewSize="w-32 h-14"
                />

                {/* Advantage card images — one slot per "Why Get …" card */}
                <div className="pt-2 border-t border-white/[0.08] space-y-3">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                      <span>Advantage Card Images</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      "Why Get this certification" cards ka artwork — jaise Doubt Clearing Sessions aur Industry Relevant Projects.
                      Slot khaali chhodne par wahi card apna coloured icon dikhata rahega.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {advantageCardTitles.map((cardTitle, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <span className="sm:col-span-4 text-[11px] text-slate-300 font-semibold truncate">
                          {idx + 1}. {cardTitle}
                        </span>
                        <div className="sm:col-span-8">
                          <ImageUploadInput
                            label=""
                            value={advantageImages[idx] || ''}
                            onChange={(url) => setAdvantageImage(idx, url)}
                            placeholder="Image URL or upload"
                            previewSize="w-16 h-11"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hero credential block — the partner mark + certificate shown
                    in the band under the hero's skill pills. */}
                <div className="pt-3 border-t border-white/[0.08] space-y-3">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-400" />
                      <span>Hero Credential Block</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Course hero me skills ke niche dikhne wala partner mark + certificate. Microsoft logo ya AI GRC
                      certificate mark yahan se set karo. Khaali chhodne par is course ka apna default credential dikhta rahega.
                    </p>
                  </div>

                  <ImageUploadInput
                    label="Credential Logo / Partner Mark"
                    value={credentialLogo}
                    onChange={setCredentialLogo}
                    placeholder="/images/microsoft-logo.svg — ya upload karo"
                    previewSize="w-24 h-12"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Credential Title</label>
                      <input
                        type="text"
                        value={credentialTitle}
                        onChange={(e) => setCredentialTitle(e.target.value)}
                        placeholder="Microsoft Certificate / AI GRC Certificate"
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Credential Subtitle</label>
                      <input
                        type="text"
                        value={credentialSubtitle}
                        onChange={(e) => setCredentialSubtitle(e.target.value)}
                        placeholder="DP-750 · Microsoft Certified: Azure Databricks Data Engineer Associate"
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                      />
                    </div>
                  </div>

                  <ImageUploadInput
                    label="Certificate Artwork (shown beside the credential mark)"
                    value={certificateImage}
                    onChange={setCertificateImage}
                    placeholder="GRC / Microsoft certificate image — URL ya upload"
                    previewSize="w-28 h-16"
                  />

                  {/* Second credential — the client hands out two certificates on
                      several tracks (Microsoft + US Fellowship diploma, and the
                      GRC's AIGP mark beside its own certificate). Khaali chhodo to
                      hero band pehle jaisa, ek hi certificate. */}
                  <ImageUploadInput
                    label="Second Certificate Artwork (optional, legacy)"
                    value={certificateImage2}
                    onChange={setCertificateImage2}
                    placeholder="Doosra certificate (e.g. GRC / Fellowship diploma) — URL ya upload"
                    previewSize="w-28 h-16"
                  />
                </div>

                {/* Certificate showcase — the three credentials this course page
                    shows. Exactly what the client asked for: course page par teen
                    certificate dikhne chahiye, aur teesra yahan se add hota hai. */}
                <div className="pt-3 border-t border-white/[0.08] space-y-3">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-400" />
                      <span>Certificates (3 per course)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Course page ke certificate showcase ke teen cards. Row 1 aur 2 built-in cards ko refine karte hain
                      (khaali chhodne par unka default title/description hi dikhta rahega), aur <strong className="text-slate-200">row 3
                      bharne par course page par teesra certificate card aa jaata hai</strong>. Yahuin se hero band ka artwork      aur
                      bhi set hota hai — teesri baar alag se image dene ki zarurat nahi.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {certificates.map((cert, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-slate-300 font-bold">
                            {CERTIFICATE_ROLE_LABELS[idx] || `Certificate ${idx + 1}`}
                          </span>
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono cursor-pointer whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={cert.active !== false}
                              onChange={(e) => setCertificates((prev) => prev.map((c, i) => (
                                i === idx ? { ...c, active: e.target.checked } : c
                              )))}
                              className="rounded bg-slate-900 border-white/20 text-blue-500"
                            />
                            Show
                          </label>
                        </div>

                        <ImageUploadInput
                          label="Certificate artwork"
                          value={cert.image}
                          onChange={(url) => setCertificates((prev) => prev.map((c, i) => (
                            i === idx ? { ...c, image: url } : c
                          )))}
                          placeholder="https://… ya upload — khaali chhodne par built-in artwork dikhta hai"
                          previewSize="w-24 h-16"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={cert.title}
                            onChange={(e) => setCertificates((prev) => prev.map((c, i) => (
                              i === idx ? { ...c, title: e.target.value } : c
                            )))}
                            placeholder="Certificate title"
                            aria-label={`Certificate ${idx + 1} title`}
                            className="p-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          />
                          <input
                            type="text"
                            value={cert.issuer}
                            onChange={(e) => setCertificates((prev) => prev.map((c, i) => (
                              i === idx ? { ...c, issuer: e.target.value } : c
                            )))}
                            placeholder="Issued by (Microsoft / American FutureTech)"
                            aria-label={`Certificate ${idx + 1} issuer`}
                            className="p-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          />
                          <input
                            type="text"
                            value={cert.code}
                            onChange={(e) => setCertificates((prev) => prev.map((c, i) => (
                              i === idx ? { ...c, code: e.target.value } : c
                            )))}
                            placeholder="Credential code (AI-102 / AFT-SPECIALIST)"
                            aria-label={`Certificate ${idx + 1} code`}
                            className="p-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          />
                        </div>

                        <textarea
                          value={cert.description}
                          onChange={(e) => setCertificates((prev) => prev.map((c, i) => (
                            i === idx ? { ...c, description: e.target.value } : c
                          )))}
                          rows={2}
                          placeholder="Short description shown under the card title"
                          aria-label={`Certificate ${idx + 1} description`}
                          className="w-full p-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* "What Can You Become?" career-role pills — editable per course
                    so the admin can change the wording and the badge colour of
                    each role without a code change. */}
                <div className="pt-3 border-t border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-400" />
                        <span>Career Roles ("What Can You Become?")</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Course page par target-role pills. List khaali chhodne par is program ki default roles dikhti rehti
                        hain — yahan add karte hi aapki list live ho jaati hai.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCareerRoles((prev) => [
                        ...prev,
                        { name: 'New Role', color: 'from-blue-500 to-blue-500', order: prev.length + 1, active: true },
                      ])}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-blue-500/30 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Role</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Block Heading</label>
                      <input
                        type="text"
                        value={careerRolesHeading}
                        onChange={(e) => setCareerRolesHeading(e.target.value)}
                        placeholder="Unlock Your Potential — What Can You Become?"
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Block Subtitle</label>
                      <input
                        type="text"
                        value={careerRolesSubtitle}
                        onChange={(e) => setCareerRolesSubtitle(e.target.value)}
                        placeholder="Khaali chhodo to course ka default line dikhega"
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                      />
                    </div>
                  </div>

                  {careerRoles.length === 0 ? (
                    <p className="text-[11px] text-slate-500 font-mono">
                      Abhi is course ki default roles dikh rahi hain. Add Role dabao to apni list bana sakte ho.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {careerRoles.map((role, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col sm:flex-row sm:items-center gap-2"
                        >
                          <input
                            type="text"
                            value={role.name}
                            onChange={(e) => setCareerRoles((prev) => prev.map((r, i) => (
                              i === idx ? { ...r, name: e.target.value } : r
                            )))}
                            placeholder="Role name"
                            aria-label={`Career role ${idx + 1} name`}
                            className="flex-1 p-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          />
                          <select
                            value={role.color}
                            onChange={(e) => setCareerRoles((prev) => prev.map((r, i) => (
                              i === idx ? { ...r, color: e.target.value } : r
                            )))}
                            aria-label={`Career role ${idx + 1} badge colour`}
                            className="p-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          >
                            {CAREER_ROLE_COLORS.map((color) => (
                              <option key={color.value} value={color.value}>{color.label}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono cursor-pointer whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={role.active !== false}
                              onChange={(e) => setCareerRoles((prev) => prev.map((r, i) => (
                                i === idx ? { ...r, active: e.target.checked } : r
                              )))}
                              className="rounded bg-slate-900 border-white/20 text-blue-500"
                            />
                            Show
                          </label>
                          <button
                            type="button"
                            onClick={() => setCareerRoles((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-slate-900 cursor-pointer shrink-0"
                            aria-label={`Remove career role ${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span>Tools Covered (this course only)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Har course ka apna tool stack — pehle sab courses me ek hi Data Science tool grid dikh rahi thi.
                      List khaali chhodne par default stack dikhta rahega.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTool}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-blue-500/30 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tool</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Tools Section Title</label>
                    <input
                      type="text"
                      value={toolsTitle}
                      onChange={(e) => setToolsTitle(e.target.value)}
                      placeholder={`${title || 'Course'} Program`}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Tools Section Subtitle</label>
                    <input
                      type="text"
                      value={toolsSubtitle}
                      onChange={(e) => setToolsSubtitle(e.target.value)}
                      placeholder="Master enterprise-grade frameworks…"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                {tools.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-700 rounded-xl">
                    No tools listed yet — the course keeps showing the default tool grid.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tools.map((tool, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Tool name (e.g. PyTorch)"
                          value={tool.name || ''}
                          onChange={(e) => updateTool(idx, 'name', e.target.value)}
                          className="sm:col-span-5 w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                        />
                        <div className="sm:col-span-6">
                          <ImageUploadInput
                            label=""
                            value={tool.icon || ''}
                            onChange={(value) => updateTool(idx, 'icon', value)}
                            placeholder="Icon URL (/images/tools/pytorch.svg) or upload"
                            previewSize="w-9 h-9"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTool(idx)}
                          className="sm:col-span-1 justify-self-end text-red-400 hover:text-red-300 p-2 cursor-pointer"
                          title="Remove this tool"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    <Layers className="w-4 h-4 text-blue-400" />
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
                      className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-0"
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
                      className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-0"
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
                      <Briefcase className="w-4 h-4 text-blue-400" />
                      <span>Capstone Projects (Showcase Cards)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Yeh cards sirf IS course ke Capstone Projects section me dikhte hain. Khaali chhodne par
                      site-wide list (Settings → Capstone) dikhti hai.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addCapstone}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-blue-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                {capstoneProjects.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-700 rounded-xl">
                    No capstone cards yet — add one, or course defaults will show.
                  </div>
                )}

                <div className="space-y-3">
                  {capstoneProjects.map((proj, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-400 text-xs">Project {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeCapstone(idx)}
                          className="text-red-400 hover:text-red-300 p-1"
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
                          placeholder="Gradient (e.g. from-blue-500 to-blue-500)"
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
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Curriculum Module Composer</span>
                  </h4>

                  <button
                    type="button"
                    onClick={addModuleField}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-blue-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Module</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {modules.map((mod, index) => (
                    <div key={index} className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-blue-400">Module {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeModuleField(index)}
                          className="text-red-400 hover:text-red-300 p-1"
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

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Topics — separate each lesson with a FULL STOP (e.g. Python Basics. Data Cleaning. Feature Engineering)"
                          value={mod.topics}
                          onChange={(e) => setModuleTopics(index, e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-slate-300 text-xs"
                        />
                        <p className="text-[10px] text-slate-500">
                          Full stop (.) = naya lesson. Comma ki zarurat nahi — pehle comma se lesson ban raha tha.
                        </p>

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <span className="text-[10px] font-mono uppercase text-slate-500">
                            Lessons ({(mod.lessons || []).length}) — tick “Free Preview” for the lesson students may watch before enrolling
                          </span>
                          <button
                            type="button"
                            onClick={() => addLessonRow(index)}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold hover:bg-blue-500/30 cursor-pointer shrink-0"
                          >
                            + Add lesson
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {(mod.lessons || []).map((lesson, lessonIndex) => (
                            <div key={lessonIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={lesson.title || ''}
                                onChange={(e) => setLessonTitle(index, lessonIndex, e.target.value)}
                                placeholder={`Lesson ${lessonIndex + 1}`}
                                className="flex-1 p-2 rounded-lg bg-slate-950 border border-white/10 text-slate-200 text-xs"
                              />
                              <label className="flex items-center gap-1.5 text-[10px] font-mono text-red-300 whitespace-nowrap cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(lesson.isPreview)}
                                  onChange={(e) => toggleLessonPreview(index, lessonIndex, e.target.checked)}
                                  className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-red-400 focus:ring-0"
                                />
                                Free Preview
                              </label>
                              <button
                                type="button"
                                onClick={() => removeLessonRow(index, lessonIndex)}
                                className="text-red-400 hover:text-red-300 p-1.5 cursor-pointer"
                                title="Remove this lesson"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
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
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 text-white font-bold flex items-center gap-2 shadow-lg"
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
