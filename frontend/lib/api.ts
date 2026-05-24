import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://psychometric-backend-production.up.railway.app/api/v1';

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use(cfg => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('psy_token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('psy_token');
      localStorage.removeItem('psy_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const questionsApi = {
  categories: () => api.get('/questions/categories'),
  diagnostic: () => api.get('/questions/diagnostic'),
  practice: (params: { category?: string; limit?: number; mode?: string }) =>
    api.get('/questions', { params }),
};

export const attemptsApi = {
  submit: (data: { questionId: string; selectedOption: string; timeTaken: number; confidence?: number; mode: string; sessionId?: string }) =>
    api.post('/attempts', data),
  stats: () => api.get('/attempts/stats'),
  heatmap: () => api.get('/attempts/heatmap'),
};

export const mockExamsApi = {
  start: (data: { categoryIds: string[]; questionCount: number }) =>
    api.post('/mock-exams/start', data),
  submit: (examId: string, answers: unknown[]) =>
    api.post(`/mock-exams/${examId}/submit`, { answers }),
  history: () => api.get('/mock-exams/history'),
  get: (id: string) => api.get(`/mock-exams/${id}`),
};

export const profileApi = {
  get: () => api.get('/profile'),
  studyPlan: () => api.get('/profile/study-plan'),
  progress: (days = 30) => api.get('/profile/progress', { params: { days } }),
};

export const bookmarksApi = {
  list: () => api.get('/bookmarks'),
  add: (questionId: string, note?: string) => api.post('/bookmarks', { questionId, note }),
  remove: (questionId: string) => api.delete(`/bookmarks/${questionId}`),
};
