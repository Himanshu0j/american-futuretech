import { CheckCircle2, Clock, Library } from 'lucide-react';

const FEATURES = [
  {
    icon: Clock,
    title: 'Cohort-paced, not clock-paced',
    body: 'Lessons unlock on a schedule, then stay open. Watch a lab at 11pm and bring the question to office hours.',
  },
  {
    icon: Library,
    title: 'Everything attached to the lesson',
    body: 'Slides, notebooks, recordings and lab artifacts live beside the video — nothing to hunt for in chat.',
  },
];

/**
 * "Study anywhere" split band.
 *
 * The photo is licensed stock (Unsplash), stored locally in public/images/scenes
 * so the build's hotlink check stays green and the page does not lean on a CDN.
 */
export default function StudyAnywhereSection() {
  return (
    <section id="study-anywhere" className="aft-red-wash overflow-hidden py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="relative lg:col-span-6">
            <div className="overflow-hidden rounded-[26px] shadow-[0_28px_60px_-32px_rgba(150,26,26,0.5)] ring-1 ring-white/25">
              <img
                src="/images/scenes/study-desk.jpg"
                alt="A laptop, open notebook and coffee on a wooden desk"
                width="1000"
                height="667"
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>

            {/* Small proof chip, floating so the band has one moving element even
                before the visitor scrolls into the feature list. */}
            <div className="aft-blue-card absolute -bottom-5 right-4 flex items-center gap-2.5 rounded-2xl px-4 py-3 ring-1 ring-white/25 animate-float-slow sm:right-8">
              <CheckCircle2 className="h-5 w-5 text-white" />
              <div className="text-left">
                <div className="text-xs font-bold text-white">
                  Progress synced
                </div>
                <div className="text-[11px] text-white/75">Pick up on any device</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <span className="inline-flex items-center rounded-full bg-[rgb(var(--tw-sand-200))] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[color:rgb(var(--tw-ink-900))] font-heading">
              Explore features
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold font-heading tracking-tight leading-tight text-[color:rgb(var(--tw-ink-900))]">
              Study anytime,{' '}
              <span className="text-[color:rgb(var(--tw-blue-700))]">anywhere</span>
            </h2>
            <p className="mt-4 text-base text-gray-600 leading-relaxed">
              Continue across desktop, tablet and phone. Your place in the curriculum, your notes
              and your lab submissions follow you, so a commute never costs you a lesson.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="aft-blue-card group rounded-2xl p-5 ring-1 ring-white/25 transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/85 ring-1 ring-[rgb(var(--tw-gold-500)/38%)] transition-all duration-300 group-hover:-translate-y-1">
                    <Icon className="h-5 w-5 text-[color:rgb(var(--tw-gold-600))]" />
                  </div>
                  <h3 className="mt-3.5 font-heading text-base font-bold text-white">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm text-white/85 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
