import { useEffect, useState, useCallback } from 'react';
import performanceOptimizer from '../utils/PerformanceOptimizer';

// Hook for performance-aware component mounting
export const usePerformanceAwareMount = () => {
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [shouldReduceAnimations, setShouldReduceAnimations] = useState(false);

  useEffect(() => {
    const isLowEnd = performanceOptimizer.isLowEndDevice;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    setIsLowEndDevice(isLowEnd);
    setShouldReduceAnimations(isLowEnd || prefersReducedMotion);
    
    // Apply performance optimizations if needed
    if (isLowEnd) {
      document.body.classList.add('low-end-device');
    }
  }, []);

  return {
    isLowEndDevice,
    shouldReduceAnimations,
    performanceOptimizer
  };
};

// Hook for optimized animations
export const useOptimizedAnimation = (animationClass, delay = 0) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const { shouldReduceAnimations } = usePerformanceAwareMount();

  useEffect(() => {
    if (shouldReduceAnimations) {
      setShouldAnimate(true); // Skip animation delay on low-end devices
      return;
    }

    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, shouldReduceAnimations]);

  const getAnimationClass = useCallback(() => {
    if (shouldReduceAnimations) {
      return ''; // No animation class for low-end devices
    }
    return shouldAnimate ? animationClass : '';
  }, [shouldAnimate, animationClass, shouldReduceAnimations]);

  return getAnimationClass();
};

// Hook for performance-optimized image loading
export const useOptimizedImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setIsError(false);
    };
    
    img.onerror = () => {
      setIsError(true);
      setIsLoaded(false);
    };
    
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { src: imageSrc, isLoaded, isError };
};

// Hook for debounced search
export const useOptimizedSearch = (searchFunction, delay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const debouncedSearch = performanceOptimizer.debounce(searchFunction, delay);
    
    if (searchTerm) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, searchFunction, delay]);

  return [searchTerm, setSearchTerm];
};

// Hook for throttled scroll events
export const useOptimizedScroll = (callback, delay = 100) => {
  useEffect(() => {
    const throttledCallback = performanceOptimizer.throttle(callback, delay);
    
    window.addEventListener('scroll', throttledCallback, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledCallback);
    };
  }, [callback, delay]);
};

// Hook for component visibility (Intersection Observer)
export const useVisibility = (ref, options = {}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
};

export default {
  usePerformanceAwareMount,
  useOptimizedAnimation,
  useOptimizedImage,
  useOptimizedSearch,
  useOptimizedScroll,
  useVisibility
};
