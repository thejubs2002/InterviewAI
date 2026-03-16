# 🎯 AI Mock Interview System

A production-ready, full-stack MERN application for AI-powered mock interview preparation. Practice aptitude, technical, HR, and managerial interviews with real-time AI feedback, live webcam monitoring, and speech-to-text answer input.

## ✨ Features

### Core Interview Modules

- **Aptitude Interviews** — Logical reasoning, quantitative analysis, verbal ability, data interpretation (MCQ format)
- **Technical Interviews** — DSA, system design, JavaScript, Python, Java, React, Node.js, databases
- **HR Interviews** — Behavioral questions, situational judgment, cultural fit, STAR method
- **Managerial Interviews** — Leadership scenarios, conflict resolution, strategic thinking, team management

### AI-Powered Experience

- Real-time question generation powered by **Google Gemini** (configurable model)
- Intelligent answer evaluation with detailed per-question feedback (shown on results page)
- Exact question count enforcement — always delivers exactly the number you select
- Fallback question banks ensure interviews work even without an AI API key
- Comprehensive end-of-interview results with scores, strengths, and improvement areas

### Media & Accessibility

- **Live webcam feed** during Technical, HR, and Managerial interviews (side-by-side layout)
- **Speech-to-text** answer input using the Web Speech API — speak your answers instead of typing
- One-click microphone mute/unmute with real-time audio track control
- Camera and microphone permissions requested on a dedicated pre-interview page
- Graceful fallback when browser doesn't support speech recognition (Chrome/Edge/Safari recommended)

### User Features

- Google OAuth one-tap authentication
- Personalized dashboard with performance analytics and charts
- Full interview history with detailed answer breakdowns
- Progress tracking across all four interview categories
- Global performance leaderboard
- Dark / Light mode toggle
- Profile customization (experience level, skills, target role)

## 🛠 Tech Stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts             |
| Backend  | Node.js, Express.js                                               |
| Database | MongoDB Atlas with Mongoose                                       |
| AI       | Google Gemini API (`GOOGLE_AI_MODEL`, default `gemini-2.0-flash`) |
| Auth     | Google OAuth 2.0 (`@react-oauth/google`), JWT                     |
| Media    | Web Speech API, `navigator.mediaDevices.getUserMedia`             |
| Design   | Apple + Anthropic inspired minimal dark/light UI                  |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google AI API Key — [Google AI Studio](https://aistudio.google.com/)
- Google OAuth Client ID — [Google Cloud Console](https://console.cloud.google.com/)

### Installation

```bash
# Enter project directory
cd interview

# Install all dependencies (root + client + server)
npm run install:all

# Setup environment variables
cp .env.example .env
# Fill in: MONGODB_URI, GOOGLE_AI_API_KEY, GOOGLE_AI_MODEL, GOOGLE_AI_MODELS, GOOGLE_CLIENT_ID, JWT_SECRET, VITE_GOOGLE_CLIENT_ID

# Seed the database with sample questions
npm run seed

# Start development (client + server concurrently)
npm run dev
```

### Environment Variables

| Variable                | Where  | Description                                      |
| ----------------------- | ------ | ------------------------------------------------ |
| `MONGODB_URI`           | server | MongoDB connection string                        |
| `GOOGLE_AI_API_KEY`     | server | Gemini API key                                   |
| `GOOGLE_AI_MODEL`       | server | Gemini model name (default: `gemini-2.0-flash`)  |
| `GOOGLE_AI_MODELS`      | server | Comma-separated model list for rotation/failover |
| `GOOGLE_CLIENT_ID`      | server | Google OAuth client ID                           |
| `JWT_SECRET`            | server | Secret for signing JWT tokens                    |
| `VITE_GOOGLE_CLIENT_ID` | client | Google OAuth client ID (Vite env)                |

### Google OAuth Setup

Add the following to your OAuth Client's **Authorized JavaScript origins** in Google Cloud Console:

```
http://localhost:5173
http://localhost:5174
http://localhost:5175
```

### Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

## 📁 Project Structure

```
├── client/                        # React frontend (Vite)
│   └── src/
│       ├── components/            # Reusable UI components
│       │   └── layout/            # Navbar, sidebar, Layout wrapper
│       ├── contexts/
│       │   ├── AuthContext.jsx    # User authentication state
│       │   ├── MediaContext.jsx   # Shared webcam/mic stream across pages
│       │   └── ThemeContext.jsx   # Dark/light mode
│       ├── hooks/
│       │   ├── useMediaPermissions.js  # Camera/mic permission hook
│       │   └── useSpeechToText.js      # Web Speech API wrapper
│       ├── pages/
│       │   ├── Landing.jsx
│       │   ├── Login.jsx / Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── InterviewSetup.jsx
│       │   ├── MediaPermissions.jsx   # Pre-interview camera/mic setup
│       │   ├── InterviewSession.jsx   # Core interview UI
│       │   ├── InterviewResult.jsx    # Post-interview results & feedback
│       │   ├── History.jsx
│       │   ├── Analytics.jsx
│       │   ├── Leaderboard.jsx
│       │   ├── Profile.jsx
│       │   └── Settings.jsx
│       └── services/              # Axios API service layer
│
├── server/                        # Express backend
│   ├── config/                    # Database connection
│   ├── controllers/               # Route handler logic
│   ├── middleware/                # Auth, error handling, rate limiting
│   ├── models/                    # Mongoose schemas (User, Interview, Question)
│   ├── routes/                    # API route definitions
│   ├── services/
│   │   └── aiService.js           # Gemini AI integration + fallback banks
│   ├── utils/                     # Helper utilities
│   └── validators/                # Input validation schemas
└── package.json                   # Root scripts (dev, build, seed)
```

## 🗺 Interview Flow

```
InterviewSetup → MediaPermissions → InterviewSession → InterviewResult
     (configure)    (camera/mic)      (live interview)    (scores & feedback)
```

1. **Setup** — Choose category, subcategory(ies), difficulty, question count
2. **Media Permissions** — Grant webcam + microphone access (or skip)
3. **Session** — Answer questions by typing or speaking; webcam visible for video categories
4. **Results** — Full breakdown with scores, AI feedback, strengths, and improvement areas

## 🔒 Security

- Helmet.js for HTTP security headers
- Rate limiting on all API routes
- Input sanitization with express-mongo-sanitize
- XSS protection
- CORS configured to allowed origins only
- JWT token authentication with expiry
- Password hashing with bcrypt (12 rounds)

## 🌐 Browser Support

| Feature        | Chrome | Edge | Safari | Firefox    |
| -------------- | ------ | ---- | ------ | ---------- |
| Webcam/Mic     | ✅     | ✅   | ✅     | ✅         |
| Speech-to-Text | ✅     | ✅   | ✅     | ⚠️ Limited |
| Full UI        | ✅     | ✅   | ✅     | ✅         |

> Speech-to-text uses the Web Speech API. Chrome and Edge provide the best experience.

## 📄 License

MIT
