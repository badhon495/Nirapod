import React, { useState } from 'react';
import axios from 'axios';
import './Tracker.css';

function Tracker() {
  const [trackingId, setTrackingId] = useState('');
  const [complain, setComplain] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setComplain(null);
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }
    setLoading(true);
    try {
      // 1. Get identifier from localStorage
      const identifier = localStorage.getItem('nirapod_identifier');
      if (!identifier) {
        setError('You must be logged in to track complaints.');
        setLoading(false);
        return;
      }
      // 2. Fetch user info to get NID
      const userRes = await axios.get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`);
      const userNid = userRes.data.nid;
      // 3. Fetch complain by trackingId and NID
      const res = await axios.get(`/api/complain/${trackingId}?nid=${encodeURIComponent(userNid)}`);
      setComplain(res.data);
    } catch (err) {
      console.error('Tracking error:', err);
      setError('Complaint not found for this Tracking ID or you do not have permission to view it.');
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    // Handle both integer status (new backend) and string status (old backend)
    let statusText;
    if (typeof status === 'number') {
      switch (status) {
        case 2: statusText = 'Solved'; break;
        case 1: statusText = 'In Progress'; break;
        default: statusText = 'Unsolved'; break;
      }
    } else {
      statusText = status || 'Unsolved';
    }
    
    // Ensure statusText is a string before calling toLowerCase
    const statusLower = String(statusText).toLowerCase();
    let className = 'status-badge ';
    
    if (statusLower.includes('solved') || statusLower.includes('resolved') || statusLower.includes('completed')) {
      className += 'status-resolved';
    } else if (statusLower.includes('investigating') || statusLower.includes('progress')) {
      className += 'status-investigating';
    } else {
      className += 'status-pending';
    }
    
    return <span className={className}>{statusText}</span>;
  };

  return (
    <div className="tracker-container">
      <div className="tracker-content">
        <h1 className="tracker-title">Track Your Complaint</h1>
        <p className="tracker-subtitle">
          Enter your tracking ID to check the status of your complaint
        </p>
        
        <form className="tracker-form" onSubmit={handleSearch}>
          <div className="tracker-input-group">
            <input
              className="tracker-input"
              value={trackingId}
              onChange={e => setTrackingId(e.target.value)}
              placeholder="Enter Tracking ID (e.g., TRK12345)"
              required
            />
          </div>
          <button 
            type="submit" 
            className="tracker-button" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span> Tracking...
              </>
            ) : (
              'Track Complaint'
            )}
          </button>
        </form>
        
        {error && <div className="tracker-error"> {error}</div>}
        
        {complain && (
          <div className="complaint-result">
            <div className="complaint-header">
              <h2 className="complaint-header-title">Complaint Details</h2>
            </div>
            
            <div className="complaint-details">
              <div className="complaint-detail-row">
                <div>
                  <div className="complaint-label">Tracking ID</div>
                  <div className="complaint-value">{complain.trackingId}</div>
                </div>
              </div>
              
              <div className="complaint-detail-row">
                <div>
                  <div className="complaint-label">Complainant NID</div>
                  <div className="complaint-value">{complain.nid}</div>
                </div>
              </div>
              
              <div className="complaint-detail-row">
                <div>
                  <div className="complaint-label">Department</div>
                  <div className="complaint-value">{complain.complainTo}</div>
                </div>
              </div>
              
              <div className="complaint-detail-row">
                <div>
                  <div className="complaint-label">Category</div>
                  <div className="complaint-value">{complain.tags || 'Not specified'}</div>
                </div>
              </div>
              
              <div className="complaint-detail-row">
                <div>
                  <div className="complaint-label">Status</div>
                  <div className="complaint-value">
                    {getStatusBadge(complain.status)}
                  </div>
                </div>
              </div>
              
              {complain.details && (
                <div className="complaint-detail-row">
                  <div style={{width: '100%'}}>
                    <div className="complaint-label">Details</div>
                    <div className="complaint-value" style={{textAlign: 'left', maxWidth: '100%'}}>
                      {complain.details.split('\n').map((line, index) => (
                        <p key={index} style={{margin: '0.5rem 0'}}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="complaint-detail-row">
                <div style={{width: '100%'}}>
                  <div className="complaint-label">Latest Update</div>
                  <div className="complaint-value" style={{textAlign: 'left', maxWidth: '100%'}}>
                    <div className={`complaint-update ${!(complain.update || complain.updateNote) ? 'no-update' : ''}`}>
                      {complain.update || complain.updateNote || 'No updates yet. Your complaint is being processed.'}
                    </div>
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

export default Tracker;
