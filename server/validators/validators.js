const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map((d) => d.message).join(', ');
    return res.status(400).json({ message: messages });
  }
  next();
};

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  profile: Joi.object({
    title: Joi.string().max(100).allow(''),
    bio: Joi.string().max(500).allow(''),
    experience: Joi.string().valid('fresher', 'junior', 'mid', 'senior', 'lead'),
    skills: Joi.array().items(Joi.string().trim().max(50)).max(20),
    targetRole: Joi.string().max(100).allow(''),
    targetCompany: Joi.string().max(100).allow(''),
  }),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'system'),
    difficulty: Joi.string().valid('easy', 'medium', 'hard', 'adaptive'),
    notifications: Joi.boolean(),
  }),
});

const startInterviewSchema = Joi.object({
  category: Joi.string().valid('aptitude', 'technical', 'hr', 'managerial').required(),
  subcategory: Joi.string().trim().max(200).default('general'),
  difficulty: Joi.string().valid('easy', 'medium', 'hard', 'adaptive').default('medium'),
  questionCount: Joi.number().integer().min(5).max(30).default(10),
});

const submitAnswerSchema = Joi.object({
  questionId: Joi.string().required(),
  answer: Joi.string().allow('').max(5000).required(),
  timeSpent: Joi.number().integer().min(0).default(0),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  startInterviewSchema,
  submitAnswerSchema,
  changePasswordSchema,
};
