import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import usePageTransition from '../hooks/usePageTransition';
import './PageLayout.css';

const PageLayout = ({ children }) => {
  const [displayChildren, setDisplayChildren] = useState(children);
  const { isTransitioning, pageRef } = usePageTransition({
    transitionDuration: 300,
    enablePerformanceOptimizations: true,
    preloadResources: true
  });
  const location = useLocation();

  useEffect(() => {
    if (isTransitioning) {
      // Update content after a short delay to allow fade out
      const updateTimeout = setTimeout(() => {
        setDisplayChildren(children);
      }, 150);

      return () => clearTimeout(updateTimeout);
    } else {
      setDisplayChildren(children);
    }
  }, [location.pathname, children, isTransitioning]);

  return (
    <div className="page-layout" ref={pageRef}>
      {/* Persistent background */}
      <div className="page-background">
        <div className="background-layer-1"></div>
        <div className="background-layer-2"></div>
        <div className="background-layer-3"></div>
        <div className="background-overlay"></div>
      </div>
      
      {/* Page content with transitions */}
      <div className={`page-content-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
        <div className="page-content">
          {displayChildren}
        </div>
      </div>
      
      {/* Loading overlay during transitions */}
      {isTransitioning && (
        <div className="page-transition-overlay">
          <div className="transition-loader">
            <div className="loader-ring"></div>
            <div className="loader-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageLayout;
