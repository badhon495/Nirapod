import React, { useState } from 'react';
import axios from 'axios';
import './Investigate.css';

const searchOptions = [
  { label: '🆔 NID', value: 'nid', placeholder: 'Enter National ID Number', icon: '🆔' },
  { label: '🚗 Driving License', value: 'drivingLicence', placeholder: 'Enter Driving License Number', icon: '🚗' },
  { label: '🛂 Passport', value: 'passport', placeholder: 'Enter Passport Number', icon: '🛂' },
];

function Investigate() {
  const [searchBy, setSearchBy] = useState('nid');
  const [searchValue, setSearchValue] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setUser(null);
    
    if (!searchValue.trim()) {
      setError('Please enter a search value');
      return;
    }
    
    setLoading(true);
    try {
      const params = {};
      params[searchBy] = searchValue.trim();
      const res = await axios.get('/api/user/search', { params });
      setUser(res.data);
    } catch (err) {
      console.error('Search error:', err);
      setError('User not found or you do not have permission to view this information.');
    }
    setLoading(false);
  };

  const selectedOption = searchOptions.find(opt => opt.value === searchBy);

  const renderPhoto = (photoPath, alt = 'Photo') => {
    if (!photoPath) return null;
    
    let photo = photoPath;
    if (photo.startsWith('/uploads/')) {
      photo = photo.replace('/uploads/', '');
    }
    const backendUrl = 'http://localhost:8080';
    const src = `${backendUrl}/${photo}`;
    
    return (
      <img 
        src={src} 
        alt={alt}
        className="user-document-photo"
        onClick={() => window.open(src, '_blank')}
      />
    );
  };

  const renderDocumentLink = (photoPath, label) => {
    if (!photoPath) {
      return <span className="document-unavailable">Not Available</span>;
    }
    
    let photo = photoPath;
    if (photo.startsWith('/uploads/')) {
      photo = photo.replace('/uploads/', '');
    }
    const backendUrl = 'http://localhost:8080';
    const src = `${backendUrl}/${photo}`;
    
    return (
      <a 
        href={src} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="document-link"
      >
        📎 View {label}
      </a>
    );
  };

  return (
    <div className="investigate-container">
      <div className="investigate-content">
        <h1 className="investigate-title">🕵️ User Investigation Portal</h1>
        <p className="investigate-subtitle">
          Search for user information using various identification methods
        </p>
        
        <div className="search-form-container">
          <div className="search-type-selector">
            <span className="search-type-label">Search by:</span>
            <div className="search-options">
              {searchOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`search-option-btn ${searchBy === option.value ? 'active' : ''}`}
                  onClick={() => {
                    setSearchBy(option.value);
                    setSearchValue('');
                    setError('');
                    setUser(null);
                  }}
                >
                  <span className="search-option-icon">{option.icon}</span>
                  <span className="search-option-text">{option.label.replace(/🆔|🚗|🛂/g, '').trim()}</span>
                </button>
              ))}
            </div>
          </div>
          
          <form className="investigate-form" onSubmit={handleSearch}>
            <div className="investigate-input-group">
              <input
                className="investigate-input"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder={selectedOption.placeholder}
                required
              />
            </div>
            <button 
              type="submit" 
              className="investigate-button" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span> Searching...
                </>
              ) : (
                <>
                  <span className="button-icon">🔍</span>
                  Search User
                </>
              )}
            </button>
          </form>
        </div>
        
        {error && <div className="investigate-error">⚠️ {error}</div>}
        
        {user && (
          <div className="user-result">
            <div className="user-header">
              <span className="user-header-icon">👤</span>
              <h2 className="user-header-title">User Information</h2>
            </div>
            
            {user.userPhoto && (
              <div className="user-photo-section">
                <div className="user-photo-container">
                  {renderPhoto(user.userPhoto, 'User Photo')}
                </div>
              </div>
            )}
            
            <div className="user-details">
              <div className="user-detail-row" style={{'--animation-order': 1}}>
                <div className="detail-label">
                  <span className="detail-icon">👤</span>
                  Full Name
                </div>
                <div className="detail-value">{user.name}</div>
              </div>
              
              <div className="user-detail-row" style={{'--animation-order': 2}}>
                <div className="detail-label">
                  <span className="detail-icon">🏠</span>
                  Present Address
                </div>
                <div className="detail-value">{user.presentAddress}</div>
              </div>
              
              <div className="user-detail-row" style={{'--animation-order': 3}}>
                <div className="detail-label">
                  <span className="detail-icon">📞</span>
                  Phone Number
                </div>
                <div className="detail-value">{user.phone}</div>
              </div>
              
              <div className="user-detail-row" style={{'--animation-order': 4}}>
                <div className="detail-label">
                  <span className="detail-icon">🆔</span>
                  National ID
                </div>
                <div className="detail-value">{user.nid}</div>
              </div>
              
              {user.passport && (
                <div className="user-detail-row" style={{'--animation-order': 5}}>
                  <div className="detail-label">
                    <span className="detail-icon">🛂</span>
                    Passport
                  </div>
                  <div className="detail-value">{user.passport}</div>
                </div>
              )}
              
              {user.drivingLicence && (
                <div className="user-detail-row" style={{'--animation-order': 6}}>
                  <div className="detail-label">
                    <span className="detail-icon">🚗</span>
                    Driving License
                  </div>
                  <div className="detail-value">{user.drivingLicence}</div>
                </div>
              )}
              
              <div className="user-detail-row" style={{'--animation-order': 7}}>
                <div className="detail-label">
                  <span className="detail-icon">📧</span>
                  Email Address
                </div>
                <div className="detail-value">{user.email}</div>
              </div>
              
              <div className="user-detail-row" style={{'--animation-order': 8}}>
                <div className="detail-label">
                  <span className="detail-icon">🏡</span>
                  Permanent Address
                </div>
                <div className="detail-value">{user.permanentAddress}</div>
              </div>
              
              <div className="user-detail-row" style={{'--animation-order': 9}}>
                <div className="detail-label">
                  <span className="detail-icon">⚡</span>
                  Utility Bill ID
                </div>
                <div className="detail-value">{user.utilityBillId}</div>
              </div>
            </div>
            
            <div className="documents-section">
              <h3 className="documents-title">
                <span className="documents-icon">📄</span>
                Document Attachments
              </h3>
              
              <div className="documents-grid">
                <div className="document-item">
                  <div className="document-label">
                    <span className="document-icon">⚡</span>
                    Utility Bill
                  </div>
                  <div className="document-value">
                    {renderDocumentLink(user.utilityBillPhoto, 'Utility Bill')}
                  </div>
                </div>
                
                <div className="document-item">
                  <div className="document-label">
                    <span className="document-icon">🆔</span>
                    NID Document
                  </div>
                  <div className="document-value">
                    {renderDocumentLink(user.nidPhoto, 'NID')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Investigate;
