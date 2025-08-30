import { useEffect, useCallback, useRef, useState } from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const startTime = useRef(Date.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${componentName} rendered #${renderCount.current} in ${Date.now() - startTime.current}ms`);
    }
  });

  const markStart = useCallback((label) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${componentName}-${label}-start`);
    }
  }, [componentName]);

  const markEnd = useCallback((label) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${componentName}-${label}-end`);
      performance.measure(
        `${componentName}-${label}`,
        `${componentName}-${label}-start`,
        `${componentName}-${label}-end`
      );
    }
  }, [componentName]);

  return { markStart, markEnd, renderCount: renderCount.current };
};

// Hook for debouncing values
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttling function calls
export const useThrottle = (func, delay) => {
  const inThrottle = useRef();

  return useCallback((...args) => {
    if (!inThrottle.current) {
      func.apply(this, args);
      inThrottle.current = true;
      setTimeout(() => inThrottle.current = false, delay);
    }
  }, [func, delay]);
};

// Hook for intersection observer (infinite scroll)
export const useIntersectionObserver = (callback, options = {}) => {
  const targetRef = useRef();
  const observerRef = useRef();

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, {
      threshold: 0.1,
      rootMargin: '20px',
      ...options
    });

    observerRef.current.observe(target);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);

  return targetRef;
};

// Hook for lazy loading images
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const image = new Image();
        image.onload = () => {
          setImageSrc(src);
          setIsLoaded(true);
        };
        image.src = src;
        observer.disconnect();
      }
    });

    observer.observe(img);

    return () => observer.disconnect();
  }, [src]);

  return { ref: imgRef, src: imageSrc, isLoaded };
};

// Hook for optimized window resize handling
export const useOptimizedResize = (callback, delay = 250) => {
  const timeoutRef = useRef();

  useEffect(() => {
    const handleResize = () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback();
      }, delay);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutRef.current);
    };
  }, [callback, delay]);
};

export default {
  usePerformanceMonitor,
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  useLazyImage,
  useOptimizedResize
};
