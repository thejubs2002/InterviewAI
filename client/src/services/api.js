import axios from "axios";

const ENV_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_BASE = (ENV_API_BASE_URL || "/api").replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register" &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Auth
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  googleAuth: (data) => api.post("/auth/google", data),
  getMe: () => api.get("/auth/me"),
};

// Interviews
export const interviewAPI = {
  start: (data) => api.post("/interviews/start", data),
  submitAnswer: (id, data) => api.post(`/interviews/${id}/answer`, data),
  complete: (id) => api.post(`/interviews/${id}/complete`),
  abandon: (id) => api.post(`/interviews/${id}/abandon`),
  getById: (id) => api.get(`/interviews/${id}`),
  getAll: (params) => api.get("/interviews", { params }),
};

// Questions
export const questionAPI = {
  getCategories: () => api.get("/questions/categories"),
  getAll: (params) => api.get("/questions", { params }),
  getById: (id) => api.get(`/questions/${id}`),
};

// Users
export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  changePassword: (data) => api.put("/users/password", data),
  deleteAccount: () => api.delete("/users/account"),
};

// Analytics
export const analyticsAPI = {
  get: () => api.get("/analytics"),
};

// Leaderboard
export const leaderboardAPI = {
  get: (params) => api.get("/leaderboard", { params }),
};

export default api;
