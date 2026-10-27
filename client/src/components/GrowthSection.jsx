import { Link } from 'react-router-dom';
import { ArrowRight, Quote, Sparkles, Star } from 'lucide-react';

/**
 * "Grow your skills with experts" — the mentorship band.
 *
 * The portrait sits in an arch so the block reads as a person, not another
 * rectangle next to the copy; the quote card overlaps its foot on desktop and
 * drops underneath on phones. Both photos are real photography already licensed
 * for this site and served locally (the build's hotlink guard would reject a
 * remote CDN URL anyway).
 */
export default function GrowthSection() {
  return (
    <section id="grow-with-experts" className="aft-red-wash relative overflow-hidden py-14 sm:py-20">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Copy */}
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-widest text-[color:rgb(var(--tw-blue-700))]">
              <Sparkles className="h-3.5 w-3.5" />
              Learn with experts
            </span>
            <h2 className="mt-3 font-heading text-2xl font-bold leading-tight tracking-tight text-[color:rgb(var(--tw-ink-900))] sm:text-3xl lg:text-4xl">
              Grow your skills with{' '}
              <span className="text-[color:rgb(var(--tw-blue-700))]">experts</span> beside you
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600">
              A group of working practitioners stands behind every cohort. They review your code,
              sit on your defense panel, and take the call when an interview lands — so your value
              moves up a level, not just your certificate count.
            </p>

            <dl className="aft-red-card mt-8 grid max-w-md grid-cols-2 gap-6 rounded-2xl p-5 ring-1 ring-white/25">
              <div>
                <dt className="font-heading text-2xl font-bold text-white">
                  12 yrs
                </dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-white/80">
                  median practitioner experience across the faculty
                </dd>
              </div>
              <div>
                <dt className="font-heading text-2xl font-bold text-white">
                  Weekly
                </dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-white/80">
                  1-on-1 reviews with your own assigned mentor
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[rgb(var(--tw-blue-700))] px-6 py-3 font-heading text-sm font-bold text-white shadow-[0_16px_34px_-18px_rgba(37,99,235,0.9)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Enrol now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgb(var(--tw-ink-900)/15%)] px-6 py-3 font-heading text-sm font-bold text-[color:rgb(var(--tw-ink-900))] transition-colors hover:bg-[rgb(var(--tw-sand-200))]"
              >
                Explore programs
              </Link>
            </div>
          </div>

          {/* Portrait in an arch, quote card tucked under it */}
          <div className="relative lg:col-span-7">
            {/* Backdrop: a mint arch sitting a few pixels proud of the photo, so
                the portrait reads as layered rather than pasted on a card, plus a
                single green disc behind the shoulder for depth. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-2 left-[15%] right-[1%] rounded-[240px_240px_44px_44px] bg-[#FBE9E9]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 top-0 h-40 w-40 rounded-full bg-[rgb(var(--tw-sand-200)/70%)] blur-2xl"
            />

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-[78%] overflow-hidden rounded-[200px_200px_28px_28px] ring-1 ring-[rgb(var(--tw-ink-900)/10%)] shadow-[0_40px_70px_-40px_rgba(15,27,17,0.6)] sm:w-[66%] lg:w-[72%]">
                <img
                  src="/images/career-acceleration.jpg"
                  alt="A graduate holding a laptop by a window"
                  width="534"
                  height="800"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[3/4] w-full object-cover transition-transform duration-[1100ms] ease-out hover:scale-[1.04]"
                />
              </div>

              <div className="aft-red-card absolute left-[13%] top-[6%] hidden items-center gap-2 rounded-2xl px-4 py-3 ring-1 ring-white/25 animate-float-slow sm:flex">
                <Star className="h-4 w-4 text-[#FFC86B]" />
                <div>
                  <div className="font-heading text-xs font-bold text-white">
                    4.9 / 5
                  </div>
                  <div className="text-[11px] text-white/75">alumni rating</div>
                </div>
              </div>
            </div>

            <figure className="aft-red-card relative mx-auto -mt-10 w-[92%] max-w-lg rounded-2xl p-5 ring-1 ring-white/25 sm:-mt-16 sm:ml-0 lg:-mt-14 lg:w-[86%]">
              <Quote className="absolute -top-3 left-5 h-7 w-7 rounded-full bg-white p-1.5 text-[color:rgb(var(--tw-gold-600))]" />
              <blockquote className="mt-2 text-sm leading-relaxed text-white/90">
                They did not just teach the stack. They reviewed every pull request until it was
                merge-able, and that is what got me through the interviews.
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-white/20 pt-3.5">
                <img
                  src="/images/avatars/priya-sharma.webp"
                  alt=""
                  width="40"
                  height="40"
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-white/30"
                />
                <div className="min-w-0">
                  <div className="font-heading text-xs font-bold text-white">
                    Priya Sharma
                  </div>
                  <div className="text-[11px] text-white/75">AI Engineering cohort</div>
                </div>
                <Link
                  to="/success-stories"
                  className="ml-auto shrink-0 text-[11px] font-bold text-white underline-offset-2 hover:underline"
                >
                  More stories
                </Link>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
