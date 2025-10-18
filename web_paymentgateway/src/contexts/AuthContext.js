// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // Handle MFA required case
      if (data.requiresMFA) {
        // Store temporary data for MFA verification
        localStorage.setItem('pendingUserId', data.userId);
        throw new Error('MFA_REQUIRED');
      }

      // Regular login without MFA
      setUser(data.data.user);
      setToken(data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('token', data.data.token);
      
      return data; // Return success data
    } catch (error) {
      if (error.message === 'MFA_REQUIRED') {
        throw error; // Re-throw to handle in component
      }
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    return data;
  };

  const verifyMFA = async (userId, code) => {
    const response = await fetch('/api/auth/verify-mfa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, code }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    setUser(data.data.user);
    setToken(data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    localStorage.setItem('token', data.data.token);
    localStorage.removeItem('pendingUserId');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('pendingUserId');
  };

  const value = {
    user,
    token,
    login,
    register,
    verifyMFA,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};