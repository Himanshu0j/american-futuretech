import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowUpRight } from 'lucide-react';

/**
 * "What our learners say" — three speech bubbles.
 *
 * The quotes are not written here: they come from the same CMS-managed alumni
 * stories the Success Stories page reads (/api/content/success-stories), so the
 * client edits a quote once and it changes in both places. If the endpoint is
 * unreachable or has no stories the section renders nothing rather than
 * inventing a testimonial.
 *
 * Bubble tails are pseudo elements; `background: inherit` keeps a tail the same
 * colour as its bubble without repeating the value three times.
 */
const VARIANTS = ['sand', 'deep', 'cream'];

const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export default function LearnerVoicesSection() {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    let alive = true;
    axios
      .get('/api/content/success-stories')
      .then((res) => {
        if (!alive) return;
        const all = Array.isArray(res.data?.stories) ? res.data.stories : [];
        // Featured first, then the highest rated — the three that best represent
        // the school without cherry-picking the longest paragraphs.
        const ranked = [...all].sort((a, b) => {
          const featured = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
          if (featured) return featured;
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        });
        setStories(
          ranked
            .filter((story) => String(story.testimonial || '').trim().length > 40)
            .slice(0, 3),
        );
      })
      .catch(() => {
        // A quiet failure is right here: the band is social proof, not a feature.
        if (alive) setStories([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!stories.length) return null;

  return (
    <section id="learner-voices" className="aft-cloud relative overflow-hidden bg-[#fffcf9] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <span className="block font-heading text-xs font-bold uppercase tracking-widest text-[color:rgb(var(--tw-gold-600))]">
              Alumni
            </span>
            <h2 className="mt-3 inline-block font-heading text-2xl font-bold leading-tight tracking-tight text-[color:rgb(var(--tw-ink-900))] sm:text-3xl lg:text-4xl">
              What our learners say
              {/* Hand-drawn underline, the sketch-book gesture from the reference. */}
              <svg
                aria-hidden="true"
                viewBox="0 0 240 12"
                className="mt-1 block h-2.5 w-52 text-[color:rgb(var(--tw-gold-500))] sm:w-64"
              >
                <path
                  d="M2 8c34-6 68 2 102-3s70 1 104-3c-30 8-64 3-98 7S36 12 2 8Z"
                  fill="currentColor"
                  opacity="0.75"
                />
              </svg>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Every quote below belongs to a graduate whose record is in our alumni database — same
              words they wrote for the Success Stories page, not marketing copy.
            </p>
          </div>

          <Link
            to="/success-stories"
            className="inline-flex shrink-0 items-center gap-1.5 self-start font-heading text-xs font-bold text-[color:rgb(var(--tw-gold-600))] underline-offset-4 hover:underline sm:self-auto"
          >
            Read all stories
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          {stories.map((story, index) => (
            <figure
              key={story._id || story.studentName}
              className={`aft-bubble aft-bubble--${VARIANTS[index % VARIANTS.length]} ${
                index === 1 ? 'md:mt-8' : index === 2 ? 'md:mt-16' : ''
              }`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 18"
                className="aft-bubble__mark h-4 w-6"
              >
                <path
                  d="M0 18C0 8 4 2 12 0c-4 4-5 7-5 9 3 0 5 2 5 4.5S10 18 7 18H0Zm13 0c0-10 4-16 11-18-4 4-5 7-5 9 3 0 5 2 5 4.5S21 18 18 18h-5Z"
                  fill="currentColor"
                />
              </svg>

              <blockquote className="mt-3 text-sm leading-relaxed sm:text-[15px]">
                “{story.testimonial}”
              </blockquote>

              <figcaption className="aft-bubble__who mt-4 flex items-center gap-3">
                {story.photo ? (
                  <img
                    src={story.photo}
                    alt=""
                    width="40"
                    height="40"
                    loading="lazy"
                    decoding="async"
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white/60"
                  />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/70 font-heading text-xs font-bold text-[color:rgb(var(--tw-ink-900))]">
                    {initialsOf(story.studentName)}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="font-heading text-xs font-bold">{story.studentName}</div>
                  <div className="text-[11px] opacity-80">
                    {[story.role, story.company].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {Number(story.salaryHikePercent) > 0 && (
                  <span className="aft-bubble__badge ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
                    +{story.salaryHikePercent}%
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
