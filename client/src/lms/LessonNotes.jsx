import React from 'react';

/**
 * Renders a lesson's "notes" body in the student player.
 *
 * The LMS stores notes as light markdown (the seeded lessons ship headings like
 * `### Overview: ...`), but the player used to print the raw string, so students
 * saw literal `###` and `**` characters. This keeps that authoring format
 * readable without pulling a markdown dependency into the bundle.
 *
 * Supported: #–#### headings, **bold**, *italic*, `code`, [links](url),
 * "-" / "*" bullet lists, "1." numbered lists, ">" quotes and "---" rules.
 * Blank lines separate blocks; single newlines read like a wrapped paragraph.
 */

/** Bold / italic / code / links inside one line of text. */
const renderInline = (text, keyPrefix) => {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((?:https?:\/\/|\/)[^)\s]+\)|\*[^*\s][^*]*\*)/g;
  const out = [];
  let lastIndex = 0;
  let match;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) out.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${keyPrefix}-i${i++}`;

    if (token.startsWith('**')) {
      out.push(<strong key={key} className="font-bold text-slate-900">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      out.push(
        <code key={key} className="px-1.5 py-0.5 rounded bg-slate-100 text-[0.85em] font-mono text-[#002060]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('[')) {
      const split = token.indexOf('](');
      out.push(
        <a
          key={key}
          href={token.slice(split + 2, -1)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1D4ED8] font-semibold underline decoration-dotted hover:text-[#002060]"
        >
          {token.slice(1, split)}
        </a>,
      );
    } else {
      out.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
};

/** Split the notes into block-level elements. */
const renderBlocks = (content) => {
  const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const sizes = {
        1: 'text-lg',
        2: 'text-base',
        3: 'text-sm',
        4: 'text-xs uppercase tracking-wide',
      };
      blocks.push(
        React.createElement(
          level <= 2 ? 'h3' : 'h4',
          { key: `b${blockKey++}`, className: `${sizes[level]} font-heading font-bold text-[#002060] pt-1` },
          renderInline(heading[2], `h${blockKey}`),
        ),
      );
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(<hr key={`b${blockKey++}`} className="border-slate-200" />);
      i += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quote = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push(
        <blockquote key={`b${blockKey++}`} className="border-l-4 border-[#1D4ED8]/40 pl-3 text-slate-600 italic">
          {renderInline(quote.join(' '), `q${blockKey}`)}
        </blockquote>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul key={`b${blockKey++}`} className="list-disc pl-5 space-y-1">
          {items.map((item, idx) => <li key={idx}>{renderInline(item, `ul${blockKey}-${idx}`)}</li>)}
        </ul>,
      );
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol key={`b${blockKey++}`} className="list-decimal pl-5 space-y-1">
          {items.map((item, idx) => <li key={idx}>{renderInline(item, `ol${blockKey}-${idx}`)}</li>)}
        </ol>,
      );
      continue;
    }

    // Plain paragraph — consecutive non-empty lines stay together, exactly like
    // the old "blank line starts a new paragraph" behaviour the admin hint promises.
    const paragraph = [];
    while (i < lines.length && lines[i].trim()) {
      const next = lines[i].trim();
      if (/^(#{1,4}\s|[-*]\s+|\d+[.)]\s+|>)/.test(next) || /^(-{3,}|\*{3,}|_{3,})$/.test(next)) break;
      paragraph.push(next);
      i += 1;
    }
    blocks.push(
      <p key={`b${blockKey++}`}>{renderInline(paragraph.join(' '), `p${blockKey}`)}</p>,
    );
  }

  return blocks;
};

export default function LessonNotes({ content }) {
  if (!content || !String(content).trim()) return null;
  return <>{renderBlocks(content)}</>;
}
