import axios from 'axios';

// Create an authentication service
class AuthenticationService {
  static isAuthenticated() {
    const identifier = localStorage.getItem('nirapod_identifier');
    return !!identifier;
  }

  static getUserIdentifier() {
    return localStorage.getItem('nirapod_identifier');
  }

  static getUserRole() {
    return localStorage.getItem('categories') || 'normal';
  }

  static async validateSession() {
    try {
      const identifier = this.getUserIdentifier();
      if (!identifier) {
        throw new Error('No authentication identifier found');
      }

      const response = await axios.get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`);
      
      if (!response.data || !response.data.nid) {
        throw new Error('Invalid session');
      }

      // Update localStorage with fresh data
      localStorage.setItem('categories', response.data.categories || 'normal');
      
      return response.data;
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  static clearSession() {
    localStorage.removeItem('nirapod_identifier');
    localStorage.removeItem('categories');
  }

  static hasRole(requiredRole) {
    const userRole = this.getUserRole();
    
    if (!requiredRole) return true; // No specific role required
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    
    return userRole === requiredRole;
  }

  static canAccessAdminRoutes() {
    return this.hasRole('admin');
  }

  static canAccessPrivilegedRoutes() {
    return this.hasRole(['admin', 'police', 'fire', 'city', 'animal']);
  }

  static getDefaultRoute() {
    const role = this.getUserRole();
    
    if (role === 'admin') {
      return '/admin';
    } else if (['police', 'fire', 'city', 'animal'].includes(role)) {
      return '/complains';
    } else {
      return '/home';
    }
  }
}

export default AuthenticationService;
