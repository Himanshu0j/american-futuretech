const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOptionIndex: { type: Number, required: true },
  isCorrect: { type: Boolean, required: true },
}, { _id: false });

const QuizAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  answers: [AnswerSchema],
  totalQuestions: { type: Number, required: true },
  correctAnswersCount: { type: Number, required: true },
  scorePercent: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  timeSpentSeconds: { type: Number, default: 0 },
}, {
  timestamps: true,
});

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
