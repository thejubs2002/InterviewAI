const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['aptitude', 'technical', 'hr', 'managerial'],
    index: true,
  },
  subcategory: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  type: {
    type: String,
    required: true,
    enum: ['mcq', 'open-ended', 'coding', 'scenario'],
    default: 'open-ended',
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: [{
    label: String,
    text: String,
  }],
  correctAnswer: {
    type: String,
    default: '',
  },
  sampleAnswer: {
    type: String,
    default: '',
  },
  evaluationCriteria: [{
    type: String,
  }],
  hints: [{
    type: String,
  }],
  timeLimit: {
    type: Number,
    default: 120,  // seconds
  },
  points: {
    type: Number,
    default: 10,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isAIGenerated: {
    type: Boolean,
    default: false,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

questionSchema.index({ category: 1, subcategory: 1, difficulty: 1 });
questionSchema.index({ tags: 1 });

module.exports = mongoose.model('Question', questionSchema);
