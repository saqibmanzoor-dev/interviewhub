import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT access token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('interviewhub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear and optionally redirect
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        // localStorage.removeItem('interviewhub_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
