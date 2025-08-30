import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthenticationService from '../services/AuthenticationService';

const RoleBasedRoute = ({ children, allowedRoles, redirectTo = null }) => {
  const userRole = AuthenticationService.getUserRole();

  if (!AuthenticationService.hasRole(allowedRoles)) {
    // Redirect to specific route or default route based on user's role
    const redirectRoute = redirectTo || AuthenticationService.getDefaultRoute();
    return <Navigate to={redirectRoute} replace />;
  }

  return children;
};

export default RoleBasedRoute;
