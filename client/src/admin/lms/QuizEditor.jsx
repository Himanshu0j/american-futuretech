import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import { Modal, Field, inputClass, btnPrimary, btnGhost, btnIcon, ErrorNote } from './ui';

const emptyQuestion = () => ({
  questionText: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0,
  explanation: '',
});

const emptyDraft = (defaults = {}) => ({
  title: '',
  description: '',
  timeLimitMinutes: defaults.defaultQuizTimeLimit || 15,
  passingScorePercent: defaults.defaultQuizPassingScore || 70,
  questions: [emptyQuestion()],
  isPublished: true,
});

/**
 * Build the per-module assessment. Questions are single-choice, matching the
 * Quiz model the student player already grades.
 */
export default function QuizEditor({ open, quiz, courseId, moduleId, defaults = {}, onClose, onSaved }) {
  const isEdit = Boolean(quiz?._id);
  const [draft, setDraft] = useState(emptyDraft(defaults));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (isEdit) {
      setDraft({
        title: quiz.title || '',
        description: quiz.description || '',
        timeLimitMinutes: quiz.timeLimitMinutes ?? defaults.defaultQuizTimeLimit ?? 15,
        passingScorePercent: quiz.passingScorePercent ?? defaults.defaultQuizPassingScore ?? 70,
        questions:
          Array.isArray(quiz.questions) && quiz.questions.length
            ? quiz.questions.map((q) => ({
                questionText: q.questionText || '',
                options: Array.isArray(q.options) && q.options.length ? [...q.options] : ['', '', '', ''],
                correctOptionIndex: q.correctOptionIndex ?? 0,
                explanation: q.explanation || '',
              }))
            : [emptyQuestion()],
        isPublished: quiz.isPublished !== false,
      });
    } else {
      setDraft(emptyDraft(defaults));
    }
  }, [open, quiz, isEdit, defaults]);

  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const updateQuestion = (qIndex, key, value) =>
    setDraft((prev) => {
      const questions = prev.questions.map((q, i) => (i === qIndex ? { ...q, [key]: value } : q));
      return { ...prev, questions };
    });

  const updateOption = (qIndex, oIndex, value) =>
    setDraft((prev) => {
      const questions = prev.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.map((opt, oi) => (oi === oIndex ? value : opt));
        return { ...q, options };
      });
      return { ...prev, questions };
    });

  const addQuestion = () => setDraft((prev) => ({ ...prev, questions: [...prev.questions, emptyQuestion()] }));
  const removeQuestion = (qIndex) =>
    setDraft((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qIndex) }));

  const handleSave = async () => {
    if (!draft.title.trim()) {
      setError('A quiz title is required.');
      return;
    }
    const cleanQuestions = draft.questions
      .map((q) => ({
        questionText: q.questionText.trim(),
        options: q.options.map((opt) => opt.trim()).filter(Boolean),
        correctOptionIndex: Number(q.correctOptionIndex) || 0,
        explanation: q.explanation.trim(),
      }))
      .filter((q) => q.questionText && q.options.length >= 2);

    if (cleanQuestions.length === 0) {
      setError('Add at least one question with two or more options.');
      return;
    }
    if (cleanQuestions.some((q) => q.correctOptionIndex >= q.options.length)) {
      setError('A question points at a correct answer that was left blank. Fix the highlighted rows.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...(isEdit ? { id: quiz._id } : {}),
        course: courseId,
        module: moduleId,
        title: draft.title.trim(),
        description: draft.description,
        timeLimitMinutes: Number(draft.timeLimitMinutes) || 15,
        passingScorePercent: Number(draft.passingScorePercent) || 70,
        questions: cleanQuestions,
        isPublished: draft.isPublished,
      };

      const res = await api.post('/curriculum/quizzes', payload);
      if (res.data?.success) {
        onSaved?.(res.data.quiz);
        onClose?.();
      } else {
        setError(res.data?.message || 'Could not save the quiz.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not save the quiz.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      wide
      title={isEdit ? 'Edit quiz' : 'New quiz'}
      subtitle="One quiz per module — the student sees a Test button in that module's sidebar."
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={handleSave} disabled={saving}>
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : isEdit ? 'Save quiz' : 'Create quiz'}
          </button>
        </>
      }
    >
      <ErrorNote>{error}</ErrorNote>

      <div className="space-y-4">
        <Field label="Quiz title" required>
          <input
            className={inputClass}
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Module 1 knowledge check"
          />
        </Field>

        <Field label="Description">
          <textarea
            className={inputClass}
            rows={2}
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What this quiz covers"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Time limit (minutes)">
            <input
              type="number"
              min="1"
              className={inputClass}
              value={draft.timeLimitMinutes}
              onChange={(e) => set('timeLimitMinutes', e.target.value)}
            />
          </Field>
          <Field label="Passing score (%)">
            <input
              type="number"
              min="1"
              max="100"
              className={inputClass}
              value={draft.passingScorePercent}
              onChange={(e) => set('passingScorePercent', e.target.value)}
            />
          </Field>
        </div>

        <div className="space-y-3">
          {draft.questions.map((question, qIndex) => (
            <div key={qIndex} className="rounded-xl border border-white/[0.08] bg-[#111A2E]/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-200">Question {qIndex + 1}</span>
                {draft.questions.length > 1 && (
                  <button
                    type="button"
                    className={`${btnIcon} text-rose-300`}
                    onClick={() => removeQuestion(qIndex)}
                    aria-label={`Remove question ${qIndex + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <Field label="Question">
                <input
                  className={inputClass}
                  value={question.questionText}
                  onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                  placeholder="What does … mean?"
                />
              </Field>

              <div className="space-y-2">
                <span className="block text-[11px] font-bold text-slate-300">
                  Options — click the circle to mark the correct answer
                </span>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIndex, 'correctOptionIndex', oIndex)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        question.correctOptionIndex === oIndex
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-white/[0.06] text-slate-400 hover:text-slate-300'
                      }`}
                      aria-label={`Mark option ${oIndex + 1} correct`}
                      aria-pressed={question.correctOptionIndex === oIndex}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <input
                      className={inputClass}
                      value={option}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      aria-label={`Question ${qIndex + 1} option ${oIndex + 1}`}
                    />
                  </div>
                ))}
              </div>

              <Field label="Explanation (shown after grading)">
                <input
                  className={inputClass}
                  value={question.explanation}
                  onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                  placeholder="Optional"
                />
              </Field>
            </div>
          ))}

          <button type="button" className={btnGhost} onClick={addQuestion}>
            <Plus className="w-3.5 h-3.5" /> Add question
          </button>
        </div>

        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={draft.isPublished}
            onChange={(e) => set('isPublished', e.target.checked)}
            className="rounded border-white/20 bg-[#111A2E]"
          />
          Published to students
        </label>
      </div>
    </Modal>
  );
}
