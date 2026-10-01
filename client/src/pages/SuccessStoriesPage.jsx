import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Building2, Quote, ArrowRight, Award, CheckCircle2, ShieldCheck, Check } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TrustMarquee from '../components/TrustMarquee';
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
    <div className="min-h-screen bg-[#F7F7F5] text-slate-800 font-sans antialiased selection:bg-[#F00000] selection:text-[#002060] relative">
      <Navbar />

      <main className="pt-28 pb-10">

        <TrustMarquee />        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center pt-8 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCE7E7] border border-[#F00000]/40 text-[#002060] text-xs font-semibold mb-4">
            <TrendingUp className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>VERIFIED GRADUATE OUTCOMES</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-[#002060] mb-6">
            Real Alumni <span className="highlight">Career Transformations</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Examine how American FutureTech students transitioned from traditional engineering, non-tech, and junior backgrounds into specialized engineering and leadership roles across major enterprises.
          </p>
        </section>

        {/* Proof Ledger */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-6 shadow-xs">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-left divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              <div className="pt-4 lg:pt-0 lg:px-4 first:px-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Placement Rate</div>
                <div className="text-xl sm:text-2xl font-display font-black text-[#002060] mt-1">94.2%</div>
                <div className="text-xs text-slate-500 mt-0.5">Employed within 180 days</div>
              </div>
              <div className="pt-4 lg:pt-0 lg:px-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Salary Uplift</div>
                <div className="text-xl sm:text-2xl font-display font-black text-[#1D4ED8] mt-1">+138%</div>
                <div className="text-xs text-slate-500 mt-0.5">Average compensation gain</div>
              </div>
              <div className="pt-4 lg:pt-0 lg:px-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hiring Network</div>
                <div className="text-xl sm:text-2xl font-display font-black text-[#002060] mt-1">100+</div>
                <div className="text-xs text-slate-500 mt-0.5">US & international partners</div>
              </div>
              <div className="pt-4 lg:pt-0 lg:px-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alumni Rating</div>
                <div className="text-xl sm:text-2xl font-display font-black text-red-700 mt-1">4.9 / 5.0</div>
                <div className="text-xs text-slate-500 mt-0.5">From 320+ verified evaluations</div>
              </div>
            </div>
          </div>
        </section>

        {/* Stories Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mb-12">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-[#002060]/20 border-t-[#002060] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stories.map((story) => (
                <div
                  key={story._id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between text-left shadow-xs hover:border-[#002060]/30 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1 text-red-400">
                        {[...Array(story.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-red-400" />
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Number(story.salaryHikePercent) > 0 && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                            +{story.salaryHikePercent}% Salary
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-[#002060] bg-[#FCE7E7] px-2 py-0.5 rounded-full whitespace-nowrap">
                          Verified Alumni
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 italic">
                      "{story.testimonial}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                    <img
                      src={story.photo}
                      alt={story.studentName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#F00000] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-display font-bold text-[#002060] truncate">{story.studentName}</div>
                      <div className="text-[11px] text-[#1D4ED8] font-semibold truncate">{story.role} @ {story.company}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{story.course}</div>
                      {story.graduationYear && (
                        <div className="text-[10px] text-slate-600 truncate mt-0.5">Class of {story.graduationYear}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="bg-[#002060] text-white border border-[#1D4ED8] rounded-3xl p-6 sm:p-7 text-center shadow-lg">
            <span className="text-xs font-semibold text-[#FF6B6B] uppercase tracking-wider block mb-2">
              ADMISSIONS ARE OPEN
            </span>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-3">
              Your Engineering Breakthrough Begins Here
            </h3>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              Join ambitious practitioners who transformed their capabilities, portfolios, and careers with American FutureTech live cohort fellowships.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/courses"
                className="py-3 px-7 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold transition-colors shadow-sm"
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
