const Interview = require('../models/Interview');

// @desc    Get user analytics/dashboard data
// @route   GET /api/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Overall stats
    const totalInterviews = await Interview.countDocuments({ user: userId, status: 'completed' });
    const interviews = await Interview.find({ user: userId, status: 'completed' }).sort({ createdAt: -1 });

    // Category breakdown
    const categoryStats = {};
    for (const cat of ['aptitude', 'technical', 'hr', 'managerial']) {
      const catInterviews = interviews.filter((i) => i.category === cat);
      categoryStats[cat] = {
        total: catInterviews.length,
        averageScore: catInterviews.length
          ? Math.round(catInterviews.reduce((s, i) => s + i.percentage, 0) / catInterviews.length)
          : 0,
        bestScore: catInterviews.length
          ? Math.max(...catInterviews.map((i) => i.percentage))
          : 0,
        lastAttempt: catInterviews[0]?.createdAt || null,
      };
    }

    // Recent performance (last 10 interviews)
    const recentPerformance = interviews.slice(0, 10).map((i) => ({
      _id: i._id,
      category: i.category,
      percentage: i.percentage,
      grade: i.grade,
      date: i.createdAt,
      duration: i.duration,
    }));

    // Weekly progress (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const recentInterviews = interviews.filter((i) => i.createdAt >= fourWeeksAgo);

    const weeklyProgress = [];
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - w * 7);

      const weekInterviews = recentInterviews.filter(
        (i) => i.createdAt >= weekStart && i.createdAt < weekEnd
      );

      weeklyProgress.unshift({
        week: `Week ${4 - w}`,
        count: weekInterviews.length,
        avgScore: weekInterviews.length
          ? Math.round(weekInterviews.reduce((s, i) => s + i.percentage, 0) / weekInterviews.length)
          : 0,
      });
    }

    // Difficulty distribution
    const difficultyStats = {};
    for (const diff of ['easy', 'medium', 'hard']) {
      const diffInterviews = interviews.filter((i) => i.difficulty === diff);
      difficultyStats[diff] = {
        total: diffInterviews.length,
        averageScore: diffInterviews.length
          ? Math.round(diffInterviews.reduce((s, i) => s + i.percentage, 0) / diffInterviews.length)
          : 0,
      };
    }

    res.json({
      overview: {
        totalInterviews,
        averageScore: req.user.stats.averageScore,
        bestScore: req.user.stats.bestScore,
        totalQuestions: req.user.stats.totalQuestions,
        streakDays: req.user.stats.streakDays,
      },
      categoryStats,
      recentPerformance,
      weeklyProgress,
      difficultyStats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
