import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const usePersistentNavbar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);

  // Pages where navbar should be hidden (only auth pages)
  const hiddenPaths = ['/login', '/signup'];
  const shouldHideNavbar = hiddenPaths.includes(location.pathname);

  // Handle scroll-based navbar behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show/hide navbar based on scroll direction
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
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

    // Only add scroll listener if navbar should be visible
    if (!shouldHideNavbar) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
      };
    }
  }, [shouldHideNavbar]);

  // Reset navbar state on route change
  useEffect(() => {
    setIsVisible(true);
    setIsScrolled(false);
    lastScrollY.current = 0;
  }, [location.pathname]);

  return {
    isVisible: shouldHideNavbar ? false : isVisible,
    isScrolled,
    shouldHideNavbar
  };
};

export const useNavbarOptimization = () => {
  // Prevent navbar from re-rendering on every route change
  const [navbarKey] = useState(() => Math.random().toString(36));
  
  // Debounce navbar updates
  const debounceNavbarUpdate = (callback, delay = 100) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    };
  };

  return {
    navbarKey,
    debounceNavbarUpdate
  };
};

export default usePersistentNavbar;
