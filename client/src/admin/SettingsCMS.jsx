import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  ChevronRight,
  Compass
} from 'lucide-react';
import RepeatableListInput from './components/RepeatableListInput';

export default function SettingsCMS() {
  const [activeTab, setActiveTab] = useState('general');
  // Tabs: 'general' | 'hero' | 'personalized' | 'capstone' | 'roadmap' | 'about' | 'globalCtas' | 'audit'

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Full Settings State
  const [settings, setSettings] = useState({
    brandName: 'American FutureTech LLC',
    phone: '+1 (307) 201-9494',
    email: 'admissions@americanfuturetech.com',
    address: '30 N Gould St Ste R, Sheridan, WY 82801, United States',
    announcementBanner: {
      active: true,
      text: '🚀 Spring Cohort 2026 Admissions Open — $99 Seat Reservation Now Available!',
      link: '/courses',
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
      price: 2199,
      originalPrice: 3499,
      depositPrice: 99,
      features: [
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
    }
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

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
              tools: res.data.settings.capstone?.tools || prev.capstone.tools
            },
            roadmap: {
              ...prev.roadmap,
              ...(res.data.settings.roadmap || {}),
              steps: res.data.settings.roadmap?.steps || prev.roadmap.steps
            },
            aboutCMS: {
              ...prev.aboutCMS,
              ...(res.data.settings.aboutCMS || {}),
              bodyParagraphs: res.data.settings.aboutCMS?.bodyParagraphs || prev.aboutCMS.bodyParagraphs
            },
            globalCtas: {
              ...prev.globalCtas,
              ...(res.data.settings.globalCtas || {})
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
        setFeedback({ type: 'success', message: 'Site CMS configuration saved and live on production!' });
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
    { id: 'hero', label: 'Homepage Hero', icon: Sparkles },
    { id: 'companies', label: 'Company Logos Marquee', icon: Award },
    { id: 'personalized', label: 'Personalized ($2,199)', icon: DollarSign },
    { id: 'capstone', label: 'Capstone & Tools', icon: Cpu },
    { id: 'roadmap', label: 'Roadmap Steps', icon: Target },
    { id: 'about', label: 'About & Mission', icon: Globe },
    { id: 'globalCtas', label: 'Global CTAs & Urgency', icon: Zap },
    { id: 'audit', label: 'Audit Trail', icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-2">
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer shrink-0"
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
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
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
                  <Building className="w-4 h-4 text-cyan-400" />
                  Corporate Identity & Legal Entity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Legal Entity Name</label>
                    <input
                      type="text"
                      value={settings.brandName || ''}
                      onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Official US Contact Phone</label>
                    <input
                      type="text"
                      value={settings.phone || ''}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Admissions Email</label>
                    <input
                      type="email"
                      value={settings.email || ''}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Registered Wyoming Office</label>
                    <input
                      type="text"
                      value={settings.address || ''}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Announcement Banner */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    Global Top Announcement Banner
                  </h3>
                  <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.announcementBanner?.active || false}
                      onChange={(e) => setSettings({
                        ...settings,
                        announcementBanner: { ...settings.announcementBanner, active: e.target.checked }
                      })}
                      className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1.5">Action Target Link</label>
                    <input
                      type="text"
                      value={settings.announcementBanner?.link || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        announcementBanner: { ...settings.announcementBanner, link: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: HOMEPAGE HERO CMS */}
          {/* ========================================================================= */}
          {activeTab === 'hero' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
              <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                    <Award className="w-4 h-4 text-cyan-400" />
                    Global Enterprise Brand & Company Logos Marquee
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddCompany}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3 relative group"
                      >
                        {/* Logo Preview */}
                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          {comp.logoUrl ? (
                            <img
                              src={comp.logoUrl}
                              alt={comp.name}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <Building className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        {/* Fields */}
                        <div className="flex-1 space-y-1.5 text-xs font-mono">
                          <input
                            type="text"
                            value={comp.name || ''}
                            onChange={(e) => handleUpdateCompany(idx, 'name', e.target.value)}
                            placeholder="Company Name"
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white font-sans font-bold text-xs focus:outline-none focus:border-cyan-500"
                          />
                          <input
                            type="text"
                            value={comp.logoUrl || ''}
                            onChange={(e) => handleUpdateCompany(idx, 'logoUrl', e.target.value)}
                            placeholder="Logo URL (/images/companies/google.svg)"
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                          />
                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={comp.active !== false}
                                onChange={(e) => handleUpdateCompany(idx, 'active', e.target.checked)}
                                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
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
                      </div>
                    ))}
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
                    <DollarSign className="w-4 h-4 text-cyan-400" />
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
                      className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                  <Cpu className="w-4 h-4 text-cyan-400" />
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                      <Layers className="w-4 h-4 text-cyan-400" />
                      Capstone Tools & Technologies (Live Logos)
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Manage visual tech logos displayed on the homepage Tools section.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTool}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
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
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded ml-2">
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
                              className="rounded bg-slate-900 border-slate-800 text-cyan-500"
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
                          <label className="block text-slate-500 uppercase mb-1">Tool Name</label>
                          <input
                            type="text"
                            value={tool.name || ''}
                            onChange={(e) => handleUpdateTool(idx, 'name', e.target.value)}
                            placeholder="e.g. Docker"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 uppercase mb-1">Category</label>
                          <input
                            type="text"
                            value={tool.category || ''}
                            onChange={(e) => handleUpdateTool(idx, 'category', e.target.value)}
                            placeholder="e.g. Infrastructure"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 uppercase mb-1">Logo URL (SVG / PNG)</label>
                          <input
                            type="url"
                            value={tool.logoUrl || ''}
                            onChange={(e) => handleUpdateTool(idx, 'logoUrl', e.target.value)}
                            placeholder="https://...logo.svg"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                          />
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
                    <Target className="w-4 h-4 text-cyan-400" />
                    Career Placement Roadmap Milestones
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddRoadmapStep}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                          <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs font-mono flex items-center justify-center">
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
                          <label className="block text-slate-500 uppercase mb-1">Phase Tag</label>
                          <input
                            type="text"
                            value={step.phaseName || ''}
                            onChange={(e) => handleUpdateRoadmapStep(idx, 'phaseName', e.target.value)}
                            placeholder="e.g. Phase 01"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 uppercase mb-1">Title</label>
                          <input
                            type="text"
                            value={step.title || ''}
                            onChange={(e) => handleUpdateRoadmapStep(idx, 'title', e.target.value)}
                            placeholder="e.g. Diagnostic & Fundamentals"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 uppercase mb-1">Timeline / Duration</label>
                          <input
                            type="text"
                            value={step.duration || ''}
                            onChange={(e) => handleUpdateRoadmapStep(idx, 'duration', e.target.value)}
                            placeholder="e.g. Weeks 1-2"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-500 uppercase mb-1 text-xs font-mono">Description</label>
                        <textarea
                          rows={2}
                          value={step.description || ''}
                          onChange={(e) => handleUpdateRoadmapStep(idx, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-cyan-500"
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
                  <Globe className="w-4 h-4 text-cyan-400" />
                  About American FutureTech — Narrative Copy
                </h3>

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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
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
                <Zap className="w-4 h-4 text-cyan-400" />
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Bottom Save Action */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Publishing Changes...' : 'Publish CMS Changes'}
            </button>
          </div>
        </form>
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
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-mono cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Refresh Logs
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
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
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
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
