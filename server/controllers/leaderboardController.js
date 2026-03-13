const User = require('../models/User');

// @desc    Get leaderboard
// @route   GET /api/leaderboard
const getLeaderboard = async (req, res, next) => {
  try {
    const { category, limit = 20 } = req.query;

    let sortField = 'stats.averageScore';
    if (category && ['aptitude', 'technical', 'hr', 'managerial'].includes(category)) {
      sortField = `stats.categoryScores.${category}`;
    }

    const users = await User.find({
      'stats.totalInterviews': { $gt: 0 },
    })
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .select('name avatar stats.totalInterviews stats.averageScore stats.bestScore stats.categoryScores');

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      totalInterviews: user.stats.totalInterviews,
      averageScore: category ? user.stats.categoryScores[category] : user.stats.averageScore,
      bestScore: user.stats.bestScore,
    }));

    // Find current user's rank
    const currentUser = await User.findById(req.user._id);
    const userScore = category
      ? currentUser.stats.categoryScores[category]
      : currentUser.stats.averageScore;

    const usersAbove = await User.countDocuments({
      'stats.totalInterviews': { $gt: 0 },
      [sortField]: { $gt: userScore },
    });

    res.json({
      leaderboard,
      currentUserRank: currentUser.stats.totalInterviews > 0 ? usersAbove + 1 : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeaderboard };
