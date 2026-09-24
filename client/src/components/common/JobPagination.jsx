import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Numbered pagination for the Live Jobs board.
 *
 * Only renders the pages that actually exist (a 17-job board never shows a "5"
 * button), disables Previous on page 1 and Next on the last page, and shows an
 * ellipsis when the range is collapsed.
 */
export default function JobPagination({ pagination, onPageChange, label = 'openings' }) {
  const { page = 1, pageSize = 8, total = 0, totalPages = 1, hasPrev, hasNext } = pagination || {};
  if (!total || totalPages <= 1) return null;

  const windowSize = 2;
  const numbers = [];
  for (let i = 1; i <= totalPages; i += 1) {
    const inWindow = Math.abs(i - page) <= windowSize;
    if (i === 1 || i === totalPages || inWindow) numbers.push(i);
  }

  const firstIndex = (page - 1) * pageSize + 1;
  const lastIndex = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <div className="text-xs text-slate-600 font-mono">
        Showing <strong className="text-slate-900 dark:text-white">{firstIndex}–{lastIndex}</strong> of{' '}
        <strong className="text-slate-900 dark:text-white">{total}</strong> {label}
      </div>

      <nav aria-label="Job listings pagination" className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={hasPrev === undefined ? page <= 1 : !hasPrev}
          aria-label="Previous page"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {numbers.map((num, idx) => {
          const prev = numbers[idx - 1];
          const gap = prev && num - prev > 1;
          return (
            <React.Fragment key={num}>
              {gap && <span className="px-1 text-slate-400 text-xs">…</span>}
              <button
                type="button"
                onClick={() => onPageChange(num)}
                aria-current={num === page ? 'page' : undefined}
                className={`min-w-[34px] h-9 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  num === page
                    ? 'bg-[#0B1220] dark:bg-indigo-500 text-[#EFE6D6] dark:text-slate-950 border-[#0B1220] dark:border-indigo-500'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {num}
              </button>
            </React.Fragment>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={hasNext === undefined ? page >= totalPages : !hasNext}
          aria-label="Next page"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </nav>
    </div>
  );
}
