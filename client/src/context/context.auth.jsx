import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('lis_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('lis_auth_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate session on load
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('lis_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (loginId, password, totp = null) => {
    try {
      const res = await api.post('/auth/login', { loginId, password, totp });
      if (res.data?.token && res.data?.user) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('lis_auth_token', res.data.token);
        localStorage.setItem('lis_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data?.Message || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.Message || err.message || 'Login connection failed',
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('lis_auth_token');
      localStorage.removeItem('lis_user');
    }
  };

  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (user.role === 'Super') return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        hasRole,
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
