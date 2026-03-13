import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { interviewAPI } from "../services/api";
import { ArrowRight, Filter } from "lucide-react";

const categoryColors = {
  aptitude: "from-indigo-500 to-blue-500",
  technical: "from-violet-500 to-purple-500",
  hr: "from-pink-500 to-rose-500",
  managerial: "from-amber-500 to-orange-500",
};

export default function History() {
  const [interviews, setInterviews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: "", status: "" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (filter.category) params.category = filter.category;
        if (filter.status) params.status = filter.status;
        const { data } = await interviewAPI.getAll(params);
        setInterviews(data.interviews);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [page, filter]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDuration = (s) => (s ? `${Math.floor(s / 60)}m ${s % 60}s` : "-");

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-display-sm mb-2">Interview History</h1>
        <p className="text-[var(--color-text-secondary)]">
          Review your past interview sessions and results.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-[var(--color-text-tertiary)]" />
        <select
          value={filter.category}
          onChange={(e) => {
            setFilter({ ...filter, category: e.target.value });
            setPage(1);
          }}
          className="input-field w-auto py-2 text-sm"
        >
          <option value="">All Categories</option>
          <option value="aptitude">Aptitude</option>
          <option value="technical">Technical</option>
          <option value="hr">HR</option>
          <option value="managerial">Managerial</option>
        </select>
        <select
          value={filter.status}
          onChange={(e) => {
            setFilter({ ...filter, status: e.target.value });
            setPage(1);
          }}
          className="input-field w-auto py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="abandoned">Abandoned</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : interviews.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--color-text-secondary)] mb-4">
            No interviews found.
          </p>
          <Link to="/interview/setup" className="btn-primary inline-flex">
            Start Your First Interview
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                to={
                  item.status === "completed"
                    ? `/interview/${item._id}/result`
                    : item.status === "in-progress"
                      ? `/interview/${item._id}`
                      : "#"
                }
                className="card-hover flex items-center gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${categoryColors[item.category]} flex items-center justify-center shrink-0`}
                >
                  <span className="text-white font-bold">
                    {item.category.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold capitalize">
                    {item.category} Interview
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-semibold">
                        {item.percentage || 0}%
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        Score
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">
                        {item.grade || "-"}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        Grade
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">
                        {formatDuration(item.duration)}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        Duration
                      </p>
                    </div>
                  </div>
                </div>
                <span
                  className={`badge text-xs shrink-0 ${
                    item.status === "completed"
                      ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600"
                      : item.status === "in-progress"
                        ? "bg-blue-100 dark:bg-blue-950/30 text-blue-600"
                        : "bg-surface-100 dark:bg-surface-800 text-surface-500"
                  }`}
                >
                  {item.status}
                </span>
                <ArrowRight className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                page === i + 1
                  ? "bg-primary-500 text-white"
                  : "bg-surface-100 dark:bg-surface-800 hover:bg-surface-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
