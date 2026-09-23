import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Award, CheckCircle2, Play, Clock, ArrowRight, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import axios from 'axios';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/lms/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load student dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="h-5 w-36 bg-slate-100 rounded-full" />
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 bg-slate-100 rounded" />
        </div>
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-slate-100" />
              <div className="h-7 w-16 bg-slate-200 rounded-lg" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        {/* Enrolled Course Skeleton */}
        <div className="p-8 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="h-6 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
          <div className="h-12 w-full bg-slate-50 rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || { totalEnrolled: 0, avgProgress: 0, certificatesEarned: 0, quizzesTaken: 0 };
  const enrollments = data?.enrollments || [];
  const primaryCourse = enrollments[0];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Banner - Easy LMS Forest Green Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0B1220] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5C275]/20 border border-[#E5C275]/30 text-[#E5C275] text-[11px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Active Academic Term
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">
            Welcome to your <span className="highlight">Learning Space</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-xl leading-relaxed">
            Pick up where you left off, review recorded masterclasses, or prepare for your upcoming module assessment.
          </p>
        </div>

        {primaryCourse && (
          <Link
            to={`/student/courses/${primaryCourse.course?._id}/learn`}
            className="py-3 px-6 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            Resume {primaryCourse.course?.title?.substring(0, 24)}...
          </Link>
        )}
      </div>

      {/* 4 Metric Stats - Clean White Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#0B1220]/30 transition-all">
          <div className="text-xs text-slate-500 font-semibold mb-1">Enrolled Courses</div>
          <div className="text-2xl sm:text-3xl font-black text-[#0B1220] font-heading">{stats.totalEnrolled}</div>
          <div className="text-[11px] text-[#4338CA] font-medium mt-2 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Active in Cohort
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#0B1220]/30 transition-all">
          <div className="text-xs text-slate-500 font-semibold mb-1">Average Completion</div>
          <div className="text-2xl sm:text-3xl font-black text-[#4338CA] font-heading">{stats.avgProgress}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#10B981] h-full rounded-full transition-all duration-500" style={{ width: `${stats.avgProgress}%` }} />
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#0B1220]/30 transition-all">
          <div className="text-xs text-slate-500 font-semibold mb-1">Certificates Earned</div>
          <div className="text-2xl sm:text-3xl font-black text-[#4338CA] font-heading">{stats.certificatesEarned}</div>
          <div className="text-[11px] text-[#4338CA] font-medium mt-2 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Accredited Credentials
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#0B1220]/30 transition-all">
          <div className="text-xs text-slate-500 font-semibold mb-1">Quizzes & Labs Completed</div>
          <div className="text-2xl sm:text-3xl font-black text-[#0B1220] font-heading">{stats.quizzesTaken}</div>
          <div className="text-[11px] text-[#4338CA] font-medium mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Knowledge
          </div>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-black text-[#0B1220]">My Enrolled Programs</h2>
          <Link to="/courses" className="text-xs font-bold text-[#4338CA] hover:text-[#0B1220] hover:underline flex items-center gap-1">
            Browse More Programs &rarr;
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0B1220] mb-1">No Active Enrollments Yet</h3>
            <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">Reserve a seat or enroll in a program to begin learning.</p>
            <Link to="/courses" className="inline-flex px-6 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] rounded-full text-xs font-bold text-white transition-all shadow-xs">
              Explore Available Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrollments.map((enr) => (
              <div
                key={enr.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-[#0B1220]/30 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-[11px] font-bold text-[#0B1220] bg-[#F7F7F5] px-2.5 py-0.5 rounded-full border border-slate-200">
                      {enr.course?.category || 'Technology'}
                    </span>
                    <span className="text-xs font-bold text-[#4338CA] bg-[#EFE6D6] px-2.5 py-0.5 rounded-full">
                      {enr.progressPercent}% Complete
                    </span>
                  </div>

                  <h3 className="text-lg font-heading font-bold text-[#0B1220] mb-2 leading-snug">
                    {enr.course?.title}
                  </h3>

                  <div className="text-xs text-slate-500 mb-4 flex items-center gap-3">
                    <span>{enr.course?.duration}</span>
                    <span>•</span>
                    <span>Cohort: {enr.batch?.batchCode || 'WKND-Cohort'}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6 border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-[#10B981] to-[#E5C275] h-full rounded-full transition-all duration-500"
                      style={{ width: `${enr.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Completed: <strong className="text-[#0B1220]">{enr.completedLessonsCount} lessons</strong>
                  </div>
                  <Link
                    to={`/student/courses/${enr.course?._id}/learn`}
                    className="py-2.5 px-5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    Enter Learning Player
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Certificates Strip */}
      {data?.recentCertificates && data.recentCertificates.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h3 className="text-base font-heading font-bold text-[#0B1220] mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#4338CA]" />
            Earned Credentials
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.recentCertificates.map((cert) => (
              <div key={cert._id} className="p-4 rounded-xl bg-[#F7F7F5] border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#0B1220]">{cert.courseTitle}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{cert.certificateId}</div>
                </div>
                <Link
                  to={`/certificate/${cert.certificateId}`}
                  className="px-4 py-1.5 rounded-full bg-white hover:bg-slate-50 text-[#0B1220] text-xs font-semibold border border-slate-300 shadow-xs transition-colors"
                >
                  Verify
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
