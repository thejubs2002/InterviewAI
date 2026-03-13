import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { interviewAPI } from "../services/api";
import { useMedia } from "../contexts/MediaContext";
import { useSpeechToText } from "../hooks/useSpeechToText";
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Send,
  SkipForward,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  XCircle,
  Flag,
  Mic,
  MicOff,
} from "lucide-react";
import toast from "react-hot-toast";

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const textareaRef = useRef(null);
  const videoRef = useRef(null);

  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const preSpeechAnswerRef = useRef("");
  const autoCompletedRef = useRef(false);

  // Shared media stream from context (established in MediaPermissions page)
  const { mediaStream, permissionsGranted, requestPermissions, stopStream } = useMedia();
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  // Fetch interview data
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const { data } = await interviewAPI.getById(id);
        if (data.interview.status === "completed") {
          navigate(`/interview/${id}/result`, { replace: true });
          return;
        }
        if (data.interview.status === "abandoned") {
          toast.error("This interview was abandoned");
          navigate("/dashboard", { replace: true });
          return;
        }
        setInterview(data.interview);
        setQuestions(data.questions);

        // Calculate total interview time
        const total = (data.questions || []).reduce(
          (sum, q) => sum + (q.timeLimit || 120),
          0,
        );
        setTotalTimeLeft(total);

        // Restore any previously answered questions
        const existing = {};
        data.interview.answers?.forEach((a) => {
          if (a.userAnswer) existing[a.question] = a.userAnswer;
        });
        setAnswers(existing);

        // Find first unanswered question
        const firstUnanswered = data.interview.answers?.findIndex(
          (a) => !a.userAnswer && !a.skipped,
        );
        if (firstUnanswered > 0) setCurrentIndex(firstUnanswered);
      } catch (error) {
        toast.error("Failed to load interview");
        navigate("/dashboard", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id, navigate]);

  // Overall interview timer
  useEffect(() => {
    if (totalTimeLeft <= 0 || !interview || interview.status !== "in-progress")
      return;

    const timer = setInterval(() => {
      setTotalTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          // Auto-complete when time runs out
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [interview]);

  // Auto-complete when time runs out (guard ref prevents infinite retry on error)
  useEffect(() => {
    if (
      totalTimeLeft === 0 &&
      interview?.status === "in-progress" &&
      !completing &&
      !autoCompletedRef.current
    ) {
      autoCompletedRef.current = true;
      handleComplete();
    }
  }, [totalTimeLeft, interview, completing]);

  // Focus textarea on question change
  useEffect(() => {
    if (textareaRef.current && questions[currentIndex]?.type !== "mcq") {
      textareaRef.current.focus();
    }
  }, [currentIndex, questions]);

  // Setup video stream - request if not yet granted
  useEffect(() => {
    if (!permissionsGranted) {
      // Silently request - browser won't show a popup if already granted on permissions page
      requestPermissions();
    }
  }, [permissionsGranted, requestPermissions]);

  // Cleanup on unmount: stop speech recognition and camera/mic stream
  const stopStreamRef = useRef(stopStream);
  useEffect(() => { stopStreamRef.current = stopStream; }, [stopStream]);
  useEffect(() => {
    return () => {
      stopListening();
      stopStreamRef.current();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Attach media stream to video element using callback ref to avoid timing issues
  const videoCallbackRef = useCallback(
    (el) => {
      videoRef.current = el;
      if (el && mediaStream) {
        el.srcObject = mediaStream;
      }
    },
    [mediaStream],
  );

  // Re-attach when mediaStream changes (e.g. granted after mount)
  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Integrate ONLY final transcript into answer - no answer state in deps to prevent infinite loop
  useEffect(() => {
    if (!transcript) return;
    const currentQ = questions[currentIndex];
    if (currentQ?.type !== "mcq") {
      setAnswer(preSpeechAnswerRef.current + transcript);
    }
  }, [transcript, currentIndex, questions]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasEvaluation = evaluations[currentQuestion?._id];
  const isAptitude = interview?.category === "aptitude";

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartSpeech = () => {
    if (!isSupported) {
      toast.error("Speech recognition not supported in your browser");
      return;
    }
    // Capture existing answer text so we can prefix it with new speech
    preSpeechAnswerRef.current =
      answer || answers[currentQuestion?._id] || "";
    resetTranscript();
    startListening();
  };

  const handleStopSpeech = () => {
    stopListening();
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || submitting) return;

    // Stop speech listening before submitting
    if (isListening) {
      stopListening();
    }

    const currentAnswer = answer || answers[currentQuestion._id] || "";
    if (!currentAnswer.trim()) {
      toast.error("Please provide an answer");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await interviewAPI.submitAnswer(id, {
        questionId: currentQuestion._id,
        answer: currentAnswer,
        timeSpent: 0, // Time tracking handled at interview level
      });

      setAnswers((prev) => ({ ...prev, [currentQuestion._id]: currentAnswer }));
      setEvaluations((prev) => ({
        ...prev,
        [currentQuestion._id]: data.evaluation,
      }));
      setAnswer("");
      stopListening();
      resetTranscript();

      // All categories: no per-question feedback, auto-advance
      if (!isLastQuestion) {
        setCurrentIndex((prev) => prev + 1);
        setShowHints(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!currentQuestion) return;
    try {
      await interviewAPI.submitAnswer(id, {
        questionId: currentQuestion._id,
        answer: "",
        timeSpent: 0,
      });
      setEvaluations((prev) => ({
        ...prev,
        [currentQuestion._id]: {
          score: 0,
          feedback: "Question skipped",
          isCorrect: false,
        },
      }));
    } catch {
      // Continue anyway
    }
    goNext();
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setAnswer("");
      stopListening();
      resetTranscript();
      setShowHints(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setAnswer("");
      stopListening();
      resetTranscript();
      setShowHints(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await interviewAPI.complete(id);
      toast.success("Interview completed!");
      navigate(`/interview/${id}/result`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to complete interview",
      );
    } finally {
      setCompleting(false);
    }
  };

  const handleAbandon = async () => {
    if (
      !window.confirm(
        "Are you sure you want to abandon this interview? Progress will be saved but it will be marked as abandoned.",
      )
    )
      return;
    try {
      await interviewAPI.abandon(id);
      toast("Interview abandoned", { icon: "🚪" });
      navigate("/dashboard");
    } catch {
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!interview || !currentQuestion) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-text-secondary)]">
          Interview not found or no questions available.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-[var(--color-text-tertiary)] uppercase tracking-wider font-medium">
            {interview.category} Interview
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-semibold ${
              totalTimeLeft < 60
                ? "bg-red-50 dark:bg-red-950/30 text-red-600"
                : "bg-surface-100 dark:bg-surface-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatTime(totalTimeLeft)}
          </div>
          <button
            onClick={handleAbandon}
            className="btn-ghost text-red-500 text-sm"
          >
            <XCircle className="w-4 h-4 mr-1" /> Exit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-2 mb-8">
        <motion.div
          className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
          initial={{ width: 0 }}
          animate={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main interview area: camera (left) + question (right) for video-enabled categories */}
      <div
        className={`flex gap-5 mb-6 items-start ${
          ["technical", "hr", "managerial"].includes(interview?.category)
            ? "flex-row"
            : ""
        }`}
      >
        {/* Camera panel on left */}
        {["technical", "hr", "managerial"].includes(interview?.category) && (
          <div className="w-72 flex-shrink-0 self-start">
            <p className="text-xs font-semibold mb-2 text-[var(--color-text-secondary)] uppercase tracking-wide">
              You
            </p>
            <div className="relative bg-black rounded-2xl overflow-hidden border border-surface-700 shadow-lg" style={{ aspectRatio: "4/3" }}>
              <video
                ref={videoCallbackRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              {/* Live indicator */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/90 px-2 py-1 rounded-full text-white text-xs font-semibold">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-white"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                LIVE
              </div>
              {/* Mute toggle */}
              <button
                onClick={() => {
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  if (mediaStream) {
                    mediaStream.getAudioTracks().forEach((t) => {
                      t.enabled = !newMuted;
                    });
                  }
                }}
                className="absolute bottom-2 right-2 p-2 rounded-full bg-surface-900/70 hover:bg-surface-800/70 text-white transition-colors"
              >
                {isMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Question Card */}
        <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="card flex-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Difficulty badge */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`badge ${
                currentQuestion.difficulty === "easy"
                  ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600"
                  : currentQuestion.difficulty === "hard"
                    ? "bg-red-100 dark:bg-red-950/30 text-red-600"
                    : "bg-amber-100 dark:bg-amber-950/30 text-amber-600"
              }`}
            >
              {currentQuestion.difficulty}
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {currentQuestion.points} points
            </span>
          </div>

          {/* Question text */}
          <h2 className="text-xl font-semibold leading-relaxed mb-6">
            {currentQuestion.question}
          </h2>

          {/* MCQ Options */}
          {currentQuestion.type === "mcq" &&
            currentQuestion.options?.length > 0 && (
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setAnswer(opt.label)}
                    disabled={!!hasEvaluation}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                      answer === opt.label ||
                      answers[currentQuestion._id] === opt.label
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 ring-1 ring-primary-500"
                        : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                    } ${hasEvaluation ? "cursor-default" : ""}`}
                  >
                    <span className="font-semibold mr-3">{opt.label}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
            )}

          {/* Open-ended answer with Speech-to-Text */}
          {currentQuestion.type !== "mcq" && (
            <>
              <textarea
                ref={textareaRef}
                value={answer || answers[currentQuestion._id] || ""}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={!!hasEvaluation}
                placeholder="Type your answer here or use the microphone button to speak..."
                className="input-field min-h-[160px] resize-y mb-4"
                rows={6}
              />

              {/* Speech-to-Text Interim Display */}
              {(isListening || interimTranscript) && (
                <motion.div
                  className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    {isListening ? "Listening..." : "Interim text:"}
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {interimTranscript || "Processing audio..."}
                  </p>
                </motion.div>
              )}

              {/* Speech Controls */}
              {!hasEvaluation && isSupported && (
                <div className="flex gap-2 mb-4">
                  {!isListening ? (
                    <button
                      onClick={handleStartSpeech}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
                    >
                      <Mic className="w-4 h-4" />
                      Start Speaking
                    </button>
                  ) : (
                    <button
                      onClick={handleStopSpeech}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors animate-pulse"
                    >
                      <MicOff className="w-4 h-4" />
                      Stop Listening
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Hints */}
          {currentQuestion.hints?.length > 0 && !hasEvaluation && (
            <div className="mb-4">
              <button
                onClick={() => setShowHints(!showHints)}
                className="btn-ghost text-sm text-amber-600 dark:text-amber-400"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                {showHints ? "Hide Hints" : "Show Hints"}
              </button>
              {showHints && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-sm text-amber-800 dark:text-amber-200"
                >
                  {currentQuestion.hints.map((hint, i) => (
                    <p key={i}>💡 {hint}</p>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {!hasEvaluation || (isAptitude && hasEvaluation) ? (
            !hasEvaluation ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={
                    submitting || (!answer && !answers[currentQuestion._id])
                  }
                  className="btn-primary"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Submit Answer
                    </>
                  )}
                </button>
                <button onClick={handleSkip} className="btn-ghost text-sm">
                  <SkipForward className="w-4 h-4 mr-1" /> Skip
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" /> Answer submitted
              </div>
            )
          ) : null}
        </motion.div>
        </AnimatePresence>
      </div>

      {/* Evaluation Feedback - hidden during interview, shown only on results page */}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </button>

        <div className="flex items-center gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                setAnswer("");
                stopListening();
                resetTranscript();
                setShowHints(false);
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-primary-500 scale-125"
                  : evaluations[questions[i]?._id]
                    ? "bg-emerald-400"
                    : "bg-surface-300 dark:bg-surface-600"
              }`}
            />
          ))}
        </div>

        {isLastQuestion ? (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="btn-primary"
          >
            {completing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Flag className="w-4 h-4 mr-2" /> Complete
              </>
            )}
          </button>
        ) : (
          <button onClick={goNext} className="btn-secondary">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}
