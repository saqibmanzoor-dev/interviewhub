import api from '../api/axios';

export const authService = {
  // Register a new user
  async register(data) {
    const res = await api.post('/auth/register', data);
    if (res.data.token) {
      localStorage.setItem('postpilot_token', res.data.token);
    }
    return res.data;
  },

  // Log in user
  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    if (res.data.token) {
      localStorage.setItem('postpilot_token', res.data.token);
    }
    return res.data;
  },

  // Log out user
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('postpilot_token');
    }
  },

  // Get current authenticated user
  async getMe() {
    const res = await api.get('/auth/me');
    return res.data.user;
  },
};
