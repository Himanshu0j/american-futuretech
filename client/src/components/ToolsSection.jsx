import React, { useState } from 'react';
import {
  Wrench,
  Search,
  Sparkles,
  ExternalLink,
  X,
  Layers,
  Shield,
  Cloud,
  Database,
  Cpu,
  Terminal,
  CheckCircle2,
  ArrowRight,
  Code2,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';
import BulletContent from './common/BulletContent';

const DEFAULT_TOOLS = [
  {
    name: 'Python',
    category: 'Data & AI',
    description: 'Core programming language powering modern generative AI, machine learning architectures, and data engineering pipelines.',
    badge: 'Core Standard',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    order: 1,
    active: true
  },
  {
    name: 'Docker',
    category: 'Cloud & Container Systems',
    description: 'Enterprise container virtualization ensuring immutable multi-cloud deployment and reproducible runtime environments.',
    badge: 'DevOps Standard',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
    order: 2,
    active: true
  },
  {
    name: 'AWS',
    category: 'Cloud & Container Systems',
    description: 'Premier hyperscale cloud platform utilizing EKS, ECS, Lambda, and IAM for resilient production infrastructure.',
    badge: 'Cloud Standard',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
    order: 3,
    active: true
  },
  {
    name: 'PyTorch',
    category: 'Data & AI',
    description: 'State-of-the-art deep learning and tensor computation framework powering modern computer vision and transformer LLMs.',
    badge: 'Production AI',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg',
    order: 4,
    active: true
  },
  {
    name: 'Git & GitHub',
    category: 'Software Engineering',
    description: 'Distributed version control, automated CI/CD GitHub Actions, and production peer code review workflows.',
    badge: 'Dev Standard',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
    order: 5,
    active: true
  },
  {
    name: 'Jupyter',
    category: 'Data Science & Analytics',
    description: 'Interactive computational notebooks for exploratory data analysis, statistical modeling, and ML experimentation.',
    badge: 'Data Standard',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original.svg',
    order: 6,
    active: true
  },
  {
    name: 'Hugging Face',
    category: 'Data & AI',
    description: 'Global transformer model hub, tokenizer pipelines, and fine-tuning ecosystem for open-weight foundation models.',
    badge: 'GenAI Hub',
    logo: 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg',
    order: 7,
    active: true
  },
  {
    name: 'PostgreSQL',
    category: 'Data Science & Analytics',
    description: 'Enterprise relational database management system supporting advanced analytics, indexing, and pgvector extensions.',
    badge: 'Database Standard',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    order: 8,
    active: true
  },
];

export default function ToolsSection() {
  const { settings } = useSiteSettings();
  const capstone = settings?.capstone || {};

  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Load tools from admin settings if available, else fallback to defaults
  const activeTools = (capstone.tools && capstone.tools.length > 0
    ? capstone.tools.filter(t => t.active !== false)
    : DEFAULT_TOOLS
  ).sort((a, b) => (a.order || 0) - (b.order || 0));

  // Extract unique categories dynamically
  const categories = ['All', ...new Set(activeTools.map(t => t.category).filter(Boolean))];

  const filteredTools = activeTools.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const featuredTools = activeTools.slice(0, 8);

  const outcomes = capstone.outcomes?.length ? capstone.outcomes : [
    'Deploy low-latency production inference pipelines on AWS / GCP',
    'Architect end-to-end containerized microservices with Docker & Kubernetes',
    'Conduct ethical penetration tests with Kali Linux and defend against live CVEs',
    'Live architectural defense panel evaluated by Silicon Valley engineering leads'
  ];

  return (
    <section id="tools" className="py-20 bg-[#fffff2] border-t border-[#1a361d]/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-semibold mb-3">
              <Terminal className="w-3.5 h-3.5 text-[#2d5c36]" />
              <span>{capstone.title || 'CAPSTONE DEFENSES & TOOLSTACK'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#1a361d] tracking-tight">
              {capstone.subtitle || 'Master the Exact Tools Used by Tier-1 Tech Teams'}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              {capstone.description ||
                'Every fellowship track culminates in an enterprise capstone project engineered around real production tooling—no synthetic toy simulations. Build, test, and deploy code reviewed by external tech leaders.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={capstone.ctaLink || '/checkout?tier=deposit'}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <span>{capstone.ctaText || 'Reserve Capstone Seat — $99'}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>

            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#1a361d] hover:bg-[#2d5c36] text-[#d8ffd2] text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <span>View All Tools</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#76ff8a]" />
            </button>
          </div>
        </div>

        {/* Featured Capstone Tools Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTools.map((tool, idx) => (
            <div
              key={tool.name || idx}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#1a361d]/40 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between text-left group relative"
            >
              <div className="space-y-4">
                {/* Logo & Category Badge */}
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 p-2.5 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                    {tool.logo ? (
                      <img
                        src={tool.logo}
                        alt={tool.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full rounded-xl bg-slate-900 text-white font-bold text-xs items-center justify-center ${tool.logo ? 'hidden' : 'flex'}`}>
                      {tool.name?.slice(0, 2).toUpperCase() || 'TL'}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#d8ffd2] text-[#1a361d] border border-[#76ff8a]/40">
                    {tool.badge || 'Core Standard'}
                  </span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[#40844e] uppercase tracking-wider mb-1">
                    {tool.category || 'Production Tool'}
                  </div>
                  <h3 className="text-xl font-display font-bold text-[#1a361d] group-hover:text-[#40844e] transition-colors">
                    {tool.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {tool.description || 'Enterprise platform deployed in student production laboratory environments.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-slate-500 font-mono">Verified in Cohorts</span>
                <CheckCircle2 className="w-4 h-4 text-[#40844e]" />
              </div>
            </div>
          ))}
        </div>

        {/* Capstone Real-World Outcomes Banner */}
        <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-left">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2d5c36] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#40844e]" />
                <span>Capstone Engineering Benchmark</span>
              </div>
              <h4 className="text-lg sm:text-xl font-display font-extrabold text-[#1a361d]">
                What You Build & Defend in Capstone Defense
              </h4>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Our capstone defenses are conducted live before invited engineering directors. You graduate with immutable digital verification backing your defense.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/checkout?tier=deposit"
                className="py-2.5 px-6 rounded-full bg-[#1a361d] hover:bg-[#2d5c36] text-[#76ff8a] font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
              >
                <span>Enroll in Next Cohort — $99</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 mt-6 border-t border-slate-100">
            {outcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-5 h-5 rounded-full bg-[#d8ffd2] text-[#1a361d] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </div>
                <span className="text-xs text-slate-700 leading-relaxed font-medium">{outcome}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Complete Tools Catalog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-hidden flex flex-col text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#2d5c36] uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#40844e]" />
                  <span>Curriculum Toolchain Catalog</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-extrabold text-[#1a361d]">
                  Production Toolstack & Technologies
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Administered directly across American FutureTech laboratory and capstone defense environments.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="py-4 space-y-3 shrink-0 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tool by name or keyword (e.g. Docker, Python, AWS)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1a361d]"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#1a361d] text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Tools Grid */}
            <div className="flex-1 overflow-y-auto py-4 pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredTools.map((tool, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-[#1a361d]/30 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                        {tool.logo ? (
                          <img src={tool.logo} alt={tool.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] font-bold text-[#1a361d]">{tool.name?.slice(0, 2)}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#2d5c36] bg-[#d8ffd2] px-2 py-0.5 rounded-full">
                        {tool.badge || 'Core'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#1a361d] truncate">
                        {tool.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {tool.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredTools.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No tools found matching "{searchTerm}".
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 font-mono">
                Showing {filteredTools.length} of {activeTools.length} verified program tools
              </span>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                Close Catalog
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
