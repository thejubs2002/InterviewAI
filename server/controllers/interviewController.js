const Interview = require('../models/Interview');
const Question = require('../models/Question');
const User = require('../models/User');
const { generateQuestions, evaluateAnswer, generateInterviewFeedback } = require('../services/aiService');

// @desc    Start a new interview
// @route   POST /api/interviews/start
const startInterview = async (req, res, next) => {
  try {
    const { category, subcategory, difficulty, questionCount } = req.body;
    const userId = req.user._id;

    // Check for existing in-progress interview
    const existing = await Interview.findOne({ user: userId, status: 'in-progress' });
    if (existing) {
      return res.status(400).json({
        message: 'You have an in-progress interview. Complete or abandon it first.',
        interviewId: existing._id,
      });
    }

    // Generate questions (AI or fallback)
    const userContext = req.user.profile
      ? `Experience: ${req.user.profile.experience}, Skills: ${(req.user.profile.skills || []).join(', ')}, Target Role: ${req.user.profile.targetRole}`
      : '';

    // Support multiple subcategories (comma-separated)
    const subcategories = (subcategory || 'general').split(',').map(s => s.trim()).filter(Boolean);
    const effectiveDifficulty = difficulty === 'adaptive' ? 'medium' : difficulty;
    const totalCount = questionCount || 10;

    let questions = [];
    if (subcategories.length <= 1) {
      questions = await generateQuestions(category, subcategories[0] || 'general', effectiveDifficulty, totalCount, userContext);
    } else {
      const perSub = Math.max(1, Math.floor(totalCount / subcategories.length));
      let remainder = totalCount - perSub * subcategories.length;
      for (const sub of subcategories) {
        const count = perSub + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        const subQuestions = await generateQuestions(category, sub, effectiveDifficulty, count, userContext);
        questions.push(...subQuestions);
      }
      // Shuffle so subcategories are mixed
      questions.sort(() => Math.random() - 0.5);
    }

    // Enforce exact count - trim if over, pad with fallback if under
    if (questions.length > totalCount) {
      questions = questions.slice(0, totalCount);
    } else if (questions.length < totalCount) {
      const extra = await generateQuestions(category, subcategories[0] || 'general', effectiveDifficulty, totalCount - questions.length, userContext);
      questions = [...questions, ...extra].slice(0, totalCount);
    }

    // Save questions to DB if AI-generated
    const savedQuestions = [];
    for (const q of questions) {
      let savedQ;
      if (q.isAIGenerated) {
        savedQ = await Question.create({
          ...q,
          usageCount: 1,
        });
      } else {
        savedQ = await Question.findOneAndUpdate(
          { question: q.question, category },
          { ...q, $inc: { usageCount: 1 } },
          { upsert: true, new: true }
        );
      }
      savedQuestions.push(savedQ);
    }

    // Create interview
    const interview = await Interview.create({
      user: userId,
      category,
      subcategory: subcategory || 'general',
      difficulty,
      totalQuestions: savedQuestions.length,
      maxScore: savedQuestions.length * 10,
      answers: savedQuestions.map((q) => ({
        question: q._id,
        questionText: q.question,
        questionCategory: q.category,
        questionType: q.type,
      })),
    });

    // Return interview with first question details
    res.status(201).json({
      interview: {
        _id: interview._id,
        category: interview.category,
        subcategory: interview.subcategory,
        difficulty: interview.difficulty,
        totalQuestions: interview.totalQuestions,
        status: interview.status,
      },
      questions: savedQuestions.map((q) => ({
        _id: q._id,
        question: q.question,
        type: q.type,
        options: q.options,
        timeLimit: q.timeLimit,
        points: q.points,
        hints: q.hints,
        difficulty: q.difficulty,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit an answer for a question
// @route   POST /api/interviews/:id/answer
const submitAnswer = async (req, res, next) => {
  try {
    const { questionId, answer, timeSpent } = req.body;
    const interviewId = req.params.id;

    const interview = await Interview.findOne({ _id: interviewId, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    if (interview.status !== 'in-progress') {
      return res.status(400).json({ message: 'This interview is no longer active' });
    }

    // Find the answer slot
    const answerIndex = interview.answers.findIndex(
      (a) => a.question.toString() === questionId
    );
    if (answerIndex === -1) {
      return res.status(404).json({ message: 'Question not found in this interview' });
    }

    // Get question details for evaluation
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Evaluate the answer
    const evaluation = await evaluateAnswer(question, answer, interview.category);

    // Update the answer
    interview.answers[answerIndex].userAnswer = answer;
    interview.answers[answerIndex].score = evaluation.score;
    interview.answers[answerIndex].isCorrect = evaluation.isCorrect;
    interview.answers[answerIndex].feedback = evaluation.feedback;
    interview.answers[answerIndex].strengths = evaluation.strengths || [];
    interview.answers[answerIndex].improvements = evaluation.improvements || [];
    interview.answers[answerIndex].timeSpent = timeSpent || 0;
    interview.answers[answerIndex].skipped = !answer || !answer.trim();

    interview.questionsAnswered = interview.answers.filter((a) => a.userAnswer || a.skipped).length;
    interview.totalScore = interview.answers.reduce((sum, a) => sum + a.score, 0);
    interview.percentage = Math.round((interview.totalScore / interview.maxScore) * 100);

    await interview.save();

    res.json({
      evaluation: {
        score: evaluation.score,
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
      },
      progress: {
        answered: interview.questionsAnswered,
        total: interview.totalQuestions,
        currentScore: interview.totalScore,
        percentage: interview.percentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete an interview
// @route   POST /api/interviews/:id/complete
const completeInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    if (interview.status !== 'in-progress') {
      return res.status(400).json({ message: 'Interview is already completed' });
    }

    // Calculate final scores
    interview.totalScore = interview.answers.reduce((sum, a) => sum + a.score, 0);
    interview.percentage = Math.round((interview.totalScore / interview.maxScore) * 100);
    interview.grade = interview.calculateGrade();
    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.duration = Math.round((interview.completedAt - interview.startedAt) / 1000);

    // Generate overall feedback
    const feedback = await generateInterviewFeedback(interview);
    interview.overallFeedback = feedback.overallFeedback;
    interview.strengths = feedback.strengths;
    interview.areasForImprovement = feedback.areasForImprovement;
    interview.recommendations = feedback.recommendations;

    await interview.save();

    // Update user stats
    const user = await User.findById(req.user._id);
    user.stats.totalInterviews += 1;
    user.stats.totalQuestions += interview.totalQuestions;
    user.stats.lastActiveDate = new Date();

    // Recalculate average score
    const allInterviews = await Interview.find({ user: req.user._id, status: 'completed' });
    const totalPct = allInterviews.reduce((sum, i) => sum + i.percentage, 0);
    user.stats.averageScore = Math.round(totalPct / allInterviews.length);
    user.stats.bestScore = Math.max(user.stats.bestScore, interview.percentage);

    // Update category score
    const categoryInterviews = allInterviews.filter((i) => i.category === interview.category);
    const catAvg = Math.round(
      categoryInterviews.reduce((sum, i) => sum + i.percentage, 0) / categoryInterviews.length
    );
    user.stats.categoryScores[interview.category] = catAvg;

    await user.save();

    res.json({ interview });
  } catch (error) {
    next(error);
  }
};

// @desc    Abandon an interview
// @route   POST /api/interviews/:id/abandon
const abandonInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.status = 'abandoned';
    interview.completedAt = new Date();
    interview.duration = Math.round((interview.completedAt - interview.startedAt) / 1000);
    await interview.save();

    res.json({ message: 'Interview abandoned', interviewId: interview._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Get interview by ID
// @route   GET /api/interviews/:id
const getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // If interview is in progress, include question details
    let questions = [];
    if (interview.status === 'in-progress') {
      const questionIds = interview.answers.map((a) => a.question);
      const fetched = await Question.find({ _id: { $in: questionIds } }).select(
        'question type options timeLimit points hints difficulty'
      );
      // Preserve the order defined by interview.answers (MongoDB $in does not guarantee order)
      const idOrder = questionIds.map((id) => id.toString());
      questions = fetched.sort(
        (a, b) => idOrder.indexOf(a._id.toString()) - idOrder.indexOf(b._id.toString())
      );
    }

    res.json({ interview, questions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's interview history
// @route   GET /api/interviews
const getInterviews = async (req, res, next) => {
  try {
    const { category, status, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };

    if (category) query.category = category;
    if (status) query.status = status;

    const total = await Interview.countDocuments(query);
    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-answers');

    res.json({
      interviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startInterview,
  submitAnswer,
  completeInterview,
  abandonInterview,
  getInterview,
  getInterviews,
};
