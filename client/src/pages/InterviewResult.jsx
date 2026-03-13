import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { interviewAPI } from '../services/api';
import {
  Trophy, Target, Clock, ArrowLeft, ArrowRight,
  CheckCircle, XCircle, ChevronDown, ChevronUp, BarChart3,
  TrendingUp, AlertTriangle,
} from 'lucide-react';

const gradeColors = {
  'A+': 'text-emerald-500', A: 'text-emerald-500', 'B+': 'text-blue-500', B: 'text-blue-500',
  'C+': 'text-amber-500', C: 'text-amber-500', D: 'text-orange-500', F: 'text-red-500',
};

export default function InterviewResult() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAnswer, setExpandedAnswer] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await interviewAPI.getById(id);
        setInterview(data.interview);
      } catch (error) {
        console.error('Failed to load result:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-text-secondary)]">Result not found.</p>
        <Link to="/dashboard" className="btn-primary mt-4 inline-flex">Go to Dashboard</Link>
      </div>
    );
  }

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/history" className="btn-ghost text-sm mb-4 inline-flex">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to History
        </Link>
        <h1 className="text-display-sm">Interview Result</h1>
        <p className="text-[var(--color-text-secondary)] capitalize">{interview.category} Interview — {interview.subcategory}</p>
      </motion.div>

      {/* Score Card */}
      <motion.div
        className="card text-center py-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="mb-6">
          <div className={`text-7xl font-bold ${gradeColors[interview.grade] || 'text-surface-500'}`}>
            {interview.grade || '-'}
          </div>
          <p className="text-[var(--color-text-tertiary)] text-sm mt-2">Grade</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center text-2xl font-bold">
              <Target className="w-5 h-5 text-primary-500" />
              {interview.percentage}%
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Score</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center text-2xl font-bold">
              <Trophy className="w-5 h-5 text-amber-500" />
              {interview.totalScore}/{interview.maxScore}
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Points</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center text-2xl font-bold">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              {interview.questionsAnswered}/{interview.totalQuestions}
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Answered</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center text-2xl font-bold">
              <Clock className="w-5 h-5 text-surface-400" />
              {formatDuration(interview.duration || 0)}
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Duration</p>
          </div>
        </div>
      </motion.div>

      {/* Overall Feedback */}
      {interview.overallFeedback && (
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-semibold mb-3">Overall Feedback</h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">{interview.overallFeedback}</p>

          <div className="grid sm:grid-cols-2 gap-6 mt-6">
            {interview.strengths?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Strengths
                </h3>
                <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
                  {interview.strengths.map((s, i) => <li key={i}>✓ {s}</li>)}
                </ul>
              </div>
            )}
            {interview.areasForImprovement?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Areas to Improve
                </h3>
                <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
                  {interview.areasForImprovement.map((s, i) => <li key={i}>→ {s}</li>)}
                </ul>
              </div>
            )}
          </div>

          {interview.recommendations?.length > 0 && (
            <div className="mt-6 p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/20">
              <h3 className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">Recommendations</h3>
              <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
                {interview.recommendations.map((r, i) => <li key={i}>💡 {r}</li>)}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Detailed Answers */}
      <div>
        <h2 className="text-heading mb-4">Question Breakdown</h2>
        <div className="space-y-3">
          {interview.answers?.map((ans, i) => (
            <motion.div
              key={i}
              className="card p-0 overflow-hidden"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <button
                onClick={() => setExpandedAnswer(expandedAnswer === i ? null : i)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  ans.skipped ? 'bg-surface-100 dark:bg-surface-800' :
                  ans.score >= 7 ? 'bg-emerald-100 dark:bg-emerald-950/30' :
                  ans.score >= 4 ? 'bg-amber-100 dark:bg-amber-950/30' :
                  'bg-red-100 dark:bg-red-950/30'
                }`}>
                  {ans.skipped ? (
                    <span className="text-xs text-surface-400">—</span>
                  ) : ans.score >= 7 ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Q{i + 1}: {ans.questionText}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-sm">{ans.score}/10</span>
                  {expandedAnswer === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedAnswer === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-surface-100 dark:border-surface-800 p-4 bg-surface-50/50 dark:bg-surface-800/30"
                >
                  {ans.userAnswer && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1">Your Answer</p>
                      <p className="text-sm">{ans.userAnswer}</p>
                    </div>
                  )}
                  {ans.feedback && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1">Feedback</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{ans.feedback}</p>
                    </div>
                  )}
                  {ans.strengths?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-emerald-600 mb-1">Strengths</p>
                      <div className="flex flex-wrap gap-1">
                        {ans.strengths.map((s, j) => (
                          <span key={j} className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {ans.improvements?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-amber-600 mb-1">Improvements</p>
                      <div className="flex flex-wrap gap-1">
                        {ans.improvements.map((s, j) => (
                          <span key={j} className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link to="/interview/setup" className="btn-primary">
          Practice Again <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
        <Link to="/dashboard" className="btn-secondary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
