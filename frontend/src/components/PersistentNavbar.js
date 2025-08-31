import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import './PersistentNavbar.css';

const PersistentNavbar = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);
  
  // Only hide navbar on login and signup pages
  const hiddenPaths = ['/login', '/signup'];
  const shouldHideNavbar = hiddenPaths.includes(location.pathname);

  // Handle scroll-based navbar behavior
  useEffect(() => {
    if (shouldHideNavbar) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show/hide navbar based on scroll direction
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down - hide navbar
        setIsVisible(false);
      } else {
        // Scrolling up - show navbar
        setIsVisible(true);
      }
      
      // Update scroll state for styling
      setIsScrolled(currentScrollY > 10);
      lastScrollY.current = currentScrollY;

      // Clear any pending timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Auto-show navbar after scroll stops
      scrollTimeout.current = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [shouldHideNavbar]);

  // Reset navbar state on route change
  useEffect(() => {
    setIsVisible(true);
    setIsScrolled(false);
    lastScrollY.current = 0;
  }, [location.pathname]);

  if (shouldHideNavbar) {
    return null;
  }

  return (
    <div 
      className={`persistent-navbar-wrapper ${isVisible ? 'visible' : 'hidden'} ${isScrolled ? 'scrolled' : ''}`}
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <Navbar />
    </div>
  );
};

export default React.memo(PersistentNavbar);
