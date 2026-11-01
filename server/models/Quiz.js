const mongoose = require('mongoose');

/**
 * One question inside a quiz.
 *
 * The original schema only supported a single-choice question with exactly one
 * correct index. That shape is kept (`correctOptionIndex`) so every quiz already
 * stored keeps working, while the new fields add the remaining types:
 *   MCQ            → options + correctOptionIndexES (one entry)
 *   MultipleSelect → options + correctOptionIndexes (several entries)
 *   TrueFalse      → options ['True', 'False'] + correctOptionIndex
 *   ShortAnswer    → correctAnswer (matched case-insensitively)
 *   LongAnswer     → no automatic key; the admin grades it
 *   FillBlank      → correctAnswer
 *   Matching       → pairs [{ left, right }]
 */
const PairSchema = new mongoose.Schema(
  {
    left: { type: String, default: '' },
    right: { type: String, default: '' },
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    type: {
      type: String,
      enum: ['MCQ', 'MultipleSelect', 'TrueFalse', 'ShortAnswer', 'LongAnswer', 'FillBlank', 'Matching'],
      default: 'MCQ',
    },
    options: [{ type: String }],
    // Legacy single-answer key — still written for MCQ/TrueFalse so old readers work.
    correctOptionIndex: { type: Number, default: 0 },
    correctOptionIndexes: [{ type: Number }],
    correctAnswer: { type: String, default: '' },
    pairs: { type: [PairSchema], default: [] },
    marks: { type: Number, default: 1, min: 0 },
    explanation: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
  },
  { _id: true }
);

const QuizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    // A quiz authored from the batch workspace belongs to that batch only.
    // Legacy course-level quizzes leave this blank and stay visible course-wide.
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
      index: true,
    },
    classSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassSession',
      default: null,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    instructions: {
      type: String,
      default: '',
    },
    timeLimitMinutes: {
      type: Number,
      default: 15,
    },
    passingScorePercent: {
      type: Number,
      default: 70,
    },
    // Marks-based variant of the pass rule. When `totalMarks` is authored the
    // controller prefers `passingMarks`; otherwise it falls back to the percent.
    totalMarks: {
      type: Number,
      default: 0,
    },
    passingMarks: {
      type: Number,
      default: 0,
    },
    attemptsAllowed: {
      type: Number,
      default: 1,
      min: 1,
    },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    negativeMarking: { type: Number, default: 0, min: 0 },
    // Immediately | AfterDueDate | Hidden
    resultVisibility: {
      type: String,
      enum: ['Immediately', 'AfterDueDate', 'Hidden'],
      default: 'Immediately',
    },
    questions: [QuestionSchema],
    isPublished: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

QuizSchema.index({ batch: 1, isPublished: 1 });
QuizSchema.index({ course: 1, batch: 1 });

module.exports = mongoose.model('Quiz', QuizSchema);
