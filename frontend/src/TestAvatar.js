import React from 'react';
import './pages/Profile.css';

function TestAvatar() {
  const user = {
    name: "John Doe",
    userPhoto: null
  };

  return (
    <div style={{ padding: '50px', background: '#0f172a', minHeight: '100vh' }}>
      <h1 style={{ color: 'white', marginBottom: '30px' }}>Avatar Test</h1>
      
      {/* Test with name */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: 'white' }}>User with name:</h3>
        <div className="profile-photo-container">
          <div className="profile-photo-placeholder">
            <div className="profile-avatar-initials">
              {user.name && user.name.trim() ? 
                user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 
                <span className="profile-default-icon">👤</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Test without name */}
      <div>
        <h3 style={{ color: 'white' }}>User without name:</h3>
        <div className="profile-photo-container">
          <div className="profile-photo-placeholder">
            <div className="profile-avatar-initials">
              <span className="profile-default-icon">👤</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestAvatar;
