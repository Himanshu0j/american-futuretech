import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Clock, ArrowRight, Tag, ChevronRight } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import CompanyMarquee from '../components/CompanyMarquee';
import Footer from '../components/Footer';

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchBlogs();
    window.scrollTo(0, 0);
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await axios.get('/api/content/blogs');
      setBlogs(res.data.blogs || []);
    } catch (err) {
      console.error('Failed to load blog posts', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Artificial Intelligence', 'Cyber Security', 'Cloud & DevOps'];

  const filteredBlogs = blogs.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || b.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar />

      <main className="pt-28 sm:pt-32 pb-14 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">

        <CompanyMarquee />        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-semibold mb-4">
            <BookOpen className="w-3.5 h-3.5 text-[#2d5c36]" />
            <span>Engineering Research & Briefings</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#1a361d] mb-4">
            FutureTech <span className="highlight">Engineering Journal</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Architectural breakdowns, offensive security teardowns, LLM deployment whitepapers, and cloud infrastructure guides.
          </p>
        </div>

        {/* Search & Categories */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs mb-10 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search engineering papers by keyword or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1a361d] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#1a361d]/20 border-t-[#1a361d] rounded-full animate-spin" />
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-display font-bold text-[#1a361d] mb-1">No articles found matching filters</h3>
            <p className="text-slate-500 text-xs">Try selecting 'All' or searching for another topic.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredBlogs.map((post) => (
              <Link
                key={post._id}
                to={`/blog/${post.slug}`}
                className="group rounded-2xl bg-white border border-slate-200 hover:border-[#1a361d]/40 transition-all flex flex-col overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="p-6 flex flex-col flex-1 justify-between text-left">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold text-[#1a361d] bg-[#d8ffd2] px-2.5 py-0.5 rounded-full">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#40844e]" />
                        <span>{post.readTimeMinutes} min</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-display font-bold text-[#1a361d] mb-2.5 group-hover:text-[#40844e] transition-colors leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{post.author?.name || 'Faculty Research Team'}</span>
                    <span className="text-xs font-bold text-[#2d5c36] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Read Paper <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
