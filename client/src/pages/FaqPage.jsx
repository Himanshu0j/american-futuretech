import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, PhoneCall } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import CompanyMarquee from '../components/CompanyMarquee';
import Footer from '../components/Footer';
import LeadModal from '../components/LeadModal';

export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  useEffect(() => {
    fetchFaqs();
    window.scrollTo(0, 0);
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await axios.get('/api/content/faqs');
      setFaqs(res.data.faqs || []);
    } catch (err) {
      console.error('Failed to load FAQs', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Admissions & Fees', 'Curriculum & Projects', 'Career & Placement', 'Certifications'];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      <main className="pt-28 sm:pt-32 pb-14 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">

        <CompanyMarquee />        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-semibold mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-[#2d5c36]" />
            <span>Academic Disclosures & FAQs</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#1a361d] mb-4">
            Frequently Asked <span className="highlight">Questions</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Detailed answers regarding tuition plans, the flexible $99 seat reservation, cohort schedules, live labs, and career support services.
          </p>
        </div>

        {/* Search & Category Pills */}
        <div className="space-y-4 mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search knowledgebase (e.g. refund policy, prerequisites, placement rate)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] shadow-xs transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1a361d] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs Accordion */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[#1a361d]/20 border-t-[#1a361d] rounded-full animate-spin" />
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-display font-bold text-[#1a361d] mb-1">No matching questions found</h3>
            <p className="text-slate-500 text-xs">Try an alternate search query or speak with our admissions officers directly.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-10">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq._id || index}
                  className={`rounded-2xl transition-all border ${
                    isOpen
                      ? 'bg-white border-[#1a361d]/40 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-[#1a361d]/25 shadow-xs'
                  } overflow-hidden`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-display font-bold text-[#1a361d] leading-snug">
                      {faq.question}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isOpen ? 'bg-[#d8ffd2] text-[#1a361d]' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Academic Callback Card */}
        <div className="p-6 sm:p-6 rounded-3xl bg-[#1a361d] text-white border border-[#2d5c36] text-center shadow-lg">
          <h3 className="text-xl font-display font-bold text-white mb-2">Need direct guidance on tracks?</h3>
          <p className="text-xs sm:text-sm text-emerald-100 mb-6 max-w-md mx-auto leading-relaxed">
            Our admissions directors in Sheridan, Wyoming and online faculty provide personalized curriculum reviews.
          </p>
          <button
            onClick={() => setIsLeadModalOpen(true)}
            className="py-3 px-7 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white font-bold text-xs inline-flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            Request Free Academic Callback
          </button>
        </div>
      </main>

      <Footer onOpenLeadModal={() => setIsLeadModalOpen(true)} />
      <LeadModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
    </div>
  );
}
