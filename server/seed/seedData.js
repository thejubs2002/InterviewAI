require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const User = require("../models/User");
const Question = require("../models/Question");

const seedData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/ai-mock-interview",
    );
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Question.deleteMany({});
    console.log("Cleared existing data");

    // Create demo user
    const user = await User.create({
      name: "Demo User",
      email: "demo@example.com",
      password: "demo1234",
      profile: {
        title: "Full Stack Developer",
        bio: "Passionate about building great software",
        experience: "mid",
        skills: ["JavaScript", "React", "Node.js", "Python", "MongoDB"],
        targetRole: "Senior Software Engineer",
        targetCompany: "Tech Company",
      },
    });
    console.log(`Created demo user: ${user.email}`);

    // Seed sample questions
    const sampleQuestions = [
      // Aptitude
      {
        category: "aptitude",
        subcategory: "logical-reasoning",
        difficulty: "easy",
        type: "mcq",
        question:
          "If all roses are flowers and some flowers fade quickly, which statement is definitely true?",
        options: [
          { label: "A", text: "All roses fade quickly" },
          { label: "B", text: "Some roses fade quickly" },
          { label: "C", text: "No roses fade quickly" },
          { label: "D", text: "None of the above is definitely true" },
        ],
        correctAnswer: "D",
        sampleAnswer:
          "We only know all roses are flowers and some flowers fade quickly. We cannot determine if any roses are in the group that fades quickly.",
        points: 10,
        timeLimit: 90,
      },
      {
        category: "aptitude",
        subcategory: "quantitative",
        difficulty: "medium",
        type: "mcq",
        question:
          "A car travels 120 km at 60 km/h and returns at 40 km/h. What is the average speed for the round trip?",
        options: [
          { label: "A", text: "48 km/h" },
          { label: "B", text: "50 km/h" },
          { label: "C", text: "45 km/h" },
          { label: "D", text: "52 km/h" },
        ],
        correctAnswer: "A",
        sampleAnswer:
          "Total distance = 240 km. Time going = 2h, return = 3h, total = 5h. Avg speed = 240/5 = 48 km/h",
        points: 10,
        timeLimit: 90,
      },
      // Technical
      {
        category: "technical",
        subcategory: "javascript",
        difficulty: "medium",
        type: "open-ended",
        question: "Explain the difference between == and === in JavaScript.",
        correctAnswer:
          "== performs type coercion, === checks both value and type",
        sampleAnswer:
          "== (loose equality) converts operands to the same type before comparing. === (strict equality) checks both value and type without conversion. Always prefer === to avoid unexpected coercion bugs.",
        evaluationCriteria: [
          "Type coercion understanding",
          "Practical recommendation",
        ],
        points: 10,
        timeLimit: 120,
      },
      {
        category: "technical",
        subcategory: "dsa",
        difficulty: "hard",
        type: "open-ended",
        question:
          "Explain the difference between BFS and DFS. When would you prefer one over the other?",
        correctAnswer:
          "BFS uses queue, explores level by level (shortest path). DFS uses stack/recursion, explores depth first (memory efficient for deep graphs).",
        sampleAnswer:
          "BFS (Breadth-First Search) uses a queue and explores nodes level by level. Best for finding shortest paths in unweighted graphs. DFS (Depth-First Search) uses a stack (or recursion) and goes as deep as possible first. More memory-efficient for deep graphs and useful for topological sorting, cycle detection, and path finding.",
        evaluationCriteria: [
          "Data structure used",
          "Traversal pattern",
          "Use cases",
        ],
        points: 10,
        timeLimit: 180,
      },
      // HR
      {
        category: "hr",
        subcategory: "behavioral",
        difficulty: "medium",
        type: "open-ended",
        question:
          "Tell me about a time you had to learn a new technology quickly for a project.",
        sampleAnswer:
          "Use STAR: describe the project need, what you had to learn, the steps you took (courses, documentation, practice), and the successful outcome.",
        evaluationCriteria: [
          "STAR method",
          "Learning approach",
          "Positive outcome",
        ],
        points: 10,
        timeLimit: 180,
      },
      // Managerial
      {
        category: "managerial",
        subcategory: "leadership",
        difficulty: "medium",
        type: "open-ended",
        question:
          "How would you onboard a new team member to be productive quickly?",
        sampleAnswer:
          "Create a structured onboarding plan: documentation, buddy system, gradual task complexity, regular check-ins, clear expectations, and team introductions.",
        evaluationCriteria: [
          "Structured approach",
          "Support mechanisms",
          "Practical steps",
        ],
        points: 10,
        timeLimit: 180,
      },
    ];

    await Question.insertMany(sampleQuestions);
    console.log(`Seeded ${sampleQuestions.length} sample questions`);

    console.log("\n✅ Seed completed successfully!");
    console.log("Demo login: demo@example.com / demo1234\n");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();
