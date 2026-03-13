const express = require('express');
const router = express.Router();
const {
  startInterview,
  submitAnswer,
  completeInterview,
  abandonInterview,
  getInterview,
  getInterviews,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');
const { validate, startInterviewSchema, submitAnswerSchema } = require('../validators/validators');

router.use(protect);

router.get('/', getInterviews);
router.post('/start', validate(startInterviewSchema), startInterview);
router.get('/:id', getInterview);
router.post('/:id/answer', validate(submitAnswerSchema), submitAnswer);
router.post('/:id/complete', completeInterview);
router.post('/:id/abandon', abandonInterview);

module.exports = router;
