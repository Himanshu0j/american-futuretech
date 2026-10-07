import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Star, TrendingUp, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PageBanner from '../components/PageBanner';
import TrustMarquee from '../components/TrustMarquee';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

/**
 * Cards visible at once. The carousel is measured in whole cards, so every
 * breakpoint has its own step width.
 */
const slidesFor = (width) => {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  return 3;
};

const AUTOPLAY_MS = 4500;

/**
 * Last-resort avatar: an inline monogram. The portrait hosts are third-party, so
 * a story must still look finished when one is unreachable (or blocked by a
 * strict img-src policy) — and because this is a data URI it can never fail a
 * second time, which also keeps onError from re-firing forever.
 */
const initialsAvatar = (name) => {
  const initials = String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || '')
    .join('')
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#002060"/><text x="48" y="61" font-family="Helvetica,Arial,sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export default function SuccessStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carousel state. `index` is the first visible card, not a page number, so the
  // last step can land exactly on the final card instead of leaving a hole.
  const [perPage, setPerPage] = useState(() =>
    slidesFor(typeof window === 'undefined' ? 1280 : window.innerWidth)
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    fetchStories();
    window.scrollTo(0, 0);
  }, []);

  // Responsive step width — a resize can leave `index` past the new end, which
  // the clamp effect below fixes.
  useEffect(() => {
    const onResize = () => setPerPage(slidesFor(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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

  const visibleCount = Math.min(perPage, Math.max(stories.length, 1));
  const slideWidth = 100 / visibleCount;
  const maxIndex = Math.max(0, stories.length - visibleCount);

  useEffect(() => {
    setIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  const goNext = useCallback(() => {
    setIndex((current) => (current >= maxIndex ? 0 : current + 1));
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setIndex((current) => (current <= 0 ? maxIndex : current - 1));
  }, [maxIndex]);

  // Auto-slide through every story. Nothing ambient stops it: pausing on hover
  // would freeze the wall for as long as a visitor's cursor rests anywhere over
  // it — which, right after scrolling to the section, is always. Only the pause
  // button stops it (and a background tab, which has nobody watching).
  useEffect(() => {
    if (paused || stories.length <= visibleCount) return undefined;
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      goNext();
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, stories.length, visibleCount, goNext]);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    }
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches?.[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current == null) return;
    const delta = (event.changedTouches?.[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  const progress = stories.length
    ? Math.min(100, ((index + visibleCount) / stories.length) * 100)
    : 0;

  const controlClass =
    'p-2.5 rounded-full border border-slate-200 bg-white text-[#002060] hover:border-[#002060]/40 hover:text-[#1D4ED8] shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-800 font-sans antialiased selection:bg-[#F00000] selection:text-[#002060] relative">
      <Navbar />

      {/* Admin photo strip (Content → Website Images). */}
      <PageBanner pageKey="success-stories" />

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

        {/* Stories Carousel — every verified alumni story slides through here. */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mb-12">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-[#002060]/20 border-t-[#002060] rounded-full animate-spin" />
            </div>
          ) : stories.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              Alumni stories are being verified right now — please check back shortly.
            </div>
          ) : (
            <div
              role="region"
              aria-roledescription="carousel"
              aria-label="Verified alumni success stories"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              className="rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/40"
            >
              <div className="flex flex-wrap items-end justify-between gap-4 mb-5 text-left">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Alumni Voices</div>
                  <h2 className="text-lg sm:text-2xl font-display font-extrabold text-[#002060] mt-1">
                    {stories.length} verified graduate stories
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaused((value) => !value)}
                    aria-label={paused ? 'Resume automatic sliding' : 'Pause automatic sliding'}
                    aria-pressed={paused}
                    className={controlClass}
                  >
                    {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Show previous alumni stories"
                    disabled={stories.length <= visibleCount}
                    className={controlClass}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Show next alumni stories"
                    disabled={stories.length <= visibleCount}
                    className={controlClass}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* -mx-3 lets the first card line up with the sections above while
                  each slide keeps a 12px gutter for the next one. */}
              <div
                className="relative overflow-hidden -mx-3"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="story-carousel-track flex transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${index * slideWidth}%)` }}
                >
                  {stories.map((story, storyIndex) => {
                    const onScreen = storyIndex >= index && storyIndex < index + visibleCount;
                    const stars = Math.max(1, Math.min(5, Math.round(Number(story.rating) || 5)));
                    return (
                      <div
                        key={story._id}
                        aria-hidden={!onScreen}
                        className="shrink-0 px-3"
                        style={{ width: `${slideWidth}%` }}
                      >
                        <article className="h-full bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between text-left shadow-xs hover:border-[#002060]/30 hover:shadow-md transition-all">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-4">
                              <div className="flex items-center gap-1 text-red-400">
                                {[...Array(stars)].map((_, starIndex) => (
                                  <Star key={starIndex} className="w-3.5 h-3.5 fill-red-400" />
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
                              loading={storyIndex < visibleCount * 2 ? 'eager' : 'lazy'}
                              onError={(event) => {
                                const image = event.currentTarget;
                                if (image.dataset.fallbackApplied) return;
                                image.dataset.fallbackApplied = 'true';
                                image.src = initialsAvatar(story.studentName);
                              }}
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
                        </article>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-[#1D4ED8] transition-[width] duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-[11px] font-semibold text-slate-500 whitespace-nowrap" aria-live="polite">
                  Showing {index + 1}–{Math.min(index + visibleCount, stories.length)} of {stories.length}
                </div>
              </div>
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
