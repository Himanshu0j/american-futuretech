import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('aft_admin_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (emailOrToken, passwordOrUser) => {
    if (typeof passwordOrUser === 'object' || (typeof emailOrToken === 'string' && emailOrToken.startsWith('ey'))) {
      const tokenVal = emailOrToken;
      const userVal = passwordOrUser;
      localStorage.setItem('aft_admin_token', tokenVal);
      localStorage.setItem('token', tokenVal);
      setToken(tokenVal);
      setUser(userVal);
      return { success: true, token: tokenVal, user: userVal };
    }
    const res = await api.post('/auth/login', { email: emailOrToken, password: passwordOrUser });
    if (res.data.success) {
      localStorage.setItem('aft_admin_token', res.data.token);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('aft_admin_token');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        isSuperAdmin: user?.role === 'SuperAdmin' || user?.role === 'SUPERADMIN',
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
