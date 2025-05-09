import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../image/logo.png';
import './Navbar.css';
import axios from 'axios';

function Navbar() {
  const categories = localStorage.getItem('categories');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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
    navigate('/login');
  };

  const NotificationLink = () => (
    <Link 
      to="/notifications" 
      className="navbar-dropdown-item" 
      onClick={() => setDropdownOpen(false)}
      style={{ position: 'relative' }}
    >
      Notification
      {unreadCount > 0 && (
        <span className="navbar-notification-badge">
          {unreadCount}
        </span>
      )}
    </Link>
  );

  if (categories === 'police') {
    return (
      <nav className="navbar-custom">
        <div className="navbar-logo-box" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Nirapod Logo" className="navbar-logo-img" />
        </div>
        <div className="navbar-btn-group">
          <a href="/home" className="navbar-btn">Home</a>
          <a href="/complains" className="navbar-btn">Complains</a>
          <a href="/investigate" className="navbar-btn">Investigate</a>
          <div className="navbar-profile-dropdown" ref={dropdownRef}>
            <button className="navbar-btn" onClick={() => setDropdownOpen(v => !v)}>
              Profile {unreadCount > 0 && <span className="navbar-notification-dot"></span>} <span style={{marginLeft: 6}}>▼</span>
            </button>
            {dropdownOpen && (
              <div className="navbar-dropdown-menu">
                <Link to="/profile" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Update Profile</Link>
                <Link to="/my-complains" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Your Complains</Link>
                <NotificationLink />
                <Link to="/livechat" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Live Chat</Link>
                <button className="navbar-dropdown-item" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
        <div className="navbar-welcome-msg">Welcome Officer, {userName}</div>
      </nav>
    );
    
  } 
  
  
  else if (categories === 'fire') {
    return (
      <nav className="navbar-custom">
        <div className="navbar-logo-box" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Nirapod Logo" className="navbar-logo-img" />
        </div>
        <div className="navbar-btn-group">
          <a href="/home" className="navbar-btn">Home</a>
          <a href="/complains" className="navbar-btn">Complains</a>
          {/* <a href=# className="navbar-btn"></a> */}
          <div className="navbar-profile-dropdown" ref={dropdownRef}>
            <button className="navbar-btn" onClick={() => setDropdownOpen(v => !v)}>
              Profile {unreadCount > 0 && <span className="navbar-notification-dot"></span>} <span style={{marginLeft: 6}}>▼</span>
            </button>
            {dropdownOpen && (
              <div className="navbar-dropdown-menu">
                <Link to="/profile" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Update Profile</Link>
                {/* <Link to="/my-complains" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Your Complains</Link> */}
                <NotificationLink />
                <Link to="/livechat" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Live Chat</Link>
                <button className="navbar-dropdown-item" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
        <div className="navbar-welcome-msg">Welcome Fire-Fighter, {userName}</div>
      </nav>
    );
  } 
  
  else if (categories === 'animal') {
    return (
      <nav className="navbar-custom">
        <div className="navbar-logo-box" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Nirapod Logo" className="navbar-logo-img" />
        </div>
        <div className="navbar-btn-group">
          <a href="/home" className="navbar-btn">Home</a>
          <a href="/complains" className="navbar-btn">Complains</a>
          <div className="navbar-profile-dropdown" ref={dropdownRef}>
            <button className="navbar-btn" onClick={() => setDropdownOpen(v => !v)}>
              Profile {unreadCount > 0 && <span className="navbar-notification-dot"></span>} <span style={{marginLeft: 6}}>▼</span>
            </button>
            {dropdownOpen && (
              <div className="navbar-dropdown-menu">
                <Link to="/profile" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Update Profile</Link>
                {/* <Link to="/my-complains" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Your Complains</Link> */}
                <NotificationLink />
                <Link to="/livechat" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Live Chat</Link>
                <button className="navbar-dropdown-item" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
        <div className="navbar-welcome-msg">Welcome Animal-Rescuer, {userName}</div>
      </nav>
    );
  }

  else if (categories === 'city') {
    return (
      <nav className="navbar-custom">
        <div className="navbar-logo-box" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Nirapod Logo" className="navbar-logo-img" />
        </div>
        <div className="navbar-btn-group">
          <a href="/home" className="navbar-btn">Home</a>
          <a href="/complains" className="navbar-btn">Complains</a>
          <div className="navbar-profile-dropdown" ref={dropdownRef}>
            <button className="navbar-btn" onClick={() => setDropdownOpen(v => !v)}>
              Profile {unreadCount > 0 && <span className="navbar-notification-dot"></span>} <span style={{marginLeft: 6}}>▼</span>
            </button>
            {dropdownOpen && (
              <div className="navbar-dropdown-menu">
                <Link to="/profile" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Update Profile</Link>
                {/* <Link to="/my-complains" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Your Complains</Link> */}
                <NotificationLink />
                <Link to="/livechat" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Live Chat</Link>
                <button className="navbar-dropdown-item" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
        <div className="navbar-welcome-msg">Welcome Govt City Officer, {userName}</div>
      </nav>
    );
  }

  if (categories === 'admin') {
    return (
      <nav className="navbar-custom">
        <div className="navbar-logo-box" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Nirapod Logo" className="navbar-logo-img" />
        </div>
        <div className="navbar-btn-group">
          <a href="/admin" className="navbar-btn">Home</a>
          <a href="/reports" className="navbar-btn">Reports</a>
          <a href="/investigate" className="navbar-btn">Investigate</a>
          <div className="navbar-profile-dropdown" ref={dropdownRef}>
            <button className="navbar-btn" onClick={() => setDropdownOpen(v => !v)}>
              Profile {unreadCount > 0 && <span className="navbar-notification-dot"></span>} <span style={{marginLeft: 6}}>▼</span>
            </button>
            {dropdownOpen && (
              <div className="navbar-dropdown-menu">
                <Link to="/profile" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Update Profile</Link>
                <Link to="/add-admin" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Add Admin</Link>
                <NotificationLink />
                <Link to="/livechat" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Live Chat</Link>
                <button className="navbar-dropdown-item" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
        <div className="navbar-welcome-msg">Welcome Admin, {userName}</div>
      </nav>
    );
  }

  return (
    <nav className="navbar-custom">
      <div className="navbar-logo-box" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="Nirapod Logo" className="navbar-logo-img" />
      </div>
      <div className="navbar-btn-group">
        <Link to="/home" className="navbar-btn">Home</Link>
        <Link to="/CreateComplain" className="navbar-btn">Complain</Link>
        <Link to="/tracker" className="navbar-btn">Tracker</Link>
        <div className="navbar-profile-dropdown" ref={dropdownRef}>
          <button className="navbar-btn" onClick={() => setDropdownOpen(v => !v)}>
            Profile {unreadCount > 0 && <span className="navbar-notification-dot"></span>} <span style={{marginLeft: 6}}>▼</span>
          </button>
          {dropdownOpen && (
            <div className="navbar-dropdown-menu">
              <Link to="/profile" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Update Profile</Link>
              <Link to="/my-complains" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Your Complains</Link>
              <NotificationLink />
              <Link to="/livechat" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>Live Chat</Link>
              <button className="navbar-dropdown-item" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
      <div className="navbar-welcome-msg">Welcome, {userName}</div>
    </nav>
  );
}

export default Navbar;
