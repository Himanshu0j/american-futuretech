import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User, Tag, Share2, BookOpen } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TrustMarquee from '../components/TrustMarquee';
import Footer from '../components/Footer';

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
      <div className="min-h-screen bg-[#001845] flex items-center justify-center text-blue-400">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // The heading needs its own light colour: a global base-layer rule pins every
  // h1–h6 to the dark ink, so an inherited `text-white` never reached it and the
  // "Article Not Found" message measured 1.04 contrast (dark on dark).
  if (!blog) {
    return (
      <div className="min-h-screen bg-[#001845] flex flex-col items-center justify-center p-4">
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
    <div className="min-h-screen bg-[#F7F7F5] text-slate-800 font-sans antialiased selection:bg-[#F00000] selection:text-[#002060] relative">
      <Navbar />

      <main className="pt-28 sm:pt-32 pb-14 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">

        <TrustMarquee />        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#002060] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all papers
        </Link>

        <article className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm text-left">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-xs font-bold text-[#002060] bg-[#FCE7E7] px-3 py-1 rounded-full">
              {blog.category}
            </span>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>{blog.readTimeMinutes} min read</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-[#002060] tracking-tight leading-snug mb-6">
            {blog.title}
          </h1>

          <div className="flex items-center gap-4 py-4 border-y border-slate-100 mb-8">
            <div className="w-10 h-10 rounded-full bg-[#FCE7E7] text-[#002060] flex items-center justify-center font-bold text-sm">
              <User className="w-5 h-5 text-[#1D4ED8]" />
            </div>
            <div>
              <div className="text-sm font-display font-bold text-[#002060]">{blog.author?.name || 'American FutureTech AI Research Group'}</div>
              <div className="text-xs text-slate-500">{blog.author?.role || 'Principal Engineering Faculty'}</div>
            </div>
          </div>

          {/* Body Content */}
          <div className="prose max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4">
            {blog.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
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
