import React, { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import './Tracker.css';

function Tracker() {
  const [trackingId, setTrackingId] = useState('');
  const [complain, setComplain] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Simulate page loading for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 800); // Show loading animation for 800ms

    return () => clearTimeout(timer);
  }, []);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setComplain(null);
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }
    
    setLoading(true);
    setUserDataLoading(true);
    
    try {
      // 1. Get identifier from localStorage
      const identifier = localStorage.getItem('nirapod_identifier');
      if (!identifier) {
        setError('You must be logged in to track complaints.');
        setLoading(false);
        setUserDataLoading(false);
        return;
      }
      
      // 2. Fetch user info and complaint in parallel for better performance
      const [userRes, complainRes] = await Promise.all([
        axios.get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`),
        // Try to fetch complaint first, then validate user access
        axios.get(`/api/complain/${trackingId}`).catch(err => ({ error: err }))
      ]);
      
      setUserDataLoading(false);
      
      const userNid = userRes.data.nid;
      
      // 3. If initial complaint fetch failed, try with NID validation
      if (complainRes.error) {
        const validatedRes = await axios.get(`/api/complain/${trackingId}?nid=${encodeURIComponent(userNid)}`);
        setComplain(validatedRes.data);
      } else {
        // Validate user has access to this complaint
        if (complainRes.data.nid !== userNid) {
          setError('You do not have permission to view this complaint.');
          setLoading(false);
          return;
        }
        setComplain(complainRes.data);
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError('Complaint not found for this Tracking ID or you do not have permission to view it.');
      setUserDataLoading(false);
    }
    setLoading(false);
  }, [trackingId]);

  const getStatusBadge = useMemo(() => (status) => {
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
  }, []);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="tracker-container">
      <div className="tracker-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-subtitle"></div>
        <div className="skeleton-form">
          <div className="skeleton-input"></div>
          <div className="skeleton-button"></div>
        </div>
        <div className="loading-text">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Loading Tracker...</p>
        </div>
      </div>
    </div>
  );

  // Show loading skeleton while page is loading
  if (pageLoading) {
    return <LoadingSkeleton />;
  }

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
        
        {loading && !complain && (
          <div className="search-loading-overlay">
            <div className="search-loading-content">
              <div className="search-loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
              <div className="search-loading-text">
                <h3>Searching for your complaint...</h3>
                <p>Please wait while we fetch your data</p>
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && <div className="tracker-error"> {error}</div>}
        
        {complain && (
          <div className="complaint-result">
            <div className="complaint-header">
              <h2 className="complaint-header-title">Complaint Details</h2>
              {userDataLoading && <div className="user-data-loading">Validating access...</div>}
            </div>
            
            <div className="complaint-details">
              <div className="complaint-detail-row" data-animation-order="1">
                <div>
                  <div className="complaint-label">Tracking ID</div>
                  <div className="complaint-value">{complain.trackingId}</div>
                </div>
              </div>
              
              <div className="complaint-detail-row" data-animation-order="2">
                <div>
                  <div className="complaint-label">Complainant NID</div>
                  <div className="complaint-value">{complain.nid}</div>
                </div>
              </div>
              
              <div className="complaint-detail-row" data-animation-order="3">
                <div>
                  <div className="complaint-label">Department</div>
                  <div className="complaint-value">{complain.complainTo}</div>
                </div>
              </div>
              
              <div className="complaint-detail-row" data-animation-order="4">
                <div>
                  <div className="complaint-label">Category</div>
                  <div className="complaint-value">{complain.tags || 'Not specified'}</div>
                </div>
              </div>
              
              <div className="complaint-detail-row" data-animation-order="5">
                <div>
                  <div className="complaint-label">Status</div>
                  <div className="complaint-value">
                    {getStatusBadge(complain.status)}
                  </div>
                </div>
              </div>
              
              {complain.details && (
                <div className="complaint-detail-row" data-animation-order="6">
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
              
              <div className="complaint-detail-row" data-animation-order="7">
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

export default React.memo(Tracker);
