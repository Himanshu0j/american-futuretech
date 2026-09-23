import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Clock, Award, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const res = await axios.get('/api/lms/my-courses');
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#0B1220]">My Enrolled Programs</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Access your curriculum modules, video sessions, and laboratory assignments.</p>
        </div>
        <Link
          to="/courses"
          className="py-2.5 px-6 rounded-full bg-white hover:bg-slate-50 text-[#0B1220] text-xs font-bold border-2 border-[#0B1220] shadow-xs transition-colors self-start sm:self-auto"
        >
          Explore More Programs
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
              <div className="h-6 w-24 bg-slate-100 rounded-full" />
              <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-1/2 bg-slate-100 rounded" />
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-2 w-full bg-slate-100 rounded-full" />
              </div>
              <div className="h-10 w-full bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center shadow-xs max-w-xl mx-auto">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-heading font-bold text-[#0B1220] mb-1">No Active Enrollments</h3>
          <p className="text-xs text-slate-500 mb-6">You are not currently enrolled in any programs.</p>
          <Link to="/courses" className="inline-flex py-3 px-6 bg-[#4338CA] hover:bg-[#3730A3] rounded-full text-xs font-bold text-white shadow-xs transition-colors">
            Browse All Master Programs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((item) => (
            <div
              key={item.enrollmentId}
              className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-[#0B1220]/30 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold text-[#0B1220] bg-[#F7F7F5] px-2.5 py-0.5 rounded-full border border-slate-200">
                    {item.course?.category || 'Technology'}
                  </span>
                  <span className="text-xs font-bold text-[#4338CA] bg-[#EFE6D6] px-2.5 py-0.5 rounded-full">
                    {item.progressPercent}% Complete
                  </span>
                </div>

                <h3 className="text-lg font-heading font-bold text-[#0B1220] mb-2 leading-snug">
                  {item.course?.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {item.course?.shortDescription}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6 border border-slate-200">
                  <div className="bg-gradient-to-r from-[#10B981] to-[#E5C275] h-full rounded-full transition-all duration-500" style={{ width: `${item.progressPercent}%` }} />
                </div>
              </div>

              <Link
                to={`/student/courses/${item.course?._id}/learn`}
                className="w-full py-3 px-5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                Launch Course Player
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
