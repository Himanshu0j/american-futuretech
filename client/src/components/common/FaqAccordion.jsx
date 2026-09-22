import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import BulletContent from './BulletContent';

export default function FaqAccordion({
  category = null, // e.g. 'Career Programs', 'Personalized Learning', 'Capstone', 'Live Jobs', 'Enrollment', or null for category tabs
  title = 'Frequently Asked Questions',
  subtitle = 'Everything you need to know about curriculum, tuition, and placement.',
  showCategoryFilter = false,
  limit = undefined,
  className = '',
}) {
  const [allFaqs, setAllFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(category || 'All');
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    fetchAllFaqs();
  }, []);

  const fetchAllFaqs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/content/faqs');
      if (res.data.success) {
        setAllFaqs(res.data.faqs || []);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const DEFAULT_FALLBACK_FAQS = {
    'live jobs': [
      {
        _id: 'default-lj-1',
        question: 'How does the corporate placement referral process work?',
        answer: 'Once you complete 70% of your program curriculum and pass your capstone review, our Corporate Placement Office directly introduces your vetted portfolio and ATS-optimized resume to verified hiring partners across our network of 140+ technology companies.',
        category: 'Live Jobs',
      },
      {
        _id: 'default-lj-2',
        question: 'What types of roles and companies hire American FutureTech graduates?',
        answer: 'Graduates are hired into high-growth engineering roles including Data Scientist, Machine Learning Engineer, SOC Analyst, Penetration Tester, Cloud DevOps Engineer, and AI Product Manager across Fortune 500 enterprises and high-growth technology companies.',
        category: 'Live Jobs',
      },
      {
        _id: 'default-lj-3',
        question: 'Are these positions open to international candidates or US-only?',
        answer: 'We list a mix of on-site US, hybrid, and global remote opportunities. Each job card clearly outlines work authorization requirements, OPT/CPT eligibility, and visa sponsorship availability (e.g. H1B transfer support or international contractor agreements).',
        category: 'Live Jobs',
      },
      {
        _id: 'default-lj-4',
        question: 'What compensation ranges can I expect for these partner roles?',
        answer: 'Entry-level engineering packages typically range from $85,000 to $115,000 base. Mid-to-senior specialized roles in Applied AI, Cybersecurity, and Cloud Architecture command $130,000 to $185,000+ total compensation.',
        category: 'Live Jobs',
      },
      {
        _id: 'default-lj-5',
        question: 'How does the Fast-Track Placement Concierge work if I do not see my exact role?',
        answer: 'Submit your resume through the Fast-Track Application form on the sidebar. Our placement directors conduct an unlisted partner scan and pair your background directly with upcoming openings within 48 to 72 business hours.',
        category: 'Live Jobs',
      },
      {
        _id: 'default-lj-6',
        question: 'Do hiring partners directly review American FutureTech capstone projects?',
        answer: 'Yes! Our curriculum capstones are built to enterprise production specifications. Hiring partner engineering leads review your GitHub repositories, architecture documentation, and live demo recordings during technical evaluation.',
        category: 'Live Jobs',
      }
    ]
  };

  const dynamicCategories = ['All', ...Array.from(new Set(allFaqs.map((f) => f.category).filter(Boolean)))];

  const targetCategory = (category || activeCategory || '').toLowerCase();
  const rawFiltered = allFaqs.filter((faq) => {
    if (!targetCategory || targetCategory === 'all') return true;
    return faq.category?.toLowerCase() === targetCategory;
  });

  // Fallback to rich pre-configured FAQs if database has no entries for this specific category
  const filteredFaqs = rawFiltered.length > 0 
    ? rawFiltered 
    : (DEFAULT_FALLBACK_FAQS[targetCategory] || []);

  const displayFaqs = typeof limit === 'number' ? filteredFaqs.slice(0, limit) : filteredFaqs;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Optional Header */}
      {title && (
        <div className="text-left space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>KNOWLEDGEBASE & DISCLOSURES</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Category Pills (if requested) */}
      {showCategoryFilter && !category && (
        <div className="flex flex-wrap gap-2 pb-2">
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setOpenIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Accordion Body */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : displayFaqs.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No FAQs currently listed under this category.
        </div>
      ) : (
        <div className="space-y-3">
          {displayFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={faq._id || idx}
                className={`rounded-2xl transition-all duration-200 border ${
                  isOpen
                    ? 'bg-white dark:bg-slate-900 border-indigo-500/50 dark:border-indigo-500/60 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                } overflow-hidden text-left`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      Q
                    </span>
                    <span className="text-sm sm:text-base font-display font-bold text-slate-900 dark:text-white leading-snug">
                      {faq.question}
                    </span>
                  </div>

                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800">
                        <BulletContent content={faq.answer} as="auto" bulletType="check" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Link to Dedicated Knowledgebase */}
      <div className="pt-2 text-center">
        <a
          href="/faq"
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline transition-colors"
        >
          <span>Have more questions? Browse all disclosures & academic FAQs</span>
          <Sparkles className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
