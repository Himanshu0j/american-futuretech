/**
 * Markdown → styled HTML → PDF, for the client-facing handover documents.
 *
 *   node scripts/generate-doc-pdf.js docs/LMS-CLIENT-GUIDE.md docs/LMS-CLIENT-GUIDE.pdf
 *
 * Why a local script instead of a markdown dependency: the repo ships no
 * markdown renderer, and the documents only use a small, predictable subset
 * (headings, paragraphs, tables, lists, quotes, code fences, inline bold/code/
 * links). This converts exactly that subset, wraps it in a print stylesheet, and
 * prints through the same real Chrome the browser audits already drive — so the
 * PDF a client opens is the same render our own tests look at.
 *
 * The HTML next to the PDF is kept on purpose: it can be opened in a browser and
 * previewed/scrolled without a PDF reader, and it is what the print CSS styles.
 * It is a build artifact of the Markdown source, never hand-edited.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME =
  process.env.CHROME_PATH ||
  ['C:/Program Files/Google/Chrome/Application/chrome.exe',
   'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
   '/usr/bin/google-chrome',
   '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));

const escapeHtml = (text) =>
  text
    .replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** Inline formatting: `code`, **bold**, *italic*, [label](url). */
const inline = (text) =>
  escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');

const splitRow = (line) =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((cell) => cell.trim());

const isSeparatorRow = (line) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-');

/**
 * Convert the supported Markdown subset to HTML. Everything the documents rely
 * on is handled explicitly so nothing silently degrades into raw asterisks.
 */
const markdownToHtml = (markdown) => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let listType = null; // 'ul' | 'ol' | null
  let inCode = false;

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    // ── Fenced code ────────────────────────────────────────────────────────
    if (/^```/.test(line)) {
      closeList();
      out.push(inCode ? '</code></pre>' : '<pre><code>');
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      out.push(escapeHtml(line));
      continue;
    }

    // ── Blank line ────────────────────────────────────────────────────────
    if (!line.trim()) {
      closeList();
      continue;
    }

    // ── Horizontal rule ───────────────────────────────────────────────────
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      closeList();
      out.push('<hr />');
      continue;
    }

    // ── Headings ──────────────────────────────────────────────────────────
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    // ── Tables ────────────────────────────────────────────────────────────
    if (/^\s*\|/.test(line) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      closeList();
      const header = splitRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      i -= 1;
      out.push('<table>');
      out.push(`<thead><tr>${header.map((cell) => `<th>${inline(cell)}</th>`).join('')}</tr></thead>`);
      out.push('<tbody>');
      rows.forEach((row) => {
        out.push(`<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`);
      });
      out.push('</tbody></table>');
      continue;
    }

    // ── Blockquote (consecutive `>` lines merge into one callout) ──────────
    if (/^\s*>/.test(line)) {
      closeList();
      const quote = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      i -= 1;
      out.push(`<blockquote><p>${quote.map(inline).join('<br />')}</p></blockquote>`);
      continue;
    }

    // ── Lists ─────────────────────────────────────────────────────────────
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (bullet || numbered) {
      const type = bullet ? 'ul' : 'ol';
      if (listType !== type) {
        closeList();
        out.push(`<${type}>`);
        listType = type;
      }
      out.push(`<li>${inline((bullet || numbered)[1])}</li>`);
      continue;
    }

    // ── Paragraph ─────────────────────────────────────────────────────────
    closeList();
    out.push(`<p>${inline(line.trim())}</p>`);
  }

  closeList();
  if (inCode) out.push('</code></pre>');
  return out.join('\n');
};

const PRINT_CSS = `
  :root { --ink: #12362f; --ink-soft: #1f4a41; --gold: #a97c22; --line: #d8ddd9; --muted: #5b6764; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0; color: #1c2321; background: #fff;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 10.5pt; line-height: 1.55;
  }
  .content { padding: 0; }

  /* ── Cover ─────────────────────────────────────────────────────────────── */
  .cover {
    height: 250mm; display: flex; flex-direction: column; justify-content: center;
    padding: 0 6mm; page-break-after: always; border-top: 6px solid var(--ink);
  }
  .cover .eyebrow { font-size: 9pt; letter-spacing: 0.28em; text-transform: uppercase; color: var(--gold); font-weight: 700; }
  .cover h1 { font-size: 30pt; line-height: 1.15; margin: 10px 0 14px; color: var(--ink); letter-spacing: -0.01em; }
  .cover .tagline { font-size: 12.5pt; color: var(--ink-soft); margin: 0 0 8px; font-weight: 600; }
  .cover .meta { margin-top: 26px; font-size: 9.5pt; color: var(--muted); }
  .cover .rule { width: 86px; height: 4px; background: var(--gold); margin: 18px 0 4px; }

  /* ── Headings ──────────────────────────────────────────────────────────── */
  h1 { font-size: 19pt; color: var(--ink); margin: 0 0 14px; }
  h2 {
    font-size: 15.5pt; color: var(--ink); margin: 0 0 12px; padding-bottom: 7px;
    border-bottom: 2px solid var(--ink); break-before: page; break-after: avoid;
  }
  h2:first-of-type { break-before: auto; }
  h3 { font-size: 12.5pt; color: var(--ink-soft); margin: 20px 0 8px; break-after: avoid; }
  h4 { font-size: 11pt; color: var(--ink-soft); margin: 16px 0 6px; break-after: avoid; }
  p { margin: 0 0 9px; }
  strong { color: #122a24; }
  a { color: #0f5a8c; text-decoration: none; word-break: break-word; }
  code {
    font-family: "Cascadia Mono", Consolas, "Courier New", monospace;
    font-size: 9pt; background: #f2f4f2; border: 1px solid #e2e6e3;
    border-radius: 3px; padding: 1px 4px;
  }

  /* ── Tables ────────────────────────────────────────────────────────────── */
  table { width: 100%; border-collapse: collapse; margin: 6px 0 14px; font-size: 9.5pt; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th {
    background: var(--ink); color: #fff; text-align: left; font-weight: 700;
    padding: 7px 9px; border: 1px solid var(--ink);
  }
  td { padding: 6px 9px; border: 1px solid var(--line); vertical-align: top; }
  tbody tr:nth-child(even) td { background: #f6f8f6; }

  /* ── Lists ─────────────────────────────────────────────────────────────── */
  ul, ol { margin: 4px 0 12px; padding-left: 20px; }
  li { margin: 3px 0; }
  li > p { margin: 0; }

  /* ── Quotes, rules, code blocks ────────────────────────────────────────── */
  blockquote {
    margin: 10px 0 14px; padding: 9px 13px; background: #f4f7f4;
    border-left: 4px solid var(--gold); break-inside: avoid;
  }
  blockquote p { margin: 0; }
  hr { border: 0; border-top: 1px solid var(--line); margin: 16px 0; }
  pre {
    background: #f6f8f6; border: 1px solid var(--line); border-radius: 5px;
    padding: 11px 13px; margin: 8px 0 14px; break-inside: avoid; overflow: visible;
  }
  pre code {
    background: none; border: 0; padding: 0; font-size: 8.6pt; line-height: 1.45;
    white-space: pre-wrap; display: block;
  }
`;

const buildHtml = (markdown, { eyebrow }) => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const titleIndex = lines.findIndex((line) => /^#\s+/.test(line));
  const title = titleIndex === -1 ? 'Document' : lines[titleIndex].replace(/^#\s+/, '').trim();

  let tagline = '';
  let bodyStart = 0;
  if (titleIndex !== -1) {
    for (let i = titleIndex + 1; i < lines.length; i += 1) {
      if (!lines[i].trim()) continue;
      tagline = lines[i].replace(/\*\*/g, '').trim();
      bodyStart = i + 1;
      break;
    }
  }
  const body = lines.slice(bodyStart).join('\n');
  const today = new Date().toISOString().slice(0, 10);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${PRINT_CSS}</style>
</head>
<body>
  <section class="cover">
    <div class="eyebrow">${escapeHtml(eyebrow)}</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="rule"></div>
    ${tagline ? `<p class="tagline">${escapeHtml(tagline)}</p>` : ''}
    <p class="meta">American FutureTech &middot; Client documentation &middot; ${today}</p>
  </section>
  <main class="content">
${markdownToHtml(body)}
  </main>
</body>
</html>`;
};

const main = async () => {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    console.error('usage: node scripts/generate-doc-pdf.js <input.md> <output.pdf> [eyebrow label]');
    process.exit(1);
  }
  if (!CHROME) throw new Error('Chrome not found — set CHROME_PATH to chrome.exe');

  const eyebrow = process.argv[5] || 'Client Documentation';
  const markdown = fs.readFileSync(inputPath, 'utf8');
  const html = buildHtml(markdown, { eyebrow });

  const htmlPath = outputPath.replace(/\.pdf$/i, '.html');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(htmlPath, html);
  console.log(`HTML written: ${htmlPath}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`file://${path.resolve(htmlPath)}`, { waitUntil: 'load' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      margin: { top: '16mm', bottom: '16mm', left: '15mm', right: '15mm' },
      headerTemplate: '<div style="font-size:7pt;color:#7a8580;width:100%;padding:0 15mm;">American FutureTech — Academy / LMS</div>',
      footerTemplate:
        '<div style="font-size:7pt;color:#7a8580;width:100%;padding:0 15mm;display:flex;justify-content:space-between;">' +
        '<span>Confidential — for AFT staff use</span>' +
        '<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
    });

    const stats = fs.statSync(outputPath);
    const bytes = fs.readFileSync(outputPath);
    const pages = (bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log(`PDF written: ${outputPath}`);
    console.log(`Size: ${(stats.size / 1024).toFixed(0)} KB · Pages: ${pages || 'unknown'}`);
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error(`FAILED: ${error.message}`);
  process.exit(1);
});
