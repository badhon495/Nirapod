import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../image/logo.png';
import './Navbar.css';

function Navbar() {
  const categories = localStorage.getItem('categories');
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  const handleLogout = () => {
    localStorage.removeItem('nirapod_identifier');
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
