import React from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

/**
 * Intelligent Bullet Content Parser & Renderer
 * 
 * Takes string or array input. Automatically normalizes:
 * - Newline-separated items (\n)
 * - Bullet characters (•, *, -, –, —)
 * - Numbered items (1., 2., 1), etc.)
 * - Semicolon-delimited items (item 1; item 2)
 * 
 * Renders an elegant list with custom checkmark or bullet styling.
 * Plain prose is rendered as standard readable paragraphs.
 */
export const parseBulletPoints = (content) => {
  if (!content) return [];

  // If already an array, clean each element
  if (Array.isArray(content)) {
    return content
      .flatMap((item) => (typeof item === 'string' ? parseBulletPoints(item) : []))
      .filter(Boolean);
  }

  if (typeof content !== 'string') return [];

  const trimmed = content.trim();
  if (!trimmed) return [];

  // If content contains JSON array string, parse it
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parseBulletPoints(parsed);
      }
    } catch {
      // Not JSON, continue with string parsing
    }
  }

  // Split on newlines first
  let lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // If only 1 line, check for bullet symbols or semicolon separation
  if (lines.length === 1) {
    if (lines[0].includes('•')) {
      lines = lines[0].split('•').map((l) => l.trim()).filter(Boolean);
    } else if (lines[0].includes(' - ') || lines[0].startsWith('- ')) {
      lines = lines[0].split(/(?:^|\s+)-\s+/).map((l) => l.trim()).filter(Boolean);
    } else if (lines[0].includes(';')) {
      lines = lines[0].split(';').map((l) => l.trim()).filter(Boolean);
    }
  }

  // Clean bullet prefixes from each line
  const cleaned = lines.map((line) => {
    return line
      .replace(/^[-*•–—]\s*/, '')      // Remove leading bullets
      .replace(/^\d+[\.\)]\s*/, '')     // Remove leading 1. or 1)
      .replace(/^\[\s*\]\s*/, '')       // Remove leading checkbox [ ]
      .replace(/^checked\s*/i, '')      // Remove leading checked
      .trim();
  }).filter((line) => line.length > 0);

  return cleaned;
};

export default function BulletContent({
  content,
  variant = 'bullet', // 'bullet', 'check', 'numeric', 'minimal'
  className = '',
  itemClassName = '',
  bulletClassName = '',
}) {
  const points = parseBulletPoints(content);

  if (!points || points.length === 0) {
    return null;
  }

  // If only 1 single long paragraph with no list markers, render as standard paragraph
  if (points.length === 1 && points[0].length > 180 && !content.toString().match(/^[-*•\d]/)) {
    return (
      <p className={`text-slate-600 dark:text-slate-300 leading-relaxed ${className}`}>
        {points[0]}
      </p>
    );
  }

  return (
    <ul className={`space-y-2.5 ${className}`}>
      {points.map((point, idx) => (
        <li
          key={idx}
          className={`flex items-start gap-3 text-slate-700 dark:text-slate-200 text-sm leading-relaxed ${itemClassName}`}
        >
          {variant === 'check' && (
            <CheckCircle2
              className={`w-4 h-4 text-emerald-500 shrink-0 mt-0.5 ${bulletClassName}`}
              aria-hidden="true"
            />
          )}
          {variant === 'bullet' && (
            <span
              className={`w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-2 ${bulletClassName}`}
              aria-hidden="true"
            />
          )}
          {variant === 'numeric' && (
            <span
              className={`w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${bulletClassName}`}
            >
              {idx + 1}
            </span>
          )}
          {variant === 'minimal' && (
            <ChevronRight
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 mt-1 ${bulletClassName}`}
              aria-hidden="true"
            />
          )}
          <span className="flex-1">{point}</span>
        </li>
      ))}
    </ul>
  );
}
