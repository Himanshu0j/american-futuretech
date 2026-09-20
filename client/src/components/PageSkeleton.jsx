import React from 'react';

export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 flex flex-col antialiased selection:bg-sky-500 selection:text-white">
      {/* Top Navbar Shimmer */}
      <div className="h-20 border-b border-white/[0.08] bg-[#0c1322]/80 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500/30 to-blue-600/30 border border-sky-400/20" />
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-slate-800 rounded" />
            <div className="h-2.5 w-20 bg-slate-800/60 rounded" />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 animate-pulse">
          <div className="h-3.5 w-16 bg-slate-800 rounded" />
          <div className="h-3.5 w-20 bg-slate-800 rounded" />
          <div className="h-3.5 w-16 bg-slate-800 rounded" />
          <div className="h-3.5 w-24 bg-slate-800 rounded" />
        </div>

        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-9 w-24 bg-slate-800/80 rounded-xl" />
          <div className="h-9 w-28 bg-sky-500/20 rounded-xl border border-sky-500/30" />
        </div>
      </div>

      {/* Main Content Shimmer */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 py-12 space-y-10">
        {/* Hero / Header Shimmer */}
        <div className="space-y-4 max-w-2xl animate-pulse">
          <div className="h-6 w-36 bg-sky-500/15 border border-sky-400/20 rounded-full" />
          <div className="h-10 sm:h-12 w-3/4 bg-slate-800 rounded-2xl" />
          <div className="h-4 w-full bg-slate-800/60 rounded" />
          <div className="h-4 w-4/5 bg-slate-800/40 rounded" />
        </div>

        {/* Bento Grid Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-[#0c1322]/70 border border-white/[0.08] space-y-4 shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80" />
              <div className="h-6 w-2/3 bg-slate-800 rounded" />
              <div className="space-y-2">
                <div className="h-3.5 w-full bg-slate-800/50 rounded" />
                <div className="h-3.5 w-4/5 bg-slate-800/40 rounded" />
                <div className="h-3.5 w-3/5 bg-slate-800/30 rounded" />
              </div>
              <div className="pt-4 border-t border-white/[0.05] flex justify-between items-center">
                <div className="h-4 w-20 bg-slate-800/60 rounded" />
                <div className="h-8 w-24 bg-slate-800/80 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
