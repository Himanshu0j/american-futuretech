import { Award, BookMarked, MessagesSquare, Library } from 'lucide-react';

/**
 * "Why we are different" — four pillars strung along a dashed path.
 *
 * The connector is a real SVG path rather than a background image, so the dashes
 * can march (see .aft-dash-flow in index.css) and stay crisp at any width. Below
 * the lg breakpoint the path is hidden and the pillars stack: a curved line
 * across two columns reads as noise, not as a route.
 */
const PILLARS = [
  {
    icon: Award,
    title: 'Mentors who ship',
    body: 'Faculty pulled from working engineering teams, not full-time trainers.',
  },
  {
    icon: BookMarked,
    title: 'A curriculum that builds',
    body: 'Every module ends in a lab that goes straight into your portfolio.',
  },
  {
    icon: MessagesSquare,
    title: '1-on-1 support',
    body: 'Weekly sessions with your own mentor instead of a ticket queue.',
  },
  {
    icon: Library,
    title: 'Resources that stay',
    body: 'Notes, recordings and code remain yours after the cohort ends.',
  },
];

export default function DifferentiatorsSection() {
  return (
    <section id="why-different" className="aft-red-wash aft-red-wash--bold relative py-14 sm:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold tracking-widest text-[color:rgb(var(--tw-blue-700))] uppercase font-heading">
            The difference
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold font-heading tracking-tight text-[color:rgb(var(--tw-ink-900))] leading-tight">
            Why we are different from others
          </h2>
          <p className="mt-3 text-base text-gray-600 leading-relaxed">
            Small cohorts, working mentors, and a route through the curriculum that has a beginning,
            a middle and a job at the end of it.
          </p>
        </div>

        <div className="relative mt-12">
          {/* Height is the icon row (80px) and nothing more: the curve has to
              thread the four circles, not wander down through the copy under
              them. Odd pillars sit 40px lower, so the path alternates 34/66. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 80"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 top-6 hidden h-20 w-full lg:block"
          >
            <path
              d="M 150 32 C 262 32, 326 72, 450 72 S 662 32, 750 32 S 912 72, 1050 72"
              fill="none"
              stroke="rgba(200, 30, 30, 0.3)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="7 11"
              className="aft-dash-flow"
            />
          </svg>

          {/* No gap at lg: with four equal 25% columns the node centres sit at
              12.5 / 37.5 / 62.5 / 87.5% at every width, which is exactly where
              the path below starts, dips and ends. A fixed gap would break that
              alignment as soon as the container narrowed. */}
          <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {PILLARS.map(({ icon: Icon, title, body }, index) => (
              <div
                key={title}
                className={`text-center ${index % 2 === 1 ? 'lg:translate-y-10' : ''}`}
              >
                <div className="aft-red-card mx-2 rounded-[22px] px-5 py-6 ring-1 ring-white/25">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/85 ring-1 ring-[rgb(var(--tw-gold-500)/38%)] transition-transform duration-500 ease-spring hover:-translate-y-1.5 hover:rotate-3">
                    <Icon className="h-7 w-7 text-[color:rgb(var(--tw-gold-600))]" />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-bold text-white">
                    {title}
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-[34ch] text-sm text-white/85 leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
