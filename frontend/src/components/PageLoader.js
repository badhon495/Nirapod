import React from 'react';
import './PageLoader.css';

const PageLoader = ({ message = "Loading...", size = "medium" }) => {
  return (
    <div className={`page-loader page-loader-${size}`}>
      <div className="page-loader-content">
        <div className="page-loader-animation">
          <div className="loader-ring-1"></div>
          <div className="loader-ring-2"></div>
          <div className="loader-center-dot"></div>
        </div>
        <div className="page-loader-text">
          <span className="loader-message">{message}</span>
          <div className="loader-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      
      {/* Background skeleton for better UX */}
      <div className="page-loader-skeleton">
        <div className="skeleton-header"></div>
        <div className="skeleton-content">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
