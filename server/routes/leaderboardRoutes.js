const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getLeaderboard);

module.exports = router;
