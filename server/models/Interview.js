const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  },
  questionText: String,
  questionCategory: String,
  questionType: String,
  userAnswer: {
    type: String,
    default: '',
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  feedback: {
    type: String,
    default: '',
  },
  strengths: [String],
  improvements: [String],
  timeSpent: {
    type: Number,
    default: 0,
  },
  skipped: {
    type: Boolean,
    default: false,
  },
});

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['aptitude', 'technical', 'hr', 'managerial'],
  },
  subcategory: {
    type: String,
    default: 'general',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'adaptive'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress',
  },
  answers: [answerSchema],
  totalQuestions: {
    type: Number,
    default: 0,
  },
  questionsAnswered: {
    type: Number,
    default: 0,
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  maxScore: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', ''],
    default: '',
  },
  overallFeedback: {
    type: String,
    default: '',
  },
  strengths: [String],
  areasForImprovement: [String],
  recommendations: [String],
  duration: {
    type: Number,
    default: 0,  // total seconds
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

interviewSchema.index({ user: 1, category: 1, createdAt: -1 });
interviewSchema.index({ user: 1, status: 1 });

// Calculate grade based on percentage
interviewSchema.methods.calculateGrade = function () {
  const p = this.percentage;
  if (p >= 95) return 'A+';
  if (p >= 85) return 'A';
  if (p >= 75) return 'B+';
  if (p >= 65) return 'B';
  if (p >= 55) return 'C+';
  if (p >= 45) return 'C';
  if (p >= 35) return 'D';
  return 'F';
};

module.exports = mongoose.model('Interview', interviewSchema);
