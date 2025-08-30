import { useEffect, useState } from 'react';

// Custom hook to preload and initialize Google SDK
export const useGoogleSDK = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if Google SDK script is already loaded
    const checkGoogleSDK = () => {
      if (window.google && window.google.accounts) {
        setIsLoaded(true);
        initializeGoogleSDK();
        return true;
      }
      return false;
    };

    // Initialize Google SDK
    const initializeGoogleSDK = () => {
      try {
        // Initialize the Google Identity Services
        if (window.google && window.google.accounts && window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: () => {}, // Empty callback for initialization
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          setIsInitialized(true);
        }
      } catch (error) {
        console.warn('Google SDK initialization failed:', error);
      }
    };

    // If already loaded, initialize immediately
    if (checkGoogleSDK()) {
      return;
    }

    // Wait for Google SDK to load
    const checkInterval = setInterval(() => {
      if (checkGoogleSDK()) {
        clearInterval(checkInterval);
      }
    }, 100);

    // Cleanup interval after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      console.warn('Google SDK failed to load within 10 seconds');
    }, 10000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, []);

  return { isLoaded, isInitialized, isReady: isLoaded && isInitialized };
};

export default useGoogleSDK;
