import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthenticationService from '../services/AuthenticationService';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      // Quick check for authentication identifier
      if (!AuthenticationService.isAuthenticated()) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Validate session with backend
      const userData = await AuthenticationService.validateSession();
      
      if (userData && userData.nid) {
        setIsAuthenticated(true);
        setUserRole(userData.categories || 'normal');
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    const defaultRoute = AuthenticationService.getDefaultRoute();
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;
