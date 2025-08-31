// Performance optimization utilities for smooth page transitions

class PerformanceOptimizer {
  constructor() {
    this.setupPreloading();
    this.optimizeAnimations();
    this.setupMemoryManagement();
  }

  // Preload critical resources
  setupPreloading() {
    // Preload critical fonts
    this.preloadFont('Inter', [300, 400, 500, 600, 700]);
    
    // Setup intersection observer for lazy loading
    this.setupLazyLoading();
  }

  preloadFont(fontFamily, weights = [400]) {
    weights.forEach(weight => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${weight}&display=swap`;
      link.as = 'style';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  // Setup lazy loading for images and components
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              this.imageObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.1
      });
    }
  }

  // Optimize animations based on device capabilities
  optimizeAnimations() {
    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
      document.documentElement.style.setProperty('--transition-duration', '0.1s');
    } else {
      // Check device performance
      const isLowEndDevice = this.detectLowEndDevice();
      
      if (isLowEndDevice) {
        document.documentElement.style.setProperty('--animation-duration', '0.2s');
        document.documentElement.style.setProperty('--transition-duration', '0.2s');
      } else {
        document.documentElement.style.setProperty('--animation-duration', '0.3s');
        document.documentElement.style.setProperty('--transition-duration', '0.3s');
      }
    }
  }

  // Simple device performance detection
  detectLowEndDevice() {
    // Check available memory (if supported)
    if ('deviceMemory' in navigator) {
      return navigator.deviceMemory < 4; // Less than 4GB RAM
    }
    
    // Check CPU cores (if supported)
    if ('hardwareConcurrency' in navigator) {
      return navigator.hardwareConcurrency < 4; // Less than 4 cores
    }
    
    // Fallback: assume mid-range device
    return false;
  }

  // Memory management for better performance
  setupMemoryManagement() {
    // Clean up unused resources on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performMemoryCleanup();
      }
    });

    // Clean up on beforeunload
    window.addEventListener('beforeunload', () => {
      this.performMemoryCleanup();
    });
  }

  performMemoryCleanup() {
    // Cancel any pending animations
    this.cancelPendingAnimations();
    
    // Clear any pending timeouts/intervals
    this.clearPendingTimers();
    
    // Force garbage collection if available
    if (window.gc && typeof window.gc === 'function') {
      try {
        window.gc();
      } catch (e) {
        // Ignore if GC is not available
      }
    }
  }

  cancelPendingAnimations() {
    // Cancel all animation frames
    if (this.pendingAnimations) {
      this.pendingAnimations.forEach(id => cancelAnimationFrame(id));
      this.pendingAnimations.clear();
    }
  }

  clearPendingTimers() {
    // Clear any stored timer IDs
    if (this.pendingTimers) {
      this.pendingTimers.forEach(id => {
        clearTimeout(id);
        clearInterval(id);
      });
      this.pendingTimers.clear();
    }
  }

  // Smooth page transition utilities
  addPageTransition(element, options = {}) {
    const {
      duration = 300,
      easing = 'cubic-bezier(0.16, 1, 0.3, 1)',
      direction = 'up'
    } = options;

    // Apply initial state
    element.style.transition = `all ${duration}ms ${easing}`;
    element.style.opacity = '0';
    
    switch (direction) {
      case 'up':
        element.style.transform = 'translateY(20px)';
        break;
      case 'down':
        element.style.transform = 'translateY(-20px)';
        break;
      case 'left':
        element.style.transform = 'translateX(20px)';
        break;
      case 'right':
        element.style.transform = 'translateX(-20px)';
        break;
      default:
        element.style.transform = 'scale(0.95)';
    }

    // Trigger animation
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translate(0) scale(1)';
    });

    // Clean up after animation
    setTimeout(() => {
      element.style.transition = '';
      element.style.transform = '';
    }, duration + 50);
  }

  // Lazy load an image
  lazyLoadImage(img) {
    if (this.imageObserver) {
      this.imageObserver.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    }
  }

  // Debounce utility for performance
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle utility for performance
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  // Initialize performance monitoring
  setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      // Monitor Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const lcp = entries[entries.length - 1];
          console.log('LCP:', lcp.startTime);
        }
      });
      
      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // Handle if not supported
      }

      // Monitor First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      });
      
      try {
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // Handle if not supported
      }
    }
  }
}

// Create and export a singleton instance
const performanceOptimizer = new PerformanceOptimizer();

export default performanceOptimizer;
