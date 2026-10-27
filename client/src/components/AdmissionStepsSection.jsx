import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, CreditCard, Rocket, UserRound } from 'lucide-react';

/**
 * "Become a student in 4 steps" — the admission route as a live stepper.
 *
 * The nodes advance on their own every few seconds (and on click/arrow keys), so
 * the band demonstrates the process instead of listing it. The moving part is a
 * state change, not an effect: a visitor who prefers reduced motion still gets
 * the full panel, it just waits for a click instead of advancing itself.
 *
 * Deliberately no prices here — the deposit is whatever the checkout quotes, and
 * this block must not become a second source of truth for it.
 */
const STEPS = [
  {
    icon: UserRound,
    label: 'Your details',
    title: 'Tell us who you are',
    body: 'A one-minute account: name, email, password. No entrance exam, no transcripts, no application fee.',
    detail: 'You get the student dashboard immediately, so you can look through the curriculum before paying anything.',
  },
  {
    icon: BookOpen,
    label: 'Choose your course',
    title: 'Pick the track and the cohort',
    body: 'Compare AI Engineering, Cyber Security and Data Science side by side, then choose the start date that fits your week.',
    detail: 'Not sure which one? A 15-minute call with admissions maps your current role to the track that closes the gap fastest.',
  },
  {
    icon: CreditCard,
    label: 'Reserve your seat',
    title: 'Hold your place',
    body: 'A seat deposit reserves your spot in the cohort through the hosted checkout — card, and the options your region supports.',
    detail: 'The deposit and the balance terms are quoted live at checkout; nothing is charged twice and no card details touch our servers.',
  },
  {
    icon: Rocket,
    label: 'Start learning',
    title: 'Onboarding, not paperwork',
    body: 'Orientation call, mentor pairing and your first lab all land in the same week. Modules unlock on the cohort schedule.',
    detail: 'Live sessions are recorded and stay in your library, alongside the notebooks and lab artifacts for every unit.',
  },
];

const STEP_MS = 5200;

export default function AdmissionStepsSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  // Once the visitor picks a step themselves, the band hands them control for
  // good — auto-advancing away from a step someone deliberately opened is the
  // difference between "alive" and "fighting the mouse".
  const [pinned, setPinned] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || paused || pinned) return undefined;

    timer.current = window.setTimeout(
      () => setActive((current) => (current + 1) % STEPS.length),
      STEP_MS,
    );
    return () => window.clearTimeout(timer.current);
  }, [active, paused, pinned]);

  const choose = (index) => {
    setActive(index);
    setPinned(true);
  };

  const step = STEPS[active];
  const Icon = step.icon;

  return (
    <section
      id="admissions"
      className="aft-red-wash aft-red-wash--bold relative overflow-hidden py-14 sm:py-20"
    >
      {/* Third field, warmer than the two the wash paints, so the band does not
          read as a flat slab under the stepper. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[rgb(var(--tw-gold-500)/6%)] blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-heading text-xs font-bold uppercase tracking-widest text-[color:rgb(var(--tw-gold-600))]">
            Admissions
          </span>
          <h2 className="mt-3 font-heading text-2xl font-bold leading-tight tracking-tight text-[color:rgb(var(--tw-ink-900))] sm:text-3xl lg:text-4xl">
            Become a student in four steps
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            It is a short route on purpose. Most applicants finish step one and two in a single
            sitting, and start the cohort the following Monday.
          </p>
        </div>

        {/* Stepper. On phones the rail turns vertical; from lg it is a row. */}
        <div
          className="relative mt-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Rail between the node centres: vertical under lg (nodes sit at
              x≈28px), a row above it (centres at 12.5% … 87.5%). */}
          <div
            aria-hidden="true"
            className="absolute bottom-12 left-[27px] top-12 w-0.5 border-l-2 border-dashed border-[rgb(var(--tw-gold-500)/40%)] lg:hidden"
          />
          <div
            aria-hidden="true"
            className="absolute left-[27px] top-12 w-0.5 rounded-full bg-[rgb(var(--tw-gold-500))] transition-[height] duration-700 ease-out lg:hidden"
            style={{ height: `${(active / (STEPS.length - 1)) * 100 * 0.92}%` }}
          />
          <div
            aria-hidden="true"
            className="absolute left-[12.5%] right-[12.5%] top-[27px] hidden h-0.5 border-t-2 border-dashed border-[rgb(var(--tw-gold-500)/40%)] lg:block"
          />
          <div
            aria-hidden="true"
            className="absolute left-[12.5%] top-[27px] hidden h-0.5 rounded-full bg-[rgb(var(--tw-gold-500))] transition-[width] duration-700 ease-out lg:block"
            style={{ width: `${(active / (STEPS.length - 1)) * 75}%` }}
          />

          <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {STEPS.map(({ icon: StepIcon, label }, index) => {
              const isActive = index === active;
              const isDone = index < active;
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => choose(index)}
                    aria-current={isActive ? 'step' : undefined}
                    className="group flex w-full items-center gap-3 text-left lg:flex-col lg:gap-3 lg:text-center cursor-pointer"
                  >
                    <span
                      className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full border transition-all duration-500 ${
                        isActive
                          ? 'border-transparent bg-[rgb(var(--tw-gold-600))] text-white shadow-[0_14px_30px_-12px_rgb(200_30_30_/_0.75)]'
                          : isDone
                            ? 'border-[rgb(var(--tw-gold-500)/52%)] bg-[#ffdcd4] text-[color:rgb(var(--tw-gold-600))]'
                            : 'border-[rgb(var(--tw-gold-500)/32%)] bg-[#ffe7e2] text-[rgb(var(--tw-ink-900)/55%)]'
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full ring-2 ring-[rgb(var(--tw-gold-500)/45%)] animate-step-ping"
                        />
                      )}
                      {isDone ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                      <span
                        className={`absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold transition-colors ${
                          isActive
                            ? 'bg-white text-[color:rgb(var(--tw-gold-600))]'
                            : 'bg-white/85 text-[color:rgb(var(--tw-gold-600))]'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </span>
                    <span
                      className={`font-heading text-sm font-bold transition-colors sm:text-base ${
                        isActive
                          ? 'text-[color:rgb(var(--tw-ink-900))]'
                          : 'text-gray-500 group-hover:text-[color:rgb(var(--tw-ink-900))]'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* The panel swaps content; keying it on the step restarts the fade. */}
        <div className="aft-red-card mt-10 overflow-hidden rounded-[26px] ring-1 ring-white/20">
          <div key={step.label} className="animate-step-in p-6 sm:p-9">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[color:rgb(var(--tw-gold-600))] ring-1 ring-white/25">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-[#ffc9c4]">
                Step {active + 1} of {STEPS.length}
              </span>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <h3 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-base leading-relaxed text-white/85">{step.body}</p>
              </div>
              <p className="border-l-0 text-sm leading-relaxed text-white/75 lg:col-span-5 lg:border-l lg:border-white/20 lg:pl-6">
                {step.detail}
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-heading text-sm font-bold text-[#8c1c1c] shadow-[0_16px_34px_-18px_rgba(0,0,0,0.7)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/90"
              >
                Start registration
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 font-heading text-sm font-bold text-white transition-colors hover:bg-white/20"
              >
                Compare programs
              </Link>
              <span className="text-xs text-white/75 sm:ml-auto">
                Questions first?{' '}
                <Link
                  to="/contact"
                  className="font-semibold text-white underline underline-offset-2"
                >
                  Talk to admissions
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
