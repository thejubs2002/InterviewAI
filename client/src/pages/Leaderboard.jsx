import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { leaderboardAPI } from '../services/api';
import { Trophy, Medal, Crown, Star } from 'lucide-react';

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category) params.category = category;
        const { data } = await leaderboardAPI.get(params);
        setLeaderboard(data.leaderboard);
        setCurrentUserRank(data.currentUserRank);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [category]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-mono text-[var(--color-text-tertiary)]">#{rank}</span>;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-display-sm mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" /> Leaderboard
        </h1>
        <p className="text-[var(--color-text-secondary)]">See how you compare with other candidates.</p>
      </motion.div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'Overall' },
          { value: 'aptitude', label: 'Aptitude' },
          { value: 'technical', label: 'Technical' },
          { value: 'hr', label: 'HR' },
          { value: 'managerial', label: 'Managerial' },
        ].map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              category === cat.value
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Your rank */}
      {currentUserRank && (
        <motion.div
          className="card bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-200 dark:border-primary-800"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold">
              #{currentUserRank}
            </div>
            <div>
              <p className="font-semibold">Your Ranking</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Keep practicing to climb higher!</p>
            </div>
            <Star className="w-5 h-5 text-primary-500 ml-auto" />
          </div>
        </motion.div>
      )}

      {/* Leaderboard list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">No entries yet. Be the first on the leaderboard!</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {leaderboard.map((entry, i) => {
              const isCurrentUser = entry._id === user?._id;
              return (
                <motion.div
                  key={entry._id}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    isCurrentUser ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''
                  } ${i < 3 ? 'bg-surface-50/50 dark:bg-surface-800/30' : ''}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="w-10 flex justify-center">{getRankIcon(entry.rank)}</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {entry.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isCurrentUser ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                      {entry.name} {isCurrentUser && '(You)'}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {entry.totalInterviews} interviews
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg">{entry.averageScore}%</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">avg score</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
