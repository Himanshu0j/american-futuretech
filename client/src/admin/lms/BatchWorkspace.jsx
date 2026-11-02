import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronRight,
  ArrowLeft,
  CalendarPlus,
  ListChecks,
  UserPlus,
  Briefcase,
  Users,
  CalendarDays,
  Copy,
  Trash2,
  Pencil,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Plus,
  BookOpen,
  FileText,
  ClipboardCheck,
  Megaphone,
  BarChart3,
  Settings,
  Download,
  RotateCcw,
  ArrowRightLeft,
  CalendarClock,
  Eye,
  KeyRound,
} from 'lucide-react';
import api from '../../lib/api';
import {
  PageHeader,
  Card,
  StatCard,
  Badge,
  Loading,
  ErrorNote,
  EmptyState,
  Modal,
  btnPrimary,
  btnGhost,
  btnDanger,
  btnIcon,
  inputClass,
  Field,
  ProgressBar,
} from './ui';
import BatchForm, { toBatchDraft } from './BatchForm';
import ClassForm, { emptyClass, toClassDraft } from './ClassForm';
import QuizForm, { emptyQuiz, toQuizDraft } from './QuizForm';
import AssignmentForm, { emptyAssignment, toAssignmentDraft } from './AssignmentForm';
import EnrollStudentForm, { emptyEnrollment } from './EnrollStudentForm';
import JobForm, { emptyJob } from './JobForm';
import UploadField from './UploadField';
import StudentActivityPanel from './StudentActivityPanel';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'classes', label: 'Classes', icon: CalendarDays },
  { id: 'quizzes', label: 'Quizzes', icon: ListChecks },
  { id: 'assignments', label: 'Assignments', icon: FileText },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'resources', label: 'Resources', icon: BookOpen },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const statusTone = {
  Draft: 'slate',
  Scheduled: 'indigo',
  Published: 'emerald',
  Completed: 'slate',
  Cancelled: 'rose',
  Open: 'emerald',
  Upcoming: 'indigo',
  Closed: 'slate',
  Submitted: 'amber',
  Evaluated: 'emerald',
  'Pending review': 'amber',
  'Auto-graded': 'emerald',
};

const phaseTone = {
  live: 'rose',
  upcoming: 'indigo',
  scheduled: 'indigo',
  ended: 'slate',
  cancelled: 'rose',
  draft: 'slate',
};

const fmtDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtShortDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const toIso = (value) => (value ? new Date(value).toISOString() : null);

const cleanQuestion = (question) => {
  const base = {
    questionText: question.questionText.trim(),
    type: question.type,
    marks: Number(question.marks) || 0,
    explanation: question.explanation || '',
    imageUrl: question.imageUrl || '',
    correctAnswer: question.correctAnswer || '',
    correctOptionIndex: 0,
    correctOptionIndexes: [],
    options: [],
    pairs: [],
  };

  if (['MCQ', 'TrueFalse', 'MultipleSelect'].includes(question.type)) {
    const filled = question.options
      .map((text, index) => ({ text: String(text || '').trim(), index }))
      .filter((row) => row.text);
    base.options = filled.map((row) => row.text);

    if (question.type === 'MultipleSelect') {
      base.correctOptionIndexes = question.correctOptionIndexes
        .map((index) => filled.findIndex((row) => row.index === Number(index)))
        .filter((index) => index >= 0);
    } else {
      const mapped = filled.findIndex((row) => row.index === Number(question.correctOptionIndex));
      base.correctOptionIndex = mapped >= 0 ? mapped : 0;
      base.correctOptionIndexes = [base.correctOptionIndex];
    }
  }

  if (question.type === 'Matching') {
    base.pairs = question.pairs
      .map((pair) => ({ left: String(pair.left || '').trim(), right: String(pair.right || '').trim() }))
      .filter((pair) => pair.left && pair.right);
  }

  return base;
};

const cleanQuizPayload = (draft) => ({
  title: draft.title.trim(),
  description: draft.description,
  instructions: draft.instructions,
  timeLimitMinutes: Number(draft.timeLimitMinutes) || 15,
  passingScorePercent: Number(draft.passingScorePercent) || 70,
  passingMarks: Number(draft.passingMarks) || 0,
  attemptsAllowed: Number(draft.attemptsAllowed) || 1,
  startsAt: toIso(draft.startsAt),
  endsAt: toIso(draft.endsAt),
  shuffleQuestions: Boolean(draft.shuffleQuestions),
  shuffleOptions: Boolean(draft.shuffleOptions),
  negativeMarking: Number(draft.negativeMarking) || 0,
  resultVisibility: draft.resultVisibility,
  isPublished: Boolean(draft.isPublished),
  questions: draft.questions.map(cleanQuestion),
});

export default function BatchWorkspace() {
  const { courseId, batchId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [tab, setTab] = useState('overview');

  // Class state
  const [classOpen, setClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classDraft, setClassDraft] = useState(emptyClass(batchId));
  const [savingClass, setSavingClass] = useState(false);

  // Quiz state
  const [quizOpen, setQuizOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizDraft, setQuizDraft] = useState(emptyQuiz());
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [quizResultsLoading, setQuizResultsLoading] = useState(false);
  const [attemptReview, setAttemptReview] = useState(null);
  const [attemptMarks, setAttemptMarks] = useState({});
  const [savingAttempt, setSavingAttempt] = useState(false);

  // Assignment state
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentDraft, setAssignmentDraft] = useState(emptyAssignment());
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [submissionPanel, setSubmissionPanel] = useState(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionEdits, setSubmissionEdits] = useState({});

  // Student state
  const [studentOpen, setStudentOpen] = useState(false);
  const [studentDraft, setStudentDraft] = useState(emptyEnrollment());
  const [savingStudent, setSavingStudent] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [transferRow, setTransferRow] = useState(null);
  const [transferBatches, setTransferBatches] = useState([]);
  const [transferBatchId, setTransferBatchId] = useState('');
  const [savingTransfer, setSavingTransfer] = useState(false);
  const [accessBusy, setAccessBusy] = useState('');
  const [activityStudentId, setActivityStudentId] = useState(null);
  const [passwordRow, setPasswordRow] = useState(null);
  const [passwordDraft, setPasswordDraft] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Resource state
  const [resourceOpen, setResourceOpen] = useState(false);
  const [resourceDraft, setResourceDraft] = useState({ title: '', description: '', url: '', fileType: 'PDF', category: 'Reading' });
  const [savingResource, setSavingResource] = useState(false);

  // Announcement state
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState({ title: '', body: '', pinned: false });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Job state
  const [jobOpen, setJobOpen] = useState(false);
  const [jobDraft, setJobDraft] = useState(emptyJob());
  const [savingJob, setSavingJob] = useState(false);
  const [jobApplications, setJobApplications] = useState(null);

  // Attendance state
  const [attendanceClassId, setAttendanceClassId] = useState('');
  const [attendanceRows, setAttendanceRows] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Analytics + batch settings
  const [analytics, setAnalytics] = useState(null);
  const [batchDraft, setBatchDraft] = useState(null);
  const [savingBatch, setSavingBatch] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/lms/batches/${batchId}`);
      setData(res.data);
      setBatchDraft(toBatchDraft(res.data?.batch || {}));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load this batch.');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (message) => {
    setFlash(message);
    window.setTimeout(() => setFlash(''), 4000);
  };

  const batch = data?.batch;
  const stats = data?.stats || {};
  const classes = data?.classes || [];
  const students = data?.students || [];
  const quizzes = data?.quizzes || [];
  const assignments = data?.assignments || [];
  const resources = data?.resources || [];
  const announcements = data?.announcements || [];
  const jobs = data?.jobs || [];

  const upcoming = useMemo(
    () => classes.filter((row) => ['upcoming', 'live', 'scheduled'].includes(row.window?.phase)).slice(0, 4),
    [classes]
  );

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return students;
    return students.filter((row) =>
      `${row.student?.name || ''} ${row.student?.email || ''} ${row.student?.enrollmentNumber || ''}`
        .toLowerCase()
        .includes(query)
    );
  }, [students, studentSearch]);

  // ── Classes ────────────────────────────────────────────────────────────────
  const openCreateClass = () => {
    setEditingClass(null);
    setClassDraft(emptyClass(batchId, batch?.timezone || 'EST (UTC-5)'));
    setClassOpen(true);
  };

  const openEditClass = (session) => {
    setEditingClass(session);
    setClassDraft(toClassDraft(session, batchId));
    setClassOpen(true);
  };

  const saveClass = async () => {
    if (!classDraft.title.trim()) return setError('Class title is required.');
    if (!classDraft.classDate) return setError('Class date is required.');
    setSavingClass(true);
    setError('');
    try {
      if (editingClass) {
        await api.put(`/admin/lms/classes/${editingClass._id}`, classDraft);
        notify('Class updated.');
      } else {
        await api.post('/admin/lms/classes', { ...classDraft, batchId });
        notify('Class scheduled for this batch.');
      }
      setClassOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the class.');
    } finally {
      setSavingClass(false);
    }
  };

  const quickClassUpdate = async (session, patch, message) => {
    try {
      await api.put(`/admin/lms/classes/${session._id}`, patch);
      await load();
      notify(message);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the class.');
    }
  };

  const duplicateClass = async (session) => {
    try {
      await api.post(`/admin/lms/classes/${session._id}/duplicate`);
      await load();
      notify('Class duplicated as a draft next week.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not duplicate the class.');
    }
  };

  const removeClass = async (session) => {
    if (!window.confirm(`Delete "${session.title}"?`)) return;
    try {
      await api.delete(`/admin/lms/classes/${session._id}`);
      await load();
      notify('Class deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the class.');
    }
  };

  // ── Quizzes ────────────────────────────────────────────────────────────────
  const openCreateQuiz = () => {
    setEditingQuiz(null);
    setQuizDraft(emptyQuiz());
    setQuizOpen(true);
  };

  const openEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizDraft(toQuizDraft(quiz));
    setQuizOpen(true);
  };

  const saveQuiz = async () => {
    if (!quizDraft.title.trim()) return setError('Quiz title is required.');
    if (!quizDraft.questions.length) return setError('Add at least one question.');
    setSavingQuiz(true);
    setError('');
    try {
      const payload = cleanQuizPayload(quizDraft);
      if (editingQuiz) {
        await api.put(`/admin/lms/quizzes/${editingQuiz._id}`, payload);
        notify('Quiz updated.');
      } else {
        await api.post(`/admin/lms/batches/${batchId}/quizzes`, payload);
        notify('Quiz published to this batch.');
      }
      setQuizOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the quiz.');
    } finally {
      setSavingQuiz(false);
    }
  };

  const removeQuiz = async (quiz) => {
    if (!window.confirm(`Delete "${quiz.title}"? Attempts block deletion.`)) return;
    try {
      await api.delete(`/admin/lms/quizzes/${quiz._id}`);
      await load();
      notify('Quiz deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the quiz.');
    }
  };

  const openQuizResults = async (quiz) => {
    setQuizResults({ quiz, loading: true });
    setQuizResultsLoading(true);
    try {
      const res = await api.get(`/admin/lms/quizzes/${quiz._id}/results`);
      setQuizResults(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the quiz results.');
      setQuizResults(null);
    } finally {
      setQuizResultsLoading(false);
    }
  };

  const openAttemptReview = (attempt) => {
    const quiz = quizResults?.quiz;
    const marks = {};
    (attempt.answers || []).forEach((answer) => {
      const question = (quiz?.questions || []).find((row) => String(row._id) === String(answer.questionId));
      if (question && ['ShortAnswer', 'LongAnswer', 'FillBlank', 'Matching'].includes(question.type)) {
        marks[String(answer.questionId)] = {
          awardedMarks: answer.awardedMarks ?? 0,
          feedback: answer.feedback || '',
          max: question.marks ?? 1,
          text: answer.textAnswer || '',
          prompt: question.questionText,
        };
      }
    });
    setAttemptReview(attempt);
    setAttemptMarks(marks);
  };

  const saveAttemptReview = async () => {
    if (!attemptReview) return;
    setSavingAttempt(true);
    setError('');
    try {
      const answers = Object.entries(attemptMarks).map(([questionId, row]) => ({
        questionId,
        awardedMarks: Number(row.awardedMarks) || 0,
        feedback: row.feedback,
      }));
      await api.put(`/admin/lms/quiz-attempts/${attemptReview._id}/evaluate`, { answers });
      notify('Attempt graded.');
      setAttemptReview(null);
      await openQuizResults(quizResults.quiz);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not grade the attempt.');
    } finally {
      setSavingAttempt(false);
    }
  };

  // ── Assignments ────────────────────────────────────────────────────────────
  const openCreateAssignment = () => {
    setEditingAssignment(null);
    setAssignmentDraft(emptyAssignment());
    setAssignmentOpen(true);
  };

  const openEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setAssignmentDraft(toAssignmentDraft(assignment));
    setAssignmentOpen(true);
  };

  const saveAssignment = async () => {
    if (!assignmentDraft.title.trim()) return setError('Assignment title is required.');
    setSavingAssignment(true);
    setError('');
    try {
      const payload = {
        ...assignmentDraft,
        totalMarks: Number(assignmentDraft.totalMarks) || 0,
        dueAt: toIso(assignmentDraft.dueAt),
      };
      if (editingAssignment) {
        await api.put(`/admin/lms/assignments/${editingAssignment._id}`, payload);
        notify('Assignment updated.');
      } else {
        await api.post(`/admin/lms/batches/${batchId}/assignments`, payload);
        notify('Assignment published to this batch.');
      }
      setAssignmentOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the assignment.');
    } finally {
      setSavingAssignment(false);
    }
  };

  const removeAssignment = async (assignment) => {
    if (!window.confirm(`Delete "${assignment.title}"? Submissions block deletion.`)) return;
    try {
      await api.delete(`/admin/lms/assignments/${assignment._id}`);
      await load();
      notify('Assignment deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the assignment.');
    }
  };

  const openSubmissions = async (assignment) => {
    setSubmissionPanel({ assignment, loading: true });
    setSubmissionLoading(true);
    try {
      const res = await api.get(`/admin/lms/assignments/${assignment._id}/submissions`);
      setSubmissionPanel(res.data);
      setSubmissionEdits({});
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load submissions.');
      setSubmissionPanel(null);
    } finally {
      setSubmissionLoading(false);
    }
  };

  const saveSubmission = async (submission) => {
    const edit = submissionEdits[submission._id] || {};
    try {
      await api.put(`/admin/lms/assignment-submissions/${submission._id}/evaluate`, {
        marks: Number(edit.marks ?? submission.marks ?? 0),
        feedback: edit.feedback ?? submission.feedback ?? '',
      });
      notify('Submission graded.');
      await openSubmissions(submissionPanel.assignment);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not grade the submission.');
    }
  };

  // ── Students ───────────────────────────────────────────────────────────────
  const openEnrollStudent = () => {
    setStudentDraft(emptyEnrollment());
    setCredentials(null);
    setStudentOpen(true);
  };

  const saveStudent = async () => {
    if (!studentDraft.name.trim() || !studentDraft.email.trim()) {
      return setError('Student name and email are required.');
    }
    setSavingStudent(true);
    setError('');
    try {
      const res = await api.post(`/admin/lms/batches/${batchId}/students`, studentDraft);
      setCredentials(res.data.credentials);
      notify(`${res.data.student.name} enrolled in this batch.`);
      await load();
      if (!res.data.credentials) setStudentOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the student account.');
    } finally {
      setSavingStudent(false);
    }
  };

  const openPassword = (row) => {
    setPasswordRow(row);
    setPasswordDraft('');
    setError('');
  };

  const savePassword = async () => {
    if (!passwordRow?.student?._id) return;
    setSavingPassword(true);
    setError('');
    try {
      const res = await api.post(`/admin/lms/students/${passwordRow.student._id}/reset-password`, {
        newPassword: passwordDraft.trim(),
      });
      setCredentials(res.data.credentials);
      setCredentialsOpen(true);
      setPasswordRow(null);
      setPasswordDraft('');
      notify(res.data.mode === 'custom' ? 'Password updated.' : 'New temporary password generated.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleStudentStatus = async (row) => {
    try {
      await api.put(`/admin/lms/students/${row.student._id}/status`, {
        isActive: !row.student.isActive,
        enrollmentId: row.enrollmentId,
      });
      await load();
      notify(`${row.student.name} ${row.student.isActive ? 'suspended' : 'reactivated'}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the student.');
    }
  };

  // Extend by 30 days from the later of today and the current expiry, so a
  // button press never shortens access that still has time left.
  const extendAccess = async (row) => {
    const base =
      row.accessUntil && new Date(row.accessUntil) > new Date() ? new Date(row.accessUntil) : new Date();
    base.setDate(base.getDate() + 30);
    setAccessBusy(row.enrollmentId);
    try {
      await api.put(`/admin/lms/students/${row.student._id}/access`, {
        enrollmentId: row.enrollmentId,
        accessUntil: base.toISOString().slice(0, 10),
      });
      await load();
      notify(`${row.student.name}'s access extended to ${base.toLocaleDateString()}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not extend access.');
    } finally {
      setAccessBusy('');
    }
  };

  const openTransfer = async (row) => {
    setTransferRow(row);
    setTransferBatchId('');
    setTransferBatches([]);
    try {
      const res = await api.get(`/admin/lms/portal/courses/${courseId}`);
      setTransferBatches(
        (res.data?.batches || []).filter(
          (batch) => String(batch._id) !== String(batchId) && batch.status !== 'Archived'
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the other batches.');
    }
  };

  const saveTransfer = async () => {
    if (!transferBatchId) return setError('Pick the batch to move this student into.');
    setSavingTransfer(true);
    setError('');
    try {
      const res = await api.put(`/admin/lms/students/${transferRow.student._id}/transfer`, {
        enrollmentId: transferRow.enrollmentId,
        batchId: transferBatchId,
      });
      notify(`${transferRow.student.name} moved to ${res.data.batch?.name || 'the selected batch'}.`);
      setTransferRow(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not transfer the student.');
    } finally {
      setSavingTransfer(false);
    }
  };

  // ── Resources ──────────────────────────────────────────────────────────────
  const saveResource = async () => {
    if (!resourceDraft.title.trim() || !resourceDraft.url.trim()) {
      return setError('Resource title and link are required.');
    }
    setSavingResource(true);
    setError('');
    try {
      await api.post(`/admin/lms/batches/${batchId}/resources`, resourceDraft);
      setResourceOpen(false);
      setResourceDraft({ title: '', description: '', url: '', fileType: 'PDF', category: 'Reading' });
      await load();
      notify('Resource added to this batch.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add the resource.');
    } finally {
      setSavingResource(false);
    }
  };

  const removeResource = async (resource) => {
    if (!window.confirm(`Remove "${resource.title}"?`)) return;
    try {
      await api.delete(`/admin/lms/resources/${resource._id}`);
      await load();
      notify('Resource removed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove the resource.');
    }
  };

  // ── Announcements ──────────────────────────────────────────────────────────
  const saveAnnouncement = async () => {
    if (!announcementDraft.title.trim()) return setError('Announcement title is required.');
    setSavingAnnouncement(true);
    setError('');
    try {
      await api.post(`/admin/lms/batches/${batchId}/announcements`, announcementDraft);
      setAnnouncementOpen(false);
      setAnnouncementDraft({ title: '', body: '', pinned: false });
      await load();
      notify('Announcement published to this batch.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not publish the announcement.');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const removeAnnouncement = async (announcement) => {
    if (!window.confirm(`Delete "${announcement.title}"?`)) return;
    try {
      await api.delete(`/admin/lms/batches/announcements/${announcement._id}`);
      await load();
      notify('Announcement deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the announcement.');
    }
  };

  // ── Jobs ───────────────────────────────────────────────────────────────────
  const saveJob = async () => {
    if (!jobDraft.title.trim() || !jobDraft.description.trim()) {
      return setError('Job title and description are required.');
    }
    setSavingJob(true);
    setError('');
    try {
      await api.post(`/admin/lms/batches/${batchId}/jobs`, jobDraft);
      setJobOpen(false);
      setJobDraft(emptyJob());
      await load();
      notify('Job published to this batch.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not publish the job.');
    } finally {
      setSavingJob(false);
    }
  };

  const openJobApplications = async (job) => {
    setJobApplications({ job, loading: true });
    try {
      const res = await api.get(`/admin/lms/jobs/${job._id}/applications`);
      setJobApplications(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load applications.');
      setJobApplications(null);
    }
  };

  // ── Attendance ─────────────────────────────────────────────────────────────
  const openAttendance = (session) => {
    setAttendanceClassId(session._id);
    const rows = {};
    students.forEach((row) => {
      if (row.student?._id) rows[row.student._id] = 'Present';
    });
    setAttendanceRows(rows);
  };

  const saveAttendance = async () => {
    if (!attendanceClassId) return setError('Pick a class first.');
    setSavingAttendance(true);
    setError('');
    try {
      await api.post(`/admin/lms/batches/${batchId}/attendance`, {
        classSessionId: attendanceClassId,
        records: Object.entries(attendanceRows).map(([studentId, status]) => ({ studentId, status })),
      });
      setAttendanceClassId('');
      await load();
      notify('Attendance saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save attendance.');
    } finally {
      setSavingAttendance(false);
    }
  };

  // ── Analytics / settings ───────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'analytics' || !batchId) return;
    let cancelled = false;
    api
      .get(`/admin/lms/batches/${batchId}/analytics`)
      .then((res) => {
        if (!cancelled) setAnalytics(res.data.analytics);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load analytics.');
      });
    return () => {
      cancelled = true;
    };
  }, [tab, batchId]);

  const saveBatch = async () => {
    if (!batchDraft) return;
    setSavingBatch(true);
    setError('');
    try {
      await api.put(`/admin/lms/batches/${batchId}`, batchDraft);
      await load();
      notify('Batch settings saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the batch.');
    } finally {
      setSavingBatch(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <Loading label="Opening batch…" />
      </Card>
    );
  }

  if (!batch) {
    return (
      <div>
        <ErrorNote>{error || 'Batch not found.'}</ErrorNote>
        <Link to={`/admin/lms/portal/${courseId}`} className={btnGhost}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to batches
        </Link>
      </div>
    );
  }

  return (
    <div>
      <nav className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mb-3" aria-label="Breadcrumb">
        <Link to="/admin/lms/portal" className="hover:text-white inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> LMS Portal
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/admin/lms/portal/${courseId}`} className="hover:text-white">
          {batch.course?.title || 'Course'}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-200 font-semibold">{batch.name || batch.batchCode}</span>
      </nav>

      <PageHeader
        icon={CalendarDays}
        title={batch.name || batch.batchCode}
        subtitle={`${batch.course?.title || 'Course'} · ${batch.timing || 'Schedule not set'} · ${batch.instructor || 'Instructor not assigned'}`}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={load}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button type="button" className={btnPrimary} onClick={openCreateClass}>
              <Plus className="w-3.5 h-3.5" /> Add class
            </button>
          </>
        }
      />

      <ErrorNote>{error}</ErrorNote>
      {flash && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-400/20 text-[11px] text-blue-200">
          {flash}
        </div>
      )}

      {/* Four primary operations, opened in place so the course/batch stays selected. */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <button
          type="button"
          onClick={openCreateClass}
          className="text-left rounded-2xl p-4 bg-[rgb(var(--tw-blue-800))] border border-blue-400/30 hover:border-blue-300/60 transition-colors"
        >
          <CalendarPlus className="w-5 h-5 text-blue-200" />
          <div className="mt-2 text-xs font-bold text-white">Add Class</div>
          <div className="text-[10px] text-blue-100/80">Schedule a live session with its room and material.</div>
        </button>
        <button
          type="button"
          onClick={openCreateQuiz}
          className="text-left rounded-2xl p-4 bg-[rgb(var(--tw-ink-900))] border border-white/[0.08] hover:border-blue-400/40 transition-colors"
        >
          <ListChecks className="w-5 h-5 text-blue-300" />
          <div className="mt-2 text-xs font-bold text-white">Add Quiz</div>
          <div className="text-[10px] text-slate-400">Build questions, set marks and publish to this batch.</div>
        </button>
        <button
          type="button"
          onClick={openEnrollStudent}
          className="text-left rounded-2xl p-4 bg-[rgb(var(--tw-ink-900))] border border-white/[0.08] hover:border-blue-400/40 transition-colors"
        >
          <UserPlus className="w-5 h-5 text-blue-300" />
          <div className="mt-2 text-xs font-bold text-white">Enroll Student</div>
          <div className="text-[10px] text-slate-400">Create an account, generate credentials and enroll.</div>
        </button>
        <button
          type="button"
          onClick={() => {
            setJobDraft(emptyJob());
            setJobOpen(true);
          }}
          className="text-left rounded-2xl p-4 bg-[rgb(var(--tw-ink-900))] border border-white/[0.08] hover:border-blue-400/40 transition-colors"
        >
          <Briefcase className="w-5 h-5 text-blue-300" />
          <div className="mt-2 text-xs font-bold text-white">Add Job</div>
          <div className="text-[10px] text-slate-400">Publish a role that only this cohort sees.</div>
        </button>
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto" role="tablist" aria-label="Batch sections">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors ${
                tab === item.id
                  ? 'bg-[rgb(var(--tw-blue-700))] text-white'
                  : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Students" value={stats.students ?? 0} hint={`${stats.activeStudents ?? 0} active`} icon={Users} />
            <StatCard label="Seats left" value={stats.seatsLeft ?? 0} hint={`Capacity ${stats.capacity ?? 0}`} icon={UserPlus} tone="emerald" />
            <StatCard label="Classes" value={stats.classes ?? 0} hint={`${stats.completedClasses ?? 0} completed`} icon={CalendarDays} tone="indigo" />
            <StatCard label="Quizzes" value={stats.quizzes ?? 0} hint={`${stats.pendingEvaluations ?? 0} awaiting evaluation`} icon={ListChecks} tone="amber" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 mt-6">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="text-xs font-bold text-white">Next classes</div>
                <button type="button" onClick={() => setTab('classes')} className="text-[10px] font-bold text-blue-300">
                  View all
                </button>
              </div>
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarPlus}
                  title="No upcoming class"
                  message="Schedule the first session so it appears in the student portal."
                  action={
                    <button type="button" className={btnPrimary} onClick={openCreateClass}>
                      <Plus className="w-3.5 h-3.5" /> Add class
                    </button>
                  }
                />
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {upcoming.map((session) => (
                    <div key={session._id} className="px-4 py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-white truncate">{session.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {fmtDate(session.startsAt)} · {fmtTime(session.startsAt)}–{fmtTime(session.endsAt)}
                        </div>
                      </div>
                      <Badge tone={phaseTone[session.window?.phase] || 'slate'}>{session.window?.phase || session.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="text-xs font-bold text-white">Roster</div>
                <button type="button" onClick={() => setTab('students')} className="text-[10px] font-bold text-blue-300">
                  View all
                </button>
              </div>
              {students.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Nobody enrolled yet"
                  message="Create a student account to give them this batch's classes."
                  action={
                    <button type="button" className={btnPrimary} onClick={openEnrollStudent}>
                      <UserPlus className="w-3.5 h-3.5" /> Enroll student
                    </button>
                  }
                />
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {students.slice(0, 5).map((row) => (
                    <div key={row.enrollmentId} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-white truncate">{row.student?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400 truncate">{row.student?.email}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 shrink-0">{row.progressPercent || 0}%</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {tab === 'classes' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
            <div>
              <div className="text-xs font-bold text-white">Classes in this batch</div>
              <div className="text-[10px] text-slate-400">Drafts stay hidden; meeting links unlock only during the live window.</div>
            </div>
            <button type="button" className={btnPrimary} onClick={openCreateClass}>
              <Plus className="w-3.5 h-3.5" /> Add class
            </button>
          </div>

          {classes.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No classes scheduled"
              message="Add the first class and it will appear in the student portal for this batch only."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3">Time</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Room</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {classes.map((session) => (
                    <tr key={session._id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 text-[10px] text-slate-300 whitespace-nowrap">{fmtDate(session.startsAt)}</td>
                      <td className="py-3 px-3">
                        <div className="text-[11px] font-semibold text-white">{session.title}</div>
                        <div className="text-[10px] text-slate-400">
                          Session {session.sessionNumber} · {session.instructor || 'No instructor'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[10px] text-slate-400 whitespace-nowrap">
                        {fmtTime(session.startsAt)}–{fmtTime(session.endsAt)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge tone={statusTone[session.status] || 'slate'}>{session.status}</Badge>
                          {session.window?.phase === 'live' && <Badge tone="rose">Live now</Badge>}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[10px] text-slate-400">
                        <div>{session.meetingPlatform}</div>
                        {session.window?.canJoin && session.meetingUrl ? (
                          <a
                            href={session.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-300 font-bold"
                          >
                            Join <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span>{session.deliveryMode}</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className={btnIcon}
                            onClick={() => openAttendance(session)}
                            aria-label={`Mark attendance for ${session.title}`}
                            title="Mark attendance"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                          </button>
                          {session.status !== 'Published' && session.status !== 'Cancelled' && (
                            <button
                              type="button"
                              className={btnIcon}
                              onClick={() => quickClassUpdate(session, { status: 'Published' }, 'Class published to its batch.')}
                              aria-label={`Publish ${session.title}`}
                              title="Publish"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            className={btnIcon}
                            onClick={() => openEditClass(session)}
                            aria-label={`Edit ${session.title}`}
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className={btnIcon}
                            onClick={() => duplicateClass(session)}
                            aria-label={`Duplicate ${session.title}`}
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className={btnDanger}
                            onClick={() => removeClass(session)}
                            aria-label={`Delete ${session.title}`}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'quizzes' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
            <div>
              <div className="text-xs font-bold text-white">Quizzes in this batch</div>
              <div className="text-[10px] text-slate-400">Only enrolled students can open them; objective answers grade on submit.</div>
            </div>
            <button type="button" className={btnPrimary} onClick={openCreateQuiz}>
              <Plus className="w-3.5 h-3.5" /> Add quiz
            </button>
          </div>

          {quizzes.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No quizzes yet"
              message="Build a quiz with multiple choice, multi-select, true/false, short or long answers, fill-in-the-blank or matching."
              action={
                <button type="button" className={btnPrimary} onClick={openCreateQuiz}>
                  <Plus className="w-3.5 h-3.5" /> Create the first quiz
                </button>
              }
            />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {quizzes.map((quiz) => (
                <div key={quiz._id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-white">{quiz.title}</span>
                      <Badge tone={quiz.isPublished ? 'emerald' : 'slate'}>{quiz.isPublished ? 'Published' : 'Draft'}</Badge>
                      {quiz.stats?.pendingReview > 0 && <Badge tone="amber">{quiz.stats.pendingReview} to grade</Badge>}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {(quiz.questions || []).length} questions · {quiz.totalMarks || 0} marks · {quiz.stats?.attempts || 0} attempt(s) ·
                      avg {quiz.stats?.averagePercent || 0}%
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {quiz.startsAt ? `Opens ${fmtShortDate(quiz.startsAt)}` : 'Opens immediately'} ·{' '}
                      {quiz.endsAt ? `closes ${fmtShortDate(quiz.endsAt)}` : 'no deadline'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" className={btnGhost} onClick={() => openQuizResults(quiz)}>
                      <BarChart3 className="w-3.5 h-3.5" /> Results
                    </button>
                    <button type="button" className={btnIcon} onClick={() => openEditQuiz(quiz)} aria-label={`Edit ${quiz.title}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className={btnDanger} onClick={() => removeQuiz(quiz)} aria-label={`Delete ${quiz.title}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'assignments' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
            <div>
              <div className="text-xs font-bold text-white">Assignments in this batch</div>
              <div className="text-[10px] text-slate-400">Submissions land here for evaluation.</div>
            </div>
            <button type="button" className={btnPrimary} onClick={openCreateAssignment}>
              <Plus className="w-3.5 h-3.5" /> Add assignment
            </button>
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No assignments yet"
              message="Publish a brief with a due date so students can submit their work."
              action={
                <button type="button" className={btnPrimary} onClick={openCreateAssignment}>
                  <Plus className="w-3.5 h-3.5" /> Create assignment
                </button>
              }
            />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-white">{assignment.title}</span>
                      <Badge tone={statusTone[assignment.status] || 'slate'}>{assignment.status}</Badge>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {assignment.totalMarks} marks · due {assignment.dueAt ? fmtShortDate(assignment.dueAt) : 'no deadline'} ·{' '}
                      {assignment.stats?.submissions || 0} submitted · {assignment.stats?.pending || 0} to grade
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" className={btnGhost} onClick={() => openSubmissions(assignment)}>
                      <ClipboardCheck className="w-3.5 h-3.5" /> Submissions
                    </button>
                    <button type="button" className={btnIcon} onClick={() => openEditAssignment(assignment)} aria-label={`Edit ${assignment.title}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className={btnDanger} onClick={() => removeAssignment(assignment)} aria-label={`Delete ${assignment.title}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'students' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
            <div>
              <div className="text-xs font-bold text-white">Batch roster</div>
              <div className="text-[10px] text-slate-400">
                {stats.students ?? 0} enrolled · {stats.seatsLeft ?? 0} seats left
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                className={`${inputClass} w-56`}
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search name, email or ID"
                aria-label="Search batch students"
              />
              <button type="button" className={btnPrimary} onClick={openEnrollStudent}>
                <UserPlus className="w-3.5 h-3.5" /> Enroll student
              </button>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students here yet"
              message="Create an account and enroll it into this cohort to see it here."
              action={
                <button type="button" className={btnPrimary} onClick={openEnrollStudent}>
                  <UserPlus className="w-3.5 h-3.5" /> Enroll student
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Progress</th>
                    <th className="py-3 px-3">Last login</th>
                    <th className="py-3 px-3">Access</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredStudents.map((row) => (
                    <tr key={row.enrollmentId} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={row.student?.avatar || '/images/avatars/default-avatar.webp'}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-white truncate">{row.student?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-slate-400 truncate">{row.student?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[10px] font-mono text-slate-400">
                        {row.student?.enrollmentNumber || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <ProgressBar percent={row.progressPercent || 0} />
                      </td>
                      <td className="py-3 px-3 text-[10px] text-slate-400">
                        {row.student?.lastLoginAt ? (
                          <div>
                            <div>{fmtShortDate(row.student.lastLoginAt)}</div>
                            <span className={row.student.activeNow ? 'text-emerald-300' : 'text-slate-500'}>
                              {row.student.activeNow ? 'Online now' : 'Offline'}
                            </span>
                          </div>
                        ) : (
                          'Never signed in'
                        )}
                      </td>
                      <td className="py-3 px-3 text-[10px] text-slate-400">
                        {row.accessUntil ? `Until ${fmtShortDate(row.accessUntil)}` : 'No expiry'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge tone={row.status === 'Active' ? 'emerald' : row.status === 'Suspended' ? 'amber' : 'slate'}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className={btnIcon}
                            onClick={() => setActivityStudentId(row.student?._id)}
                            title="Login history and activity"
                            aria-label={`View access details for ${row.student?.name}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className={btnIcon}
                            onClick={() => openPassword(row)}
                            title="Change password"
                            aria-label={`Change password for ${row.student?.name}`}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className={btnIcon}
                            onClick={() => extendAccess(row)}
                            disabled={accessBusy === row.enrollmentId}
                            title="Extend access by 30 days"
                            aria-label={`Extend access for ${row.student?.name} by 30 days`}
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className={btnIcon}
                            onClick={() => openTransfer(row)}
                            title="Transfer to another batch"
                            aria-label={`Transfer ${row.student?.name} to another batch`}
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className={row.student?.isActive ? btnDanger : btnGhost}
                            onClick={() => toggleStudentStatus(row)}
                          >
                            {row.student?.isActive ? 'Revoke' : 'Restore'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Marked rows" value={data?.attendance?.summary?.total ?? 0} hint="Across all classes" icon={ClipboardCheck} />
            <StatCard label="Attendance rate" value={`${data?.attendance?.summary?.rate ?? 0}%`} hint="Present + late" icon={CheckCircle2} tone="emerald" />
            <StatCard label="Classes marked" value={data?.attendance?.markedClasses ?? 0} hint={`of ${classes.length} classes`} icon={CalendarDays} tone="amber" />
          </div>

          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <div className="text-xs font-bold text-white">Mark attendance</div>
              <div className="text-[10px] text-slate-400">Pick a class, set each student's status, then save.</div>
            </div>
            {classes.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No classes to mark" message="Schedule a class first." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3 px-3">Class</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Marked</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {classes.map((session) => {
                      const marked = data?.attendance?.byClass?.[session._id] || { total: 0, present: 0 };
                      return (
                        <tr key={session._id}>
                          <td className="py-3 px-3 text-[11px] text-white">{session.title}</td>
                          <td className="py-3 px-3 text-[10px] text-slate-400">{fmtShortDate(session.startsAt)}</td>
                          <td className="py-3 px-3 text-[10px] text-slate-400">
                            {marked.total ? `${marked.present}/${marked.total} present` : 'Not marked'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button type="button" className={btnGhost} onClick={() => openAttendance(session)}>
                              <ClipboardCheck className="w-3.5 h-3.5" /> Mark
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'resources' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
            <div>
              <div className="text-xs font-bold text-white">Batch resource library</div>
              <div className="text-[10px] text-slate-400">Reading lists, datasets and templates the cohort can open.</div>
            </div>
            <button type="button" className={btnPrimary} onClick={() => setResourceOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Add resource
            </button>
          </div>

          {resources.length === 0 ? (
            <EmptyState icon={BookOpen} title="No resources yet" message="Attach a PDF, dataset or external reading link." />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {resources.map((resource) => (
                <div key={resource._id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                      <span className="text-[11px] font-semibold text-white truncate">{resource.title}</span>
                      <Badge tone="slate">{resource.fileType}</Badge>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{resource.category} · {resource.description || resource.url}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a href={resource.url} target="_blank" rel="noreferrer" className={btnIcon} aria-label={`Open ${resource.title}`}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button type="button" className={btnDanger} onClick={() => removeResource(resource)} aria-label={`Remove ${resource.title}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'jobs' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
            <div>
              <div className="text-xs font-bold text-white">Jobs for this batch</div>
              <div className="text-[10px] text-slate-400">Only this cohort (and the public board) sees these roles.</div>
            </div>
            <button type="button" className={btnPrimary} onClick={() => { setJobDraft(emptyJob()); setJobOpen(true); }}>
              <Plus className="w-3.5 h-3.5" /> Add job
            </button>
          </div>

          {jobs.length === 0 ? (
            <EmptyState icon={Briefcase} title="No jobs published" message="Add a role that fits this cohort's skills." />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {jobs.map((job) => (
                <div key={job._id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-white">{job.title}</span>
                      <Badge tone={job.isPublished && !job.isArchived ? 'emerald' : 'slate'}>
                        {job.isArchived ? 'Archived' : job.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {job.company} · {job.location} · {job.employmentType} · {job.applications} application(s)
                    </div>
                  </div>
                  <button type="button" className={btnGhost} onClick={() => openJobApplications(job)}>
                    <Users className="w-3.5 h-3.5" /> Applications
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'announcements' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
            <div>
              <div className="text-xs font-bold text-white">Batch announcements</div>
              <div className="text-[10px] text-slate-400">Published to this batch only.</div>
            </div>
            <button type="button" className={btnPrimary} onClick={() => setAnnouncementOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> New announcement
            </button>
          </div>

          {announcements.length === 0 ? (
            <EmptyState icon={Megaphone} title="No announcements" message="Post a schedule change or an exam reminder." />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {announcements.map((announcement) => (
                <div key={announcement._id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                      <span className="text-[11px] font-semibold text-white">{announcement.title}</span>
                      {announcement.pinned && <Badge tone="amber">Pinned</Badge>}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 whitespace-pre-line">{announcement.body}</p>
                    <div className="text-[9px] text-slate-500 mt-1">{fmtShortDate(announcement.createdAt)}</div>
                  </div>
                  <button type="button" className={btnDanger} onClick={() => removeAnnouncement(announcement)} aria-label={`Delete ${announcement.title}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'analytics' && (
        <div className="space-y-4">
          {!analytics ? (
            <Card>
              <Loading label="Loading analytics…" />
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Active students" value={analytics.students.active} hint={`${analytics.students.total} total · capacity ${analytics.students.capacity}`} icon={Users} />
                <StatCard label="Attendance" value={`${analytics.attendance.rate}%`} hint={`${analytics.attendance.present} present · ${analytics.attendance.absent} absent`} icon={ClipboardCheck} tone="emerald" />
                <StatCard label="Quiz average" value={`${analytics.quizzes.averagePercent}%`} hint={`${analytics.quizzes.attempts} attempts · ${analytics.quizzes.passRate}% pass`} icon={ListChecks} tone="indigo" />
                <StatCard label="Assignment average" value={analytics.assignments.averageMarks} hint={`${analytics.assignments.submissions} submissions`} icon={FileText} tone="amber" />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-4">
                  <div className="text-xs font-bold text-white mb-3">Attendance breakdown</div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      ['Present', analytics.attendance.present, 'text-blue-300'],
                      ['Late', analytics.attendance.late, 'text-blue-200'],
                      ['Absent', analytics.attendance.absent, 'text-red-300'],
                      ['Excused', analytics.attendance.excused, 'text-slate-300'],
                    ].map(([label, value, tone]) => (
                      <div key={label} className="rounded-xl bg-white/[0.04] py-2">
                        <div className={`text-lg font-bold ${tone}`}>{value}</div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">{label}</div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs font-bold text-white mb-3">Assessment activity</div>
                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between">
                      <span>Classes completed</span>
                      <span className="font-bold text-white">{analytics.classes.completed} / {analytics.classes.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Quizzes awaiting review</span>
                      <span className="font-bold text-white">{analytics.quizzes.pendingReview}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Assignments evaluated</span>
                      <span className="font-bold text-white">{analytics.assignments.evaluated} / {analytics.assignments.submissions}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'settings' && batchDraft && (
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-xs font-bold text-white">Batch settings</div>
              <div className="text-[10px] text-slate-400">Timing changes update the public schedule as well.</div>
            </div>
            <button type="button" className={btnPrimary} onClick={saveBatch} disabled={savingBatch}>
              {savingBatch ? 'Saving…' : 'Save changes'}
            </button>
          </div>
          <BatchForm value={batchDraft} onChange={setBatchDraft} />
        </Card>
      )}

      {/* ── Class modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={classOpen}
        title={editingClass ? 'Edit class' : 'Schedule a class'}
        subtitle={`${batch.name || batch.batchCode} · only this batch will see it`}
        onClose={() => setClassOpen(false)}
        wide
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setClassOpen(false)} disabled={savingClass}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={saveClass} disabled={savingClass}>
              {savingClass ? 'Saving…' : editingClass ? 'Save class' : 'Schedule class'}
            </button>
          </>
        }
      >
        <ClassForm value={classDraft} onChange={setClassDraft} />
      </Modal>

      {/* ── Quiz modal ──────────────────────────────────────────────────────── */}
      <Modal
        open={quizOpen}
        title={editingQuiz ? 'Edit quiz' : 'Add quiz'}
        subtitle={`${batch.course?.title || 'Course'} → ${batch.name || batch.batchCode}`}
        onClose={() => setQuizOpen(false)}
        wide
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setQuizOpen(false)} disabled={savingQuiz}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={saveQuiz} disabled={savingQuiz}>
              {savingQuiz ? 'Saving…' : editingQuiz ? 'Save quiz' : 'Publish quiz'}
            </button>
          </>
        }
      >
        <QuizForm value={quizDraft} onChange={setQuizDraft} />
      </Modal>

      {/* ── Quiz results ────────────────────────────────────────────────────── */}
      <Modal
        open={Boolean(quizResults)}
        title={`Results · ${quizResults?.quiz?.title || 'Quiz'}`}
        subtitle="Objective answers are graded automatically; subjective ones need your marks."
        onClose={() => setQuizResults(null)}
        wide
      >
        {quizResultsLoading || quizResults?.loading ? (
          <Loading label="Loading results…" />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/[0.04] py-2">
                <div className="text-lg font-bold text-white">{quizResults?.attempts?.length || 0}</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400">Attempts</div>
              </div>
              <div className="rounded-xl bg-white/[0.04] py-2">
                <div className="text-lg font-bold text-white">{quizResults?.pendingStudents?.length || 0}</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400">Not attempted</div>
              </div>
              <div className="rounded-xl bg-white/[0.04] py-2">
                <div className="text-lg font-bold text-white">{quizResults?.quiz?.totalMarks || 0}</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400">Total marks</div>
              </div>
            </div>

            {quizResults?.attempts?.length ? (
              <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Score</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Submitted</th>
                      <th className="py-2.5 px-3 text-right">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {quizResults.attempts.map((attempt) => (
                      <tr key={attempt._id}>
                        <td className="py-2.5 px-3">
                          <div className="text-[11px] text-white">{attempt.student?.name || 'Unknown'}</div>
                          <div className="text-[10px] text-slate-400">{attempt.student?.enrollmentNumber}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-white">
                          {attempt.scoreMarks}/{attempt.totalMarks} ({attempt.scorePercent}%)
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge tone={statusTone[attempt.status] || 'slate'}>{attempt.status}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-[10px] text-slate-400">{fmtShortDate(attempt.submittedAt)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button type="button" className={btnGhost} onClick={() => openAttemptReview(attempt)}>
                            <Pencil className="w-3.5 h-3.5" /> Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={ListChecks} title="No attempts yet" message="Students in this batch have not submitted the quiz." />
            )}

            {quizResults?.pendingStudents?.length ? (
              <div>
                <div className="text-[11px] font-bold text-slate-200 mb-1.5">Not attempted</div>
                <div className="flex flex-wrap gap-1.5">
                  {quizResults.pendingStudents.map((student) => (
                    <span key={student._id} className="px-2 py-1 rounded-lg bg-white/[0.05] text-[10px] text-slate-300">
                      {student.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      {/* ── Manual grading of one attempt ───────────────────────────────────── */}
      <Modal
        open={Boolean(attemptReview)}
        title="Grade attempt"
        subtitle={attemptReview?.student?.name ? `${attemptReview.student.name} · ${attemptReview.student.enrollmentNumber || ''}` : ''}
        onClose={() => setAttemptReview(null)}
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setAttemptReview(null)} disabled={savingAttempt}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={saveAttemptReview} disabled={savingAttempt}>
              {savingAttempt ? 'Saving…' : 'Save marks'}
            </button>
          </>
        }
      >
        {Object.keys(attemptMarks).length === 0 ? (
          <p className="text-[11px] text-slate-400">
            Every answer in this attempt was graded automatically. Nothing to review.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(attemptMarks).map(([questionId, row]) => (
              <div key={questionId} className="rounded-xl border border-white/[0.08] p-3">
                <div className="text-[11px] font-semibold text-white">{row.prompt}</div>
                <div className="text-[10px] text-slate-400 mt-1 whitespace-pre-line">{row.text || 'No answer given.'}</div>
                <div className="grid sm:grid-cols-[110px_1fr] gap-2 mt-2">
                  <Field label={`Marks / ${row.max}`}>
                    <input
                      type="number"
                      min="0"
                      max={row.max}
                      className={inputClass}
                      value={row.awardedMarks}
                      onChange={(e) =>
                        setAttemptMarks({ ...attemptMarks, [questionId]: { ...row, awardedMarks: e.target.value } })
                      }
                    />
                  </Field>
                  <Field label="Feedback">
                    <input
                      className={inputClass}
                      value={row.feedback}
                      onChange={(e) => setAttemptMarks({ ...attemptMarks, [questionId]: { ...row, feedback: e.target.value } })}
                      placeholder="Optional note for the student"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Assignment modal ────────────────────────────────────────────────── */}
      <Modal
        open={assignmentOpen}
        title={editingAssignment ? 'Edit assignment' : 'Add assignment'}
        subtitle={`${batch.course?.title || 'Course'} → ${batch.name || batch.batchCode}`}
        onClose={() => setAssignmentOpen(false)}
        wide
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setAssignmentOpen(false)} disabled={savingAssignment}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={saveAssignment} disabled={savingAssignment}>
              {savingAssignment ? 'Saving…' : editingAssignment ? 'Save assignment' : 'Publish assignment'}
            </button>
          </>
        }
      >
        <AssignmentForm value={assignmentDraft} onChange={setAssignmentDraft} />
      </Modal>

      {/* ── Submissions panel ───────────────────────────────────────────────── */}
      <Modal
        open={Boolean(submissionPanel)}
        title={`Submissions · ${submissionPanel?.assignment?.title || ''}`}
        subtitle="Enter marks out of the assignment total and save the feedback."
        onClose={() => setSubmissionPanel(null)}
        wide
      >
        {submissionLoading || submissionPanel?.loading ? (
          <Loading label="Loading submissions…" />
        ) : (
          <div className="space-y-3">
            {(submissionPanel?.submissions || []).length === 0 ? (
              <EmptyState icon={FileText} title="No submissions yet" message="Students have not submitted this assignment." />
            ) : (
              submissionPanel.submissions.map((submission) => {
                const edit = submissionEdits[submission._id] || {};
                return (
                  <div key={submission._id} className="rounded-xl border border-white/[0.08] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-semibold text-white">{submission.student?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400">
                          {submission.student?.enrollmentNumber} · {fmtShortDate(submission.submittedAt)}
                          {submission.isLate ? ' · late' : ''}
                        </div>
                      </div>
                      <Badge tone={statusTone[submission.status] || 'slate'}>{submission.status}</Badge>
                    </div>
                    {submission.text && (
                      <p className="text-[10px] text-slate-300 mt-2 whitespace-pre-line">{submission.text}</p>
                    )}
                    {submission.files?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {submission.files.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.05] text-[10px] text-blue-300"
                          >
                            <Download className="w-3 h-3" /> {file.title}
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <div className="grid sm:grid-cols-[110px_1fr_auto] gap-2 mt-2 items-end">
                      <Field label={`Marks / ${submissionPanel.assignment?.totalMarks ?? 0}`}>
                        <input
                          type="number"
                          min="0"
                          max={submissionPanel.assignment?.totalMarks ?? 0}
                          className={inputClass}
                          value={edit.marks ?? submission.marks ?? ''}
                          onChange={(e) =>
                            setSubmissionEdits({ ...submissionEdits, [submission._id]: { ...edit, marks: e.target.value } })
                          }
                        />
                      </Field>
                      <Field label="Feedback">
                        <input
                          className={inputClass}
                          value={edit.feedback ?? submission.feedback ?? ''}
                          onChange={(e) =>
                            setSubmissionEdits({ ...submissionEdits, [submission._id]: { ...edit, feedback: e.target.value } })
                          }
                          placeholder="What worked, what to improve"
                        />
                      </Field>
                      <button type="button" className={btnPrimary} onClick={() => saveSubmission(submission)}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Save
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {submissionPanel?.pendingStudents?.length ? (
              <div>
                <div className="text-[11px] font-bold text-slate-200 mb-1.5">Not submitted</div>
                <div className="flex flex-wrap gap-1.5">
                  {submissionPanel.pendingStudents.map((student) => (
                    <span key={student._id} className="px-2 py-1 rounded-lg bg-white/[0.05] text-[10px] text-slate-300">
                      {student.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      {/* ── Enroll student ──────────────────────────────────────────────────── */}
      <Modal
        open={studentOpen}
        title="Enroll student"
        subtitle={`${batch.course?.title || 'Course'} → ${batch.name || batch.batchCode} · ${stats.seatsLeft ?? 0} seats left`}
        onClose={() => {
          setStudentOpen(false);
          setCredentials(null);
        }}
        wide
        footer={
          <>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                setStudentOpen(false);
                setCredentials(null);
              }}
              disabled={savingStudent}
            >
              {credentials ? 'Done' : 'Cancel'}
            </button>
            <button type="button" className={btnPrimary} onClick={saveStudent} disabled={savingStudent}>
              {savingStudent ? 'Creating…' : 'Create account & enroll'}
            </button>
          </>
        }
      >
        <EnrollStudentForm value={studentDraft} onChange={setStudentDraft} credentials={credentials} />
      </Modal>

      {/* ── Transfer a student (same course only) ───────────────────────────── */}
      <Modal
        open={Boolean(transferRow)}
        title="Transfer student"
        subtitle={`${transferRow?.student?.name || 'Student'} · ${batch.name || batch.batchCode} → another cohort`}
        onClose={() => setTransferRow(null)}
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setTransferRow(null)} disabled={savingTransfer}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={saveTransfer} disabled={savingTransfer || !transferBatchId}>
              {savingTransfer ? 'Moving…' : 'Transfer student'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Move to batch" required hint="Only batches of this course are listed. History stays on the old enrollment.">
            <select className={inputClass} value={transferBatchId} onChange={(e) => setTransferBatchId(e.target.value)}>
              <option value="">Select a batch…</option>
              {transferBatches.map((row) => (
                <option key={row._id} value={row._id}>
                  {row.name || row.batchCode} · {row.batchCode} · {row.activeStudents ?? 0}/{row.maxCapacity || '∞'}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-[10px] text-slate-400">
            The current enrollment is closed (not deleted) and a new active enrollment is created in the target batch,
            so attendance and assessment history survive the move.
          </p>
        </div>
      </Modal>

      {/* ── Job modal ───────────────────────────────────────────────────────── */}
      <Modal
        open={jobOpen}
        title="Add job"
        subtitle={`${batch.course?.title || 'Course'} → ${batch.name || batch.batchCode}`}
        onClose={() => setJobOpen(false)}
        wide
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setJobOpen(false)} disabled={savingJob}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={saveJob} disabled={savingJob}>
              {savingJob ? 'Publishing…' : 'Publish job'}
            </button>
          </>
        }
      >
        <JobForm value={jobDraft} onChange={setJobDraft} />
      </Modal>

      {/* ── Job applications ────────────────────────────────────────────────── */}
      <Modal
        open={Boolean(jobApplications)}
        title={`Applications · ${jobApplications?.job?.title || ''}`}
        subtitle={jobApplications?.job?.company || ''}
        onClose={() => setJobApplications(null)}
      >
        {jobApplications?.loading ? (
          <Loading label="Loading applications…" />
        ) : (jobApplications?.applications || []).length === 0 ? (
          <EmptyState icon={Briefcase} title="No applications yet" message="Students have not applied to this role." />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {jobApplications.applications.map((application) => (
              <div key={application._id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-white truncate">{application.applicantName}</div>
                  <div className="text-[10px] text-slate-400 truncate">{application.email} · {application.phone}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {application.resumeUrl && (
                    <a href={application.resumeUrl} target="_blank" rel="noreferrer" className={btnIcon} aria-label="Open resume">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <Badge tone={application.status === 'Hired' ? 'emerald' : application.status === 'Rejected' ? 'rose' : 'slate'}>
                    {application.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Resource modal ──────────────────────────────────────────────────── */}
      <Modal
        open={resourceOpen}
        title="Add resource"
        subtitle={`${batch.name || batch.batchCode} · visible to this batch only`}
        onClose={() => setResourceOpen(false)}
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setResourceOpen(false)} disabled={savingResource}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={saveResource} disabled={savingResource}>
              {savingResource ? 'Saving…' : 'Add resource'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <input className={inputClass} value={resourceDraft.title} onChange={(e) => setResourceDraft({ ...resourceDraft, title: e.target.value })} />
          </Field>
          <Field label="Link" required hint="Upload a PDF/slides file from this computer, or paste an https link.">
            <input className={inputClass} value={resourceDraft.url} onChange={(e) => setResourceDraft({ ...resourceDraft, url: e.target.value })} placeholder="https://… or upload below" />
            <div className="mt-2">
              <UploadField
                kind="document"
                label="Upload PDF / slides"
                showHint
                onUploaded={(file) =>
                  setResourceDraft((prev) => ({
                    ...prev,
                    url: file.url,
                    title: prev.title?.trim() ? prev.title : file.originalName || 'Batch resource',
                    fileType: file.fileType || 'PDF',
                  }))
                }
              />
            </div>
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Type">
              <select className={inputClass} value={resourceDraft.fileType} onChange={(e) => setResourceDraft({ ...resourceDraft, fileType: e.target.value })}>
                {['PDF', 'PPT', 'DOC', 'XLSX', 'ZIP', 'IMAGE', 'VIDEO', 'LINK'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <input className={inputClass} value={resourceDraft.category} onChange={(e) => setResourceDraft({ ...resourceDraft, category: e.target.value })} />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={2} className={inputClass} value={resourceDraft.description} onChange={(e) => setResourceDraft({ ...resourceDraft, description: e.target.value })} />
          </Field>
        </div>
      </Modal>

      {/* ── Change password modal ───────────────────────────────────────────── */}
      <Modal
        open={Boolean(passwordRow)}
        title="Change student password"
        subtitle={
          passwordRow
            ? `${passwordRow.student?.name || 'Student'} · ${passwordRow.student?.email || ''}`
            : ''
        }
        onClose={() => {
          setPasswordRow(null);
          setPasswordDraft('');
        }}
        footer={
          <>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                setPasswordRow(null);
                setPasswordDraft('');
              }}
              disabled={savingPassword}
            >
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={savePassword} disabled={savingPassword}>
              <KeyRound className="w-3.5 h-3.5" />
              {savingPassword ? 'Updating…' : passwordDraft.trim() ? 'Set password' : 'Generate password'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="New password"
            hint="Leave blank to generate a secure temporary password. It is shown once after saving; only the hash is stored."
          >
            <input
              type="text"
              className={inputClass}
              value={passwordDraft}
              onChange={(e) => setPasswordDraft(e.target.value)}
              placeholder="Leave blank to auto-generate"
              autoComplete="new-password"
            />
          </Field>
          <p className="text-[11px] text-slate-400">
            Changing the password signs the student out of every open portal session. Tell the student the new
            password securely — there is no self-service reset in their portal.
          </p>
        </div>
      </Modal>

      <StudentActivityPanel
        open={Boolean(activityStudentId)}
        studentId={activityStudentId}
        onClose={() => setActivityStudentId(null)}
        onSetPassword={(student) => {
          setActivityStudentId(null);
          openPassword({ student });
        }}
      />

      {/* ── Announcement modal ──────────────────────────────────────────────── */}
      <Modal
        open={announcementOpen}
        title="New announcement"
        subtitle={`${batch.name || batch.batchCode} · only this batch sees it`}
        onClose={() => setAnnouncementOpen(false)}
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setAnnouncementOpen(false)} disabled={savingAnnouncement}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={saveAnnouncement} disabled={savingAnnouncement}>
              {savingAnnouncement ? 'Publishing…' : 'Publish'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <input className={inputClass} value={announcementDraft.title} onChange={(e) => setAnnouncementDraft({ ...announcementDraft, title: e.target.value })} />
          </Field>
          <Field label="Message">
            <textarea rows={4} className={inputClass} value={announcementDraft.body} onChange={(e) => setAnnouncementDraft({ ...announcementDraft, body: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={announcementDraft.pinned}
              onChange={(e) => setAnnouncementDraft({ ...announcementDraft, pinned: e.target.checked })}
            />
            Pin to the top of the student dashboard
          </label>
        </div>
      </Modal>

      {/* ── Attendance modal ────────────────────────────────────────────────── */}
      <Modal
        open={Boolean(attendanceClassId)}
        title="Mark attendance"
        subtitle={classes.find((row) => row._id === attendanceClassId)?.title || ''}
        onClose={() => setAttendanceClassId('')}
        wide
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setAttendanceClassId('')} disabled={savingAttendance}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={saveAttendance} disabled={savingAttendance}>
              {savingAttendance ? 'Saving…' : 'Save attendance'}
            </button>
          </>
        }
      >
        {students.length === 0 ? (
          <EmptyState icon={Users} title="No students enrolled" message="Enroll students before marking attendance." />
        ) : (
          <div className="space-y-2">
            {students.map((row) => (
              <div key={row.enrollmentId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-white truncate">{row.student?.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{row.student?.enrollmentNumber}</div>
                </div>
                <div className="flex gap-1">
                  {['Present', 'Late', 'Absent', 'Excused'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setAttendanceRows({ ...attendanceRows, [row.student?._id]: status })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                        attendanceRows[row.student?._id] === status
                          ? 'bg-[rgb(var(--tw-blue-700))] text-white'
                          : 'bg-white/[0.06] text-slate-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── One-time credentials (password reset) ───────────────────────────── */}
      <Modal
        open={credentialsOpen && Boolean(credentials)}
        title="Temporary password"
        subtitle="Shown once — only the hash is stored."
        onClose={() => setCredentialsOpen(false)}
        footer={
          <button type="button" className={btnPrimary} onClick={() => setCredentialsOpen(false)}>
            Done
          </button>
        }
      >
        <div className="space-y-3 text-[11px] text-slate-200">
          <div>
            <span className="text-slate-400">Email</span>
            <div className="font-mono break-all">{credentials?.email}</div>
          </div>
          <div>
            <span className="text-slate-400">Temporary password</span>
            <div className="font-mono break-all">{credentials?.temporaryPassword}</div>
          </div>
          <p className="text-[10px] text-slate-400">
            Share it over a secure channel. The student can change it from their profile.
          </p>
        </div>
      </Modal>
    </div>
  );
}
