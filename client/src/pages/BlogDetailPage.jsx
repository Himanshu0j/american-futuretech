import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User, Tag, Share2, BookOpen } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TrustMarquee from '../components/TrustMarquee';
import Footer from '../components/Footer';

/** Render inline **bold** without handing the content to the HTML parser. */
const inlineText = (text) =>
  String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={index} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });

/** Questions, key-point labels and markdown headings read as headings. */
const isHeadingLine = (line) => {
  const text = line.trim();
  if (!text) return false;
  if (/^#{1,3}\s+/.test(text)) return true;
  if (/^\d+\.\s+.+\?$/.test(text)) return true;
  if (text.endsWith('?') && text.length <= 140) return true;
  if (text.endsWith(':') && text.length <= 100 && /^[A-Z0-9]/.test(text)) return true;
  return false;
};

const HEADING_CLASS =
  'mt-7 mb-2 rounded-r-lg border-l-4 border-[rgb(var(--tw-blue-700))] bg-blue-50/70 px-3 py-2 font-display text-base sm:text-lg font-extrabold leading-snug text-[color:rgb(var(--tw-ink-900))]';

/**
 * Tiny, safe markdown-ish renderer for blog bodies.
 *
 * Admin articles are authored as plain text with `###` headings, numbered
 * points and occasional **bold** phrases. Rendering every block as a paragraph
 * printed the hashes literally and flattened the questions the client marked as
 * headings. This keeps the text as React nodes (never innerHTML) while giving
 * questions, labels and markdown headings a real heading style.
 */
function BlogBody({ content }) {
  const nodes = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    nodes.push(
      <p key={`p-${nodes.length}`} className="text-sm sm:text-base leading-relaxed text-slate-700">
        {inlineText(paragraph.join(' '))}
      </p>
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list || !list.items.length) {
      list = null;
      return;
    }
    const Tag = list.ordered ? 'ol' : 'ul';
    nodes.push(
      <Tag
        key={`list-${nodes.length}`}
        className={`${
          list.ordered ? 'list-decimal' : 'list-disc'
        } space-y-1.5 pl-5 text-sm sm:text-base leading-relaxed text-slate-700 marker:text-[color:rgb(var(--tw-blue-700))]`}
      >
        {list.items.map((item, index) => (
          <li key={index}>{inlineText(item)}</li>
        ))}
      </Tag>
    );
    list = null;
  };

  String(content || '')
    .split('\n')
    .forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      const heading = line.match(/^#{1,3}\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        nodes.push(
          <h3 key={`h-${nodes.length}`} className={HEADING_CLASS}>
            {inlineText(heading[1])}
          </h3>
        );
        return;
      }

      if (isHeadingLine(line)) {
        flushParagraph();
        flushList();
        nodes.push(
          <h3 key={`h-${nodes.length}`} className={HEADING_CLASS}>
            {inlineText(line)}
          </h3>
        );
        return;
      }

      const bullet = line.match(/^[-*]\s+(.+)$/);
      if (bullet) {
        flushParagraph();
        if (!list || list.ordered) {
          flushList();
          list = { ordered: false, items: [] };
        }
        list.items.push(bullet[1]);
        return;
      }

      const ordered = line.match(/^\d+\.\s+(.+)$/);
      if (ordered) {
        flushParagraph();
        if (!list || !list.ordered) {
          flushList();
          list = { ordered: true, items: [] };
        }
        list.items.push(ordered[1]);
        return;
      }

      flushList();
      paragraph.push(line);
    });

  flushParagraph();
  flushList();

  return <div className="space-y-4">{nodes}</div>;
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlog();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchBlog = async () => {
    try {
      const res = await axios.get(`/api/content/blogs/${slug}`);
      setBlog(res.data.blog);
    } catch (err) {
      console.error('Failed to load blog', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--tw-ink-950))] flex items-center justify-center text-blue-400">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // The heading needs its own light colour: a global base-layer rule pins every
  // h1–h6 to the dark ink, so an inherited `text-white` never reached it and the
  // "Article Not Found" message measured 1.04 contrast (dark on dark).
  if (!blog) {
    return (
      <div className="min-h-screen bg-[rgb(var(--tw-ink-950))] flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-4 text-white">Article Not Found</h2>
        <p className="text-slate-300 text-sm mb-6 text-center max-w-sm">
          This article may have been moved or unpublished. The journal index below is the fastest way back.
        </p>
        <Link to="/blog" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm">
          Return to Tech Journal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-800 font-sans antialiased selection:bg-[rgb(var(--tw-gold-500))] selection:text-[color:rgb(var(--tw-ink-900))] relative">
      <Navbar />

      <main className="pt-28 sm:pt-32 pb-14 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">

        <TrustMarquee />        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[color:rgb(var(--tw-ink-900))] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all papers
        </Link>

        <article className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm text-left">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-xs font-bold text-[color:rgb(var(--tw-ink-900))] bg-[rgb(var(--tw-sand-200))] px-3 py-1 rounded-full">
              {blog.category}
            </span>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-[color:rgb(var(--tw-blue-700))]" />
              <span>{blog.readTimeMinutes} min read</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-[color:rgb(var(--tw-ink-900))] tracking-tight leading-snug mb-6">
            {blog.title}
          </h1>

          <img
            src={blog.coverImage || '/images/blog/default-cover.webp'}
            alt=""
            className="w-full aspect-[16/9] object-cover rounded-2xl border border-slate-200 mb-8"
            loading="lazy"
            decoding="async"
          />

          <div className="flex items-center gap-4 py-4 border-y border-slate-100 mb-8">
            <div className="w-10 h-10 rounded-full bg-[rgb(var(--tw-sand-200))] text-[color:rgb(var(--tw-ink-900))] flex items-center justify-center font-bold text-sm">
              <User className="w-5 h-5 text-[color:rgb(var(--tw-blue-700))]" />
            </div>
            <div>
              <div className="text-sm font-display font-bold text-[color:rgb(var(--tw-ink-900))]">{blog.author?.name || 'American FutureTech AI Research Group'}</div>
              <div className="text-xs text-slate-500">{blog.author?.role || 'Principal Engineering Faculty'}</div>
            </div>
          </div>

          {/* Body Content */}
          <div className="prose max-w-none">
            <BlogBody content={blog.content} />
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="pt-8 mt-10 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-2">Research Tags:</span>
              {blog.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
