const Question = require('../models/Question');

// @desc    Get questions by category
// @route   GET /api/questions
const getQuestions = async (req, res, next) => {
  try {
    const { category, subcategory, difficulty, type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-correctAnswer -sampleAnswer');

    res.json({
      questions,
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

// @desc    Get question by ID (with answer for review)
// @route   GET /api/questions/:id
const getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json({ question });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available categories and subcategories
// @route   GET /api/questions/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = [
      {
        id: 'aptitude',
        name: 'Aptitude',
        description: 'Logical reasoning, quantitative aptitude, and verbal ability',
        icon: '🧠',
        subcategories: ['general', 'logical-reasoning', 'quantitative', 'verbal-ability', 'data-interpretation'],
        color: '#6366f1',
      },
      {
        id: 'technical',
        name: 'Technical',
        description: 'Programming, data structures, algorithms, and system design',
        icon: '💻',
        subcategories: ['general', 'dsa', 'system-design', 'javascript', 'python', 'java', 'react', 'nodejs', 'database'],
        color: '#8b5cf6',
      },
      {
        id: 'hr',
        name: 'HR',
        description: 'Behavioral, situational, and cultural fit questions',
        icon: '🤝',
        subcategories: ['general', 'behavioral', 'situational', 'cultural-fit', 'communication', 'teamwork'],
        color: '#ec4899',
      },
      {
        id: 'managerial',
        name: 'Managerial',
        description: 'Leadership, strategy, and team management scenarios',
        icon: '👔',
        subcategories: ['general', 'leadership', 'strategy', 'conflict-resolution', 'team-management', 'decision-making'],
        color: '#f59e0b',
      },
    ];

    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

module.exports = { getQuestions, getQuestion, getCategories };
