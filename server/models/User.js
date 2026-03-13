const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  avatar: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  profile: {
    title: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    experience: { type: String, enum: ['fresher', 'junior', 'mid', 'senior', 'lead'], default: 'fresher' },
    skills: [{ type: String, trim: true }],
    targetRole: { type: String, default: '' },
    targetCompany: { type: String, default: '' },
  },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'adaptive'], default: 'adaptive' },
    notifications: { type: Boolean, default: true },
  },
  stats: {
    totalInterviews: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    categoryScores: {
      aptitude: { type: Number, default: 0 },
      technical: { type: Number, default: 0 },
      hr: { type: Number, default: 0 },
      managerial: { type: Number, default: 0 },
    },
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
