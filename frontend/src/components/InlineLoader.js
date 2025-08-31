import React from 'react';
import './InlineLoader.css';

const InlineLoader = ({ 
  message = "Loading...", 
  size = "medium", 
  variant = "default",
  showProgress = false,
  progressValue = 0 
}) => {
  return (
    <div className={`inline-loader inline-loader-${size} inline-loader-${variant}`}>
      <div className="inline-loader-animation">
        <div className="loader-spinner">
          <div className="spinner-segment"></div>
          <div className="spinner-segment"></div>
          <div className="spinner-segment"></div>
        </div>
        <div className="loader-pulse-dot"></div>
      </div>
      
      <div className="inline-loader-content">
        <div className="loader-message">{message}</div>
        {showProgress && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
              ></div>
            </div>
            <span className="progress-text">{Math.round(progressValue)}%</span>
          </div>
        )}
        <div className="loader-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default InlineLoader;
