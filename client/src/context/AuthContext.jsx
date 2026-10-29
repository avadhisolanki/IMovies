import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('imovies_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('imovies_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('imovies_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [token]);

  const login = async (email, password, role = 'user') => {
    try {
      const res = await api.post('/auth/login', { email, password, role });
      if (res.data && res.data.success) {
        const { token: newToken, user: userData } = res.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('imovies_token', newToken);
        localStorage.setItem('imovies_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err) {
      if (err.response?.data?.isUnverified) {
        return {
          success: false,
          isUnverified: true,
          email: err.response.data.email,
          message: err.response.data.message,
        };
      }
      return { success: false, message: err.response?.data?.message || err.message || 'Login failed' };
    }
  };

  const register = async (username, email, password, role = 'user') => {
    const endpoint = role === 'admin' ? '/auth/admin/register' : '/auth/register';
    const res = await api.post(endpoint, { username, email, password });
    if (res.data && res.data.success) {
      // If user requires OTP verification
      if (res.data.requiresVerification) {
        return {
          success: true,
          requiresVerification: true,
          email: res.data.email,
          message: res.data.message,
        };
      }

      // Admin or direct login
      const { token: newToken, user: userData } = res.data;
      if (newToken && userData) {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('imovies_token', newToken);
        localStorage.setItem('imovies_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
    }
    return { success: false, message: res.data?.message || 'Registration failed' };
  };

  const verifyOTP = async (email, otp, verificationToken) => {
    const res = await api.post('/auth/verify-otp', { email, otp, token: verificationToken });
    if (res.data && res.data.success) {
      const { token: newToken, user: userData } = res.data;
      if (newToken && userData) {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('imovies_token', newToken);
        localStorage.setItem('imovies_user', JSON.stringify(userData));
      }
      return { success: true, user: userData, message: res.data.message };
    }
    return { success: false, message: res.data?.message || 'Verification failed' };
  };

  const resendOTP = async (email) => {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (email, otp, resetToken, newPassword) => {
    const res = await api.post('/auth/reset-password', {
      email,
      otp,
      token: resetToken,
      newPassword,
    });
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('imovies_token');
    localStorage.removeItem('imovies_user');
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyOTP,
        resendOTP,
        forgotPassword,
        resetPassword,
        logout,
        isAdmin,
        isAuthenticated,
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
