import React from 'react';
import { XCircle, CheckCircle2, Plus, Minus } from 'lucide-react';

/**
 * "What American FutureTech Is – And Is Not"
 *
 * A trust-building section that confronts the four assumptions the client hears
 * most often and answers each with the concrete fact. The left column (Common
 * Assumptions) is painted in the brand RED ramp; the right column (The Facts) in
 * the brand BLUE ramp — the same blue/red the rest of the site uses, so it reads
 * as part of the system rather than a bolted-on block.
 *
 * The rows are paired 1:1 (same vertical rhythm, matching baselines) so a
 * visitor's eye can travel straight across from a myth to its correction.
 */
const PAIRS = [
  {
    assumption: 'Just another pre-recorded online course',
    fact: 'Live, instructor-led weekend sessions',
  },
  {
    assumption: 'A “get-rich-quick” scheme with no work',
    fact: 'Intensive 6+ month career transition effort',
  },
  {
    assumption: 'A platform that collects sensitive data like SSN',
    fact: 'US Registered; We explicitly do NOT collect SSN',
  },
  {
    assumption: 'Hands-off learning without instructor access',
    fact: 'Dedicated career advisors and active placement',
  },
];

export default function WhatIsSection() {
  return (
    <section
      id="what-we-are"
      className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-ink-950 relative overflow-hidden"
    >
      {/* Faint ambient wash so the block sits in the page's premium canvas */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-60 [background:radial-gradient(70%_50%_at_50%_0%,rgb(var(--tw-blue-100)/70%),transparent_70%)] dark:[background:radial-gradient(70%_50%_at_50%_0%,rgb(var(--tw-ink-800)/60%),transparent_70%)]"
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Heading chip — mirrors the site's rounded "pill" section headers */}
        <div className="flex justify-center mb-10 sm:mb-12">
          <h2 className="inline-flex items-center px-5 sm:px-7 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xl sm:text-2xl font-heading font-bold text-[color:rgb(var(--tw-ink-900))] dark:text-white tracking-tight">
            What American FutureTech Is - And Is Not
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* ── LEFT: Common Assumptions (brand red) ───────────────────── */}
          <div className="relative rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
            {/* Red accent spine */}
            <div className="absolute left-0 top-6 bottom-6 w-1.5 rounded-full bg-gradient-to-b from-[rgb(var(--tw-gold-500))] to-[rgb(var(--tw-gold-600)/40%)]" />

            <div className="flex items-center gap-3 mb-6 pl-3">
              <div className="w-10 h-10 rounded-2xl bg-[rgb(var(--tw-sand-200))] text-[color:rgb(var(--tw-gold-600))] border border-[rgb(var(--tw-gold-500)/30%)] flex items-center justify-center shadow-2xs">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-heading font-bold text-[color:rgb(var(--tw-gold-600))]">
                Common Assumptions
              </h3>
            </div>

            <ul className="space-y-4 pl-3">
              {PAIRS.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Minus className="w-4 h-4 mt-0.5 text-[color:rgb(var(--tw-gold-500))] shrink-0" />
                  <span className="text-sm sm:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {p.assumption}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── RIGHT: The Facts (brand blue) ──────────────────────────── */}
          <div className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            {/* Blue accent spine */}
            <div className="absolute left-0 top-6 bottom-6 w-1.5 rounded-full bg-gradient-to-b from-[rgb(var(--tw-blue-700))] to-[rgb(var(--tw-blue-700)/30%)]" />

            <div className="flex items-center gap-3 mb-6 pl-3">
              <div className="w-10 h-10 rounded-2xl bg-[rgb(var(--tw-blue-100))] text-[color:rgb(var(--tw-blue-700))] border border-[rgb(var(--tw-blue-700)/25%)] flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-heading font-bold text-[color:rgb(var(--tw-blue-700))]">
                The Facts
              </h3>
            </div>

            <ul className="space-y-4 pl-3">
              {PAIRS.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Plus className="w-4 h-4 mt-0.5 text-[color:rgb(var(--tw-blue-700))] shrink-0" />
                  <span className="text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
                    {p.fact}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
