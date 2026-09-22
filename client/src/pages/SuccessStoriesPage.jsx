import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Building2, Quote, ArrowRight, Award, CheckCircle2, ShieldCheck, Check } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import CompanyMarquee from '../components/CompanyMarquee';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function SuccessStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
    window.scrollTo(0, 0);
  }, []);

  const fetchStories = async () => {
    try {
      const res = await axios.get('/api/content/success-stories');
      setStories(res.data.stories || []);
    } catch (err) {
      console.error('Failed to load success stories', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar />

      <main className="pt-28 pb-20">

        <CompanyMarquee />        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center pt-8 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-semibold mb-4">
            <TrendingUp className="w-3.5 h-3.5 text-[#2d5c36]" />
            <span>VERIFIED GRADUATE OUTCOMES</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-[#1a361d] mb-6">
            Real Alumni <span className="highlight">Career Transformations</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Examine how American FutureTech students transitioned from traditional engineering, non-tech, and junior backgrounds into specialized engineering and leadership roles across major enterprises.
          </p>
        </section>

        {/* Proof Ledger */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mb-16">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-left divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              <div className="pt-4 lg:pt-0 lg:px-4 first:px-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Placement Rate</div>
                <div className="text-2xl sm:text-3xl font-display font-black text-[#1a361d] mt-1">94.2%</div>
                <div className="text-xs text-slate-500 mt-0.5">Employed within 180 days</div>
              </div>
              <div className="pt-4 lg:pt-0 lg:px-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Salary Uplift</div>
                <div className="text-2xl sm:text-3xl font-display font-black text-[#2d5c36] mt-1">+138%</div>
                <div className="text-xs text-slate-500 mt-0.5">Average compensation gain</div>
              </div>
              <div className="pt-4 lg:pt-0 lg:px-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hiring Network</div>
                <div className="text-2xl sm:text-3xl font-display font-black text-[#1a361d] mt-1">100+</div>
                <div className="text-xs text-slate-500 mt-0.5">US & international partners</div>
              </div>
              <div className="pt-4 lg:pt-0 lg:px-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alumni Rating</div>
                <div className="text-2xl sm:text-3xl font-display font-black text-amber-500 mt-1">4.9 / 5.0</div>
                <div className="text-xs text-slate-500 mt-0.5">From 320+ verified evaluations</div>
              </div>
            </div>
          </div>
        </section>

        {/* Stories Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mb-20">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#1a361d]/20 border-t-[#1a361d] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stories.map((story) => (
                <div
                  key={story._id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between text-left shadow-xs hover:border-[#1a361d]/30 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(story.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] font-semibold text-[#1a361d] bg-[#d8ffd2] px-2 py-0.5 rounded-full">
                        Verified Alumni
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 italic">
                      "{story.testimonial}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                    <img
                      src={story.photo}
                      alt={story.studentName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#76ff8a] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-display font-bold text-[#1a361d] truncate">{story.studentName}</div>
                      <div className="text-[11px] text-[#2d5c36] font-semibold truncate">{story.role} @ {story.company}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{story.course}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="bg-[#1a361d] text-white border border-[#2d5c36] rounded-3xl p-8 sm:p-12 text-center shadow-lg">
            <span className="text-xs font-semibold text-[#76ff8a] uppercase tracking-wider block mb-2">
              ADMISSIONS ARE OPEN
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
              Your Engineering Breakthrough Begins Here
            </h3>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              Join ambitious practitioners who transformed their capabilities, portfolios, and careers with American FutureTech live cohort fellowships.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/courses"
                className="py-3 px-7 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white text-xs font-bold transition-colors shadow-sm"
              >
                Browse Specialization Tracks &rarr;
              </Link>
              <Link
                to="/contact"
                className="py-3 px-6 rounded-full border border-white/40 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
              >
                Schedule Admissions Call
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
