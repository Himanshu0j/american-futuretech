import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Field, inputClass, btnGhost, btnIcon } from './ui';

/**
 * Quiz builder used by the batch workspace.
 *
 * Supports all seven question types the LMS grades: single choice, multiple
 * select, true/false, short answer, long answer, fill in the blank and matching.
 * The value stays a plain object so the parent can POST it straight to
 * `/admin/lms/batches/:id/quizzes`.
 */

export const QUESTION_TYPES = [
  { value: 'MCQ', label: 'Multiple choice' },
  { value: 'MultipleSelect', label: 'Multiple select' },
  { value: 'TrueFalse', label: 'True / False' },
  { value: 'ShortAnswer', label: 'Short answer' },
  { value: 'LongAnswer', label: 'Long answer' },
  { value: 'FillBlank', label: 'Fill in the blank' },
  { value: 'Matching', label: 'Matching' },
];

const CHOICE_TYPES = ['MCQ', 'TrueFalse', 'MultipleSelect'];

let localKey = 0;
const nextKey = () => `q-${Date.now()}-${localKey++}`;

export const emptyQuestion = (type = 'MCQ') => ({
  key: nextKey(),
  questionText: '',
  type,
  options: type === 'TrueFalse' ? ['True', 'False'] : ['', '', '', ''],
  correctOptionIndex: 0,
  correctOptionIndexes: [0],
  correctAnswer: '',
  marks: 1,
  explanation: '',
  imageUrl: '',
  pairs: [
    { left: '', right: '' },
    { left: '', right: '' },
  ],
});

export const emptyQuiz = () => ({
  title: '',
  description: '',
  instructions: '',
  timeLimitMinutes: 15,
  passingScorePercent: 70,
  passingMarks: 0,
  attemptsAllowed: 1,
  startsAt: '',
  endsAt: '',
  shuffleQuestions: false,
  shuffleOptions: false,
  negativeMarking: 0,
  resultVisibility: 'Immediately',
  isPublished: true,
  questions: [emptyQuestion('MCQ')],
});

const toDateTimeInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const toQuizDraft = (quiz = {}) => ({
  ...emptyQuiz(),
  title: quiz.title || '',
  description: quiz.description || '',
  instructions: quiz.instructions || '',
  timeLimitMinutes: quiz.timeLimitMinutes ?? 15,
  passingScorePercent: quiz.passingScorePercent ?? 70,
  passingMarks: quiz.passingMarks ?? 0,
  attemptsAllowed: quiz.attemptsAllowed ?? 1,
  startsAt: toDateTimeInput(quiz.startsAt),
  endsAt: toDateTimeInput(quiz.endsAt),
  shuffleQuestions: Boolean(quiz.shuffleQuestions),
  shuffleOptions: Boolean(quiz.shuffleOptions),
  negativeMarking: quiz.negativeMarking ?? 0,
  resultVisibility: quiz.resultVisibility || 'Immediately',
  isPublished: quiz.isPublished !== false,
  questions: (quiz.questions || []).map((question) => ({
    key: nextKey(),
    questionText: question.questionText || '',
    type: question.type || 'MCQ',
    options:
      question.type === 'TrueFalse'
        ? ['True', 'False']
        : question.options?.length
          ? [...question.options]
          : ['', '', '', ''],
    correctOptionIndex: question.correctOptionIndex ?? 0,
    correctOptionIndexes: question.correctOptionIndexes?.length
      ? [...question.correctOptionIndexes]
      : [question.correctOptionIndex ?? 0],
    correctAnswer: question.correctAnswer || '',
    marks: question.marks ?? 1,
    explanation: question.explanation || '',
    imageUrl: question.imageUrl || '',
    pairs: question.pairs?.length ? question.pairs.map((pair) => ({ left: pair.left || '', right: pair.right || '' })) : [
      { left: '', right: '' },
      { left: '', right: '' },
    ],
  })),
});

export default function QuizForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const setQuestion = (index, patch) => {
    const questions = value.questions.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
    set('questions', questions);
  };

  const totalMarks = value.questions.reduce((sum, question) => sum + Number(question.marks || 0), 0);

  const addQuestion = (type = 'MCQ') => set('questions', [...value.questions, emptyQuestion(type)]);
  const removeQuestion = (index) => set('questions', value.questions.filter((_, rowIndex) => rowIndex !== index));

  const setOption = (qIndex, optionIndex, text) => {
    const question = value.questions[qIndex];
    const options = question.options.map((row, rowIndex) => (rowIndex === optionIndex ? text : row));
    setQuestion(qIndex, { options });
  };

  const addOption = (qIndex) => setQuestion(qIndex, { options: [...value.questions[qIndex].options, ''] });
  const removeOption = (qIndex, optionIndex) => {
    const question = value.questions[qIndex];
    const options = question.options.filter((_, rowIndex) => rowIndex !== optionIndex);
    const correctIndex = Math.min(question.correctOptionIndex, Math.max(0, options.length - 1));
    setQuestion(qIndex, {
      options,
      correctOptionIndex: correctIndex,
      correctOptionIndexes: question.correctOptionIndexes.filter((value) => value !== optionIndex),
    });
  };

  const toggleCorrect = (qIndex, optionIndex) => {
    const question = value.questions[qIndex];
    if (question.type === 'MultipleSelect') {
      const has = question.correctOptionIndexes.includes(optionIndex);
      const indexes = has
        ? question.correctOptionIndexes.filter((value) => value !== optionIndex)
        : [...question.correctOptionIndexes, optionIndex];
      setQuestion(qIndex, { correctOptionIndexes: indexes, correctOptionIndex: indexes[0] ?? 0 });
    } else {
      setQuestion(qIndex, { correctOptionIndex: optionIndex, correctOptionIndexes: [optionIndex] });
    }
  };

  return (
    <div className="space-y-4">
      <Field label="Quiz title" required>
        <input className={inputClass} value={value.title} onChange={(e) => set('title', e.target.value)} placeholder="Week 3 — Model evaluation" />
      </Field>

      <Field label="Description">
        <textarea rows={2} className={inputClass} value={value.description} onChange={(e) => set('description', e.target.value)} placeholder="What this quiz covers…" />
      </Field>

      <Field label="Instructions for students">
        <textarea rows={2} className={inputClass} value={value.instructions} onChange={(e) => set('instructions', e.target.value)} placeholder="Answer all questions. One attempt only." />
      </Field>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Time limit (minutes)">
          <input type="number" min="1" className={inputClass} value={value.timeLimitMinutes} onChange={(e) => set('timeLimitMinutes', e.target.value)} />
        </Field>
        <Field label="Attempts allowed">
          <input type="number" min="1" className={inputClass} value={value.attemptsAllowed} onChange={(e) => set('attemptsAllowed', e.target.value)} />
        </Field>
        <Field label="Passing marks" hint={`Out of ${totalMarks} authored marks · 0 = use 70%`}>
          <input type="number" min="0" className={inputClass} value={value.passingMarks} onChange={(e) => set('passingMarks', e.target.value)} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Opens at" hint="Empty = immediately">
          <input type="datetime-local" className={inputClass} value={value.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
        </Field>
        <Field label="Closes at" hint="Empty = no deadline">
          <input type="datetime-local" className={inputClass} value={value.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Result visibility">
          <select className={inputClass} value={value.resultVisibility} onChange={(e) => set('resultVisibility', e.target.value)}>
            {['Immediately', 'AfterDueDate', 'Hidden'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Negative marking" hint="Marks deducted per wrong answer">
          <input type="number" min="0" step="0.25" className={inputClass} value={value.negativeMarking} onChange={(e) => set('negativeMarking', e.target.value)} />
        </Field>
        <div className="flex flex-col justify-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input type="checkbox" checked={value.shuffleQuestions} onChange={(e) => set('shuffleQuestions', e.target.checked)} />
            Shuffle questions
          </label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input type="checkbox" checked={value.shuffleOptions} onChange={(e) => set('shuffleOptions', e.target.checked)} />
            Shuffle answer options
          </label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input type="checkbox" checked={value.isPublished} onChange={(e) => set('isPublished', e.target.checked)} />
            Publish to the batch
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-b border-white/[0.08]">
          <div>
            <div className="text-[11px] font-bold text-slate-200">Questions</div>
            <div className="text-[10px] text-slate-400">
              {value.questions.length} question{value.questions.length === 1 ? '' : 's'} · {totalMarks} total marks
            </div>
          </div>
          <button type="button" className={btnGhost} onClick={() => addQuestion('MCQ')}>
            <Plus className="w-3.5 h-3.5" /> Add question
          </button>
        </div>

        <div className="p-3 space-y-3 max-h-[420px] overflow-y-auto">
          {value.questions.map((question, index) => (
            <div key={question.key} className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <GripVertical className="w-3 h-3" /> Question {index + 1}
                </div>
                <button
                  type="button"
                  className={btnIcon}
                  onClick={() => removeQuestion(index)}
                  aria-label={`Remove question ${index + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid sm:grid-cols-[1fr_150px_90px] gap-2 mb-2">
                <input
                  className={inputClass}
                  value={question.questionText}
                  onChange={(e) => setQuestion(index, { questionText: e.target.value })}
                  placeholder="Question text"
                  aria-label={`Question ${index + 1} text`}
                />
                <select
                  className={inputClass}
                  value={question.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setQuestion(index, {
                      type,
                      options: type === 'TrueFalse' ? ['True', 'False'] : question.options.length >= 2 ? question.options : ['', '', '', ''],
                      correctOptionIndex: 0,
                      correctOptionIndexes: [0],
                    });
                  }}
                  aria-label={`Question ${index + 1} type`}
                >
                  {QUESTION_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={question.marks}
                  onChange={(e) => setQuestion(index, { marks: e.target.value })}
                  placeholder="Marks"
                  aria-label={`Question ${index + 1} marks`}
                />
              </div>

              {CHOICE_TYPES.includes(question.type) && (
                <div className="space-y-1.5">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        type={question.type === 'MultipleSelect' ? 'checkbox' : 'radio'}
                        name={`correct-${question.key}`}
                        checked={
                          question.type === 'MultipleSelect'
                            ? question.correctOptionIndexes.includes(optionIndex)
                            : Number(question.correctOptionIndex) === optionIndex
                        }
                        onChange={() => toggleCorrect(index, optionIndex)}
                        aria-label={`Mark option ${optionIndex + 1} correct`}
                      />
                      <input
                        className={inputClass}
                        value={option}
                        onChange={(e) => setOption(index, optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                        aria-label={`Question ${index + 1} option ${optionIndex + 1}`}
                        disabled={question.type === 'TrueFalse'}
                      />
                      {question.type !== 'TrueFalse' && question.options.length > 2 && (
                        <button
                          type="button"
                          className={btnIcon}
                          onClick={() => removeOption(index, optionIndex)}
                          aria-label={`Remove option ${optionIndex + 1}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {question.type !== 'TrueFalse' && (
                    <button type="button" className="text-[10px] font-bold text-blue-300" onClick={() => addOption(index)}>
                      + Add option
                    </button>
                  )}
                </div>
              )}

              {(question.type === 'ShortAnswer' || question.type === 'FillBlank') && (
                <input
                  className={inputClass}
                  value={question.correctAnswer}
                  onChange={(e) => setQuestion(index, { correctAnswer: e.target.value })}
                  placeholder="Expected answer (matched case-insensitively)"
                  aria-label={`Question ${index + 1} expected answer`}
                />
              )}

              {question.type === 'LongAnswer' && (
                <p className="text-[10px] text-slate-400">
                  Long answers are graded manually from the quiz results panel.
                </p>
              )}

              {question.type === 'Matching' && (
                <div className="space-y-1.5">
                  {question.pairs.map((pair, pairIndex) => (
                    <div key={pairIndex} className="grid grid-cols-2 gap-2">
                      <input
                        className={inputClass}
                        value={pair.left}
                        onChange={(e) => {
                          const pairs = question.pairs.map((row, rowIndex) =>
                            rowIndex === pairIndex ? { ...row, left: e.target.value } : row
                          );
                          setQuestion(index, { pairs });
                        }}
                        placeholder={`Left ${pairIndex + 1}`}
                        aria-label={`Question ${index + 1} pair ${pairIndex + 1} left`}
                      />
                      <input
                        className={inputClass}
                        value={pair.right}
                        onChange={(e) => {
                          const pairs = question.pairs.map((row, rowIndex) =>
                            rowIndex === pairIndex ? { ...row, right: e.target.value } : row
                          );
                          setQuestion(index, { pairs });
                        }}
                        placeholder={`Right ${pairIndex + 1}`}
                        aria-label={`Question ${index + 1} pair ${pairIndex + 1} right`}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-[10px] font-bold text-blue-300"
                    onClick={() => setQuestion(index, { pairs: [...question.pairs, { left: '', right: '' }] })}
                  >
                    + Add pair
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
