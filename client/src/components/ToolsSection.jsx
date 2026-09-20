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
  ArrowRight
} from 'lucide-react';

const TOP_4_TOOLS = [
  {
    name: 'Jupyter',
    category: 'Data Science & Analytics',
    description: 'Interactive computational environments for data munging, exploratory modeling, and statistical inference.',
    badge: 'Core Data Standard',
    color: 'from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-200',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original.svg'
  },
  {
    name: 'PyTorch',
    category: 'Deep Learning & Neural Nets',
    description: 'State-of-the-art deep learning framework powering computer vision, speech synthesis, and foundation models.',
    badge: 'Production AI Standard',
    color: 'from-rose-500/10 to-red-500/10 text-rose-700 border-rose-200',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg'
  },
  {
    name: 'HuggingFace',
    category: 'Generative AI & LLMs',
    description: 'The world open source ecosystem for state-of-the-art transformer weights, tokenizers, and model hubs.',
    badge: 'GenAI & Transformers',
    color: 'from-yellow-500/10 to-amber-500/10 text-yellow-800 border-yellow-200',
    iconUrl: 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg'
  },
  {
    name: 'Docker',
    category: 'Cloud & Container Systems',
    description: 'Enterprise container virtualization platform ensuring immutable deployment across distributed multi-cloud nodes.',
    badge: 'DevOps & SRE Standard',
    color: 'from-blue-500/10 to-sky-500/10 text-sky-700 border-sky-200',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg'
  }
];

// All 41 tools extracted directly from the MongoDB Course collection
const ALL_41_TOOLS = [
  { name: 'Jupyter', category: 'Data & AI', level: 'Fundamental' },
  { name: 'PyTorch', category: 'Data & AI', level: 'Advanced' },
  { name: 'HuggingFace', category: 'Data & AI', level: 'Advanced' },
  { name: 'Docker', category: 'DevOps & Cloud', level: 'Core' },
  { name: 'Tableau', category: 'Data & Analytics', level: 'Core' },
  { name: 'Snowflake', category: 'Data & Analytics', level: 'Advanced' },
  { name: 'PostgreSQL', category: 'Data & Analytics', level: 'Core' },
  { name: 'Kali Linux', category: 'Cyber Security', level: 'Core' },
  { name: 'Burp Suite Pro', category: 'Cyber Security', level: 'Advanced' },
  { name: 'Nmap', category: 'Cyber Security', level: 'Core' },
  { name: 'Metasploit', category: 'Cyber Security', level: 'Advanced' },
  { name: 'Snort', category: 'Cyber Security', level: 'Core' },
  { name: 'Splunk', category: 'Cyber Security', level: 'Advanced' },
  { name: 'Wireshark', category: 'Cyber Security', level: 'Core' },
  { name: 'TensorFlow', category: 'Data & AI', level: 'Advanced' },
  { name: 'Zeek', category: 'Cyber Security', level: 'Advanced' },
  { name: 'Wazuh', category: 'Cyber Security', level: 'Core' },
  { name: 'YARA', category: 'Cyber Security', level: 'Core' },
  { name: 'LangChain', category: 'Data & AI', level: 'Advanced' },
  { name: 'CrewAI', category: 'Data & AI', level: 'Advanced' },
  { name: 'Ollama', category: 'Data & AI', level: 'Core' },
  { name: 'Pinecone', category: 'Data & AI', level: 'Advanced' },
  { name: 'vLLM', category: 'Data & AI', level: 'Advanced' },
  { name: 'Weights & Biases', category: 'Data & AI', level: 'Core' },
  { name: 'AWS EKS', category: 'DevOps & Cloud', level: 'Advanced' },
  { name: 'Terraform', category: 'DevOps & Cloud', level: 'Advanced' },
  { name: 'ArgoCD', category: 'DevOps & Cloud', level: 'Advanced' },
  { name: 'Prometheus', category: 'DevOps & Cloud', level: 'Core' },
  { name: 'Grafana', category: 'DevOps & Cloud', level: 'Core' },
  { name: 'Ansible', category: 'DevOps & Cloud', level: 'Core' },
  { name: 'Figma', category: 'Product & Ops', level: 'Core' },
  { name: 'Jira', category: 'Product & Ops', level: 'Core' },
  { name: 'Postman', category: 'Product & Ops', level: 'Core' },
  { name: 'Notion', category: 'Product & Ops', level: 'Core' },
  { name: 'LangSmith', category: 'Data & AI', level: 'Advanced' },
  { name: 'Mixpanel', category: 'Product & Ops', level: 'Core' },
  { name: 'Vanta', category: 'GRC & Security', level: 'Advanced' },
  { name: 'Drata', category: 'GRC & Security', level: 'Advanced' },
  { name: 'ServiceNow', category: 'GRC & Security', level: 'Advanced' },
  { name: 'Excel', category: 'Data & Analytics', level: 'Fundamental' },
  { name: 'OneTrust', category: 'GRC & Security', level: 'Advanced' }
];

export default function ToolsSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Data & AI', 'Cyber Security', 'DevOps & Cloud', 'Data & Analytics', 'GRC & Security', 'Product & Ops'];

  const filteredTools = ALL_41_TOOLS.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <section id="tools" className="py-20 bg-[#fffff2] border-t border-[#1a361d]/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-semibold mb-3">
              <Terminal className="w-3.5 h-3.5 text-[#2d5c36]" />
              <span>INDUSTRY-STANDARD TOOLSTACK</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#1a361d] tracking-tight">
              Master the Exact Tools Used by <span className="highlight">Tier-1 Tech Teams</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              Every fellowship track is engineered around real production tooling—no synthetic toy simulations. You build, test, and deploy using the same command lines and platforms powering Fortune 500 infrastructure.
            </p>
          </div>

          <div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#1a361d] hover:bg-[#2d5c36] text-[#d8ffd2] text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <span>Explore All 40+ Real Tools</span>
              <ArrowRight className="w-4 h-4 text-[#76ff8a]" />
            </button>
          </div>
        </div>

        {/* Top 4 Real Tools Featured Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TOP_4_TOOLS.map((tool, idx) => (
            <div
              key={tool.name}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#1a361d]/40 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between text-left group relative"
            >
              <div className="space-y-4">
                {/* Icon & Badge */}
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 p-2.5 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <img
                      src={tool.iconUrl}
                      alt={tool.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-full rounded-xl bg-slate-900 text-white font-bold text-xs items-center justify-center">
                      {tool.name.slice(0, 2).toUpperCase()}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#d8ffd2] text-[#1a361d] border border-[#76ff8a]/40">
                    #{idx + 1} Flagship
                  </span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[#40844e] uppercase tracking-wider mb-1">
                    {tool.category}
                  </div>
                  <h3 className="text-xl font-display font-bold text-[#1a361d] group-hover:text-[#40844e] transition-colors">
                    {tool.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-slate-500">{tool.badge}</span>
                <CheckCircle2 className="w-4 h-4 text-[#40844e]" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner Trigger */}
        <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center font-bold text-xs shrink-0">
              41
            </div>
            <span>
              <strong>Full Curriculum Toolchain:</strong> From PyTorch & LangChain to Splunk, Kali Linux, Docker, and AWS EKS—all integrated across student lab environments.
            </span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs font-bold text-[#1a361d] hover:text-[#40844e] underline underline-offset-4 shrink-0 cursor-pointer"
          >
            View Complete 41 Tools Matrix →
          </button>
        </div>

      </div>

      {/* Complete 41 Tools Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-hidden flex flex-col text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#2d5c36] uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#40844e]" />
                  <span>Curriculum Architecture</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-extrabold text-[#1a361d]">
                  Complete 41+ Enterprise Tools Catalog
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extracted directly from American FutureTech real syllabus cohorts & laboratory environments.
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
                  placeholder="Search tool by name (e.g. PyTorch, Docker, Splunk, Terraform)..."
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
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-[#1a361d]/30 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-[#2d5c36] bg-[#d8ffd2] px-2 py-0.5 rounded-full">
                        {tool.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {tool.level}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#1a361d] truncate">
                      {tool.name}
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
                Showing {filteredTools.length} of {ALL_41_TOOLS.length} total verified tools
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
