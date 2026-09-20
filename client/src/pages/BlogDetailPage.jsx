import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User, Tag, Share2, BookOpen } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
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
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center text-sky-400">
        <div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#080a0f] text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-4">Article Not Found</h2>
        <Link to="/blog" className="px-5 py-2.5 bg-sky-500 text-slate-950 rounded-xl font-semibold text-sm">
          Return to Tech Journal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar />

      <main className="pt-28 sm:pt-32 pb-24 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#1a361d] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all papers
        </Link>

        <article className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm text-left">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-xs font-bold text-[#1a361d] bg-[#d8ffd2] px-3 py-1 rounded-full">
              {blog.category}
            </span>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-[#40844e]" />
              <span>{blog.readTimeMinutes} min read</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-[#1a361d] tracking-tight leading-snug mb-6">
            {blog.title}
          </h1>

          <div className="flex items-center gap-4 py-4 border-y border-slate-100 mb-8">
            <div className="w-10 h-10 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center font-bold text-sm">
              <User className="w-5 h-5 text-[#2d5c36]" />
            </div>
            <div>
              <div className="text-sm font-display font-bold text-[#1a361d]">{blog.author?.name || 'American FutureTech AI Research Group'}</div>
              <div className="text-xs text-slate-500">{blog.author?.role || 'Principal Engineering Faculty'}</div>
            </div>
          </div>

          {/* Body Content */}
          <div className="prose max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-6">
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
