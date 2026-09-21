import React from 'react';
import { Check, CheckCircle2, ChevronRight } from 'lucide-react';

/**
 * Intelligent parser that converts newlines, bullet symbols (•, *, -),
 * numbered lists (1., 2.), and semicolons into clean trimmed strings.
 */
export function parseBulletPoints(raw) {
  if (!raw) return [];

  // If already an array, clean each element and split any internal multi-line strings
  if (Array.isArray(raw)) {
    const flattened = [];
    raw.forEach((item) => {
      if (typeof item === 'string') {
        const sub = parseBulletPoints(item);
        flattened.push(...sub);
      } else if (item !== null && item !== undefined) {
        flattened.push(String(item).trim());
      }
    });
    return flattened.filter(Boolean);
  }

  if (typeof raw !== 'string') return [String(raw)];

  let text = raw.trim();
  if (!text) return [];

  let items = [];

  // 1. If multiple lines exist, split by line breaks
  if (text.includes('\n')) {
    items = text.split(/\r?\n/);
  }
  // 2. If bullet symbols (• or * or -) exist inline
  else if (/[•*–—]/.test(text)) {
    items = text.split(/\s*[•*–—]\s*/);
  }
  // 3. If numbered list items exist inline (e.g. "1. Item one 2. Item two")
  else if (/(?:^|\s+)\d+[\.\)]\s+/.test(text)) {
    items = text.split(/(?:^|\s+)\d+[\.\)]\s+/);
  }
  // 4. If semicolon-separated items exist (e.g. "Item 1; Item 2; Item 3")
  else if (text.includes(';') && text.split(';').filter(s => s.trim().length > 3).length > 1) {
    items = text.split(';');
  }
  // 5. Fallback: single item
  else {
    items = [text];
  }

  // Normalize each item: strip leading bullet characters, numbering, trailing punctuation
  return items
    .map((item) => {
      let s = item.trim();
      // Remove leading bullets or dashes
      s = s.replace(/^[•*\-–—\s]+/, '');
      // Remove leading numbering like "1.", "1)", "(1)"
      s = s.replace(/^\(?\d+[\.\)]\s*/, '');
      return s.trim();
    })
    .filter(Boolean);
}

/**
 * Reusable component to render parsed bullet points or fallback paragraphs.
 */
export default function BulletContent({
  content,
  as = 'auto', // 'auto' | 'list' | 'chips' | 'paragraph'
  bulletType = 'check', // 'check' | 'checkCircle' | 'chevron' | 'dot' | 'number'
  customIcon = null,
  className = '',
  itemClassName = '',
  chipClassName = '',
  paragraphClassName = '',
  maxItems = undefined,
}) {
  if (!content) return null;

  const items = parseBulletPoints(content);

  // If parsed into 0 items, return null
  if (items.length === 0) return null;

  const displayedItems = typeof maxItems === 'number' ? items.slice(0, maxItems) : items;

  // Determine if this should be rendered as a single paragraph
  const isOriginallySingleParagraph =
    typeof content === 'string' &&
    items.length === 1 &&
    !/[\n;•*\-–—]/.test(content) &&
    !/^\d+[\.\)]/.test(content.trim());

  if (as === 'paragraph' || (as === 'auto' && isOriginallySingleParagraph)) {
    return (
      <p className={paragraphClassName || className || 'text-xs sm:text-sm text-slate-700 leading-relaxed'}>
        {content}
      </p>
    );
  }

  // Chips presentation (e.g. for skills or tools)
  if (as === 'chips') {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {displayedItems.map((item, idx) => (
          <span
            key={idx}
            className={
              chipClassName ||
              'text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200'
            }
          >
            {item}
          </span>
        ))}
      </div>
    );
  }

  // Default List presentation
  const renderIcon = (idx) => {
    if (customIcon) return customIcon;
    switch (bulletType) {
      case 'checkCircle':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      case 'chevron':
        return <ChevronRight className="w-4 h-4 text-[#2d5c36] shrink-0 mt-0.5" />;
      case 'dot':
        return <span className="w-1.5 h-1.5 rounded-full bg-[#1a361d] shrink-0 mt-2" />;
      case 'number':
        return (
          <span className="w-5 h-5 rounded-full bg-[#d8ffd2] text-[#1a361d] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
            {idx + 1}
          </span>
        );
      case 'check':
      default:
        return (
          <span className="w-4 h-4 rounded-full bg-[#d8ffd2] text-[#2d5c36] flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
            ✓
          </span>
        );
    }
  };

  return (
    <ul className={`space-y-2 text-xs sm:text-sm text-slate-700 ${className}`}>
      {displayedItems.map((item, idx) => (
        <li key={idx} className={`flex items-start gap-2.5 leading-relaxed ${itemClassName}`}>
          {renderIcon(idx)}
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}
