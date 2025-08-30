import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  ChevronDown, 
  Home, 
  MessageSquare, 
  Search, 
  Settings, 
  User, 
  LogOut,
  FileText,
  Shield,
  Flame,
  Building,
  PawPrint,
  Plus
} from 'lucide-react';
import logo from '../image/logo.png';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Navbar.css';
import { useAuth } from '../contexts/AuthContext';

// Memoized components for better performance
const NotificationBadge = React.memo(({ count }) => {
  if (count === 0) return null;
  
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="notification-badge"
    >
      {count > 9 ? '9+' : count}
    </motion.span>
  );
});

const NavButton = React.memo(({ to, icon: Icon, children, variant = 'default' }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to}
      className={`navbar-btn ${isActive ? 'active' : ''} hover-lift`}
    >
      <Icon className="w-4 h-4" />
      <span className="navbar-btn-text">{children}</span>
    </Link>
  );
});

const DropdownItem = React.memo(({ to, icon: Icon, children, badge, onClick }) => {
  const handleClick = useCallback((e) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  }, [onClick]);

  return (
    <Link 
      to={to || '#'} 
      className="dropdown-item hover-lift"
      onClick={handleClick}
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
      {badge > 0 && <NotificationBadge count={badge} />}
    </Link>
  );
});

function Navbar() {
  const { user, logout } = useAuth();
  const categories = user?.categories || localStorage.getItem('categories');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState(user?.name || '');
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Memoized category functions
  const getCategoryIcon = useMemo(() => (category) => {
    switch(category) {
      case 'police': return <Shield className="w-4 h-4" />;
      case 'fire': return <Flame className="w-4 h-4" />;
      case 'city': return <Building className="w-4 h-4" />;
      case 'animal': return <PawPrint className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  }, []);

  const getCategoryColor = useMemo(() => (category) => {
    switch(category) {
      case 'police': return 'from-blue-500 to-blue-600';
      case 'fire': return 'from-red-500 to-red-600';
      case 'city': return 'from-green-500 to-green-600';
      case 'animal': return 'from-purple-500 to-purple-600';
      case 'admin': return 'from-yellow-500 to-yellow-600';
      default: return 'from-gray-500 to-gray-600';
    }
  }, []);

  // Optimized event handlers
  const handleLogout = useCallback(() => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  }, [logout, navigate]);

  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  }, []);

  // Optimized user name fetching
  const fetchUserName = useCallback(async () => {
    const identifier = localStorage.getItem('nirapod_identifier');
    if (!identifier || user?.name) return;
    
    try {
      const res = await axios.get(`/api/user/by-identifier?value=${identifier}`);
      setUserName(res.data.name);
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  }, [user?.name]);

  // Optimized notification count fetching
  const fetchUnreadCount = useCallback(async () => {
    const identifier = localStorage.getItem('nirapod_identifier');
    if (!identifier) return;
    
    try {
      const res = await axios.get(`/api/notifications/user/${identifier}/unread-count`);
      setUnreadCount(res.data);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, []);

  // Effects with optimized dependencies
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    fetchUserName();
    fetchUnreadCount();
  }, [fetchUserName, fetchUnreadCount]);

  useEffect(() => {
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Memoized navigation items
  const navigationItems = useMemo(() => {
    if (categories === 'admin') {
      return (
        <>
          <NavButton to="/admin" icon={Settings}>Dashboard</NavButton>
          <NavButton to="/reports" icon={FileText}>Reports</NavButton>
          <NavButton to="/add-admin" icon={Plus}>Add Admin</NavButton>
        </>
      );
    } else if (categories && ['police', 'fire', 'city', 'animal'].includes(categories)) {
      return (
        <>
          <NavButton to="/complains" icon={FileText}>Complaints</NavButton>
          {categories === 'police' && (
            <NavButton to="/investigate" icon={Search}>Investigate</NavButton>
          )}
        </>
      );
    } else {
      return (
        <>
          <NavButton to="/home" icon={Home}>Home</NavButton>
          <NavButton to="/CreateComplain" icon={Plus}>Report Issue</NavButton>
          <NavButton to="/tracker" icon={Search}>Track</NavButton>
        </>
      );
    }
  }, [categories]);

  // Optimized dropdown animation variants
  const dropdownVariants = useMemo(() => ({
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 }
  }), []);

  const ProfileDropdown = useMemo(() => (
    <AnimatePresence>
      {dropdownOpen && (
        <motion.div
          variants={dropdownVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="dropdown-menu gpu-accelerated"
        >
          <div className="dropdown-header">
            <div className="dropdown-user-info">
              <div className={`dropdown-avatar bg-gradient-to-r ${getCategoryColor(categories)}`}>
                {getCategoryIcon(categories)}
              </div>
              <div className="dropdown-user-details">
                <h4 className="optimized-text">{userName}</h4>
                <p className="optimized-text">{categories || 'User'}</p>
              </div>
            </div>
          </div>
          
          <div className="dropdown-section">
            <DropdownItem to="/profile" icon={User}>Profile Settings</DropdownItem>
            <DropdownItem to="/notifications" icon={Bell} badge={unreadCount}>
              Notifications
            </DropdownItem>
            <DropdownItem to="/livechat" icon={MessageSquare}>Live Chat</DropdownItem>
          </div>
          
          <div className="dropdown-divider"></div>
          
          <div className="dropdown-section">
            <DropdownItem 
              icon={LogOut}
              onClick={handleLogout}
            >
              Logout
            </DropdownItem>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  ), [dropdownOpen, userName, categories, unreadCount, handleLogout, getCategoryIcon, getCategoryColor, dropdownVariants]);

  return (
    <nav className="navbar gpu-accelerated optimized-container">
      <div className="navbar-content">
        {/* Logo */}
        <Link to="/home" className="navbar-logo hover-scale">
          <img src={logo} alt="Nirapod" className="logo-img" />
          <span className="logo-text optimized-text">Nirapod</span>
        </Link>

        {/* Navigation Items */}
        <div className="navbar-nav">
          {navigationItems}
        </div>

        {/* Profile Section */}
        <div className="navbar-profile-section" ref={dropdownRef}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="profile-button hover-lift"
          >
            <div className={`profile-avatar bg-gradient-to-r ${getCategoryColor(categories)}`}>
              {getCategoryIcon(categories)}
            </div>
            <ChevronDown className={`chevron ${dropdownOpen ? 'open' : ''}`} />
            <NotificationBadge count={unreadCount} />
          </motion.button>

          {ProfileDropdown}
        </div>
      </div>
    </nav>
  );
}

export default React.memo(Navbar);
