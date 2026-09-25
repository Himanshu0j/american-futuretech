import React, { useCallback, useEffect, useState } from 'react';
import { Award, ExternalLink, Ban, RotateCcw, RefreshCw, Search, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import {
  PageHeader,
  Card,
  Field,
  inputClass,
  btnPrimary,
  btnGhost,
  btnDanger,
  Badge,
  EmptyState,
  Loading,
  ErrorNote,
  Modal,
} from './ui';

const TABS = [
  { id: 'issued', label: 'Issued' },
  { id: 'eligible', label: 'Ready to issue' },
  { id: 'revoked', label: 'Revoked' },
];

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
};

export default function CertificatesManager() {
  const [tab, setTab] = useState('issued');
  const [certificates, setCertificates] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (courseId) params.courseId = courseId;

      if (tab === 'eligible') {
        const res = await api.get('/admin/certificates/eligibility', {
          params: courseId ? { courseId } : {},
        });
        setEligible(res.data?.eligible || []);
      } else {
        params.status = tab === 'revoked' ? 'revoked' : 'issued';
        const res = await api.get('/admin/certificates', { params });
        setCertificates(res.data?.certificates || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load certificates.');
    } finally {
      setLoading(false);
    }
  }, [tab, search, courseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        let list = [];
        try {
          const res = await api.get('/courses/admin/all');
          list = res.data?.courses || [];
        } catch {
          const res = await api.get('/courses');
          list = res.data?.courses || [];
        }
        setCourses(list);
      } catch {
        /* the filter is optional */
      }
    })();
  }, []);

  const flash = (message) => {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 3000);
  };

  const issue = async (row) => {
    try {
      const res = await api.post('/admin/certificates/issue', {
        studentId: row.studentId,
        courseId: row.courseId,
      });
      if (res.data?.alreadyIssued) flash('A certificate already exists for this student and course.');
      else flash(`Certificate issued to ${row.studentName}.`);
      setTab('issued');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not issue the certificate.');
    }
  };

  const revoke = async () => {
    if (!revokeTarget) return;
    try {
      await api.post(`/admin/certificates/${revokeTarget.id}/revoke`, { reason: revokeReason });
      setRevokeTarget(null);
      setRevokeReason('');
      await load();
      flash('Certificate revoked. The public registry now shows it as withdrawn.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not revoke the certificate.');
    }
  };

  const reinstate = async (row) => {
    if (!window.confirm(`Reinstate ${row.certificateId}? It will verify as valid again.`)) return;
    try {
      await api.post(`/admin/certificates/${row.id}/reinstate`);
      await load();
      flash('Certificate reinstated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reinstate the certificate.');
    }
  };

  return (
    <div>
      <PageHeader
        icon={Award}
        title="Certificates"
        subtitle="Credentials issue automatically when a student finishes every lesson. Issue by hand for offline cohorts, and withdraw anything that should no longer verify."
        actions={
          <button type="button" className={btnGhost} onClick={load}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        }
      />

      <ErrorNote>{error}</ErrorNote>
      {status && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-[11px] text-emerald-200">
          {status}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {TABS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTab(option.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === option.id ? 'bg-[#4338CA] text-white' : 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.12]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Card className="p-4 mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Search">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className={`${inputClass} pl-8`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Certificate ID, student or course"
              />
            </div>
          </Field>
          <Field label="Course">
            <select className={inputClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <Loading />
        ) : tab === 'eligible' ? (
          eligible.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nobody is waiting on a certificate"
              message="Students appear here once they complete every published lesson in a course."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Completed</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {eligible.map((row) => (
                    <tr key={`${row.studentId}-${row.courseId}`} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-white">{row.studentName}</div>
                        <div className="text-[10px] text-slate-400">{row.studentEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-300">{row.courseTitle}</td>
                      <td className="py-3 px-4 text-[11px] text-slate-400">{formatDate(row.completionDate)}</td>
                      <td className="py-3 px-4 text-right">
                        <button type="button" className={btnPrimary} onClick={() => issue(row)}>
                          <Award className="w-3.5 h-3.5" /> Issue certificate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title={tab === 'revoked' ? 'No revoked certificates' : 'No certificates issued yet'}
            message={
              tab === 'revoked'
                ? 'Withdrawn credentials are listed here with the reason.'
                : 'Certificates will appear here as students complete their programs.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Certificate</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Issued</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {certificates.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <div className="text-xs font-mono font-bold text-white">{row.certificateId}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {row.isSample && <Badge tone="amber">sample</Badge>}
                        {row.revoked && <Badge tone="rose">revoked</Badge>}
                        {row.revokedReason && <span className="text-[10px] text-slate-400">{row.revokedReason}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-white">{row.studentName}</div>
                      <div className="text-[10px] text-slate-400">{row.studentEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-300">{row.courseTitle}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">{formatDate(row.issueDate)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/certificate/${row.certificateId}`}
                          target="_blank"
                          rel="noreferrer"
                          className={btnGhost}
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Verify
                        </a>
                        {tab === 'revoked' ? (
                          <button type="button" className={btnGhost} onClick={() => reinstate(row)}>
                            <RotateCcw className="w-3.5 h-3.5" /> Reinstate
                          </button>
                        ) : (
                          <button type="button" className={btnDanger} onClick={() => setRevokeTarget(row)}>
                            <Ban className="w-3.5 h-3.5" /> Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(revokeTarget)}
        title="Revoke certificate"
        subtitle={revokeTarget ? `${revokeTarget.certificateId} — ${revokeTarget.studentName}` : ''}
        onClose={() => {
          setRevokeTarget(null);
          setRevokeReason('');
        }}
        footer={
          <>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                setRevokeTarget(null);
                setRevokeReason('');
              }}
            >
              Cancel
            </button>
            <button type="button" className={btnDanger} onClick={revoke}>
              <Ban className="w-3.5 h-3.5" /> Revoke certificate
            </button>
          </>
        }
      >
        <Field label="Reason (recorded in the audit log)" hint="The certificate page will show that this credential was withdrawn.">
          <textarea
            className={inputClass}
            rows={3}
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="e.g. Issued in error"
          />
        </Field>
      </Modal>
    </div>
  );
}
