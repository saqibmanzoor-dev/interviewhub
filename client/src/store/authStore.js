import { create } from 'zustand';
import api from '../services/api.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('interviewhub_token') || null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initAuth: async () => {
    const token = localStorage.getItem('interviewhub_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      set({
        user: res.data.data.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      console.warn('Auth token invalid or expired:', err.message);
      localStorage.removeItem('interviewhub_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      localStorage.setItem('interviewhub_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  demoLogin: async (role = 'candidate') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/demo-login', { role });
      const { token, user } = res.data.data;
      localStorage.setItem('interviewhub_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Demo login failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  googleLogin: async ({ email, name, role = 'candidate' }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/google', { email, name, role });
      const { token, user } = res.data.data;
      localStorage.setItem('interviewhub_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Google sign in failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', userData);
      const { token, user } = res.data.data;
      localStorage.setItem('interviewhub_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  setTokenAndUser: (token, user) => {
    localStorage.setItem('interviewhub_token', token);
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('interviewhub_token');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
