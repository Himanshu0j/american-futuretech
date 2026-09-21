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
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(category || 'All');
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    fetchFaqs();
  }, [category, activeCategory]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const targetCat = category || (activeCategory !== 'All' ? activeCategory : undefined);
      const url = targetCat ? `/api/content/faqs?category=${encodeURIComponent(targetCat)}` : '/api/content/faqs';
      const res = await axios.get(url);
      if (res.data.success) {
        let items = res.data.faqs || [];
        if (typeof limit === 'number') {
          items = items.slice(0, limit);
        }
        setFaqs(items);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'All',
    'Career Programs',
    'Personalized Learning',
    'Capstone',
    'Live Jobs',
    'Enrollment',
    '$99 Reservation',
    'Admissions & Fees',
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Optional Header */}
      {title && (
        <div className="text-left space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-[#2d5c36]" />
            <span>KNOWLEDGEBASE & DISCLOSURES</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#1a361d] tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Category Pills (if requested) */}
      {showCategoryFilter && !category && (
        <div className="flex flex-wrap gap-2 pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setOpenIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#1a361d] text-white font-bold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
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
            <div key={n} className="h-16 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
          No FAQs currently listed under this category.
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={faq._id || idx}
                className={`rounded-2xl transition-all duration-200 border ${
                  isOpen
                    ? 'bg-white border-[#1a361d]/40 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                } overflow-hidden text-left`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#d8ffd2] text-[#1a361d] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      Q
                    </span>
                    <span className="text-sm sm:text-base font-display font-bold text-[#1a361d] leading-snug">
                      {faq.question}
                    </span>
                  </div>

                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isOpen ? 'bg-[#1a361d] text-[#76ff8a]' : 'bg-slate-100 text-slate-500'
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
                      <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100/80">
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
    </div>
  );
}
