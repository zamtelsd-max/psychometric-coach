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
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }),
};

export const enterpriseApi = {
  flags: () => api.get('/enterprise/flags'),
  passports: () => api.get('/enterprise/passports'),
  buyPassport: (slug: string, email: string, providerRef?: string) => api.post(`/enterprise/passports/${slug}/purchase`, { email, providerRef }),
  checkoutPassport: (slug: string, email: string, phone: string, operator: string) => api.post(`/enterprise/passports/${slug}/checkout`, { email, phone, operator }),
  passportStatus: (ref: string) => api.get(`/enterprise/passports/status/${ref}`),
  dodoPassport: (slug: string, email: string) => api.post(`/enterprise/passports/${slug}/dodo-checkout`, { email }),
  dodoPremium: () => api.post('/enterprise/premium/dodo-checkout', {}),
  analyzeResume: (resumeText: string, jobDescription: string) => api.post('/enterprise/matcher/analyze', { resumeText, jobDescription }),
  unlockMatch: (matchId: string, email: string) => api.post(`/enterprise/matcher/${matchId}/unlock`, { email }),
  enqueueAudit: (sessionId?: string, recordingRef?: string) => api.post('/enterprise/audit/enqueue', { sessionId, recordingRef }),
};

export const screeningApi = {
  createAssessment: (data: any) => api.post('/screening/assessments', data),
  listAssessments: () => api.get('/screening/assessments'),
  report: (id: string) => api.get(`/screening/assessments/${id}/report`),
  candidate: (id: string, t: string) => api.get(`/screening/candidate/${id}?t=${encodeURIComponent(t)}`),
  start: (id: string, t: string) => api.post(`/screening/candidate/${id}/start`, { t }),
  answer: (id: string, t: string, questionId: string, answer: string) => api.post(`/screening/candidate/${id}/answer`, { t, questionId, answer }),
  submit: (id: string, t: string) => api.post(`/screening/candidate/${id}/submit`, { t }),
  logViolation: (id: string, t: string, type: string, detail?: string) => api.post(`/screening/${id}/log-violation`, { t, type, detail }),
};

export const questionsApi = {
  categories: () => api.get('/questions/categories'),
  diagnostic: () => api.get('/questions/diagnostic'),
  practice: (params: { category?: string; limit?: number; mode?: string }) =>
    api.get('/questions', { params }),
};

export const attemptsApi = {
  submit: (data: { questionId: string; selectedOption: string; timeTaken: number; confidence?: number; mode: 'DIAGNOSTIC' | 'PRACTICE' | 'TIMED' | 'MOCK' | 'REVIEW'; sessionId?: string }) =>
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

export const interviewApi = {
  panel: () => api.get('/interview/panel'),
  start: (data: { jobFamily: string; tier: string }) => api.post('/interview/start', data),
  answer: (sessionId: string, data: { transcript: string; questionText: string; expectedKeywords?: string }) =>
    api.post(`/interview/${sessionId}/answer`, data),
  sessions: () => api.get('/interview/sessions'),
  session: (id: string) => api.get(`/interview/sessions/${id}`),
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
