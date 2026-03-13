import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { interviewAPI, questionAPI } from "../services/api";
import {
  Brain,
  Code,
  Users,
  Briefcase,
  ArrowRight,
  Zap,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

const categoryCards = [
  {
    id: "aptitude",
    name: "Aptitude",
    icon: Brain,
    desc: "Test your logical reasoning, quantitative aptitude, verbal ability, and data interpretation skills.",
    color: "from-indigo-500 to-blue-500",
    lightBg: "bg-indigo-50 dark:bg-indigo-950/30",
  },
  {
    id: "technical",
    name: "Technical",
    icon: Code,
    desc: "Practice DSA, system design, language-specific, and general programming interview questions.",
    color: "from-violet-500 to-purple-500",
    lightBg: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    id: "hr",
    name: "HR",
    icon: Users,
    desc: "Master behavioral, situational, cultural fit, and communication-focused interview questions.",
    color: "from-pink-500 to-rose-500",
    lightBg: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    id: "managerial",
    name: "Managerial",
    icon: Briefcase,
    desc: "Strengthen leadership, strategic thinking, conflict resolution, and team management responses.",
    color: "from-amber-500 to-orange-500",
    lightBg: "bg-amber-50 dark:bg-amber-950/30",
  },
];

const difficultyOptions = [
  { value: "easy", label: "Easy", desc: "Entry level questions" },
  { value: "medium", label: "Medium", desc: "Mid-level questions" },
  { value: "hard", label: "Hard", desc: "Senior-level questions" },
  { value: "adaptive", label: "Adaptive", desc: "AI adjusts difficulty" },
];

const questionCounts = [5, 10, 15, 20];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategories, setSelectedSubcategories] = useState(["general"]);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await questionAPI.getCategories();
        setCategories(data.categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const selectedCatData = categories.find((c) => c.id === selectedCategory);

  const handleStart = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }
    setLoading(true);
    try {
      const { data } = await interviewAPI.start({
        category: selectedCategory,
        subcategory: selectedSubcategories.join(','),
        difficulty,
        questionCount,
      });
      // Navigate to media permissions before starting interview
      navigate('/media-permissions', {
        state: { interviewId: data.interview._id },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-display-sm mb-2">Start Mock Interview</h1>
        <p className="text-[var(--color-text-secondary)]">
          Configure your interview session below.
        </p>
      </motion.div>

      {/* Category Selection */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Select Category</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {categoryCards.map((cat, i) => (
            <motion.button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedSubcategories(["general"]);
              }}
              className={`card text-left transition-all duration-200 ${
                selectedCategory === cat.id
                  ? "ring-2 ring-primary-500 border-primary-200 dark:border-primary-800"
                  : "hover:border-surface-300 dark:hover:border-surface-600"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shrink-0`}
                >
                  <cat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">{cat.name}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {cat.desc}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Subcategory */}
      {selectedCatData && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <h2 className="text-lg font-semibold mb-4">Focus Area <span className="text-sm font-normal text-[var(--color-text-tertiary)]">(select multiple)</span></h2>
          <div className="flex flex-wrap gap-2">
            {selectedCatData.subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  setSelectedSubcategories((prev) => {
                    if (sub === 'general') return ['general'];
                    const without = prev.filter((s) => s !== 'general');
                    if (prev.includes(sub)) {
                      const next = without.filter((s) => s !== sub);
                      return next.length === 0 ? ['general'] : next;
                    }
                    return [...without, sub];
                  });
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedSubcategories.includes(sub)
                    ? "bg-primary-500 text-white shadow-md"
                    : "bg-surface-100 dark:bg-surface-800 text-[var(--color-text-secondary)] hover:bg-surface-200 dark:hover:bg-surface-700"
                }`}
              >
                {sub
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Difficulty */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Difficulty Level</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {difficultyOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDifficulty(opt.value)}
              className={`p-4 rounded-2xl border text-center transition-all duration-200 ${
                difficulty === opt.value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 ring-1 ring-primary-500"
                  : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
              }`}
            >
              <p className="font-semibold text-sm">{opt.label}</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Question Count */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Number of Questions</h2>
        <div className="flex gap-3">
          {questionCounts.map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`w-16 h-16 rounded-2xl border font-semibold text-lg transition-all duration-200 ${
                questionCount === count
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500"
                  : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <motion.div
        className="pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={handleStart}
          disabled={!selectedCategory || loading}
          className="btn-primary w-full sm:w-auto text-base py-4 px-10"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Start Interview
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
