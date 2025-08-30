import { useState, useEffect } from 'react';
import AuthenticationService from '../services/AuthenticationService';

export const useAuthentication = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (AuthenticationService.isAuthenticated()) {
        const userData = await AuthenticationService.validateSession();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, userData) => {
    try {
      localStorage.setItem('nirapod_identifier', userData.nid || identifier);
      localStorage.setItem('categories', userData.categories || 'normal');
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    AuthenticationService.clearSession();
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    checkAuthStatus
  };
};
