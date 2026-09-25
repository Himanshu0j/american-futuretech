import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  ListChecks,
  LifeBuoy,
  UserPlus,
  Megaphone,
} from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, StatCard, Badge, Loading, ErrorNote, EmptyState } from './ui';

const QUICK_LINKS = [
  { to: '/admin/lms/curriculum', label: 'Curriculum Builder', icon: BookOpen, hint: 'Lessons, videos, resources' },
  { to: '/admin/lms/quizzes', label: 'Assessments', icon: ListChecks, hint: 'Quizzes & attempts' },
  { to: '/admin/lms/enrollments', label: 'Enrollments', icon: UserPlus, hint: 'Course & batch access' },
  { to: '/admin/lms/progress', label: 'Progress', icon: TrendingUp, hint: 'Completion control' },
  { to: '/admin/lms/certificates', label: 'Certificates', icon: Award, hint: 'Issue & revoke' },
  { to: '/admin/lms/communications', label: 'Communications', icon: Megaphone, hint: 'Announcements & support' },
];

export default function LmsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/lms/overview');
        if (res.data?.success) setData(res.data);
        else setError(res.data?.message || 'Could not load the LMS overview.');
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Could not load the LMS overview.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = data?.stats || {};

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="LMS Overview"
        subtitle="Everything the student portal is doing right now — enrollment, progress, assessments and credentials."
      />

      <ErrorNote>{error}</ErrorNote>

      {loading ? (
        <Card>
          <Loading />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Students" value={stats.students ?? 0} hint={`${stats.activeEnrollments ?? 0} active enrollments`} icon={GraduationCap} />
            <StatCard label="Curriculum" value={`${stats.lessons ?? 0} lessons`} hint={`${stats.courses ?? 0} courses · ${stats.quizzes ?? 0} quizzes`} icon={BookOpen} tone="indigo" />
            <StatCard label="Average progress" value={`${stats.averageProgressPercent ?? 0}%`} hint={`${stats.completedCourses ?? 0} completed courses`} icon={TrendingUp} tone="emerald" />
            <StatCard label="Quiz pass rate" value={`${stats.quizPassRatePercent ?? 0}%`} hint={`${stats.quizAttempts ?? 0} attempts recorded`} icon={ListChecks} tone="amber" />
            <StatCard label="Certificates issued" value={stats.certificates ?? 0} hint={`${stats.revokedCertificates ?? 0} revoked`} icon={Award} tone="emerald" />
            <StatCard label="Progress records" value={stats.trackedProgress ?? 0} hint="Students being tracked" icon={BookOpen} tone="slate" />
            <StatCard label="Open support tickets" value={stats.pendingTickets ?? 0} hint="Open or in progress" icon={LifeBuoy} tone={stats.pendingTickets ? 'amber' : 'slate'} />
            <StatCard label="Courses" value={stats.courses ?? 0} hint="Certification tracks" icon={BookOpen} tone="slate" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 mt-6">
            <Card className="lg:col-span-2 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-bold text-white">Recent enrollments</div>
              {data?.recentEnrollments?.length ? (
                <div className="divide-y divide-white/[0.04]">
                  {data.recentEnrollments.map((row) => (
                    <div key={row.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{row.studentName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{row.studentEmail}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] text-slate-300 truncate max-w-[220px]">{row.courseTitle}</div>
                        <Badge tone={row.status === 'Active' ? 'emerald' : 'slate'}>{row.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={GraduationCap} title="No enrollments yet" message="Enroll a student to see them here." />
              )}
            </Card>

            <div className="space-y-4">
              <Card className="p-4">
                <div className="text-xs font-bold text-white mb-3">Manage the LMS</div>
                <div className="space-y-2">
                  {QUICK_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] transition-colors"
                    >
                      <link.icon className="w-4 h-4 text-indigo-300 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold text-white">{link.label}</span>
                        <span className="block text-[10px] text-slate-400">{link.hint}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-bold text-white">Latest announcements</div>
                {data?.announcements?.length ? (
                  <div className="divide-y divide-white/[0.04]">
                    {data.announcements.map((row) => (
                      <div key={row._id} className="px-4 py-3">
                        <div className="text-[11px] font-semibold text-white">{row.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {row.audience} · {row.isPublished ? 'published' : 'draft'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-[11px] text-slate-400">Nothing published yet.</div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
