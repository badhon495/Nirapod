// Performance optimization utilities for smooth page transitions and low-end device support

class PerformanceOptimizer {
  constructor() {
    this.pendingAnimations = new Set();
    this.pendingTimers = new Set();
    this.isLowEndDevice = this.detectLowEndDevice();
    this.setupPreloading();
    this.optimizeAnimations();
    this.setupMemoryManagement();
    this.applyPerformanceOptimizations();
  }

  // Enhanced device performance detection
  detectLowEndDevice() {
    // Check available memory (if supported)
    if ('deviceMemory' in navigator) {
      if (navigator.deviceMemory < 2) return true; // Less than 2GB RAM
    }
    
    // Check CPU cores (if supported)
    if ('hardwareConcurrency' in navigator) {
      if (navigator.hardwareConcurrency <= 2) return true; // 2 cores or less
    }

    // Check for mobile devices
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Additional checks for lower-end mobile devices
    if (isMobile) {
      // Check for older Android versions or low-end indicators
      if (/android [1-6]\./i.test(userAgent)) return true;
      
      // Check for performance hints in connection
      if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          return true;
        }
      }
    }
    
    return false;
  }

  // Apply comprehensive performance optimizations
  applyPerformanceOptimizations() {
    if (this.isLowEndDevice) {
      this.applyLowEndOptimizations();
    }
    
    // Disable heavy animations on reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.disableAnimations();
    }
  }

  // Specific optimizations for low-end devices
  applyLowEndOptimizations() {
    // Set CSS custom properties for reduced animations
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    document.documentElement.style.setProperty('--transition-duration', '0.1s');
    document.documentElement.style.setProperty('--blur-amount', '0px');
    document.documentElement.style.setProperty('--shadow-intensity', '0.1');
    
    // Add a class to body for CSS targeting
    document.body.classList.add('low-end-device');
    
    // Reduce backdrop filters and heavy effects
    this.disableBackdropFilters();
    
    // Simplify box shadows
    this.simplifyBoxShadows();
  }

  // Disable heavy backdrop filters
  disableBackdropFilters() {
    const style = document.createElement('style');
    style.textContent = `
      .low-end-device * {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      .low-end-device .login-form-box,
      .low-end-device .login-link-btn {
        background: rgba(255, 255, 255, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Simplify box shadows for better performance
  simplifyBoxShadows() {
    const style = document.createElement('style');
    style.textContent = `
      .low-end-device * {
        box-shadow: none !important;
      }
      .low-end-device .login-form-box {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
      }
      .low-end-device .login-btn {
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Completely disable animations for accessibility or performance
  disableAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `;
    document.head.appendChild(style);
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
      document.documentElement.style.setProperty('--animation-duration', '0.01s');
      document.documentElement.style.setProperty('--transition-duration', '0.01s');
      this.disableAnimations();
    } else if (this.isLowEndDevice) {
      // Shorter durations for low-end devices
      document.documentElement.style.setProperty('--animation-duration', '0.15s');
      document.documentElement.style.setProperty('--transition-duration', '0.15s');
    } else {
      // Normal durations for capable devices
      document.documentElement.style.setProperty('--animation-duration', '0.3s');
      document.documentElement.style.setProperty('--transition-duration', '0.3s');
    }
  }

  // Simple device performance detection (enhanced)
  detectLowEndDevice() {
    // This is now handled in the constructor
    return this.isLowEndDevice;
  }

  // Enhanced memory management for better performance
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

    // Clean up on page focus for mobile devices
    window.addEventListener('pagehide', () => {
      this.performMemoryCleanup();
    });

    // Regular cleanup for long-running sessions
    if (this.isLowEndDevice) {
      setInterval(() => {
        this.performMemoryCleanup();
      }, 30000); // Every 30 seconds for low-end devices
    }
  }

  performMemoryCleanup() {
    // Cancel any pending animations
    this.cancelPendingAnimations();
    
    // Clear any pending timeouts/intervals
    this.clearPendingTimers();
    
    // Clean up any cached images that are out of view
    this.cleanupOffScreenImages();
    
    // Force garbage collection if available
    if (window.gc && typeof window.gc === 'function') {
      try {
        window.gc();
      } catch (e) {
        // Ignore if GC is not available
      }
    }
  }

  // Clean up images that are no longer visible
  cleanupOffScreenImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (!isVisible && img.src && img.src !== img.dataset.src) {
        // Image is loaded but not visible, we can unload it on low-end devices
        if (this.isLowEndDevice) {
          img.src = '';
          img.setAttribute('data-src', img.src);
        }
      }
    });
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

  // Enhanced page transition utilities
  addPageTransition(element, options = {}) {
    // Skip heavy animations on low-end devices
    if (this.isLowEndDevice) {
      element.style.opacity = '1';
      element.style.transform = 'none';
      return;
    }

    const {
      duration = 200,
      easing = 'ease-out',
      direction = 'up'
    } = options;

    // Apply initial state
    element.style.transition = `opacity ${duration}ms ${easing}`;
    element.style.opacity = '0';
    
    // Simplified transitions for better performance
    switch (direction) {
      case 'up':
        element.style.transform = 'translateY(10px)';
        break;
      case 'down':
        element.style.transform = 'translateY(-10px)';
        break;
      case 'left':
        element.style.transform = 'translateX(10px)';
        break;
      case 'right':
        element.style.transform = 'translateX(-10px)';
        break;
      default:
        element.style.transform = 'scale(0.98)';
    }

    // Trigger animation
    const animationId = requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'none';
    });

    this.pendingAnimations.add(animationId);

    // Clean up after animation
    const timeoutId = setTimeout(() => {
      element.style.transition = '';
      element.style.transform = '';
      this.pendingAnimations.delete(animationId);
      this.pendingTimers.delete(timeoutId);
    }, duration + 50);

    this.pendingTimers.add(timeoutId);
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
