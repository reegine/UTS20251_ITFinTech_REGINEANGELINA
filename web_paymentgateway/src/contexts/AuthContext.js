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

      setUser(data.data.user);
      setToken(data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('token', data.data.token);
      
      return data; 
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const initiateMFALogin = async (email) => {
    const response = await fetch('/api/auth/initiate-mfa-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    localStorage.setItem('pendingUserId', data.userId);
    
    return data;
  };

  const sendMFACode = async (userId) => {
    const response = await fetch('/api/auth/resend-mfa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    return data;
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
    initiateMFALogin,
    register,
    verifyMFA,
    sendMFACode,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};