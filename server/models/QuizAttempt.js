const mongoose = require('mongoose');

/**
 * One student's attempt at a quiz.
 *
 * Objective questions are graded on submit. Subjective questions (ShortAnswer,
 * LongAnswer, FillBlank, Matching) keep `isCorrect: null` and `awardedMarks: 0`
 * until an admin reviews the attempt, which is why `status` exists:
 *   'Auto-graded' → every question had an automatic key
 *   'Pending review' → at least one answer needs a human
 *   'Evaluated' → an admin confirmed the final mark
 */
const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // Legacy single-choice answer.
    selectedOptionIndex: { type: Number, default: null },
    selectedOptionIndexes: [{ type: Number }],
    textAnswer: { type: String, default: '' },
    isCorrect: { type: Boolean, default: null },
    awardedMarks: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
  },
  { _id: false }
);

const QuizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
      index: true,
    },
    answers: [AnswerSchema],
    totalQuestions: { type: Number, required: true },
    correctAnswersCount: { type: Number, default: 0 },
    // Percent is kept for legacy readers; totalMarks/scoreMarks carry the
    // marks-based grade the newer UI prints.
    scorePercent: { type: Number, default: 0 },
    scoreMarks: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Auto-graded', 'Pending review', 'Evaluated'],
      default: 'Auto-graded',
    },
    timeSpentSeconds: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

QuizAttemptSchema.index({ quiz: 1, student: 1, createdAt: -1 });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
