const express = require('express');
const router = express.Router();
const { getQuestions, getQuestion, getCategories } = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/categories', getCategories);
router.get('/', getQuestions);
router.get('/:id', getQuestion);

module.exports = router;
