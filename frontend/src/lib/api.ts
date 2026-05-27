import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sentinel_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sentinel_token');
      localStorage.removeItem('sentinel_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const monitorsApi = {
  list: () => api.get('/monitors'),
  get: (id: string) => api.get(`/monitors/${id}`),
  create: (data: any) => api.post('/monitors', data),
  update: (id: string, data: any) => api.patch(`/monitors/${id}`, data),
  delete: (id: string) => api.delete(`/monitors/${id}`),
  checks: (id: string, hours = 24) => api.get(`/monitors/${id}/checks?hours=${hours}`),
  incidents: (id: string) => api.get(`/monitors/${id}/incidents`),
  metrics: (id: string) => api.get(`/monitors/${id}/metrics`),
};
