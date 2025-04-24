import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/home" className="logo">Nirapod</Link>
      <div className="nav-links">
        <Link to="/home">Home</Link>
        <Link to="#">Complain</Link>
        <Link to="#">Tracker</Link>
        <div className="profile-dropdown">
          <button>Profile ▼</button>
          <div className="dropdown-content">
            <Link to="/profile">Update Profile</Link>
            <Link to="#">Notifications</Link>
            <Link to="#">Filed Complains</Link>
            <Link to="/login">Logout</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
