import axios from 'axios';

// Use the correct env var name (must start with VITE_)
const API_BASE_URL = import.meta.env.VITE_API_URL;

// For local development fallback (optional but handy)
const fallbackUrl = 'http://localhost:3000'; // your local backend port

const api = axios.create({
  // Add /api to the base URL so your calls stay clean
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : `${fallbackUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization header from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors (token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optionally redirect to login page
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API - no need to add /api here anymore!
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default api;