import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Settings,
  Shield,
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Users,
  RefreshCw,
  Sparkles,
  DollarSign,
  Layers,
  Cpu,
  Target,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Zap,
  Globe,
  Award,
  ChevronRight,
  Compass,
  Eye,
  Handshake,
  GraduationCap,
  CreditCard
} from 'lucide-react';
import { DEFAULT_LEADERSHIP, DEFAULT_SISTER_COMPANY, DEFAULT_PEDAGOGY } from '../data/siteContent';
import RepeatableListInput from './components/RepeatableListInput';
import ImageUploadInput from './components/ImageUploadInput';
import PaymentGatewayPanel from './PaymentGatewayPanel';

export default function SettingsCMS() {
  const [activeTab, setActiveTab] = useState('general');
  // Tabs: 'general' | 'hero' | 'personalized' | 'capstone' | 'roadmap' | 'about' | 'globalCtas' | 'audit'

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Full Settings State
  const [settings, setSettings] = useState({
    siteName: 'American FutureTech',
    legalName: 'American FutureTech LLC',
    tagline: 'Empowering Next-Gen Tech Leaders with AI, Cyber Security & Cloud',
    contactPhone: '+1 (816) 846-6717',
    contactEmail: 'info@americantechgloballlc.com',
    headquartersAddress: '30 N Gould St Ste R, Sheridan, WY 82801, United States',
    socialLinks: { linkedin: '', youtube: '', instagram: '', twitter: '' },
    isMaintenanceMode: false,
    announcementBanner: {
      enabled: true,
      text: '🚀 Spring Cohort 2026 Admissions Open — $99 Seat Reservation Now Available!',
      linkUrl: '/courses',
    },
    admissionNotice: 'Next Cohort Starts March 2026. Limited to 25 seats per track.',
    hero: {
      eyebrowBadgeText: 'AMERICAN FUTURETECH · US ACCREDITED TECHNOLOGY FELLOWSHIPS',
      headline: 'BUILD SKILLS.\nGET CERTIFIED.\nSHAPE YOUR FUTURE.',
      subheadline: 'Rigorous, mentor-guided technology fellowships engineered for serious learners. Master production-grade AI systems, offensive cyber operations, and cloud architectures through live faculty labs, verifiable US credentials, and direct corporate career placement.',
      primaryCtaText: 'Explore Career Programs',
      primaryCtaLink: '/courses',
      secondaryCtaText: 'Explore Live Jobs',
      secondaryCtaLink: '/jobs',
      statsBadgeText: '1,200+ Fellows Placed'
    },
    trustedCompanies: {
      heading: 'TRUSTED BY LEARNERS FROM LEADING GLOBAL COMPANIES',
      subheading: 'Our alumni engineer mission-critical systems across Fortune 500 technology leaders',
      companies: [
        { name: 'Google', logoUrl: '/images/companies/google.svg', order: 1, active: true },
        { name: 'Microsoft', logoUrl: '/images/companies/microsoft.svg', order: 2, active: true },
        { name: 'Amazon Web Services', logoUrl: '/images/companies/aws.svg', order: 3, active: true },
        { name: 'IBM', logoUrl: '/images/companies/ibm.svg', order: 4, active: true },
        { name: 'Infosys', logoUrl: '/images/companies/infosys.svg', order: 5, active: true },
        { name: 'Accenture', logoUrl: '/images/companies/accenture.svg', order: 6, active: true },
        { name: 'Intel', logoUrl: '/images/companies/intel.svg', order: 7, active: true },
        { name: 'Meta', logoUrl: '/images/companies/meta.svg', order: 8, active: true }
      ]
    },
    personalizedLearning: {
      enabled: true,
      badgeText: '1-ON-1 VIP MENTORSHIP & EXTENDED CAREER TRACK',
      headline: 'Personalized Learning Track',
      subheadline: 'Accelerate your transition into high-growth tech roles with bespoke curriculum pacing, dedicated principal engineer mentorship, and personalized portfolio development.',
      duration: '6 Months (Extended Track)',
      price: 5499,
      originalPrice: 6999,
      depositPrice: 99,
      features: [
        'Everything in the group programs (all live cohorts + recordings)',
        'Weekly private 1-on-1 mentorship with a senior industry practitioner',
        'Personalized interview preparation, system design and mock interviews',
        'Salary negotiation coaching and dedicated career support',
        'Dedicated 1-on-1 weekly sessions with Principal FAANG / Fortune 500 Engineers',
        'Custom tailored curriculum matching your background, schedule, and target role',
        'Private GitHub repository code reviews, architectural defenses, and CI/CD setup',
        'Production-grade Capstone deployed live on AWS cloud infrastructure',
        'Algorithmic ATS resume overhaul and unlimited high-pressure mock interviews',
        'Direct executive referrals to 100+ vetted enterprise hiring partners across the US'
      ],
      tools: ['Python', 'Docker', 'AWS', 'Kubernetes', 'PyTorch', 'PostgreSQL'],
      ctaText: 'Reserve Your Seat — $99 Deposit',
      ctaLink: '/checkout?plan=personalized&tier=deposit'
    },
    capstone: {
      title: 'Capstone Engineering & Real-World Stacks',
      subtitle: 'Every fellow builds and deploys scalable production software using enterprise tools mandated by Fortune 500 engineering teams.',
      outcomes: [
        'Deploy production-ready code with CI/CD automation',
        'Architect secure microservices and distributed databases',
        'Defend system design decisions in live architectural reviews',
        'Publish verified portfolio repositories with public live demo URLs'
      ],
      tools: []
    },
    roadmap: {
      title: 'Structured 6-Phase Career Placement Architecture',
      subtitle: 'From foundational engineering to corporate technical interview defense, our roadmap leaves zero room for chance.',
      steps: []
    },
    leadership: DEFAULT_LEADERSHIP,
    sisterCompany: DEFAULT_SISTER_COMPANY,
    pedagogy: DEFAULT_PEDAGOGY,
    aboutCMS: {
      headline: 'Bridging the Divide Between Academia and Global Industry',
      bodyParagraphs: [
        'American FutureTech is a globally recognized professional education and workforce development institute offering industry-aligned certification programs designed to bridge the gap between academic learning and industry demands.',
        'We partner with leading corporate enterprises, subject-matter experts, and top educators to deliver practical, career-defining learning experiences in high-growth domains including Data Science, Cybersecurity, Cloud & DevOps, Artificial Intelligence, and Product Management.',
        'Our mission is to democratize high-quality, outcome-oriented tech education and empower individuals worldwide with verified job-ready skills, recognized certifications, and comprehensive placement support.'
      ],
      missionTitle: 'Our Institutional Mission',
      missionText: 'To empower 100,000+ students, professionals, and career changers worldwide with hands-on technical skills, industry-recognized certifications, and direct pathways to high-paying tech careers by delivering affordable, practical, and mentor-guided education.',
      missionTarget: 'Target: 100,000+ Certified Tech Leaders',
      visionTitle: 'Our Global Vision',
      visionText: "To be the world's most trusted workforce transformation institute, bridging the gap between talent and technology, creating equal opportunities for global learners, and driving the future of work.",
      visionTagline: 'Global Workforce Transformation Standard'
    },
    globalCtas: {
      reserveSeatText: 'Reserve Your Seat — $99',
      reserveSeatPrice: 99,
      reserveSeatUrl: '/checkout?tier=deposit',
      urgencyBannerText: 'Spring 2026 Admissions Open · Capped at 25 Fellows Per Cohort'
    },
    courses: {
      badgeText: '6-Month Career Training Programs · Dual US & Microsoft Credentials',
      headline: 'Fellowship Specializations',
      subheadline: 'Curriculums engineered with Silicon Valley engineering leads. Deploy production code, defend capstone architectures, and gain lifetime alumni placement support. Reserve any track for $99.',
    }
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const formRootRef = useRef(null);

  // Accessible names for this panel's fields come from the shared admin hook in
  // AdminLayout (useAutoFieldLabels), which also covers modals and later tabs.

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'audit') {
        const res = await axios.get('/api/settings/audit-logs', { headers });
        if (res.data.success) {
          setAuditLogs(res.data.logs || []);
        }
      } else {
        const res = await axios.get('/api/settings');
        if (res.data.success && res.data.settings) {
          setSettings(prev => ({
            ...prev,
            ...res.data.settings,
            hero: { ...prev.hero, ...(res.data.settings.hero || {}) },
            personalizedLearning: {
              ...prev.personalizedLearning,
              ...(res.data.settings.personalizedLearning || {}),
              features: res.data.settings.personalizedLearning?.features || prev.personalizedLearning.features,
              tools: res.data.settings.personalizedLearning?.tools || prev.personalizedLearning.tools
            },
            capstone: {
              ...prev.capstone,
              ...(res.data.settings.capstone || {}),
              outcomes: res.data.settings.capstone?.outcomes || prev.capstone.outcomes,
              tools: res.data.settings.capstone?.tools || prev.capstone.tools,
              projects: res.data.settings.capstone?.projects || prev.capstone.projects || []
            },
            roadmap: {
              ...prev.roadmap,
              ...(res.data.settings.roadmap || {}),
              steps: res.data.settings.roadmap?.steps || prev.roadmap.steps
            },
            leadership: res.data.settings.leadership?.length ? res.data.settings.leadership : prev.leadership,
            sisterCompany: { ...prev.sisterCompany, ...(res.data.settings.sisterCompany || {}) },
            pedagogy: { ...prev.pedagogy, ...(res.data.settings.pedagogy || {}) },
            aboutCMS: {
              ...prev.aboutCMS,
              ...(res.data.settings.aboutCMS || {}),
              bodyParagraphs: res.data.settings.aboutCMS?.bodyParagraphs || prev.aboutCMS.bodyParagraphs
            },
            globalCtas: {
              ...prev.globalCtas,
              ...(res.data.settings.globalCtas || {})
            },
            courses: {
              ...prev.courses,
              ...(res.data.settings.courses || {})
            }
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setFeedback({ type: '', message: '' });
    try {
      setSaving(true);
      const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
      const res = await axios.put('/api/settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        // The API reports fields the schema could not store, so a "saved" state
        // is never claimed for data that was silently dropped.
        if (res.data.warning) {
          setFeedback({ type: 'error', message: res.data.warning });
        } else {
          setFeedback({ type: 'success', message: 'Site CMS configuration saved and live on production!' });
        }
        if (res.data.settings) {
          setSettings(prev => ({ ...prev, ...res.data.settings }));
        }
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  // Tool management helpers
  const handleAddTool = () => {
    const newTool = {
      name: 'New Tool',
      category: 'Infrastructure',
      logoUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
      description: 'Production containerization platform',
      order: (settings.capstone?.tools?.length || 0) + 1,
      active: true
    };
    setSettings(prev => ({
      ...prev,
      capstone: {
        ...prev.capstone,
        tools: [...(prev.capstone?.tools || []), newTool]
      }
    }));
  };

  const handleUpdateTool = (index, field, value) => {
    setSettings(prev => {
      const updatedTools = [...(prev.capstone?.tools || [])];
      updatedTools[index] = { ...updatedTools[index], [field]: value };
      return {
        ...prev,
        capstone: { ...prev.capstone, tools: updatedTools }
      };
    });
  };

  const handleDeleteTool = (index) => {
    setSettings(prev => ({
      ...prev,
      capstone: {
        ...prev.capstone,
        tools: (prev.capstone?.tools || []).filter((_, i) => i !== index)
      }
    }));
  };

  // Capstone Projects helpers
  const handleAddCapstoneProject = () => {
    const newProject = {
      tag: 'Machine Learning',
      title: 'New Capstone Project',
      desc: 'Describe what students will build in this project.',
      stack: ['Python', 'TensorFlow'],
      color: 'from-indigo-500 to-blue-500'
    };
    setSettings(prev => ({
      ...prev,
      capstone: {
        ...prev.capstone,
        projects: [...(prev.capstone?.projects || []), newProject]
      }
    }));
  };

  const handleUpdateCapstoneProject = (index, field, value) => {
    setSettings(prev => {
      const updated = [...(prev.capstone?.projects || [])];
      if (field === 'stack') {
        updated[index] = { ...updated[index], stack: value.split(',').map(s => s.trim()).filter(Boolean) };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, capstone: { ...prev.capstone, projects: updated } };
    });
  };

  const handleDeleteCapstoneProject = (index) => {
    setSettings(prev => ({
      ...prev,
      capstone: {
        ...prev.capstone,
        projects: (prev.capstone?.projects || []).filter((_, i) => i !== index)
      }
    }));
  };

  // Roadmap step helpers
  const handleAddRoadmapStep = () => {
    const nextNum = (settings.roadmap?.steps?.length || 0) + 1;
    const newStep = {
      stepNumber: nextNum,
      phaseName: `Phase 0${nextNum}`,
      title: 'Advanced Specialization & Production Capstone',
      duration: 'Weeks 5-8',
      description: 'Build enterprise-grade software architectures under senior faculty supervision.',
      deliverables: ['Production microservice deployed', 'Live CI/CD test suite passed']
    };
    setSettings(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap,
        steps: [...(prev.roadmap?.steps || []), newStep]
      }
    }));
  };

  const handleUpdateRoadmapStep = (index, field, value) => {
    setSettings(prev => {
      const updatedSteps = [...(prev.roadmap?.steps || [])];
      updatedSteps[index] = { ...updatedSteps[index], [field]: value };
      return {
        ...prev,
        roadmap: { ...prev.roadmap, steps: updatedSteps }
      };
    });
  };

  const handleDeleteRoadmapStep = (index) => {
    setSettings(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap,
        steps: (prev.roadmap?.steps || []).filter((_, i) => i !== index)
      }
    }));
  };

  // ── Leadership team helpers ──
  const handleAddLeader = () => {
    setSettings(prev => ({
      ...prev,
      leadership: [...(prev.leadership || []), {
        name: 'New Team Member', role: 'Faculty Lead', badge: 'Faculty Lead',
        experience: 'X+ Years', bio: 'Short professional bio...',
        skills: ['Skill One', 'Skill Two'], linkedin: '', image: '', order: (prev.leadership?.length || 0) + 1, active: true,
      }],
    }));
  };

  const handleUpdateLeader = (idx, field, value) => {
    setSettings(prev => {
      const list = [...(prev.leadership || [])];
      if (field === 'skills') {
        list[idx] = { ...list[idx], skills: String(value).split(',').map(s => s.trim()).filter(Boolean) };
      } else {
        list[idx] = { ...list[idx], [field]: value };
      }
      return { ...prev, leadership: list };
    });
  };

  const handleDeleteLeader = (idx) => {
    setSettings(prev => ({ ...prev, leadership: (prev.leadership || []).filter((_, i) => i !== idx) }));
  };

  const handleUpdateSister = (field, value) => {
    setSettings(prev => ({ ...prev, sisterCompany: { ...prev.sisterCompany, [field]: value } }));
  };

  const handleUpdateSisterStat = (field, value) => {
    setSettings(prev => ({ ...prev, sisterCompany: { ...prev.sisterCompany, stats: { ...(prev.sisterCompany?.stats || {}), [field]: value } } }));
  };

  const handleUpdateSisterService = (idx, field, value) => {
    setSettings(prev => {
      const services = [...(prev.sisterCompany?.services || [])];
      services[idx] = { ...services[idx], [field]: value };
      return { ...prev, sisterCompany: { ...prev.sisterCompany, services } };
    });
  };

  const handleAddSisterService = () => {
    setSettings(prev => ({
      ...prev,
      sisterCompany: { ...prev.sisterCompany, services: [...(prev.sisterCompany?.services || []), { title: 'New Service', desc: 'Describe this staffing service...' }] },
    }));
  };

  const handleDeleteSisterService = (idx) => {
    setSettings(prev => ({
      ...prev,
      sisterCompany: { ...prev.sisterCompany, services: (prev.sisterCompany?.services || []).filter((_, i) => i !== idx) },
    }));
  };

  const handleUpdatePedagogy = (field, value) => {
    setSettings(prev => ({ ...prev, pedagogy: { ...prev.pedagogy, [field]: value } }));
  };

  const handleUpdatePedagogyPillar = (idx, field, value) => {
    setSettings(prev => {
      const pillars = [...(prev.pedagogy?.pillars || [])];
      pillars[idx] = { ...pillars[idx], [field]: value };
      return { ...prev, pedagogy: { ...prev.pedagogy, pillars } };
    });
  };

  const handleUpdatePedagogyStat = (idx, field, value) => {
    setSettings(prev => {
      const stats = [...(prev.pedagogy?.stats || [])];
      stats[idx] = { ...stats[idx], [field]: value };
      return { ...prev, pedagogy: { ...prev.pedagogy, stats } };
    });
  };

  // Company logo helpers
  const handleAddCompany = () => {
    const nextOrder = (settings.trustedCompanies?.companies?.length || 0) + 1;
    const newComp = {
      name: 'New Global Enterprise',
      logoUrl: '/images/companies/google.svg',
      order: nextOrder,
      active: true
    };
    setSettings(prev => ({
      ...prev,
      trustedCompanies: {
        ...prev.trustedCompanies,
        companies: [...(prev.trustedCompanies?.companies || []), newComp]
      }
    }));
  };

  const handleUpdateCompany = (index, field, value) => {
    setSettings(prev => {
      const list = [...(prev.trustedCompanies?.companies || [])];
      list[index] = { ...list[index], [field]: value };
      return {
        ...prev,
        trustedCompanies: { ...prev.trustedCompanies, companies: list }
      };
    });
  };

  const handleDeleteCompany = (index) => {
    setSettings(prev => ({
      ...prev,
      trustedCompanies: {
        ...prev.trustedCompanies,
        companies: (prev.trustedCompanies?.companies || []).filter((_, i) => i !== index)
      }
    }));
  };

  const tabs = [
    { id: 'general', label: 'General & Identity', icon: Building },
    { id: 'sections', label: 'Homepage Sections', icon: Eye },
    { id: 'hero', label: 'Homepage Hero', icon: Sparkles },
    { id: 'companies', label: 'Company Logos', icon: Award },
    { id: 'courses', label: 'Career Programs', icon: Award },
    { id: 'personalized', label: 'Personalized ($5,499)', icon: DollarSign },
    { id: 'team', label: 'Team & Alliances', icon: Users },
    { id: 'capstone', label: 'Capstone & Tools', icon: Cpu },
    { id: 'roadmap', label: 'Roadmap Steps', icon: Target },
    { id: 'about', label: 'About & Mission', icon: Globe },
    { id: 'globalCtas', label: 'Global CTAs', icon: Zap },
    { id: 'payments', label: 'Payment Gateway', icon: CreditCard },
    { id: 'audit', label: 'Audit Trail', icon: Shield },
  ];

  return (
    <div ref={formRootRef} className="space-y-6 max-w-6xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono uppercase tracking-widest mb-2">
            <Settings className="w-3.5 h-3.5" />
            Central Site Administration
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">
            Site CMS & Content Control Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Edit fees, durations, hero headlines, Capstone tools, roadmap milestones, and about statements without code edits.
          </p>
        </div>

        {activeTab !== 'audit' && (
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Publishing Live...' : 'Publish Changes'}
          </button>
        )}
      </div>

      {/* Navigation Tabs Pill Strip */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-500 text-slate-950 font-bold shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {feedback.message && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', message: '' })} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading CMS configuration...</div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">

          {/* ========================================================================= */}
          {/* TAB 1: GENERAL & IDENTITY */}
          {/* ========================================================================= */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-400" />
                  Corporate Identity & Legal Entity
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ye values website ke header, footer, contact page aur WhatsApp button par turant apply hoti hain.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Brand / Site Name</label>
                    <input
                      type="text"
                      value={settings.siteName || ''}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Legal Entity Name</label>
                    <input
                      type="text"
                      value={settings.legalName || ''}
                      onChange={(e) => setSettings({ ...settings, legalName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 uppercase mb-1.5">Site Tagline</label>
                    <input
                      type="text"
                      value={settings.tagline || ''}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Official US Contact Phone</label>
                    <input
                      type="text"
                      value={settings.contactPhone || ''}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Admissions Email</label>
                    <input
                      type="email"
                      value={settings.contactEmail || ''}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 uppercase mb-1.5">Registered Wyoming Office</label>
                    <input
                      type="text"
                      value={settings.headquartersAddress || ''}
                      onChange={(e) => setSettings({ ...settings, headquartersAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-3">Social profiles (footer icons)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    {['linkedin', 'youtube', 'instagram', 'twitter'].map((key) => (
                      <div key={key}>
                        <label className="block text-slate-400 uppercase mb-1.5">{key}</label>
                        <input
                          type="text"
                          value={settings.socialLinks?.[key] || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            socialLinks: { ...(settings.socialLinks || {}), [key]: e.target.value },
                          })}
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 cursor-pointer">
                  <span className="text-xs">
                    <span className="block font-bold text-white">Maintenance mode</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      On karne par visitors ko maintenance screen dikhegi — admin panel chalta rahega.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.isMaintenanceMode || false}
                    onChange={(e) => setSettings({ ...settings, isMaintenanceMode: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0 w-4 h-4"
                  />
                </label>
              </div>

              {/* Announcement Banner */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-400" />
                    Global Top Announcement Banner
                  </h3>
                  <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.announcementBanner?.enabled ?? true}
                      onChange={(e) => setSettings({
                        ...settings,
                        announcementBanner: { ...settings.announcementBanner, enabled: e.target.checked }
                      })}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0"
                    />
                    <span>Show Banner</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 uppercase mb-1.5">Banner Message</label>
                    <input
                      type="text"
                      value={settings.announcementBanner?.text || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        announcementBanner: { ...settings.announcementBanner, text: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Action Target Link</label>
                    <input
                      type="text"
                      value={settings.announcementBanner?.linkUrl || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        announcementBanner: { ...settings.announcementBanner, linkUrl: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: HOMEPAGE SECTION VISIBILITY CONTROLS                                 */}
          {/* ========================================================================= */}
          {activeTab === 'sections' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 backdrop-blur-xl text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    Homepage Section Visibility & Toggles
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Show or hide individual sections on the public landing page without developer intervention.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allOn = {
                        hero: true,
                        trustMarquee: true,
                        metrics: true,
                        learningJourney: true,
                        courses: true,
                        personalizedLearning: true,
                        tools: true,
                        roadmap: true,
                        whyChooseUs: true,
                        faqs: true,
                        callToAction: true,
                      };
                      setSettings(prev => ({ ...prev, sectionVisibility: allOn }));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Enable All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {[
                  { key: 'hero', label: '1. Product Hero & LMS Cockpit', desc: 'Interactive visual cockpit, floating badges, and primary headline' },
                  { key: 'trustMarquee', label: '2. Enterprise Brand Marquee', desc: 'Infinite loop company logos (Google, Microsoft, AWS, etc.)' },
                  { key: 'metricsStrip', keyName: 'metrics', label: '3. Institutional Value Metrics Strip', desc: 'Key outcome statistics and telemetry highlights' },
                  { key: 'learningJourney', label: '4. Pedagogical Learning Journey', desc: 'Learn, Practice, Certify, and Advance 4-phase cards' },
                  { key: 'courses', label: '5. Career Programs & Course Bento', desc: 'Main course cards, syllabi modals, and credential seals' },
                  { key: 'personalizedLearning', label: '6. Personalized 1-on-1 Mentorship', desc: 'Dedicated $2,199 private career coaching offering' },
                  { key: 'tools', label: '7. 40+ Industry Tools & Tech', desc: 'Interactive developer tools, frameworks, and cloud stack grid' },
                  { key: 'roadmap', label: '8. 6-Step Career Transformation Roadmap', desc: 'Step-by-step pathway from orientation to elite hiring' },
                  { key: 'whyChooseUs', label: '9. Why Choose Us & Product Showcase', desc: 'Live sandbox terminals, code reviews, and architectural depth' },
                  { key: 'faqs', label: '10. Frequently Asked Questions (Accordion)', desc: 'Categorized expandable answers for admissions & placement' },
                  { key: 'callToAction', label: '11. Selective Admissions Bottom CTA', desc: 'Urgency countdown and final enrollment reservation banner' },
                ].map(({ key, keyName, label, desc }) => {
                  const prop = keyName || key;
                  const isVisible = settings.sectionVisibility?.[prop] !== false;
                  return (
                    <div
                      key={prop}
                      className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                        isVisible
                          ? 'bg-slate-950/80 border-indigo-500/30 shadow-xs'
                          : 'bg-slate-950/30 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="text-white font-bold flex items-center gap-2">
                          <span>{label}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isVisible
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isVisible ? 'VISIBLE' : 'HIDDEN'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] font-sans">{desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSettings(prev => ({
                            ...prev,
                            sectionVisibility: {
                              ...(prev.sectionVisibility || {}),
                              [prop]: !isVisible,
                            }
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isVisible
                            ? 'bg-indigo-500 text-slate-950 hover:bg-indigo-400 shadow-sm'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isVisible ? 'Hide Section' : 'Show Section'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: HOMEPAGE HERO CMS */}
          {/* ========================================================================= */}
          {activeTab === 'hero' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
              <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Homepage Hero Section Copy & CTAs
              </h3>
              <div className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 uppercase mb-1.5">Eyebrow Badge Text</label>
                  <input
                    type="text"
                    value={settings.hero?.eyebrowBadgeText || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      hero: { ...settings.hero, eyebrowBadgeText: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1.5">Primary Hero Headline (Line breaks allowed)</label>
                  <textarea
                    rows={3}
                    value={settings.hero?.headline || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      hero: { ...settings.hero, headline: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1.5">Supporting Subheadline Paragraph</label>
                  <textarea
                    rows={3}
                    value={settings.hero?.subheadline || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      hero: { ...settings.hero, subheadline: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Primary CTA Button Label</label>
                    <input
                      type="text"
                      value={settings.hero?.primaryCtaText || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        hero: { ...settings.hero, primaryCtaText: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Primary CTA Link URL</label>
                    <input
                      type="text"
                      value={settings.hero?.primaryCtaLink || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        hero: { ...settings.hero, primaryCtaLink: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Secondary CTA Button Label</label>
                    <input
                      type="text"
                      value={settings.hero?.secondaryCtaText || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        hero: { ...settings.hero, secondaryCtaText: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Secondary CTA Link URL</label>
                    <input
                      type="text"
                      value={settings.hero?.secondaryCtaLink || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        hero: { ...settings.hero, secondaryCtaLink: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1.5">Alumni Placement Proof Badge</label>
                  <input
                    type="text"
                    value={settings.hero?.statsBadgeText || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      hero: { ...settings.hero, statsBadgeText: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: BRAND & COMPANY LOGOS MARQUEE CMS */}
          {/* ========================================================================= */}
          {activeTab === 'companies' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-400" />
                    Global Enterprise Brand & Company Logos Marquee
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddCompany}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Company</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Marquee Headline</label>
                    <input
                      type="text"
                      value={settings.trustedCompanies?.heading || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        trustedCompanies: { ...settings.trustedCompanies, heading: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Marquee Subtitle</label>
                    <input
                      type="text"
                      value={settings.trustedCompanies?.subheading || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        trustedCompanies: { ...settings.trustedCompanies, subheading: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Configured Employer Logos ({(settings.trustedCompanies?.companies || []).length})
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(settings.trustedCompanies?.companies || []).map((comp, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={comp.name || ''}
                            onChange={(e) => handleUpdateCompany(idx, 'name', e.target.value)}
                            placeholder="Company Name"
                            className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white font-sans font-bold text-xs focus:outline-none focus:border-indigo-500 mr-2"
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={comp.active !== false}
                                onChange={(e) => handleUpdateCompany(idx, 'active', e.target.checked)}
                                className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0"
                              />
                              <span>Active</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => handleDeleteCompany(idx)}
                              className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-slate-900 cursor-pointer transition-colors"
                              title="Delete Logo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Image Upload & Preview Component */}
                        <ImageUploadInput
                          value={comp.logoUrl || ''}
                          onChange={(url) => handleUpdateCompany(idx, 'logoUrl', url)}
                          placeholder="/images/companies/google.svg or upload..."
                          label=""
                          previewSize="w-10 h-10"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: CAREER PROGRAMS CONTENT CMS */}
          {/* ========================================================================= */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  Career Programs Section — Homepage Content
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Edit the section badge, headline and subheadline shown above the course cards on the homepage.
                </p>

                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Section Badge Text</label>
                    <input
                      type="text"
                      value={settings.courses?.badgeText || ''}
                      onChange={(e) => setSettings({ ...settings, courses: { ...settings.courses, badgeText: e.target.value } })}
                      placeholder="e.g. 6-Month Career Training Programs · Dual US & Microsoft Credentials"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Section Headline</label>
                    <input
                      type="text"
                      value={settings.courses?.headline || ''}
                      onChange={(e) => setSettings({ ...settings, courses: { ...settings.courses, headline: e.target.value } })}
                      placeholder="e.g. Fellowship Specializations"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Section Subheadline / Description</label>
                    <textarea
                      rows={3}
                      value={settings.courses?.subheadline || ''}
                      onChange={(e) => setSettings({ ...settings, courses: { ...settings.courses, subheadline: e.target.value } })}
                      placeholder="Short description shown below the headline..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-400 font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="font-bold text-indigo-400">ℹ Course Cards Management:</span> Individual course cards (title, price, duration, curriculum) are managed in the{' '}
                    <span className="font-bold text-white">Admin → Courses</span> section.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PERSONALIZED LEARNING CMS ($2,199) */}
          {/* ========================================================================= */}
          {activeTab === 'personalized' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-indigo-400" />
                    Personalized Learning Track & Independent Fee ($2,199)
                  </h3>
                  <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.personalizedLearning?.enabled !== false}
                      onChange={(e) => setSettings({
                        ...settings,
                        personalizedLearning: {
                          ...settings.personalizedLearning,
                          enabled: e.target.checked
                        }
                      })}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0"
                    />
                    <span>Track Active</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Tuition Fee ($)</label>
                    <input
                      type="number"
                      value={settings.personalizedLearning?.price || 2199}
                      onChange={(e) => setSettings({
                        ...settings,
                        personalizedLearning: {
                          ...settings.personalizedLearning,
                          price: Number(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Original / Compare Price ($)</label>
                    <input
                      type="number"
                      value={settings.personalizedLearning?.originalPrice || 3499}
                      onChange={(e) => setSettings({
                        ...settings,
                        personalizedLearning: {
                          ...settings.personalizedLearning,
                          originalPrice: Number(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Seat Deposit Price ($)</label>
                    <input
                      type="number"
                      value={settings.personalizedLearning?.depositPrice || 99}
                      onChange={(e) => setSettings({
                        ...settings,
                        personalizedLearning: {
                          ...settings.personalizedLearning,
                          depositPrice: Number(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Duration (e.g. 6 Months)</label>
                    <input
                      type="text"
                      value={settings.personalizedLearning?.duration || '6 Months (Extended Track)'}
                      onChange={(e) => setSettings({
                        ...settings,
                        personalizedLearning: {
                          ...settings.personalizedLearning,
                          duration: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Badge Eyebrow</label>
                    <input
                      type="text"
                      value={settings.personalizedLearning?.badgeText || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        personalizedLearning: {
                          ...settings.personalizedLearning,
                          badgeText: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Headline</label>
                    <input
                      type="text"
                      value={settings.personalizedLearning?.headline || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        personalizedLearning: {
                          ...settings.personalizedLearning,
                          headline: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Subheadline</label>
                    <textarea
                      rows={2}
                      value={settings.personalizedLearning?.subheadline || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        personalizedLearning: {
                          ...settings.personalizedLearning,
                          subheadline: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Repeatable Features with Multi-Line Paste Splitter */}
                <div className="pt-2 border-t border-slate-800">
                  <RepeatableListInput
                    label="Personalized Track Features & Deliverables"
                    description="Paste multiple lines or bullet points — they will auto-split into distinct items."
                    items={settings.personalizedLearning?.features || []}
                    onChange={(newFeatures) => setSettings({
                      ...settings,
                      personalizedLearning: {
                        ...settings.personalizedLearning,
                        features: newFeatures
                      }
                    })}
                    placeholder="Enter feature (e.g. 1-on-1 weekly session with FAANG staff)..."
                    badgeColor="cyan"
                  />
                </div>

                {/* Repeatable Tools */}
                <div className="pt-2 border-t border-slate-800">
                  <RepeatableListInput
                    label="Covered Tech Stack & Frameworks"
                    items={settings.personalizedLearning?.tools || []}
                    onChange={(newTools) => setSettings({
                      ...settings,
                      personalizedLearning: {
                        ...settings.personalizedLearning,
                        tools: newTools
                      }
                    })}
                    placeholder="e.g. Docker, PyTorch, Kubernetes..."
                    badgeColor="emerald"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: CAPSTONE & TOOLS CMS */}
          {/* ========================================================================= */}
          {activeTab === 'capstone' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Capstone Section Headings & Outcomes
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Section Title</label>
                    <input
                      type="text"
                      value={settings.capstone?.title || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        capstone: { ...settings.capstone, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Section Subtitle</label>
                    <input
                      type="text"
                      value={settings.capstone?.subtitle || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        capstone: { ...settings.capstone, subtitle: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <RepeatableListInput
                    label="Capstone Engineering Outcomes"
                    description="Paste multiple bullet outcomes with ease."
                    items={settings.capstone?.outcomes || []}
                    onChange={(newOutcomes) => setSettings({
                      ...settings,
                      capstone: { ...settings.capstone, outcomes: newOutcomes }
                    })}
                    placeholder="Enter capstone outcome..."
                    badgeColor="cyan"
                  />
                </div>
              </div>

              {/* Capstone Tools Grid Editor */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Capstone Tools & Technologies (Live Logos)
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Manage visual tech logos displayed on the homepage Tools section.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTool}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Tool
                  </button>
                </div>

                <div className="space-y-3">
                  {(settings.capstone?.tools || []).map((tool, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                            {tool.logoUrl ? (
                              <img src={tool.logoUrl} alt={tool.name} className="w-6 h-6 object-contain" />
                            ) : (
                              <Cpu className="w-5 h-5 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white font-sans">{tool.name || `Tool #${idx + 1}`}</span>
                            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded ml-2">
                              {tool.category || 'General'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs font-mono text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tool.active !== false}
                              onChange={(e) => handleUpdateTool(idx, 'active', e.target.checked)}
                              className="rounded bg-slate-900 border-slate-800 text-indigo-500"
                            />
                            <span>Active</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteTool(idx)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-slate-900 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Tool Name</label>
                          <input
                            type="text"
                            value={tool.name || ''}
                            onChange={(e) => handleUpdateTool(idx, 'name', e.target.value)}
                            placeholder="e.g. Docker"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Category</label>
                          <input
                            type="text"
                            value={tool.category || ''}
                            onChange={(e) => handleUpdateTool(idx, 'category', e.target.value)}
                            placeholder="e.g. Infrastructure"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Logo URL (SVG / PNG)</label>
                          <input
                            type="url"
                            value={tool.logoUrl || ''}
                            onChange={(e) => handleUpdateTool(idx, 'logoUrl', e.target.value)}
                            placeholder="https://...logo.svg"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Capstone Projects Editor ── */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Capstone Project Showcase Cards
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      When saved, these override the default course-specific projects on all course pages.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCapstoneProject}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>

                {(settings.capstone?.projects || []).length === 0 && (
                  <div className="text-xs text-slate-400 font-mono py-4 text-center border border-dashed border-slate-700 rounded-xl">
                    No admin projects set — course pages use their built-in default projects.
                  </div>
                )}

                <div className="space-y-3">
                  {(settings.capstone?.projects || []).map((proj, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{proj.title || `Project #${idx + 1}`}</span>
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{proj.tag || 'Category'}</span>
                        </div>
                        <button type="button" onClick={() => handleDeleteCapstoneProject(idx)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-slate-900 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Category Tag</label>
                          <input type="text" value={proj.tag || ''} onChange={(e) => handleUpdateCapstoneProject(idx, 'tag', e.target.value)}
                            placeholder="e.g. Computer Vision"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Project Title</label>
                          <input type="text" value={proj.title || ''} onChange={(e) => handleUpdateCapstoneProject(idx, 'title', e.target.value)}
                            placeholder="e.g. US Health Care Analysis"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase mb-1 text-xs font-mono">Description</label>
                        <textarea rows={2} value={proj.desc || ''} onChange={(e) => handleUpdateCapstoneProject(idx, 'desc', e.target.value)}
                          placeholder="What do students build?"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Tech Stack (comma-separated)</label>
                          <input type="text" value={(proj.stack || []).join(', ')} onChange={(e) => handleUpdateCapstoneProject(idx, 'stack', e.target.value)}
                            placeholder="e.g. Python, TensorFlow, OpenCV"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Gradient Color</label>
                          <input type="text" value={proj.color || ''} onChange={(e) => handleUpdateCapstoneProject(idx, 'color', e.target.value)}
                            placeholder="from-blue-500 to-indigo-500"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: PLACEMENT ROADMAP CMS */}
          {/* ========================================================================= */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    Career Placement Roadmap Milestones
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddRoadmapStep}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Phase
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Section Title</label>
                    <input
                      type="text"
                      value={settings.roadmap?.title || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        roadmap: { ...settings.roadmap, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Section Subtitle</label>
                    <input
                      type="text"
                      value={settings.roadmap?.subtitle || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        roadmap: { ...settings.roadmap, subtitle: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-800">
                  {(settings.roadmap?.steps || []).map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs font-mono flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white">{step.title || `Step ${idx + 1}`}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                            {step.duration || 'Duration'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoadmapStep(idx)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-slate-900 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Phase Tag</label>
                          <input
                            type="text"
                            value={step.phaseName || ''}
                            onChange={(e) => handleUpdateRoadmapStep(idx, 'phaseName', e.target.value)}
                            placeholder="e.g. Phase 01"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Title</label>
                          <input
                            type="text"
                            value={step.title || ''}
                            onChange={(e) => handleUpdateRoadmapStep(idx, 'title', e.target.value)}
                            placeholder="e.g. Diagnostic & Fundamentals"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Timeline / Duration</label>
                          <input
                            type="text"
                            value={step.duration || ''}
                            onChange={(e) => handleUpdateRoadmapStep(idx, 'duration', e.target.value)}
                            placeholder="e.g. Weeks 1-2"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 uppercase mb-1 text-xs font-mono">Description</label>
                        <textarea
                          rows={2}
                          value={step.description || ''}
                          onChange={(e) => handleUpdateRoadmapStep(idx, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <RepeatableListInput
                          label="Phase Deliverables"
                          items={step.deliverables || []}
                          onChange={(newDeliverables) => handleUpdateRoadmapStep(idx, 'deliverables', newDeliverables)}
                          placeholder="e.g. Microservice deployed to AWS..."
                          badgeColor="cyan"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: ABOUT / MISSION / VISION CMS */}
          {/* ========================================================================= */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  About American FutureTech — Narrative Copy
                </h3>

                {/* About page section visibility — inactive = hidden, never deleted */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div>
                    <div className="text-[11px] font-bold text-white uppercase tracking-wider">
                      About Page Sections — Show / Hide
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      Untick a section to hide it on the public About page. The content is kept, so you can switch it
                      back on any time — nothing is deleted.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {[
                      { key: 'hero', label: 'About hero' },
                      { key: 'missionVision', label: 'Mission & Vision' },
                      { key: 'charter', label: 'Academic charter' },
                      { key: 'pedagogy', label: 'Build-first pedagogy & stats' },
                      { key: 'team', label: 'Leadership team' },
                      { key: 'sisterCompany', label: 'Sister company' },
                      { key: 'cta', label: 'Global vision CTA' },
                      { key: 'faqs', label: 'Admissions FAQ' },
                    ].map((section) => {
                      const active = settings.aboutSections?.[section.key] !== false;
                      return (
                        <label
                          key={section.key}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-[11px] ${
                            active
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={(e) => setSettings({
                              ...settings,
                              aboutSections: { ...settings.aboutSections, [section.key]: e.target.checked }
                            })}
                            className="accent-emerald-500"
                          />
                          <span className="font-sans font-medium">{section.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Primary About Headline</label>
                    <input
                      type="text"
                      value={settings.aboutCMS?.headline || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        aboutCMS: { ...settings.aboutCMS, headline: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <RepeatableListInput
                      label="About Body Paragraphs"
                      description="Add or edit the editorial story paragraphs displayed on the About page."
                      items={settings.aboutCMS?.bodyParagraphs || []}
                      onChange={(newParas) => setSettings({
                        ...settings,
                        aboutCMS: { ...settings.aboutCMS, bodyParagraphs: newParas }
                      })}
                      placeholder="Enter paragraph text..."
                      badgeColor="cyan"
                    />
                  </div>
                </div>
              </div>

              {/* Mission & Vision Bento Editor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mission */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                  <h4 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Institutional Mission
                  </h4>
                  <div className="space-y-3 text-xs font-mono">
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Mission Card Title</label>
                      <input
                        type="text"
                        value={settings.aboutCMS?.missionTitle || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          aboutCMS: { ...settings.aboutCMS, missionTitle: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Mission Statement</label>
                      <textarea
                        rows={4}
                        value={settings.aboutCMS?.missionText || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          aboutCMS: { ...settings.aboutCMS, missionText: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Target / Goal Tagline</label>
                      <input
                        type="text"
                        value={settings.aboutCMS?.missionTarget || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          aboutCMS: { ...settings.aboutCMS, missionTarget: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Vision */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                  <h4 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-fuchsia-400" />
                    Global Vision
                  </h4>
                  <div className="space-y-3 text-xs font-mono">
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Vision Card Title</label>
                      <input
                        type="text"
                        value={settings.aboutCMS?.visionTitle || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          aboutCMS: { ...settings.aboutCMS, visionTitle: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Vision Statement</label>
                      <textarea
                        rows={4}
                        value={settings.aboutCMS?.visionText || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          aboutCMS: { ...settings.aboutCMS, visionText: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 uppercase mb-1">Vision Standard Tagline</label>
                      <input
                        type="text"
                        value={settings.aboutCMS?.visionTagline || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          aboutCMS: { ...settings.aboutCMS, visionTagline: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: TEAM & ALLIANCES (Leadership, Sister Company, Pedagogy)              */}
          {/* ========================================================================= */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Leadership & Faculty */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      Leadership &amp; Faculty Roster (About Page)
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Team members shown on the public About page. Skills are comma-separated.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLeader}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Member
                  </button>
                </div>

                <div className="space-y-3">
                  {(settings.leadership || []).map((person, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{person.name || `Member #${idx + 1}`}</span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={person.active !== false}
                              onChange={(e) => handleUpdateLeader(idx, 'active', e.target.checked)}
                              className="rounded bg-slate-900 border-slate-800 text-indigo-500"
                            />
                            <span>Active</span>
                          </label>
                          <button type="button" onClick={() => handleDeleteLeader(idx)} className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-slate-900 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Full Name</label>
                          <input type="text" value={person.name || ''} onChange={(e) => handleUpdateLeader(idx, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Role / Title</label>
                          <input type="text" value={person.role || ''} onChange={(e) => handleUpdateLeader(idx, 'role', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">Experience Badge</label>
                          <input type="text" value={person.experience || ''} onChange={(e) => handleUpdateLeader(idx, 'experience', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 uppercase mb-1 text-xs font-mono">Bio</label>
                        <textarea rows={3} value={person.bio || ''} onChange={(e) => handleUpdateLeader(idx, 'bio', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                        <div className="sm:col-span-2">
                          <label className="block text-slate-400 uppercase mb-1">Skills (comma-separated)</label>
                          <input type="text" value={(person.skills || []).join(', ')} onChange={(e) => handleUpdateLeader(idx, 'skills', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-slate-400 uppercase mb-1">LinkedIn URL</label>
                          <input type="url" value={person.linkedin || ''} onChange={(e) => handleUpdateLeader(idx, 'linkedin', e.target.value)}
                            placeholder="https://linkedin.com/in/..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sister Company */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-indigo-400" />
                    Sister Staffing Company / Strategic Alliance
                  </h3>
                  <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={settings.sisterCompany?.enabled !== false}
                      onChange={(e) => handleUpdateSister('enabled', e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0" />
                    <span>Show Section</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Company Name</label>
                    <input type="text" value={settings.sisterCompany?.name || ''} onChange={(e) => handleUpdateSister('name', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Location Line</label>
                    <input type="text" value={settings.sisterCompany?.location || ''} onChange={(e) => handleUpdateSister('location', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="text-xs font-mono">
                  <label className="block text-slate-400 uppercase mb-1.5">Headline</label>
                  <input type="text" value={settings.sisterCompany?.headline || ''} onChange={(e) => handleUpdateSister('headline', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500" />
                </div>

                <div className="text-xs font-mono">
                  <label className="block text-slate-400 uppercase mb-1.5">Tagline (quote)</label>
                  <input type="text" value={settings.sisterCompany?.tagline || ''} onChange={(e) => handleUpdateSister('tagline', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500" />
                </div>

                <div className="text-xs font-mono">
                  <label className="block text-slate-400 uppercase mb-1.5">Description</label>
                  <textarea rows={3} value={settings.sisterCompany?.description || ''} onChange={(e) => handleUpdateSister('description', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
                  {[
                    ['shortlistHours', 'shortlistLabel'],
                    ['vetted', 'vettedLabel'],
                    ['placement', 'placementLabel'],
                  ].map(([vKey, lKey]) => (
                    <div key={vKey} className="space-y-2">
                      <input type="text" value={settings.sisterCompany?.stats?.[vKey] || ''} onChange={(e) => handleUpdateSisterStat(vKey, e.target.value)}
                        placeholder="Value" className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-xs" />
                      <input type="text" value={settings.sisterCompany?.stats?.[lKey] || ''} onChange={(e) => handleUpdateSisterStat(lKey, e.target.value)}
                        placeholder="Label" className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs" />
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Staffing Services ({(settings.sisterCompany?.services || []).length})</span>
                    <button type="button" onClick={handleAddSisterService}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold cursor-pointer hover:bg-indigo-500/30">
                      <Plus className="w-3.5 h-3.5" /> Add Service
                    </button>
                  </div>

                  {(settings.sisterCompany?.services || []).map((svc, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="text" value={svc.title || ''} onChange={(e) => handleUpdateSisterService(idx, 'title', e.target.value)}
                          placeholder="Service title" className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs" />
                        <button type="button" onClick={() => handleDeleteSisterService(idx)} className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-slate-900 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea rows={2} value={svc.desc || ''} onChange={(e) => handleUpdateSisterService(idx, 'desc', e.target.value)}
                        placeholder="Service description" className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-sans text-xs" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Build-First Pedagogy */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    "Build-First" Pedagogy &amp; Institutional Stats
                  </h3>
                  <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={settings.pedagogy?.enabled !== false}
                      onChange={(e) => handleUpdatePedagogy('enabled', e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0" />
                    <span>Show Section</span>
                  </label>
                </div>

                <div className="text-xs font-mono">
                  <label className="block text-slate-400 uppercase mb-1.5">Section Title</label>
                  <input type="text" value={settings.pedagogy?.title || ''} onChange={(e) => handleUpdatePedagogy('title', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500" />
                </div>

                <div className="text-xs font-mono">
                  <label className="block text-slate-400 uppercase mb-1.5">Description</label>
                  <textarea rows={3} value={settings.pedagogy?.description || ''} onChange={(e) => handleUpdatePedagogy('description', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Hands-On %</label>
                    <input type="number" value={settings.pedagogy?.handsOnPercent || 70} onChange={(e) => handleUpdatePedagogy('handsOnPercent', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Theory %</label>
                    <input type="number" value={settings.pedagogy?.theoryPercent || 30} onChange={(e) => handleUpdatePedagogy('theoryPercent', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  {(settings.pedagogy?.pillars || []).map((pil, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <input type="text" value={pil.title || ''} onChange={(e) => handleUpdatePedagogyPillar(idx, 'title', e.target.value)}
                        placeholder="Pillar title" className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs" />
                      <textarea rows={3} value={pil.desc || ''} onChange={(e) => handleUpdatePedagogyPillar(idx, 'desc', e.target.value)}
                        placeholder="Pillar description" className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-sans text-xs" />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  {(settings.pedagogy?.stats || []).map((st, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <input type="text" value={st.value || ''} onChange={(e) => handleUpdatePedagogyStat(idx, 'value', e.target.value)}
                        placeholder="2,000+" className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-xs" />
                      <input type="text" value={st.label || ''} onChange={(e) => handleUpdatePedagogyStat(idx, 'label', e.target.value)}
                        placeholder="Students Trained" className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: GLOBAL CTAS & URGENCY BANNER */}
          {/* ========================================================================= */}
          {activeTab === 'globalCtas' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
              <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                Contextual $99 Reservation CTAs & Urgency Notices
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 uppercase mb-1.5">CTA Button Label</label>
                  <input
                    type="text"
                    value={settings.globalCtas?.reserveSeatText || 'Reserve Your Seat — $99'}
                    onChange={(e) => setSettings({
                      ...settings,
                      globalCtas: { ...settings.globalCtas, reserveSeatText: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase mb-1.5">Deposit Amount ($)</label>
                  <input
                    type="number"
                    value={settings.globalCtas?.reserveSeatPrice || 99}
                    onChange={(e) => setSettings({
                      ...settings,
                      globalCtas: { ...settings.globalCtas, reserveSeatPrice: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase mb-1.5">Destination URL</label>
                  <input
                    type="text"
                    value={settings.globalCtas?.reserveSeatUrl || '/checkout?tier=deposit'}
                    onChange={(e) => setSettings({
                      ...settings,
                      globalCtas: { ...settings.globalCtas, reserveSeatUrl: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono pt-2 border-t border-slate-800">
                <label className="block text-slate-400 uppercase mb-1.5">Cohort Intake & Urgency Notice</label>
                <input
                  type="text"
                  value={settings.globalCtas?.urgencyBannerText || 'Spring 2026 Admissions Open · Capped at 25 Fellows Per Cohort'}
                  onChange={(e) => setSettings({
                    ...settings,
                    globalCtas: { ...settings.globalCtas, urgencyBannerText: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Bottom Save Action (hidden on the gateway tab — it saves itself) */}
          <div className={`flex justify-end pt-4 ${activeTab === 'payments' ? 'hidden' : ''}`}>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Publishing Changes...' : 'Publish CMS Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB: PAYMENT GATEWAY (Stripe) — secrets are write-only */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <PaymentGatewayPanel />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="text-xs font-mono text-slate-400 uppercase">
              Administrative & Security Audit Logs ({auditLogs.length})
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline font-mono cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Refresh Logs
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-mono">
              No recent audit trail entries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-white font-bold">
                        {log.actorName || 'System Admin'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{log.entity}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate font-sans">
                        {log.details || 'Administrative operation'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
