import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore authenticated session on page load
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await authService.getMe();
      setUser(userData);
      setAuthError(null);
    } catch (err) {
      setUser(null);
      // Suppress 401 error on initial check as it simply means user is not logged in
      if (err.status !== 401) {
        setAuthError(err.customMessage || 'Failed to authenticate');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login action
  const login = async (credentials) => {
    setAuthError(null);
    try {
      const res = await authService.login(credentials);
      setUser(res.user);
      return res;
    } catch (err) {
      setAuthError(err.customMessage || 'Login failed');
      throw err;
    }
  };

  // Register action
  const register = async (userData) => {
    setAuthError(null);
    try {
      const res = await authService.register(userData);
      setUser(res.user);
      return res;
    } catch (err) {
      setAuthError(err.customMessage || 'Registration failed');
      throw err;
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
