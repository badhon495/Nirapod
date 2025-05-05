import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';
import logo from '../image/logo.png';

function Navbar() {
  const categories = localStorage.getItem('categories');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const userNid = localStorage.getItem('nirapod_identifier');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userNid) {
      fetchUnreadCount();
      // Check for new notifications every minute
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [userNid]);

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(`/api/notifications/user/${userNid}/unread-count`);
      setUnreadCount(res.data);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nirapod_identifier');
    localStorage.removeItem('categories');
    navigate('/login');
  };

  if (categories === 'police') {
    return (
      <nav className="navbar-custom">
        <div className="navbar-logo-box">
          <img src={logo} alt="Nirapod Logo" className="navbar-logo-img" />
        </div>
        <div className="navbar-btn-group">
          <a href="/home" className="navbar-btn">Home</a>
          <a href="/complains" className="navbar-btn">Complains</a>
          <a href="/investigate" className="navbar-btn">Investigate</a>
          <div className="navbar-profile-dropdown" ref={dropdownRef}>
            <button className="navbar-btn" onClick={() => setDropdownOpen(v => !v)}>
              Profile <span style={{marginLeft: 6}}>▼</span>
            </button>
            {dropdownOpen && (
              <div className="navbar-dropdown-menu">
                <Link to="/profile" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Update Profile</Link>
                <Link to="/my-complains" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Your Complains</Link>
                <Link to="/notifications" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Notification</Link>
                <button className="navbar-dropdown-item" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  }
  return (
    <nav className="navbar-custom">
      <div className="navbar-logo-box">
        <img src={logo} alt="Nirapod Logo" className="navbar-logo-img" />
      </div>
      <div className="navbar-btn-group">
        <Link to="/home" className="navbar-btn">Home</Link>
        <Link to="/CreateComplain" className="navbar-btn">Complain</Link>
        <Link to="/tracker" className="navbar-btn">Tracker</Link>
        <div className="navbar-profile-dropdown" ref={dropdownRef}>
          <button className="navbar-btn" onClick={() => setDropdownOpen(v => !v)}>
            Profile <span style={{marginLeft: 6}}>▼</span>
          </button>
          {dropdownOpen && (
            <div className="navbar-dropdown-menu">
              <Link to="/profile" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Update Profile</Link>
              <Link to="/Complain" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Your Complains</Link>
              <Link to="/notifications" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                Notifications
                {unreadCount > 0 && (
                  <span className="notification-count-inline">{unreadCount}</span>
                )}
              </Link>
              <Link to="/my-complains" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Your Complains</Link>
              <Link to="/notifications" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Notification</Link>
              <button className="navbar-dropdown-item" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
