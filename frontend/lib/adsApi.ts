import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || '';

// Advertiser-portal axios instance (uses separate JWT stored in localStorage)
const adAxios = axios.create({ baseURL: `${BASE}/api/v1/ads` });

adAxios.interceptors.request.use(cfg => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adToken');
    if (token) cfg.headers!.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

export const advertiserApi = {
  register: (data: { companyName: string; contactName: string; email: string; password: string; phone?: string; website?: string }) =>
    adAxios.post('/advertiser/register', data),
  login: (email: string, password: string) =>
    adAxios.post('/advertiser/login', { email, password }),
  me: () => adAxios.get('/advertiser/me'),
  myAds: () => adAxios.get('/advertiser/ads'),
  createAd: (data: object) => adAxios.post('/advertiser/ads', data),
  updateAd: (id: string, data: object) => adAxios.patch(`/advertiser/ads/${id}`, data),
  submitAd: (id: string) => adAxios.post(`/advertiser/ads/${id}/submit`),
  pauseAd: (id: string) => adAxios.post(`/advertiser/ads/${id}/pause`),
  adStats: (id: string) => adAxios.get(`/advertiser/ads/${id}/stats`),
  payments: () => adAxios.get('/advertiser/payments'),
  submitPayment: (data: object) => adAxios.post('/advertiser/payments', data),
};

// Public ad serving (no auth needed)
const pubAxios = axios.create({ baseURL: `${BASE}/api/v1/ads` });

export const adsPublicApi = {
  serve: (slot: string, page?: string) =>
    pubAxios.get(`/serve?slot=${slot}${page ? `&page=${encodeURIComponent(page)}` : ''}`),
  click: (id: string, page?: string) =>
    pubAxios.post(`/click/${id}`, { page }),
};

// Admin ads (uses normal user JWT)
const adminAdAxios = axios.create({ baseURL: `${BASE}/api/v1/ads` });

adminAdAxios.interceptors.request.use(cfg => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('psy_token');
    if (token) cfg.headers!.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

export const adminAdsApi = {
  pending: () => adminAdAxios.get('/admin/pending'),
  all: () => adminAdAxios.get('/admin/all'),
  approve: (id: string) => adminAdAxios.post(`/admin/ads/${id}/approve`),
  reject: (id: string, reason: string) => adminAdAxios.post(`/admin/ads/${id}/reject`, { reason }),
  advertisers: () => adminAdAxios.get('/admin/advertisers'),
  verifyAdvertiser: (id: string) => adminAdAxios.post(`/admin/advertisers/${id}/verify`),
  payments: () => adminAdAxios.get('/admin/payments'),
  confirmPayment: (id: string) => adminAdAxios.post(`/admin/payments/${id}/confirm`),
  stats: () => adminAdAxios.get('/admin/stats'),
};
