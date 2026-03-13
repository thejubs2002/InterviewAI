import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { analyticsAPI } from "../services/api";
import {
  Target,
  Trophy,
  TrendingUp,
  Brain,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const categoryConfig = {
  aptitude: {
    color: "from-indigo-500 to-blue-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  technical: {
    color: "from-violet-500 to-purple-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    text: "text-violet-600 dark:text-violet-400",
  },
  hr: {
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    text: "text-pink-600 dark:text-pink-400",
  },
  managerial: {
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-400",
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await analyticsAPI.get();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const stats = [
    {
      label: "Total Interviews",
      value: analytics?.overview?.totalInterviews || 0,
      icon: Target,
      color: "text-primary-500",
    },
    {
      label: "Average Score",
      value: `${analytics?.overview?.averageScore || 0}%`,
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      label: "Best Score",
      value: `${analytics?.overview?.bestScore || 0}%`,
      icon: Trophy,
      color: "text-amber-500",
    },
    {
      label: "Questions Solved",
      value: analytics?.overview?.totalQuestions || 0,
      icon: Brain,
      color: "text-blue-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-display-sm mb-1">
          Welcome back,{" "}
          <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Ready for your next interview practice session?
        </p>
      </motion.div>

      {/* Quick Start */}
      <motion.div
        className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white border-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Start a Mock Interview</h3>
              <p className="text-white/80 text-sm mt-1">
                Choose from aptitude, technical, HR, or managerial categories
              </p>
            </div>
          </div>
          <Link
            to="/interview/setup"
            className="btn-secondary bg-white text-primary-700 hover:bg-white/90 dark:bg-white dark:text-primary-700 shrink-0"
          >
            Begin Now <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Category Scores */}
      <div>
        <h2 className="text-heading mb-4">Category Performance</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(categoryConfig).map(([cat, config], i) => {
            const catData = analytics?.categoryStats?.[cat] || {};
            return (
              <motion.div
                key={cat}
                className="card-hover"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-4`}
                >
                  <span className="text-white font-bold text-lg">
                    {cat.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold capitalize mb-1">{cat}</h3>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold">
                    {catData.averageScore || 0}%
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    avg score
                  </span>
                </div>
                <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${config.color} transition-all duration-500`}
                    style={{ width: `${catData.averageScore || 0}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                  {catData.total || 0} interviews completed
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      {analytics?.recentPerformance?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading">Recent Activity</h2>
            <Link
              to="/history"
              className="btn-ghost text-sm text-primary-600 dark:text-primary-400"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {analytics.recentPerformance.slice(0, 5).map((item) => {
                const config =
                  categoryConfig[item.category] || categoryConfig.technical;
                return (
                  <Link
                    key={item._id}
                    to={`/interview/${item._id}/result`}
                    className="flex items-center gap-4 p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shrink-0`}
                    >
                      <span className="text-white font-bold text-sm">
                        {item.category.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium capitalize truncate">
                        {item.category} Interview
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{item.percentage}%</p>
                      <p
                        className={`text-xs font-medium ${
                          item.percentage >= 80
                            ? "text-emerald-500"
                            : item.percentage >= 60
                              ? "text-amber-500"
                              : "text-red-500"
                        }`}
                      >
                        Grade {item.grade}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
