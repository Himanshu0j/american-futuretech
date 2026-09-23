import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Briefcase,
  PlusCircle,
  Search,
  Building,
  MapPin,
  DollarSign,
  Users,
  FileText,
  ExternalLink,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Sparkles,
  Image as ImageIcon,
  Check,
  Building2,
  ChevronRight,
  Eye,
  GraduationCap,
  Plus,
  Minus,
  Link as LinkIcon
} from 'lucide-react';
import ListItemsEditor from './components/ListItemsEditor';
import ImageUploadInput from './components/ImageUploadInput';
import SafeImage from '../components/common/SafeImage';

const LOGO_PRESETS = [
  { name: 'AWS / Cloud', url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&auto=format&fit=crop&q=80' },
  { name: 'Cyber Defense', url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=120&auto=format&fit=crop&q=80' },
  { name: 'AI Labs', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80' },
  { name: 'Fintech Data', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=80' },
  { name: 'Enterprise Cloud', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120&auto=format&fit=crop&q=80' },
];

export default function JobsManager() {
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'applications'
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Job Modal State
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    companyLogo: '',
    department: '',
    location: '',
    type: 'Full-time',
    experienceLevel: '',
    salaryMin: '',
    salaryMax: '',
    salaryRange: '',
    recommendedCourse: '',
    recommendedCourseTitle: '',
    applyLink: '',
    description: '',
    careerGrowth: '',
    isFeatured: false,
    isActive: true,
    isPublished: true,
    responsibilities: [],
    preferredQualifications: [],
    keyRequirements: [],
    requiredCertificates: [],
    technicalSkills: [],
    softSkills: []
  });

  // Selected application preview
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchCourses();
    fetchData();
  }, [activeTab]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      if (res.data.success) {
        setCourses(res.data.courses || []);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'jobs') {
        const res = await axios.get('/api/jobs?includeAll=true');
        if (res.data.success) {
          setJobs(res.data.jobs || []);
        }
      } else {
        const res = await axios.get('/api/jobs/admin/applications', { headers });
        if (res.data.success) {
          setApplications(res.data.applications || []);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Repeatable bullet list helpers
  const handleAddListItem = (field) => {
    setJobForm(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const handleRemoveListItem = (field, index) => {
    setJobForm(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };

  const handleUpdateListItem = (field, index, value) => {
    setJobForm(prev => {
      const updated = [...(prev[field] || [])];
      updated[index] = value;
      return { ...prev, [field]: updated };
    });
  };

  const handleSalaryChange = (key, value) => {
    const numVal = value === '' ? '' : Number(value);
    const updated = { ...jobForm, [key]: numVal };
    // Build the display range ONLY from manual entries; never guess defaults
    if (updated.salaryMin !== '' && updated.salaryMax !== '') {
      updated.salaryRange = `$${Number(updated.salaryMin).toLocaleString()} - $${Number(updated.salaryMax).toLocaleString()} / year`;
    } else {
      updated.salaryRange = '';
    }
    setJobForm(updated);
  };

  const handleCourseSelect = (e) => {
    const courseId = e.target.value;
    if (!courseId) {
      setJobForm(prev => ({ ...prev, recommendedCourse: '', recommendedCourseTitle: '' }));
      return;
    }
    const matched = courses.find(c => c._id === courseId);
    setJobForm(prev => ({
      ...prev,
      recommendedCourse: courseId,
      recommendedCourseTitle: matched ? matched.title : ''
    }));
  };

  const handleOpenJobModal = (job = null) => {
    if (job) {
      setEditingJob(job);
      // Prefill ONLY what exists in the saved job — no invented placeholder data
      setJobForm({
        title: job.title || '',
        company: job.company || '',
        companyLogo: job.companyLogo || '',
        department: job.department || '',
        location: job.location || '',
        type: job.employmentType || job.type || 'Full-time',
        experienceLevel: job.experienceLevel || '',
        salaryMin: job.salaryMin !== undefined && job.salaryMin !== null ? job.salaryMin : '',
        salaryMax: job.salaryMax !== undefined && job.salaryMax !== null ? job.salaryMax : '',
        salaryRange: job.salaryRange || '',
        recommendedCourse: typeof job.recommendedCourse === 'object' ? job.recommendedCourse?._id : (job.recommendedCourse || ''),
        recommendedCourseTitle: job.recommendedCourseTitle || (typeof job.recommendedCourse === 'object' ? job.recommendedCourse?.title : '') || '',
        applyLink: job.applyLink || '',
        description: job.description || '',
        careerGrowth: job.careerGrowth || '',
        isFeatured: job.isFeatured || false,
        isActive: job.isActive !== undefined ? job.isActive : true,
        isPublished: job.isPublished !== undefined ? job.isPublished : (job.isActive !== undefined ? job.isActive : true),
        responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
        preferredQualifications: Array.isArray(job.preferredQualifications) ? job.preferredQualifications : [],
        keyRequirements: Array.isArray(job.keyRequirements) ? job.keyRequirements : [],
        requiredCertificates: Array.isArray(job.requiredCertificates) ? job.requiredCertificates : [],
        technicalSkills: Array.isArray(job.technicalSkills) ? job.technicalSkills : (Array.isArray(job.skills) ? job.skills : []),
        softSkills: Array.isArray(job.softSkills) ? job.softSkills : []
      });
    } else {
      setEditingJob(null);
      setJobForm({
        title: '',
        company: '',
        companyLogo: '',
        department: '',
        location: '',
        type: 'Full-time',
        experienceLevel: '',
        salaryMin: '',
        salaryMax: '',
        salaryRange: '',
        recommendedCourse: '',
        recommendedCourseTitle: '',
        applyLink: '',
        description: '',
        careerGrowth: '',
        isFeatured: false,
        isActive: true,
        isPublished: true,
        responsibilities: [],
        preferredQualifications: [],
        keyRequirements: [],
        requiredCertificates: [],
        technicalSkills: [],
        softSkills: []
      });
    }
    setShowJobModal(true);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    if (jobForm.salaryMin && jobForm.salaryMax && Number(jobForm.salaryMin) > Number(jobForm.salaryMax)) {
      alert('Validation Error: Minimum salary cannot exceed maximum salary.');
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Clean empty list items
      const cleanList = (arr) => (arr || []).map(s => String(s).trim()).filter(Boolean);

      const payload = {
        ...jobForm,
        employmentType: jobForm.type,
        // Persist empty as null so stale defaults never resurrect on the public board
        salaryMin: jobForm.salaryMin === '' ? null : Number(jobForm.salaryMin),
        salaryMax: jobForm.salaryMax === '' ? null : Number(jobForm.salaryMax),
        salaryRange: jobForm.salaryRange || '',
        responsibilities: cleanList(jobForm.responsibilities),
        preferredQualifications: cleanList(jobForm.preferredQualifications),
        keyRequirements: cleanList(jobForm.keyRequirements),
        requiredCertificates: cleanList(jobForm.requiredCertificates),
        technicalSkills: cleanList(jobForm.technicalSkills),
        softSkills: cleanList(jobForm.softSkills),
        skills: cleanList(jobForm.technicalSkills),
        recommendedCourse: jobForm.recommendedCourse || undefined
      };

      if (editingJob) {
        const res = await axios.put(`/api/jobs/${editingJob._id}`, payload, { headers });
        if (res.data.success) {
          setJobs(jobs.map(j => j._id === editingJob._id ? res.data.job : j));
        }
      } else {
        const res = await axios.post('/api/jobs', payload, { headers });
        if (res.data.success) {
          setJobs([res.data.job, ...jobs]);
        }
      }
      setShowJobModal(false);
    } catch (err) {
      console.error('Failed to save job:', err);
      alert(err.response?.data?.message || 'Error saving job');
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
      await axios.delete(`/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(jobs.filter(j => j._id !== id));
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  const handleTogglePublish = async (job) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
      const updatedStatus = !job.isActive;
      const res = await axios.put(`/api/jobs/${job._id}`, {
        isActive: updatedStatus,
        isPublished: updatedStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setJobs(jobs.map(j => j._id === job._id ? { ...j, isActive: updatedStatus, isPublished: updatedStatus } : j));
      }
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
      await axios.patch(
        `/api/jobs/applications/${appId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplications(applications.map(a => a._id === appId ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono uppercase tracking-widest mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            Corporate Placement Network CMS
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">
            Live Jobs & Career Board Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure partner job openings, recommended tracks, repeatable bullet requirements, direct application links, and review student talent pool applications.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'jobs' ? 'bg-indigo-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Job Openings ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'applications' ? 'bg-indigo-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Applicant Resumes ({applications.length})
            </button>
          </div>

          {activeTab === 'jobs' && (
            <button
              onClick={() => handleOpenJobModal()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Post New Partner Job
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Job Postings */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-56 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
              No job postings found. Click &quot;Post New Partner Job&quot; to publish positions.
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-mono text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-5">Role & Company</th>
                      <th className="py-3.5 px-5">Recommended Course</th>
                      <th className="py-3.5 px-5">Compensation</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Applicants</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {jobs.map((job) => (
                      <tr key={job._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <SafeImage
                              src={job.companyLogo}
                              alt={job.company}
                              fallbackText={job.company || 'CP'}
                              className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 p-1 shrink-0 overflow-hidden"
                              imageClassName="w-full h-full object-contain rounded-lg"
                              fallbackClassName="w-full h-full rounded-lg bg-slate-900 text-slate-400 text-xs font-bold flex items-center justify-center"
                            />
                            <div>
                              <div className="font-bold text-white text-sm">{job.title}</div>
                              <div className="text-slate-400 text-xs flex items-center gap-2">
                                <span>{job.company}</span>
                                <span>•</span>
                                <span className="text-indigo-400">{job.department}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          {job.recommendedCourseTitle || job.recommendedCourse?.title ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span className="max-w-[180px] truncate">{job.recommendedCourseTitle || job.recommendedCourse?.title}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">General / None</span>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          <div className="font-mono text-emerald-400 font-bold">
                            {job.salaryMin && job.salaryMax ? `$${Number(job.salaryMin).toLocaleString()} - $${Number(job.salaryMax).toLocaleString()}` : job.salaryRange || 'N/A'}
                          </div>
                          <div className="text-slate-500 text-[11px]">{job.location || 'Remote'}</div>
                        </td>

                        <td className="py-4 px-5">
                          <button
                            onClick={() => handleTogglePublish(job)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
                              job.isActive !== false
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {job.isActive !== false ? '● Live' : '○ Draft'}
                          </button>
                        </td>

                        <td className="py-4 px-5">
                          <span className="font-mono text-indigo-400 font-bold bg-indigo-950/60 px-2 py-1 rounded-md border border-indigo-800/40">
                            {job.applicantCount || 0}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/jobs/${job._id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Public Details Page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleOpenJobModal(job)}
                              className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors cursor-pointer"
                              title="Edit Job"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job._id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                              title="Delete Job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-mono">Loading candidate resumes...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
              No applications submitted yet. Candidate submissions from the Live Jobs board appear here.
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-mono text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-5">Candidate Name</th>
                      <th className="py-3.5 px-5">Applied For</th>
                      <th className="py-3.5 px-5">Contact</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {applications.map((app) => (
                      <tr key={app._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-white text-sm">{app.applicantName}</div>
                          <div className="text-slate-500 text-[11px] font-mono">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-bold text-indigo-400">{app.jobTitle || 'Talent Pool Concierge'}</div>
                          <div className="text-slate-400 text-xs">{app.company || 'Direct Matching'}</div>
                        </td>
                        <td className="py-4 px-5 font-mono text-slate-400">
                          <div>{app.email}</div>
                          <div>{app.phone}</div>
                        </td>
                        <td className="py-4 px-5">
                          <select
                            value={app.status || 'Submitted'}
                            onChange={(e) => handleStatusChange(app._id, e.target.value)}
                            className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="Reviewing">Reviewing</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Hired">Hired</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Review Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Job Modal */}
      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 overflow-hidden max-h-[92vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white font-heading">
                    {editingJob ? 'Edit Partner Career Listing' : 'Publish New Partner Career Opportunity'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    All updates reflect immediately on the live /jobs and /careers hiring board.
                  </p>
                </div>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveJob} className="space-y-4 text-xs font-mono">
                {/* Basic Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Job Title *</label>
                    <input
                      type="text"
                      required
                      value={jobForm.title}
                      onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                      placeholder="e.g. Cloud DevOps Associate"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Company / Partner Name *</label>
                    <input
                      type="text"
                      required
                      value={jobForm.company}
                      onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                      placeholder="e.g. HyperScale Cloud Partners"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Company Logo Section */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
                {/* Company Logo with Live Upload & Preview */}
                <ImageUploadInput
                  label="Company Logo / Brand Asset"
                  value={jobForm.companyLogo}
                  onChange={(url) => setJobForm({ ...jobForm, companyLogo: url })}
                  placeholder="Upload PNG/SVG or choose preset..."
                />
                </div>

                {/* Recommended Course Selector */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-slate-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    Recommended Course Track (Optional)
                  </label>
                  <select
                    value={jobForm.recommendedCourse}
                    onChange={handleCourseSelect}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- None / General Placement --</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} ({c.level || 'All Levels'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Direct External Application Link */}
                <div>
                  <label className="block text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                    Apply URL (Direct external link or leave blank for internal portal modal)
                  </label>
                  <input
                    type="url"
                    value={jobForm.applyLink}
                    onChange={(e) => setJobForm({ ...jobForm, applyLink: e.target.value })}
                    placeholder="https://company.greenhouse.io/jobs/123456 or leave blank"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Department, Type, Experience */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Department</label>
                    <select
                      value={jobForm.department}
                      onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Select Department --</option>
                      <option value="AI Research & Deployment">AI Research &amp; Deployment</option>
                      <option value="Security Operations">Security Operations</option>
                      <option value="Infrastructure & SRE">Infrastructure &amp; SRE</option>
                      <option value="Engineering & Technology">Engineering &amp; Technology</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Job Type</label>
                    <select
                      value={jobForm.type}
                      onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Experience Level</label>
                    <input
                      type="text"
                      value={jobForm.experienceLevel}
                      onChange={(e) => setJobForm({ ...jobForm, experienceLevel: e.target.value })}
                      placeholder="e.g. Entry to Mid Level"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Location & Salary Range — both fully manual, no preset values */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Location (manual text)</label>
                    <input
                      type="text"
                      value={jobForm.location}
                      onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                      placeholder="e.g. Remote, Dallas TX, On-site..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Min Salary ($/yr) — manual</label>
                    <input
                      type="number"
                      value={jobForm.salaryMin}
                      onChange={(e) => handleSalaryChange('salaryMin', e.target.value)}
                      placeholder="e.g. 95000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Max Salary ($/yr) — manual</label>
                    <input
                      type="number"
                      value={jobForm.salaryMax}
                      onChange={(e) => handleSalaryChange('salaryMax', e.target.value)}
                      placeholder="e.g. 135000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1">Overview Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    placeholder="Brief summary of the role for candidate cards and job header..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1">Career Growth Opportunities</label>
                  <textarea
                    rows={2}
                    value={jobForm.careerGrowth}
                    onChange={(e) => setJobForm({ ...jobForm, careerGrowth: e.target.value })}
                    placeholder="Describe mentorship, promotion timelines, and leadership pathways..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Repeatable List Sections with Multi-Line Paste Splitter */}
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <div className="text-slate-300 font-bold uppercase text-[11px] flex items-center justify-between">
                    <span>Structured Role Qualifications & Bullets</span>
                    <span className="text-indigo-400 font-mono text-[10px]">Multi-Line Paste Split Enabled</span>
                  </div>

                  {/* Responsibilities */}
                  <ListItemsEditor
                    label="Key Responsibilities"
                    helperText="Add pointers or click 'Paste Multiple Lines' to auto-split text into bullet points."
                    items={jobForm.responsibilities || []}
                    onChange={(items) => setJobForm(prev => ({ ...prev, responsibilities: items }))}
                    placeholder="Enter responsibility..."
                  />

                  {/* Preferred Qualifications */}
                  <ListItemsEditor
                    label="Preferred Qualifications"
                    helperText="Paste multi-line qualifications to instantly parse into discrete pointers."
                    items={jobForm.preferredQualifications || []}
                    onChange={(items) => setJobForm(prev => ({ ...prev, preferredQualifications: items }))}
                    placeholder="Enter qualification..."
                  />

                  {/* Key Requirements */}
                  <ListItemsEditor
                    label="Key Requirements"
                    helperText="Specify core eligibility and academic/experience requirements."
                    items={jobForm.keyRequirements || []}
                    onChange={(items) => setJobForm(prev => ({ ...prev, keyRequirements: items }))}
                    placeholder="Enter key requirement..."
                  />

                  {/* Required Certificates */}
                  <ListItemsEditor
                    label="Required Certificates & Credentials"
                    helperText="e.g. AWS Certified Solutions Architect, CompTIA Security+, etc."
                    items={jobForm.requiredCertificates || []}
                    onChange={(items) => setJobForm(prev => ({ ...prev, requiredCertificates: items }))}
                    placeholder="e.g. AWS Certified Solutions Architect..."
                  />

                  {/* Technical Skills */}
                  <ListItemsEditor
                    label="Technical Skills (Keywords / Chips)"
                    helperText="Enter technology keywords or paste comma/newline separated skill tags."
                    items={jobForm.technicalSkills || []}
                    onChange={(items) => setJobForm(prev => ({ ...prev, technicalSkills: items }))}
                    placeholder="e.g. Docker, Python, AWS, Kubernetes..."
                  />

                  {/* Soft Skills */}
                  <ListItemsEditor
                    label="Soft Skills & Core Competencies"
                    helperText="e.g. Incident Response Leadership, Cross-functional Collaboration."
                    items={jobForm.softSkills || []}
                    onChange={(items) => setJobForm(prev => ({ ...prev, softSkills: items }))}
                    placeholder="e.g. System Design, Communication..."
                  />
                </div>

                {/* Published / Active Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="publish-toggle"
                      checked={jobForm.isActive}
                      onChange={(e) => setJobForm({ ...jobForm, isActive: e.target.checked, isPublished: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <label htmlFor="publish-toggle" className="text-xs text-slate-300 cursor-pointer select-none">
                      Publish immediately to public Live Jobs portal (/jobs & /careers)
                    </label>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowJobModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-sans cursor-pointer hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold font-sans hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
                  >
                    {editingJob ? 'Save & Update Position' : 'Publish Job Listing'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Application Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4 font-sans text-xs text-slate-300"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Application Dossier</h3>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Candidate:</span>
                  <span className="font-bold text-white">{selectedApp.applicantName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Position:</span>
                  <span className="font-bold text-indigo-400">{selectedApp.jobTitle || 'Talent Pool Concierge'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono text-white">{selectedApp.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-mono text-white">{selectedApp.phone}</span>
                </div>
                {selectedApp.linkedinUrl && (
                  <div className="flex justify-between border-b border-slate-800/60 pb-2">
                    <span className="text-slate-400">LinkedIn:</span>
                    <a href={selectedApp.linkedinUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      View Profile
                    </a>
                  </div>
                )}
                {selectedApp.resumeUrl && (
                  <div className="flex justify-between border-b border-slate-800/60 pb-2">
                    <span className="text-slate-400">Resume / Dossier:</span>
                    <a href={selectedApp.resumeUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      View Document
                    </a>
                  </div>
                )}
                {selectedApp.coverNote && (
                  <div className="pt-1">
                    <div className="text-slate-400 mb-1">Candidate Statement:</div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedApp.coverNote}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
