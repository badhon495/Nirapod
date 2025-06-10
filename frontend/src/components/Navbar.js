import React, { useState, useRef, useEffect } from 'react';
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

function Navbar() {
  const categories = localStorage.getItem('categories');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUserName = async () => {
      const identifier = localStorage.getItem('nirapod_identifier');
      if (!identifier) return;
      try {
        const res = await axios.get(`/api/user/by-identifier?value=${identifier}`);
        setUserName(res.data.name);
      } catch (err) {
        console.error('Failed to fetch user name:', err);
      }
    };
    fetchUserName();

    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
      const identifier = localStorage.getItem('nirapod_identifier');
      if (!identifier) return;
      try {
        const res = await axios.get(`/api/notifications/user/${identifier}/unread-count`);
        setUnreadCount(res.data);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('nirapod_identifier');
    localStorage.removeItem('categories');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'police': return <Shield className="w-4 h-4" />;
      case 'fire': return <Flame className="w-4 h-4" />;
      case 'city': return <Building className="w-4 h-4" />;
      case 'animal': return <PawPrint className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'police': return 'from-blue-500 to-blue-600';
      case 'fire': return 'from-red-500 to-red-600';
      case 'city': return 'from-green-500 to-green-600';
      case 'animal': return 'from-purple-500 to-purple-600';
      case 'admin': return 'from-gray-700 to-gray-800';
      default: return 'from-indigo-500 to-indigo-600';
    }
  };

  const NotificationBadge = () => (
    <div className="relative">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.span>
      )}
    </div>
  );

  const NavButton = ({ to, icon: Icon, children, variant = 'default' }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link 
        to={to}
        className={`navbar-btn ${isActive ? 'active' : ''}`}
      >
        <Icon className="w-4 h-4" />
        {children}
      </Link>
    );
  };

  const ProfileDropdown = () => (
    <AnimatePresence>
      {dropdownOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="dropdown-menu fadeIn"
        >
          <div className="dropdown-header">
            <div className="dropdown-user-info">
              <div className={`dropdown-avatar bg-gradient-to-r ${getCategoryColor(categories)}`}>
                {getCategoryIcon(categories)}
              </div>
              <div className="dropdown-user-details">
                <h4>{userName}</h4>
                <p>{categories || 'User'}</p>
              </div>
            </div>
          </div>
          
          <div className="dropdown-section">
            <DropdownItem to="/profile" icon={User}>Profile Settings</DropdownItem>
            <DropdownItem to="/notifications" icon={Bell} badge={unreadCount}>
              Notifications
            </DropdownItem>
            <DropdownItem to="/livechat" icon={MessageSquare}>Live Chat</DropdownItem>
            {!categories || (!['admin', 'police', 'fire', 'city', 'animal'].includes(categories)) ? (
              <DropdownItem to="/my-complains" icon={FileText}>My Complaints</DropdownItem>
            ) : null}
          </div>
          
          <div className="dropdown-section">
            <button
              onClick={handleLogout}
              className="dropdown-item logout-item"
            >
              <div className="dropdown-item-content">
                <LogOut className="w-4 h-4" />
                Logout
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const DropdownItem = ({ to, icon: Icon, children, badge }) => (
    <Link
      to={to}
      onClick={() => setDropdownOpen(false)}
      className="dropdown-item"
    >
      <div className="dropdown-item-content">
        <Icon className="w-4 h-4" />
        {children}
      </div>
      {badge > 0 && (
        <span className="dropdown-badge">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );

  const renderNavbar = () => {
    const baseNavbar = (
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="navbar-custom"
      >
        <div className="navbar-logo-box" onClick={() => navigate('/home')}>
          <img src={logo} alt="Nirapod" className="navbar-logo-img" />
          <span className="gradient-text">Nirapod</span>
        </div>

        {/* Navigation Links */}
        <div className="navbar-btn-group">
          <NavButton to="/home" icon={Home}>Home</NavButton>
          
          {categories === 'admin' ? (
            <>
              <NavButton to="/reports" icon={FileText}>Reports</NavButton>
              <NavButton to="/investigate" icon={Search}>Investigate</NavButton>
            </>
          ) : categories && ['police', 'fire', 'city', 'animal'].includes(categories) ? (
            <>
              <NavButton to="/complains" icon={FileText}>Complaints</NavButton>
              {categories === 'police' && (
                <NavButton to="/investigate" icon={Search}>Investigate</NavButton>
              )}
            </>
          ) : (
            <>
              <NavButton to="/CreateComplain" icon={Plus}>Report Issue</NavButton>
              <NavButton to="/tracker" icon={Search}>Track</NavButton>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="navbar-profile-section" ref={dropdownRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="profile-button"
          >
            <div className={`profile-avatar bg-gradient-to-r ${getCategoryColor(categories)}`}>
              {getCategoryIcon(categories)}
            </div>
            <span className="profile-name">{userName}</span>
            <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            {unreadCount > 0 && (
              <div className="notification-badge">
                <div className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</div>
              </div>
            )}
          </motion.button>
          
          <ProfileDropdown />
        </div>
      </motion.nav>
    );

    return baseNavbar;
  };

  return renderNavbar();
}

export default Navbar;
