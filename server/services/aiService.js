const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

const getGeminiModelName = () => {
  const configured = (process.env.GOOGLE_AI_MODEL || "").trim();
  return configured || DEFAULT_GEMINI_MODEL;
};

const getGeminiModel = () => {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  return genAI.getGenerativeModel({ model: getGeminiModelName() });
};

// ====================== OPENROUTER (OpenAI-compatible) ======================
const getOpenRouterClient = () => {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const { OpenAI } = require("openai");
    return new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://interviewai-back.onrender.com",
        "X-Title": "InterviewAI",
      },
    });
  } catch {
    return null;
  }
};

const getOpenRouterModelName = () =>
  (
    process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free"
  ).trim();

const isAIAvailable = () =>
  Boolean(process.env.OPENROUTER_API_KEY || process.env.GOOGLE_AI_API_KEY);

/**
 * Unified AI text call — tries OpenRouter first, falls back to Gemini.
 * Returns response text string, or null if no provider is configured.
 */
const callAI = async (
  systemPrompt,
  userPrompt,
  { temperature = 0.5, maxTokens = 1000 } = {},
) => {
  const orClient = getOpenRouterClient();
  if (orClient) {
    const resp = await orClient.chat.completions.create({
      model: getOpenRouterModelName(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });
    return resp.choices[0].message.content.trim();
  }

  const geminiModel = getGeminiModel();
  if (!geminiModel) return null;
  const resp = await geminiModel.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
      },
    ],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  });
  return resp.response.text().trim();
};
// ============================================================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createAIUnavailableError = (message) => {
  const err = new Error(message);
  err.name = "AIUnavailableError";
  return err;
};

const CATEGORY_PROMPTS = {
  aptitude: {
    system: `You are an expert aptitude test interviewer. Generate challenging but fair aptitude questions covering logical reasoning, quantitative aptitude, verbal ability, and data interpretation. Always provide clear, unambiguous questions.`,
    subcategories: [
      "logical-reasoning",
      "quantitative",
      "verbal-ability",
      "data-interpretation",
      "general",
    ],
  },
  technical: {
    system: `You are a senior technical interviewer at a top tech company. Generate technical interview questions for a live face-to-face interview. Questions must be verbally answerable and discussion-oriented (concept explanation, trade-offs, debugging approach, architecture choices). Do not ask candidates to write code, implement functions, type syntax, or provide long written solutions. Tailor difficulty appropriately.`,
    subcategories: [
      "dsa",
      "system-design",
      "javascript",
      "python",
      "java",
      "react",
      "nodejs",
      "database",
      "general",
    ],
  },
  hr: {
    system: `You are an experienced HR interviewer. Generate behavioral and situational interview questions that assess communication skills, teamwork, problem-solving, adaptability, and cultural fit. Focus on STAR method responses.`,
    subcategories: [
      "behavioral",
      "situational",
      "cultural-fit",
      "communication",
      "teamwork",
      "general",
    ],
  },
  managerial: {
    system: `You are a senior management interviewer. Generate questions that assess leadership ability, strategic thinking, conflict resolution, team management, decision making, and project management skills.`,
    subcategories: [
      "leadership",
      "strategy",
      "conflict-resolution",
      "team-management",
      "decision-making",
      "general",
    ],
  },
};

const DIFFICULTY_CONTEXT = {
  easy: "Entry level, suitable for freshers or those new to the field.",
  medium: "Mid-level, suitable for candidates with 1-3 years of experience.",
  hard: "Senior level, suitable for experienced candidates with 3+ years.",
};

const TECHNICAL_FACE_TO_FACE_RULES = `
For technical category, follow these strict rules:
- Ask only face-to-face, verbally answerable questions.
- Prefer prompts like "Explain...", "How would you approach...", "What trade-offs...", "Walk me through...".
- Do NOT ask to write/implement code, pseudocode, SQL queries, regex, or exact syntax.
- Keep each question suitable for a spoken 1-3 minute response.
- Focus on reasoning, architecture, debugging approach, and decision making.
`;

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "is",
  "are",
  "was",
  "were",
  "be",
  "this",
  "that",
  "it",
  "as",
  "by",
  "at",
  "from",
  "your",
  "you",
  "i",
]);

const tokenize = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

const unique = (arr = []) => [...new Set(arr)];

const extractExpectedKeywords = (question) => {
  const pool = [
    question?.correctAnswer || "",
    question?.sampleAnswer || "",
    Array.isArray(question?.evaluationCriteria)
      ? question.evaluationCriteria.join(" ")
      : "",
  ].join(" ");
  return unique(tokenize(pool)).slice(0, 12);
};

const pickQuestionTopic = (question) => {
  const q = String(question?.question || question?.questionText || "").trim();
  if (!q) return "this question";
  const plain = q.replace(/\s+/g, " ");
  return plain.length > 90 ? `${plain.slice(0, 90)}...` : plain;
};

const buildQuestionSpecificFeedback = (question, userAnswer, score) => {
  const answerTokens = new Set(tokenize(userAnswer));
  const expected = extractExpectedKeywords(question);
  const covered = expected.filter((k) => answerTokens.has(k));
  const missing = expected.filter((k) => !answerTokens.has(k));
  const topic = pickQuestionTopic(question);

  let opener = "";
  if (score >= 8) opener = `Good response for the question: \"${topic}\".`;
  else if (score >= 6)
    opener = `Decent attempt for the question: \"${topic}\".`;
  else
    opener = `Your answer only partially addressed the question: \"${topic}\".`;

  const coveredLine = covered.length
    ? `You covered relevant points such as ${covered.slice(0, 3).join(", ")}.`
    : "You should focus more on the core concept asked in the question.";

  const improveLine = missing.length
    ? `To improve, include points around ${missing.slice(0, 3).join(", ")} in your response.`
    : "To improve, add a clearer structure: key point, reasoning, and one practical example.";

  return `${opener} ${coveredLine} ${improveLine}`;
};

const isGenericFeedback = (text = "") => {
  const t = String(text).toLowerCase();
  if (!t.trim()) return true;
  return (
    /good start|strong response|basic response|answer has been recorded|well done|needs improvement/.test(
      t,
    ) && !/question|because|for this|in this/.test(t)
  );
};

const normalizeEvaluationResult = (result, question, userAnswer) => {
  const fallback = generateFallbackEvaluation(question, userAnswer);
  const scoreValue = Number(result?.score);
  const score = Number.isFinite(scoreValue)
    ? Math.max(0, Math.min(10, Math.round(scoreValue)))
    : fallback.score;

  let feedback =
    typeof result?.feedback === "string" && result.feedback.trim()
      ? result.feedback.trim()
      : fallback.feedback;

  if (isGenericFeedback(feedback)) {
    feedback = buildQuestionSpecificFeedback(question, userAnswer, score);
  }

  return {
    score,
    isCorrect:
      typeof result?.isCorrect === "boolean" ? result.isCorrect : score >= 5,
    feedback,
    strengths:
      Array.isArray(result?.strengths) && result.strengths.length
        ? result.strengths.filter((s) => typeof s === "string" && s.trim())
        : fallback.strengths,
    improvements:
      Array.isArray(result?.improvements) && result.improvements.length
        ? result.improvements.filter((s) => typeof s === "string" && s.trim())
        : fallback.improvements,
  };
};

/**
 * Generate AI-powered interview questions
 */
const generateQuestions = async (
  category,
  subcategory,
  difficulty,
  count,
  userContext = "",
) => {
  if (!isAIAvailable()) {
    return generateFallbackQuestions(category, subcategory, difficulty, count);
  }

  try {
    const categoryConfig = CATEGORY_PROMPTS[category];
    const difficultyDesc =
      DIFFICULTY_CONTEXT[difficulty] || DIFFICULTY_CONTEXT.medium;

    const prompt = `Generate exactly ${count} ${difficulty} ${category} interview questions${subcategory !== "general" ? ` focused on ${subcategory}` : ""}.

Difficulty Context: ${difficultyDesc}
${userContext ? `Candidate Context: ${userContext}` : ""}
  ${category === "technical" ? TECHNICAL_FACE_TO_FACE_RULES : ""}

Return a JSON array with this exact structure for each question:
{
  "question": "The question text",
  "type": "${category === "aptitude" ? "mcq" : "open-ended"}",
  "options": ${category === "aptitude" ? '[{"label": "A", "text": "option text"}, {"label": "B", "text": "option text"}, {"label": "C", "text": "option text"}, {"label": "D", "text": "option text"}]' : "[]"},
  "correctAnswer": "The correct answer or model answer",
  "sampleAnswer": "A detailed sample answer showing what a good response looks like",
  "evaluationCriteria": ["criterion 1", "criterion 2", "criterion 3"],
  "hints": ["helpful hint 1"],
  "timeLimit": ${category === "aptitude" ? 90 : 180},
  "points": 10
}

Return ONLY the JSON array, no markdown or other text.`;

    const content = await callAI(categoryConfig.system, prompt, {
      temperature: 0.8,
      maxTokens: 4000,
    });
    if (!content)
      return generateFallbackQuestions(
        category,
        subcategory,
        difficulty,
        count,
      );
    // Strip markdown code fences if present
    const jsonStr = content
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
    const questions = JSON.parse(jsonStr);
    const mapped = questions.map((q) => ({
      ...q,
      category,
      subcategory,
      difficulty,
      isAIGenerated: true,
    }));
    // Trim to exact count if AI returned extra, or pad with fallback if short
    if (mapped.length >= count) {
      return mapped.slice(0, count);
    }
    const fallbackExtra = generateFallbackQuestions(
      category,
      subcategory,
      difficulty,
      count - mapped.length,
    );
    return [...mapped, ...fallbackExtra].slice(0, count);
  } catch (error) {
    console.error("AI Question Generation Error:", error.message);
    return generateFallbackQuestions(category, subcategory, difficulty, count);
  }
};

/**
 * Evaluate user's answer using AI
 */
const evaluateAnswer = async (question, userAnswer, category) => {
  if (!userAnswer.trim()) {
    return generateFallbackEvaluation(question, userAnswer);
  }

  if (!isAIAvailable()) {
    throw createAIUnavailableError(
      "AI evaluation is unavailable because no AI provider is configured.",
    );
  }

  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const prompt = `Evaluate this ${category} interview answer.

Question: ${question.question || question.questionText}
${question.correctAnswer ? `Expected Answer: ${question.correctAnswer}` : ""}
${question.sampleAnswer ? `Sample Answer: ${question.sampleAnswer}` : ""}
${question.evaluationCriteria?.length ? `Evaluation Criteria: ${question.evaluationCriteria.join(", ")}` : ""}

Candidate's Answer: ${userAnswer}

Evaluate and return a JSON object:
{
  "score": <number 0-10>,
  "isCorrect": <boolean>,
  "feedback": "Detailed constructive feedback that explicitly references this specific question/topic and what the candidate covered or missed",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area for improvement 1", "area for improvement 2"]
}

Return ONLY the JSON object.`;

      const content = await callAI(
        "You are a fair and constructive interview evaluator. Feedback must be question-specific, never generic. Mention at least one concrete concept from the question, and identify what was covered vs missing in the candidate answer.",
        prompt,
        { temperature: 0.3, maxTokens: 1000 },
      );
      if (!content) throw new Error("Empty AI response");
      const jsonStr = content
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
      const parsed = JSON.parse(jsonStr);
      return normalizeEvaluationResult(parsed, question, userAnswer);
    } catch (error) {
      lastError = error;
      console.error(
        `AI Evaluation Error (attempt ${attempt}/${maxAttempts}):`,
        error.message,
      );
      if (attempt < maxAttempts) {
        await sleep(350 * attempt);
      }
    }
  }

  throw createAIUnavailableError(
    `AI evaluation is temporarily unavailable. Please retry. (${lastError?.message || "unknown error"})`,
  );
};

/**
 * Generate overall interview feedback using AI
 */
const generateInterviewFeedback = async (interview) => {
  if (!isAIAvailable()) {
    return generateFallbackFeedback(interview);
  }

  try {
    const answeredSummary = interview.answers
      .map(
        (a, i) =>
          `Q${i + 1}: ${a.questionText} | Score: ${a.score}/10 | ${a.skipped ? "Skipped" : "Answered"}`,
      )
      .join("\n");

    const prompt = `Provide overall feedback for this ${interview.category} mock interview.

Category: ${interview.category}
Score: ${interview.totalScore}/${interview.maxScore} (${interview.percentage}%)
Questions Answered: ${interview.questionsAnswered}/${interview.totalQuestions}

Summary:
${answeredSummary}

Return a JSON object:
{
  "overallFeedback": "Comprehensive paragraph of overall feedback",
  "strengths": ["key strength 1", "key strength 2", "key strength 3"],
  "areasForImprovement": ["improvement area 1", "improvement area 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Return ONLY the JSON object.`;

    const content = await callAI(
      "You are a career coach providing constructive interview feedback.",
      prompt,
      { temperature: 0.5, maxTokens: 1000 },
    );
    if (!content) return generateFallbackFeedback(interview);
    const jsonStr = content
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Feedback Error:", error.message);
    return generateFallbackFeedback(interview);
  }
};

// ====================== FALLBACK QUESTIONS (when no API key) ======================

function generateFallbackQuestions(category, subcategory, difficulty, count) {
  const questionBanks = {
    aptitude: [
      {
        question:
          "If a train travels 360 km in 4 hours, what is its speed in m/s?",
        type: "mcq",
        options: [
          { label: "A", text: "20 m/s" },
          { label: "B", text: "25 m/s" },
          { label: "C", text: "30 m/s" },
          { label: "D", text: "15 m/s" },
        ],
        correctAnswer: "B",
        sampleAnswer: "360 km/4 hours = 90 km/h = 90 × (5/18) = 25 m/s",
        timeLimit: 90,
        points: 10,
      },
      {
        question: "What is the next number in the series: 2, 6, 12, 20, 30, ?",
        type: "mcq",
        options: [
          { label: "A", text: "40" },
          { label: "B", text: "42" },
          { label: "C", text: "38" },
          { label: "D", text: "44" },
        ],
        correctAnswer: "B",
        sampleAnswer:
          "Pattern: differences are 4, 6, 8, 10, 12 → next is 30 + 12 = 42",
        timeLimit: 90,
        points: 10,
      },
      {
        question:
          "A shopkeeper marks a product 40% above cost price and gives 20% discount. What is the profit percentage?",
        type: "mcq",
        options: [
          { label: "A", text: "10%" },
          { label: "B", text: "12%" },
          { label: "C", text: "15%" },
          { label: "D", text: "20%" },
        ],
        correctAnswer: "B",
        sampleAnswer:
          "Let CP = 100, MP = 140, SP = 140 × 0.8 = 112. Profit = 12%",
        timeLimit: 90,
        points: 10,
      },
      {
        question:
          "If MACHINE is coded as 19-7-9-14-15-20-11, how is PENCIL coded?",
        type: "mcq",
        options: [
          { label: "A", text: "22-11-20-9-15-18" },
          { label: "B", text: "22-11-20-15-18-9" },
          { label: "C", text: "16-5-14-3-9-12" },
          { label: "D", text: "22-11-20-9-18-15" },
        ],
        correctAnswer: "A",
        sampleAnswer:
          "Each letter is coded as position + 6: P(16+6)=22, E(5+6)=11, N(14+6)=20, C(3+6)=9, I(9+6)=15, L(12+6)=18",
        timeLimit: 90,
        points: 10,
      },
      {
        question:
          "A tank can be filled by pipe A in 12 minutes and by pipe B in 15 minutes. If both are opened together, how long to fill the tank?",
        type: "mcq",
        options: [
          { label: "A", text: "6 min 40 sec" },
          { label: "B", text: "7 min 30 sec" },
          { label: "C", text: "6 min" },
          { label: "D", text: "8 min" },
        ],
        correctAnswer: "A",
        sampleAnswer:
          "Combined rate = 1/12 + 1/15 = 9/60 = 3/20. Time = 20/3 = 6 min 40 sec",
        timeLimit: 90,
        points: 10,
      },
      {
        question:
          "Three friends share a bill of $180 in the ratio 2:3:4. What does the second person pay?",
        type: "mcq",
        options: [
          { label: "A", text: "$40" },
          { label: "B", text: "$60" },
          { label: "C", text: "$80" },
          { label: "D", text: "$50" },
        ],
        correctAnswer: "B",
        sampleAnswer:
          "Total parts = 2+3+4 = 9. Second person = (3/9) × 180 = $60",
        timeLimit: 90,
        points: 10,
      },
      {
        question:
          "What is the probability of getting at least one head when tossing two fair coins?",
        type: "mcq",
        options: [
          { label: "A", text: "1/2" },
          { label: "B", text: "3/4" },
          { label: "C", text: "1/4" },
          { label: "D", text: "2/3" },
        ],
        correctAnswer: "B",
        sampleAnswer: "P(at least one head) = 1 - P(no heads) = 1 - 1/4 = 3/4",
        timeLimit: 90,
        points: 10,
      },
      {
        question:
          "A clock shows 3:15. What is the angle between the hour and minute hands?",
        type: "mcq",
        options: [
          { label: "A", text: "0°" },
          { label: "B", text: "7.5°" },
          { label: "C", text: "15°" },
          { label: "D", text: "22.5°" },
        ],
        correctAnswer: "B",
        sampleAnswer:
          "At 3:15, minute hand at 90°. Hour hand at 90° + 15×0.5° = 97.5°. Angle = 7.5°",
        timeLimit: 90,
        points: 10,
      },
      {
        question: "Complete the analogy: Book is to Reading as Fork is to ___",
        type: "mcq",
        options: [
          { label: "A", text: "Drawing" },
          { label: "B", text: "Eating" },
          { label: "C", text: "Writing" },
          { label: "D", text: "Cooking" },
        ],
        correctAnswer: "B",
        sampleAnswer: "A book is used for reading, a fork is used for eating",
        timeLimit: 60,
        points: 10,
      },
      {
        question:
          "If 5 machines can produce 5 widgets in 5 minutes, how many minutes do 100 machines need to produce 100 widgets?",
        type: "mcq",
        options: [
          { label: "A", text: "100" },
          { label: "B", text: "5" },
          { label: "C", text: "25" },
          { label: "D", text: "20" },
        ],
        correctAnswer: "B",
        sampleAnswer:
          "Each machine makes 1 widget in 5 minutes. 100 machines make 100 widgets in 5 minutes.",
        timeLimit: 90,
        points: 10,
      },
    ],
    technical: [
      {
        question:
          "Explain the difference between var, let, and const in JavaScript.",
        type: "open-ended",
        correctAnswer:
          "var is function-scoped and hoisted, let is block-scoped and not hoisted, const is block-scoped and cannot be reassigned",
        sampleAnswer:
          "var is function-scoped, hoisted to the top of its scope, and can be redeclared. let is block-scoped, not hoisted (temporal dead zone), and cannot be redeclared. const is like let but also cannot be reassigned, though object properties can still be modified.",
        evaluationCriteria: [
          "Scope understanding",
          "Hoisting knowledge",
          "Reassignment rules",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question: "What is the time complexity of binary search and why?",
        type: "open-ended",
        correctAnswer:
          "O(log n) because the search space is halved with each iteration",
        sampleAnswer:
          "Binary search has O(log n) time complexity because it divides the sorted array in half with each comparison. After k comparisons, the remaining elements are n/2^k. The search terminates when n/2^k = 1, giving k = log₂(n).",
        evaluationCriteria: [
          "Correct complexity",
          "Clear explanation",
          "Mathematical reasoning",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question:
          "Explain the concept of closures in JavaScript with an example.",
        type: "open-ended",
        correctAnswer:
          "A closure is a function that has access to variables in its outer scope even after the outer function has returned",
        sampleAnswer:
          'A closure occurs when an inner function retains access to variables from its outer (enclosing) function scope, even after the outer function has returned. Example: function counter() { let count = 0; return function() { return ++count; } }. The returned function "closes over" the count variable.',
        evaluationCriteria: [
          "Definition accuracy",
          "Example quality",
          "Scope chain understanding",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question:
          "What are the SOLID principles in object-oriented programming?",
        type: "open-ended",
        correctAnswer:
          "Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion",
        sampleAnswer:
          "SOLID: S - Single Responsibility (a class should have one reason to change), O - Open/Closed (open for extension, closed for modification), L - Liskov Substitution (subtypes should be substitutable for base types), I - Interface Segregation (prefer many specific interfaces), D - Dependency Inversion (depend on abstractions, not concretions).",
        evaluationCriteria: [
          "All 5 principles named",
          "Correct explanations",
          "Practical understanding",
        ],
        timeLimit: 240,
        points: 10,
      },
      {
        question:
          "Explain the difference between SQL and NoSQL databases. When would you use each?",
        type: "open-ended",
        correctAnswer:
          "SQL is relational with structured schemas, NoSQL is non-relational with flexible schemas",
        sampleAnswer:
          "SQL databases (MySQL, PostgreSQL) are relational, use structured schemas with tables, support ACID transactions, and are great for complex queries and data integrity. NoSQL databases (MongoDB, Redis) offer flexible schemas, horizontal scaling, and are ideal for rapid development, large-scale data, and when schema might evolve frequently.",
        evaluationCriteria: [
          "Key differences identified",
          "Use case understanding",
          "Examples given",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question:
          "What is the Virtual DOM in React and how does it improve performance?",
        type: "open-ended",
        correctAnswer:
          "Virtual DOM is an in-memory representation of the real DOM that React uses for efficient updates through diffing",
        sampleAnswer:
          "The Virtual DOM is a lightweight JavaScript object that is a copy of the real DOM. When state changes, React creates a new Virtual DOM tree, diffs it with the previous one (reconciliation), calculates the minimum changes needed, and batch-updates only those specific parts of the real DOM. This is faster than directly manipulating the DOM.",
        evaluationCriteria: [
          "Virtual DOM concept",
          "Diffing/reconciliation",
          "Performance benefits",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question: "Explain how indexing works in databases and its trade-offs.",
        type: "open-ended",
        correctAnswer:
          "Indexes create data structures (B-trees) for faster lookups but add write overhead and storage cost",
        sampleAnswer:
          "Database indexes create additional data structures (typically B-tree or hash) that allow the database to find rows without scanning the entire table. Benefits: much faster reads/queries. Trade-offs: slower writes (index must be updated), additional storage space, and maintenance overhead. Choose indexes based on query patterns.",
        evaluationCriteria: [
          "How indexes work",
          "Benefits explained",
          "Trade-offs identified",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question: "What is the event loop in Node.js? Explain its phases.",
        type: "open-ended",
        correctAnswer:
          "The event loop processes callbacks in phases: timers, pending callbacks, idle/prepare, poll, check, close",
        sampleAnswer:
          "The Node.js event loop is a single-threaded mechanism that handles async operations. Phases: 1) Timers (setTimeout/setInterval callbacks), 2) Pending callbacks (I/O callbacks deferred), 3) Idle/Prepare (internal), 4) Poll (retrieve new I/O events), 5) Check (setImmediate callbacks), 6) Close callbacks. This allows non-blocking I/O despite being single-threaded.",
        evaluationCriteria: [
          "Event loop concept",
          "Phases described",
          "Non-blocking understanding",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question:
          "How would you explain your approach to checking whether a string is a palindrome while ignoring non-alphanumeric characters?",
        type: "open-ended",
        correctAnswer:
          "Describe a two-pointer approach: normalize or skip non-alphanumeric characters, compare from both ends, and stop on mismatch.",
        sampleAnswer:
          "I would use two pointers, one at the start and one at the end. At each step, skip characters that are not letters or digits, compare lowercased characters, and move inward. If any pair differs, it is not a palindrome. If pointers cross, it is a palindrome. This runs in O(n) time and O(1) extra space if done in-place.",
        evaluationCriteria: [
          "Clear verbal approach",
          "Edge cases handled",
          "Time/space complexity awareness",
        ],
        timeLimit: 300,
        points: 10,
      },
      {
        question:
          "What is REST API? Explain the key principles and HTTP methods used.",
        type: "open-ended",
        correctAnswer:
          "REST is an architectural style using HTTP methods (GET, POST, PUT, DELETE) with stateless communication and resource-based URLs",
        sampleAnswer:
          "REST (Representational State Transfer) is an architectural style for APIs. Principles: 1) Stateless - each request is independent, 2) Client-Server separation, 3) Uniform interface with resource-based URLs, 4) Cacheable responses. HTTP methods: GET (read), POST (create), PUT/PATCH (update), DELETE (remove). Resources are identified by URIs.",
        evaluationCriteria: [
          "Principles explained",
          "HTTP methods",
          "Resource-based design",
        ],
        timeLimit: 180,
        points: 10,
      },
    ],
    hr: [
      {
        question: "Tell me about yourself and your career journey.",
        type: "open-ended",
        sampleAnswer:
          "Structure: Present role/education → Past experience → Future goals. Keep it professional, highlight relevant achievements, and connect to the target role.",
        evaluationCriteria: [
          "Structure and clarity",
          "Relevance to role",
          "Confidence and authenticity",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question:
          "Describe a time when you had to work with a difficult team member. How did you handle it?",
        type: "open-ended",
        sampleAnswer:
          "Use STAR method: Situation (the conflict), Task (your responsibility), Action (what you specifically did), Result (positive outcome). Focus on communication, empathy, and finding common ground.",
        evaluationCriteria: [
          "STAR method used",
          "Specific example",
          "Positive outcome focus",
        ],
        timeLimit: 240,
        points: 10,
      },
      {
        question: "What are your greatest strengths and weaknesses?",
        type: "open-ended",
        sampleAnswer:
          "Strengths: Pick 2-3 relevant to the role with specific examples. Weaknesses: Choose a genuine area, show self-awareness, and describe steps you are taking to improve.",
        evaluationCriteria: ["Self-awareness", "Honesty", "Growth mindset"],
        timeLimit: 180,
        points: 10,
      },
      {
        question: "Where do you see yourself in 5 years?",
        type: "open-ended",
        sampleAnswer:
          "Show ambition while being realistic. Connect your growth goals to the company. Mention skill development, increased responsibilities, and leadership aspirations relevant to the role.",
        evaluationCriteria: [
          "Ambition shown",
          "Realistic goals",
          "Alignment with role",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question: "Why should we hire you over other candidates?",
        type: "open-ended",
        sampleAnswer:
          "Highlight unique combination of skills, relevant experience, and cultural fit. Provide specific examples of past achievements that demonstrate value you would bring.",
        evaluationCriteria: [
          "Unique value proposition",
          "Specific examples",
          "Confidence without arrogance",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question:
          "Describe a situation where you failed. What did you learn from it?",
        type: "open-ended",
        sampleAnswer:
          "Be honest about a real failure. Use STAR to describe what happened, take responsibility, explain the lessons learned, and how you applied those lessons going forward.",
        evaluationCriteria: [
          "Honesty and accountability",
          "Lessons learned",
          "Growth demonstrated",
        ],
        timeLimit: 240,
        points: 10,
      },
      {
        question:
          "How do you handle pressure and stressful situations at work?",
        type: "open-ended",
        sampleAnswer:
          "Describe concrete strategies: prioritization, time management, breaking tasks into smaller pieces, seeking help when needed. Give a specific example where you performed well under pressure.",
        evaluationCriteria: [
          "Practical strategies",
          "Specific example",
          "Emotional intelligence",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question: "What motivates you in your professional life?",
        type: "open-ended",
        sampleAnswer:
          "Focus on intrinsic motivators: learning, impact, problem-solving, teamwork. Connect to the role and company mission. Be authentic and specific.",
        evaluationCriteria: [
          "Authenticity",
          "Alignment with role",
          "Depth of answer",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question:
          "Tell me about a time you went above and beyond your regular duties.",
        type: "open-ended",
        sampleAnswer:
          "Use STAR method with a specific example showing initiative, dedication, and positive impact beyond your job description.",
        evaluationCriteria: [
          "Initiative demonstrated",
          "Specific example",
          "Measurable impact",
        ],
        timeLimit: 240,
        points: 10,
      },
      {
        question:
          "How do you prioritize tasks when you have multiple deadlines?",
        type: "open-ended",
        sampleAnswer:
          "Describe your system: urgency/importance matrix, communication with stakeholders, breaking large tasks down, using tools. Give a concrete example of successful prioritization.",
        evaluationCriteria: [
          "Systematic approach",
          "Communication skills",
          "Real example",
        ],
        timeLimit: 180,
        points: 10,
      },
    ],
    managerial: [
      {
        question:
          "How would you handle a situation where two of your team members are in conflict?",
        type: "open-ended",
        sampleAnswer:
          "Listen to both sides individually first, understand root cause, mediate a discussion focusing on work goals not personal issues, establish clear expectations, and follow up to ensure resolution.",
        evaluationCriteria: [
          "Conflict resolution approach",
          "Fairness",
          "Communication skills",
        ],
        timeLimit: 240,
        points: 10,
      },
      {
        question:
          "Describe your leadership style and how you adapt it to different situations.",
        type: "open-ended",
        sampleAnswer:
          "Describe primary style (e.g., servant leadership, transformational) with examples, then show adaptability: coaching for new team members, delegating for experienced ones, directing in crises.",
        evaluationCriteria: [
          "Self-awareness",
          "Adaptability",
          "Concrete examples",
        ],
        timeLimit: 240,
        points: 10,
      },
      {
        question: "How do you motivate an underperforming team member?",
        type: "open-ended",
        sampleAnswer:
          "First understand the root cause (skill gap, personal issues, disengagement). Have a private, empathetic conversation. Set clear expectations with an improvement plan. Provide support, resources, and regular check-ins. Recognize improvements.",
        evaluationCriteria: [
          "Empathy shown",
          "Structured approach",
          "Support-focused",
        ],
        timeLimit: 240,
        points: 10,
      },
      {
        question:
          "Tell me about a time you had to make a difficult business decision with incomplete information.",
        type: "open-ended",
        sampleAnswer:
          "Use STAR: describe the situation, analyze what information was available, explain your decision-making framework, the decision made, and the outcome with lessons learned.",
        evaluationCriteria: [
          "Decision-making framework",
          "Risk assessment",
          "Accountability",
        ],
        timeLimit: 240,
        points: 10,
      },
      {
        question: "How do you delegate tasks effectively within your team?",
        type: "open-ended",
        sampleAnswer:
          'Match tasks to skills and development goals. Provide clear expectations and context (the "why"). Set milestones and check-in points. Trust but verify. Give credit for completion.',
        evaluationCriteria: [
          "Delegation strategy",
          "Trust building",
          "Clear communication",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question:
          "How would you manage a project that is falling behind schedule?",
        type: "open-ended",
        sampleAnswer:
          "Assess what is causing delays. Re-prioritize deliverables (MoSCoW method). Communicate transparently with stakeholders. Reallocate resources. Cut scope if needed. Implement daily standups for visibility.",
        evaluationCriteria: [
          "Problem analysis",
          "Stakeholder communication",
          "Practical solutions",
        ],
        timeLimit: 240,
        points: 10,
      },
      {
        question: "What strategies do you use to build a high-performing team?",
        type: "open-ended",
        sampleAnswer:
          "Hire for cultural fit and potential. Set clear vision and goals. Foster psychological safety. Invest in development. Recognize achievements. Encourage collaboration and healthy debate.",
        evaluationCriteria: [
          "Team building approach",
          "Development focus",
          "Culture creation",
        ],
        timeLimit: 240,
        points: 10,
      },
      {
        question:
          "How do you handle giving negative feedback to a team member?",
        type: "open-ended",
        sampleAnswer:
          "Be timely, private, and specific. Use SBI framework (Situation, Behavior, Impact). Focus on behavior, not person. Ask for their perspective. Co-create an improvement plan. Follow up supportively.",
        evaluationCriteria: [
          "Feedback framework",
          "Empathy",
          "Constructive approach",
        ],
        timeLimit: 180,
        points: 10,
      },
      {
        question:
          "Describe a time when you successfully led organizational change.",
        type: "open-ended",
        sampleAnswer:
          'Use a change management framework: communicate the "why", involve stakeholders early, identify champions, address resistance with empathy, celebrate milestones, and measure outcomes.',
        evaluationCriteria: [
          "Change management knowledge",
          "Leadership in action",
          "Result orientation",
        ],
        timeLimit: 240,
        points: 10,
      },
      {
        question:
          "How do you balance short-term delivery with long-term strategic goals?",
        type: "open-ended",
        sampleAnswer:
          "Allocate dedicated time for strategic work (e.g., 70/20/10 rule). Align sprint goals with quarterly objectives. Communicate trade-offs transparently. Build technical debt reduction into regular cycles.",
        evaluationCriteria: [
          "Strategic thinking",
          "Prioritization",
          "Practical balance",
        ],
        timeLimit: 240,
        points: 10,
      },
    ],
  };

  const bank = questionBanks[category] || questionBanks.technical;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  const selected = [];

  // Cycle through the bank as many times as needed to reach exact count
  for (let i = 0; i < count; i++) {
    const q = shuffled[i % shuffled.length];
    selected.push({
      ...q,
      category,
      subcategory,
      difficulty,
      isAIGenerated: false,
      evaluationCriteria: q.evaluationCriteria || [],
      hints: q.hints || [],
    });
  }

  return selected;
}

function generateFallbackEvaluation(question, userAnswer) {
  if (!userAnswer || !userAnswer.trim()) {
    return {
      score: 0,
      isCorrect: false,
      feedback: "No answer provided.",
      strengths: [],
      improvements: ["Please provide an answer to receive feedback."],
    };
  }

  // Basic scoring for MCQ
  if (question.type === "mcq" && question.correctAnswer) {
    const isCorrect =
      userAnswer.trim().toUpperCase() ===
      question.correctAnswer.trim().toUpperCase();
    return {
      score: isCorrect ? 10 : 0,
      isCorrect,
      feedback: isCorrect
        ? "Correct! Well done."
        : `Incorrect. The correct answer is ${question.correctAnswer}. ${question.sampleAnswer || ""}`,
      strengths: isCorrect ? ["Correct answer selected"] : [],
      improvements: isCorrect
        ? []
        : ["Review the concept behind this question"],
    };
  }

  // Basic scoring for open-ended (without AI)
  const trimmed = userAnswer.trim();
  const wordCount = trimmed.split(/\s+/).length;
  const sentenceCount = (trimmed.match(/[.!?]+/g) || []).length;
  const hasExampleCue =
    /\b(example|for instance|for example|in my|when i|project|experience)\b/i.test(
      trimmed,
    );

  let score = 4;
  if (wordCount >= 15) score += 1;
  if (wordCount >= 30) score += 1;
  if (sentenceCount >= 2) score += 1;
  if (hasExampleCue) score += 1;
  score = Math.max(1, Math.min(10, score));

  const strengths = [];
  const improvements = [];

  if (wordCount >= 20)
    strengths.push("You provided a reasonably detailed response.");
  if (sentenceCount >= 2)
    strengths.push("Your answer has a clear multi-point structure.");
  if (hasExampleCue)
    strengths.push(
      "You attempted to ground your response with context/examples.",
    );

  if (wordCount < 20)
    improvements.push(
      "Add more depth: explain your thinking in 2-3 clear points.",
    );
  if (!hasExampleCue)
    improvements.push(
      "Include one specific example from your project/work/college experience.",
    );
  if (sentenceCount < 2)
    improvements.push(
      "Structure your response into short sentences for better clarity.",
    );

  const feedback =
    score >= 8
      ? "Strong response. You communicated clearly and covered the topic with good depth."
      : score >= 6
        ? "Good start. Your answer is understandable, but adding a specific example and clearer structure would make it stronger."
        : "Basic response. Expand your answer with relevant details and a concrete example to improve your interview impact.";

  const specificFeedback = buildQuestionSpecificFeedback(
    question,
    userAnswer,
    score,
  );

  return {
    score,
    isCorrect: score >= 5,
    feedback: `${specificFeedback} ${feedback} (Score: ${score}/10)`,
    strengths,
    improvements,
  };
}

function generateFallbackFeedback(interview) {
  const pct = interview.percentage;
  let feedback = "";

  if (pct >= 80)
    feedback = `Excellent performance in your ${interview.category} interview! You demonstrated strong knowledge and communication skills.`;
  else if (pct >= 60)
    feedback = `Good performance in your ${interview.category} interview. There are some areas where you can improve with more practice.`;
  else if (pct >= 40)
    feedback = `Average performance in your ${interview.category} interview. Focus on strengthening your fundamentals and practice more.`;
  else
    feedback = `Your ${interview.category} interview needs improvement. Review the core concepts and practice regularly.`;

  return {
    overallFeedback: feedback,
    strengths:
      pct >= 50
        ? ["Attempted most questions", "Showed effort in responses"]
        : ["Showed willingness to attempt the interview"],
    areasForImprovement:
      pct < 80
        ? [
            "Provide more detailed and structured answers",
            "Use specific examples to support your points",
          ]
        : ["Continue practicing to maintain your excellent level"],
    recommendations: [
      "Practice regularly with different question types",
      "Review your answers and the provided sample answers",
      "Focus on your weakest subcategories",
    ],
  };
}

module.exports = {
  generateQuestions,
  evaluateAnswer,
  generateInterviewFeedback,
  CATEGORY_PROMPTS,
};
