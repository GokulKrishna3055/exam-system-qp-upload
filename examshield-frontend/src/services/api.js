import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('examshield_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('examshield_token');
      localStorage.removeItem('examshield_user');
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ── Upload ───────────────────────────────────────────────────
export const uploadApi = {
  uploadPaper: (formData, onProgress) =>
    api.post('/upload-question-paper', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
      timeout: 120000,
    }),
};

// ── Papers ───────────────────────────────────────────────────
export const papersApi = {
  list: () => api.get('/question-papers'),
  get: (id) => api.get(`/question-paper/${id}`),
  getPaperFileUrl: (id) => `/api/question-paper/${id}/file`,
  unlock: (quizId, key) => api.post('/unlock', { quizId, key }),
  relock: (quizId) => api.post('/relock', { quizId }),
  delete: (id) => api.delete(`/question-paper/${id}`),
};

// ── Exam Status ───────────────────────────────────────────────
export const examApi = {
  status: () => api.get('/exam-status'),
  statusById: (id) => api.get(`/exam-status/${id}`),
  startExam: (quizId) => api.post('/start-exam', { quizId }),
};

export default api;
