import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import performanceOptimizer from '../utils/PerformanceOptimizer';

export const usePageTransition = (options = {}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const pageRef = useRef(null);
  const previousLocation = useRef(location.pathname);

  const {
    transitionDuration = 300,
    enablePerformanceOptimizations = true,
    preloadResources = true
  } = options;

  // Handle page transitions
  useEffect(() => {
    if (previousLocation.current !== location.pathname) {
      // Start transition
      setIsTransitioning(true);
      setIsLoading(true);

      // Add transition class to page
      if (pageRef.current) {
        performanceOptimizer.addPageTransition(pageRef.current, {
          duration: transitionDuration,
          direction: 'up'
        });
      }

      // End transition after duration
      const transitionTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDuration);

      // Set loading to false slightly after transition
      const loadingTimer = setTimeout(() => {
        setIsLoading(false);
      }, transitionDuration + 100);

      // Update previous location
      previousLocation.current = location.pathname;

      return () => {
        clearTimeout(transitionTimer);
        clearTimeout(loadingTimer);
      };
    } else {
      // Initial page load
      const initialTimer = setTimeout(() => {
        setIsLoading(false);
      }, 200);

      return () => clearTimeout(initialTimer);
    }
  }, [location.pathname, transitionDuration]);

  // Performance optimizations
  useEffect(() => {
    if (enablePerformanceOptimizations) {
      // Preload critical resources
      if (preloadResources) {
        // You can add specific resource preloading here
      }

      // Setup lazy loading for images in the current page
      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => performanceOptimizer.lazyLoadImage(img));
    }
  }, [location.pathname, enablePerformanceOptimizations, preloadResources]);

  return {
    isTransitioning,
    isLoading,
    pageRef,
    location
  };
};

export const usePerformanceOptimization = () => {
  // Debounced search function
  const debouncedSearch = performanceOptimizer.debounce((searchFn, query) => {
    searchFn(query);
  }, 300);

  // Throttled scroll handler
  const throttledScroll = performanceOptimizer.throttle((scrollFn) => {
    scrollFn();
  }, 100);

  // Lazy load image
  const lazyLoadImage = (img) => {
    performanceOptimizer.lazyLoadImage(img);
  };

  return {
    debouncedSearch,
    throttledScroll,
    lazyLoadImage,
    performanceOptimizer
  };
};

export default usePageTransition;
