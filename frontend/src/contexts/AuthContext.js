import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const identifier = localStorage.getItem('nirapod_identifier');
      
      if (!identifier) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`);
      
      if (response.data && response.data.nid) {
        setUser(response.data);
        setIsAuthenticated(true);
        localStorage.setItem('categories', response.data.categories || 'normal');
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, userData = null) => {
    try {
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('nirapod_identifier', userData.nid || identifier);
        localStorage.setItem('categories', userData.categories || 'normal');
      } else {
        // Fetch user data if not provided
        const response = await axios.get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`);
        if (response.data && response.data.nid) {
          setUser(response.data);
          setIsAuthenticated(true);
          localStorage.setItem('nirapod_identifier', response.data.nid);
          localStorage.setItem('categories', response.data.categories || 'normal');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('nirapod_identifier');
    localStorage.removeItem('categories');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
