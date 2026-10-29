import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT access token to every outgoing request
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('interviewhub_token');
  if (!token || token === 'null' || token === 'undefined') {
    // If user info exists in localStorage, generate role-aligned demo token
    try {
      const storedUserStr = localStorage.getItem('interviewhub_user');
      const u = storedUserStr ? JSON.parse(storedUserStr) : null;
      if (u) {
        token = `demo_token_${u?.role || 'candidate'}_${Date.now()}`;
        localStorage.setItem('interviewhub_token', token);
      }
    } catch (e) {}
  }

  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => {
    // If a serverless rewrite or SPA fallback returned HTML instead of JSON for an API route
    if (
      typeof response.data === 'string' &&
      (response.data.includes('<!DOCTYPE html>') || response.data.includes('<!doctype html>'))
    ) {
      const err = new Error('API route returned HTML document instead of JSON. Ensure Vercel root directory is set to project root with api/index.js handler.');
      err.response = { status: 404, data: { success: false, message: err.message } };
      return Promise.reject(err);
    }
    return response;
  },
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
