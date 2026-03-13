import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { analyticsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, Brain, Clock } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];
const CATEGORY_LABELS = { aptitude: 'Aptitude', technical: 'Technical', hr: 'HR', managerial: 'Managerial' };

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await analyticsAPI.get();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const categoryData = analytics?.categoryStats
    ? Object.entries(analytics.categoryStats).map(([key, val]) => ({
        name: CATEGORY_LABELS[key],
        score: val.averageScore,
        interviews: val.total,
        best: val.bestScore,
      }))
    : [];

  const difficultyData = analytics?.difficultyStats
    ? Object.entries(analytics.difficultyStats).map(([key, val]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        score: val.averageScore,
        total: val.total,
      }))
    : [];

  const pieData = categoryData.filter((d) => d.interviews > 0);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-display-sm mb-2">Analytics</h1>
        <p className="text-[var(--color-text-secondary)]">Deep insights into your interview performance.</p>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Interviews', value: analytics?.overview?.totalInterviews || 0, icon: Target, color: 'text-primary-500' },
          { label: 'Average Score', value: `${analytics?.overview?.averageScore || 0}%`, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Best Score', value: `${analytics?.overview?.bestScore || 0}%`, icon: Brain, color: 'text-amber-500' },
          { label: 'Questions', value: analytics?.overview?.totalQuestions || 0, icon: Clock, color: 'text-blue-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Performance Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
          <div className="h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                    }}
                  />
                  <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Avg Score %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--color-text-tertiary)]">
                No data yet. Complete some interviews to see analytics.
              </div>
            )}
          </div>
        </div>

        {/* Weekly Progress Line Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
          <div className="h-64">
            {analytics?.weeklyProgress?.some((w) => w.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                    }}
                  />
                  <Line type="monotone" dataKey="avgScore" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Avg Score %" />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Interviews" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--color-text-tertiary)]">
                Practice this week to see your progress trend.
              </div>
            )}
          </div>
        </div>

        {/* Interview Distribution Pie */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Interview Distribution</h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="interviews"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--color-text-tertiary)]">
                No interview data available.
              </div>
            )}
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Performance by Difficulty</h3>
          <div className="h-64">
            {difficultyData.some((d) => d.total > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficultyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                    }}
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} name="Avg Score %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--color-text-tertiary)]">
                Try different difficulty levels to see comparison.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
