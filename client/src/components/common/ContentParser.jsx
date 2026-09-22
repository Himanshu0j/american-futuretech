import React from 'react';
import { CheckCircle2, ChevronRight, Check } from 'lucide-react';

/**
 * Universal Content Normalization Engine
 * 
 * Normalizes any string or array representation of list-like content into
 * an array of clean, trimmed strings.
 * 
 * Supported delimiters & formats:
 * - Arrays of strings
 * - Newline-separated lines (\r?\n)
 * - Leading bullet characters: •, *, -, –, —, ⁃, ▪, ▫, ▸
 * - Leading numbered items: 1., 2), 01., [1]
 * - Checkboxes: [ ], [x], checked
 * - Semicolons: item 1; item 2; item 3
 * - JSON encoded arrays: '["item 1", "item 2"]'
 */
export const parseContentPoints = (content, options = {}) => {
  const { allowSemicolons = false } = options;
  if (!content) return [];

  // If already an array, flatten and recursively clean
  if (Array.isArray(content)) {
    return content
      .flatMap((item) => (typeof item === 'string' ? parseContentPoints(item, options) : []))
      .filter(Boolean);
  }

  if (typeof content !== 'string') return [];

  const trimmed = content.trim();
  if (!trimmed) return [];

  // If content is JSON serialized array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parseContentPoints(parsed, options);
      }
    } catch {
      // Not JSON, continue standard string parsing
    }
  }

  // Split on newlines first
  let lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // If only a single line was passed, check for embedded bullet markers
  if (lines.length === 1) {
    const single = lines[0];
    if (single.includes('•')) {
      lines = single.split('•').map((l) => l.trim()).filter(Boolean);
    } else if (single.includes(' - ') || single.startsWith('- ')) {
      lines = single.split(/(?:^|\s+)-\s+/).map((l) => l.trim()).filter(Boolean);
    } else if (single.includes(' * ') || single.startsWith('* ')) {
      lines = single.split(/(?:^|\s+)\*\s+/).map((l) => l.trim()).filter(Boolean);
    } else if (allowSemicolons && single.includes(';')) {
      lines = single.split(';').map((l) => l.trim()).filter(Boolean);
    }
  }

  // Clean bullet / list prefixes from each extracted line
  const cleaned = lines
    .map((line) => {
      return line
        .replace(/^[-*•–—⁃▪▫▸]\s*/, '')       // Leading bullet characters
        .replace(/^\d+[\.\)]\s*/, '')          // Leading 1. or 1)
        .replace(/^\[\s*\]\s*/, '')            // Leading markdown checkbox [ ]
        .replace(/^\[x\]\s*/i, '')             // Leading checked checkbox [x]
        .replace(/^checked\s*[-:]?\s*/i, '')   // Leading "checked" prefix
        .trim();
    })
    .filter((line) => line.length > 0);

  return cleaned;
};

/**
 * ListContent — Renders a styled list with consistent icon badges
 */
export function ListContent({
  items,
  variant = 'check', // 'check' | 'bullet' | 'numeric' | 'minimal'
  className = 'space-y-2.5',
  itemClassName = 'text-slate-700 dark:text-slate-200 text-xs sm:text-sm leading-relaxed',
  iconClassName = '',
}) {
  const points = parseContentPoints(items);

  if (!points || points.length === 0) {
    return null;
  }

  return (
    <ul className={className}>
      {points.map((point, idx) => (
        <li key={idx} className={`flex items-start gap-3 ${itemClassName}`}>
          {variant === 'check' && (
            <div className={`w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${iconClassName}`}>
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          )}
          {variant === 'bullet' && (
            <span
              className={`w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2 ${iconClassName}`}
              aria-hidden="true"
            />
          )}
          {variant === 'numeric' && (
            <span
              className={`w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 ${iconClassName}`}
            >
              {idx + 1}
            </span>
          )}
          {variant === 'minimal' && (
            <ChevronRight
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5 ${iconClassName}`}
              aria-hidden="true"
            />
          )}
          <span className="flex-1">{point}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * ContentPoints — Shorthand component for rendering pointer items with checkmarks
 */
export function ContentPoints({ items, className, itemClassName }) {
  return <ListContent items={items} variant="check" className={className} itemClassName={itemClassName} />;
}

/**
 * RichTextContent — Smart prose vs. list renderer.
 * Keeps normal paragraphs as paragraphs; renders list markers as clean pointer lists.
 */
export function RichTextContent({
  content,
  className = '',
  paragraphClassName = 'text-slate-600 dark:text-slate-300 leading-relaxed text-sm mb-3',
  listVariant = 'check',
}) {
  if (!content) return null;

  if (typeof content !== 'string') {
    return <ListContent items={content} variant={listVariant} className={className} />;
  }

  const trimmed = content.trim();

  // If text contains obvious list markers, parse and render as list
  const hasListMarkers = /^(\s*[-*•\d\.]|\[|\d+\))/m.test(trimmed);

  if (hasListMarkers) {
    return <ListContent items={trimmed} variant={listVariant} className={className} />;
  }

  // Otherwise split into standard paragraphs
  const paragraphs = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  if (paragraphs.length <= 1) {
    return <p className={`${paragraphClassName} ${className}`}>{trimmed}</p>;
  }

  return (
    <div className={className}>
      {paragraphs.map((p, idx) => (
        <p key={idx} className={paragraphClassName}>
          {p}
        </p>
      ))}
    </div>
  );
}

export default ListContent;
