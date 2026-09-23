import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  FileText,
  HelpCircle,
  Award,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  CheckCircle2,
  Calendar,
  X,
  Sparkles,
  Building,
  DollarSign,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ContentCMS() {
  const [activeTab, setActiveTab] = useState('blogs'); // 'blogs' | 'faqs' | 'stories'
  const [blogs, setBlogs] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    category: 'AI & Data Science',
    excerpt: '',
    content: '',
    readTime: '5 min read',
    coverImage: '',
    isPublished: true,
  });

  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'Admissions & Fees',
    order: 1,
    isPublished: true,
  });

  const [storyForm, setStoryForm] = useState({
    name: '',
    role: '',
    company: '',
    salaryHike: '+140%',
    quote: '',
    image: '',
    courseTitle: 'AI & Machine Learning Masterclass',
  });

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      if (activeTab === 'blogs') {
        const res = await axios.get('/api/content/blogs');
        if (res.data.success) setBlogs(res.data.blogs || []);
      } else if (activeTab === 'faqs') {
        const res = await axios.get('/api/content/faqs?all=true');
        if (res.data.success) setFaqs(res.data.faqs || []);
      } else if (activeTab === 'stories') {
        const res = await axios.get('/api/content/success-stories');
        if (res.data.success) setStories(res.data.stories || []);
      }
    } catch (err) {
      console.error('Failed to load content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFaqPublished = async (faq) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      const updatedStatus = faq.isPublished === false ? true : false;
      const res = await axios.put(`/api/content/faqs/${faq._id}`, { isPublished: updatedStatus }, { headers });
      if (res.data.success) {
        setFaqs(faqs.map(f => f._id === faq._id ? res.data.faq : f));
      }
    } catch (err) {
      console.error('Failed to toggle FAQ published state:', err);
      alert('Failed to update FAQ publish status');
    }
  };

  const handleReorderFaq = async (faq, direction) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      const currentOrder = faq.order || 1;
      const newOrder = direction === 'up' ? Math.max(1, currentOrder - 1) : currentOrder + 1;
      const res = await axios.put(`/api/content/faqs/${faq._id}`, { order: newOrder }, { headers });
      if (res.data.success) {
        fetchContent();
      }
    } catch (err) {
      console.error('Failed to reorder FAQ:', err);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    if (activeTab === 'blogs') {
      setBlogForm({
        title: '',
        slug: '',
        category: 'AI & Data Science',
        excerpt: '',
        content: '',
        readTime: '5 min read',
        coverImage: '',
        isPublished: true,
      });
    } else if (activeTab === 'faqs') {
      setFaqForm({ question: '', answer: '', category: 'Admissions & Fees', order: faqs.length + 1, isPublished: true });
    } else if (activeTab === 'stories') {
      // Field names must match the SuccessStory model — the public success-stories
      // page renders studentName / testimonial / photo / course / salaryHikePercent.
      // Sending name/quote/image/courseTitle made "create" fail validation and
      // made "edit" silently drop those fields.
      setStoryForm({
        studentName: '',
        role: '',
        company: '',
        salaryHikePercent: 120,
        testimonial: '',
        photo: '',
        course: '',
        rating: 5,
        graduationYear: '2025',
        isFeatured: true,
      });
    }
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    if (activeTab === 'blogs') {
      setBlogForm({
        title: item.title || '',
        slug: item.slug || '',
        category: item.category || 'AI & Data Science',
        excerpt: item.excerpt || '',
        content: item.content || '',
        readTime: item.readTime || '5 min read',
        coverImage: item.coverImage || '',
        isPublished: item.isPublished !== false,
      });
    } else if (activeTab === 'faqs') {
      setFaqForm({
        question: item.question || '',
        answer: item.answer || '',
        category: item.category || 'Admissions & Fees',
        order: item.order || 1,
        isPublished: item.isPublished !== false,
      });
    } else if (activeTab === 'stories') {
      setStoryForm({
        studentName: item.studentName || '',
        role: item.role || '',
        company: item.company || '',
        salaryHikePercent: item.salaryHikePercent ?? 120,
        testimonial: item.testimonial || '',
        photo: item.photo || '',
        course: item.course || '',
        rating: item.rating ?? 5,
        graduationYear: item.graduationYear || '2025',
        isFeatured: item.isFeatured !== false,
      });
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content record?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      if (activeTab === 'blogs') {
        await axios.delete(`/api/content/blogs/${id}`, { headers });
        setBlogs(blogs.filter(b => b._id !== id));
      } else if (activeTab === 'faqs') {
        await axios.delete(`/api/content/faqs/${id}`, { headers });
        setFaqs(faqs.filter(f => f._id !== id));
      } else if (activeTab === 'stories') {
        await axios.delete(`/api/content/success-stories/${id}`, { headers });
        setStories(stories.filter(s => s._id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'blogs') {
        if (editingItem) {
          const res = await axios.put(`/api/content/blogs/${editingItem._id}`, blogForm, { headers });
          if (res.data.success) setBlogs(blogs.map(b => b._id === editingItem._id ? res.data.blog : b));
        } else {
          const res = await axios.post('/api/content/blogs', blogForm, { headers });
          if (res.data.success) setBlogs([res.data.blog, ...blogs]);
        }
      } else if (activeTab === 'faqs') {
        if (editingItem) {
          const res = await axios.put(`/api/content/faqs/${editingItem._id}`, faqForm, { headers });
          if (res.data.success) setFaqs(faqs.map(f => f._id === editingItem._id ? res.data.faq : f));
        } else {
          const res = await axios.post('/api/content/faqs', faqForm, { headers });
          if (res.data.success) setFaqs([...faqs, res.data.faq]);
        }
      } else if (activeTab === 'stories') {
        // An empty photo would overwrite the model's stock image with "" and
        // break the picture on the public page, so only send it when filled in.
        const storyPayload = { ...storyForm };
        if (!String(storyPayload.photo || '').trim()) delete storyPayload.photo;

        if (editingItem) {
          const res = await axios.put(`/api/content/success-stories/${editingItem._id}`, storyPayload, { headers });
          if (res.data.success) setStories(stories.map(s => s._id === editingItem._id ? res.data.story : s));
        } else {
          const res = await axios.post('/api/content/success-stories', storyPayload, { headers });
          if (res.data.success) setStories([res.data.story, ...stories]);
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error('Save error:', err);
      alert(err.response?.data?.message || 'Failed to save content');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono uppercase tracking-widest mb-2">
            <FileText className="w-3.5 h-3.5" />
            Brand Content & Publications
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">
            Content Management System
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Author and publish technical blog articles, curriculum FAQs, and verified alumni success stories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setActiveTab('blogs')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
                activeTab === 'blogs' ? 'bg-indigo-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Blog Posts ({blogs.length})
            </button>
            <button
              onClick={() => setActiveTab('faqs')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
                activeTab === 'faqs' ? 'bg-indigo-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Curriculum FAQs ({faqs.length})
            </button>
            <button
              onClick={() => setActiveTab('stories')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
                activeTab === 'stories' ? 'bg-indigo-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Alumni Reviews ({stories.length})
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Add {activeTab === 'blogs' ? 'Article' : activeTab === 'faqs' ? 'FAQ' : 'Alumni Review'}
          </button>
        </div>
      </div>

      {/* Blogs Tab */}
      {activeTab === 'blogs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            [1, 2, 3].map(n => (
              <div key={n} className="h-64 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
            ))
          ) : blogs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm">
              No blog articles found. Click &quot;Add Article&quot; to publish your first post.
            </div>
          ) : (
            blogs.map((b) => (
              <div
                key={b._id}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-indigo-400 mb-2">
                    <span>{b.category}</span>
                    <span className="text-slate-500">{b.readTime}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {b.title}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-3 mb-4">
                    {b.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-500 font-mono">
                    /{b.slug}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading FAQs...</div>
          ) : faqs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No FAQs found.</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {faqs.map((f) => (
                <div key={f._id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                        {f.category}
                      </span>
                      <div className="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs text-slate-400 font-mono">
                        <span>Order #{f.order || 1}</span>
                        <button
                          type="button"
                          onClick={() => handleReorderFaq(f, 'up')}
                          className="hover:text-indigo-400 p-0.5"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderFaq(f, 'down')}
                          className="hover:text-indigo-400 p-0.5"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* 1-Click Active / Published Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleFaqPublished(f)}
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          f.isPublished !== false
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                        }`}
                        title="Click to toggle publish state"
                      >
                        {f.isPublished !== false ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Live & Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Draft / Inactive</span>
                          </>
                        )}
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-white">{f.question}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.answer}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(f)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit FAQ"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(f._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stories Tab */}
      {activeTab === 'stories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            [1, 2, 3].map(n => (
              <div key={n} className="h-56 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
            ))
          ) : stories.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm">
              No alumni stories found. Click &quot;Add Alumni Review&quot; to publish testimonials.
            </div>
          ) : (
            stories.map((s) => (
              <div
                key={s._id}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-white text-base">{s.studentName}</div>
                    <div className="flex items-center gap-2">
                      {s.isFeatured === false && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          Not on site
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        +{s.salaryHikePercent ?? 0}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-indigo-400 font-mono mb-2">
                    {s.role} @ {s.company}
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed line-clamp-4">
                    &quot;{s.testimonial}&quot;
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-4">
                  <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    {s.course}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white font-heading">
                  {editingItem ? 'Edit ' : 'New '}
                  {activeTab === 'blogs' ? 'Technical Article' : activeTab === 'faqs' ? 'Curriculum FAQ' : 'Alumni Testimonial'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
                {activeTab === 'blogs' && (
                  <>
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Article Title</label>
                      <input
                        type="text"
                        required
                        value={blogForm.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                          setBlogForm({ ...blogForm, title, slug });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 uppercase mb-1">URL Slug</label>
                        <input
                          type="text"
                          required
                          value={blogForm.slug}
                          onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase mb-1">Category</label>
                        <select
                          value={blogForm.category}
                          onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                        >
                          <option value="AI & Data Science">AI & Data Science</option>
                          <option value="Cybersecurity">Cybersecurity</option>
                          <option value="Cloud Computing">Cloud Computing</option>
                          <option value="Software Engineering">Software Engineering</option>
                          <option value="Career & Industry">Career & Industry</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Short Excerpt (Summary)</label>
                      <textarea
                        rows={2}
                        required
                        value={blogForm.excerpt}
                        onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Full Article Content (Markdown / HTML)</label>
                      <textarea
                        rows={8}
                        required
                        value={blogForm.content}
                        onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'faqs' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 uppercase mb-1">Category</label>
                        <select
                          value={faqForm.category}
                          onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Admissions & Fees">Admissions & Fees</option>
                          <option value="Curriculum & Projects">Curriculum & Projects</option>
                          <option value="Career & Placement">Career & Placement</option>
                          <option value="Certifications">Certifications</option>
                          <option value="Career Programs">Career Programs</option>
                          <option value="Personalized Learning">Personalized Learning</option>
                          <option value="Capstone Engineering">Capstone Engineering</option>
                          <option value="Live Jobs">Live Jobs & Placement</option>
                          <option value="$99 Reservation">$99 Seat Reservation</option>
                          <option value="General">General Academic</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase mb-1">Display Order</label>
                        <input
                          type="number"
                          value={faqForm.order}
                          onChange={(e) => setFaqForm({ ...faqForm, order: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="faqIsPublished"
                        checked={faqForm.isPublished !== false}
                        onChange={(e) => setFaqForm({ ...faqForm, isPublished: e.target.checked })}
                        className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 w-4 h-4 bg-slate-950 cursor-pointer"
                      />
                      <label htmlFor="faqIsPublished" className="text-slate-300 font-medium cursor-pointer">
                        Published & Active on Live Website
                      </label>
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Question</label>
                      <input
                        type="text"
                        required
                        value={faqForm.question}
                        onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Answer</label>
                      <textarea
                        rows={4}
                        required
                        value={faqForm.answer}
                        onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'stories' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 uppercase mb-1">Alumni Name</label>
                        <input
                          type="text"
                          required
                          value={storyForm.studentName}
                          onChange={(e) => setStoryForm({ ...storyForm, studentName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase mb-1">Hired Role & Company</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Role (e.g. AI Engineer)"
                            value={storyForm.role}
                            onChange={(e) => setStoryForm({ ...storyForm, role: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Company (e.g. Google)"
                            value={storyForm.company}
                            onChange={(e) => setStoryForm({ ...storyForm, company: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 uppercase mb-1">Salary Hike %</label>
                        <input
                          type="number"
                          min="0"
                          value={storyForm.salaryHikePercent}
                          onChange={(e) => setStoryForm({ ...storyForm, salaryHikePercent: Number(e.target.value) || 0 })}
                          placeholder="140"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase mb-1">Course Completed</label>
                        <input
                          type="text"
                          value={storyForm.course}
                          onChange={(e) => setStoryForm({ ...storyForm, course: e.target.value })}
                          placeholder="Course Completed (e.g. Data Science with AI)"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Student Testimonial Quote</label>
                        <textarea
                          rows={4}
                          required                            value={storyForm.testimonial}
                          onChange={(e) => setStoryForm({ ...storyForm, testimonial: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 uppercase mb-1">Star Rating (1-5)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={storyForm.rating}
                          onChange={(e) => setStoryForm({ ...storyForm, rating: Math.min(5, Math.max(1, Number(e.target.value) || 5)) })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase mb-1">Graduation Year</label>
                        <input
                          type="text"
                          value={storyForm.graduationYear}
                          onChange={(e) => setStoryForm({ ...storyForm, graduationYear: e.target.value })}
                          placeholder="2025"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="storyIsFeatured"
                          checked={storyForm.isFeatured !== false}
                          onChange={(e) => setStoryForm({ ...storyForm, isFeatured: e.target.checked })}
                          className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 w-4 h-4 bg-slate-950 cursor-pointer"
                        />
                        <label htmlFor="storyIsFeatured" className="text-slate-200 font-medium cursor-pointer text-sm">
                          Show on the public Success Stories page
                        </label>
                      </div>
                      <p className="text-[11px] text-amber-300/80 mt-1.5 leading-relaxed">
                        Tick rakho — sirf ticked stories hi website par dikhti hain. Untick karke aap draft rakh sakte ho.
                      </p>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-500 text-slate-950 font-bold font-sans hover:bg-indigo-400 transition-colors"
                  >
                    {editingItem ? 'Update Content' : 'Publish Content'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
