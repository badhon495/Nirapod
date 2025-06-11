import axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'leaflet/dist/leaflet.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const AppWithProviders = () => {
  if (googleClientId && googleClientId.trim() !== '') {
    return (
      <ErrorBoundary>
        <GoogleOAuthProvider clientId={googleClientId}>
          <BrowserRouter>
            <App />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  theme: {
                    primary: 'green',
                    secondary: 'black',
                  },
                },
              }}
            />
          </BrowserRouter>
        </GoogleOAuthProvider>
      </ErrorBoundary>
    );
  }

  // Fallback without Google OAuth if client ID is not provided
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: 'green',
                secondary: 'black',
              },
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

// Configure axios defaults
// Set the base URL for API requests
const apiBaseUrl = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_BASE_URL || 'https://nirapod-backend.onrender.com'
  : 'http://localhost:8080';

axios.defaults.baseURL = apiBaseUrl;

// Add request interceptor to include authentication headers
axios.interceptors.request.use(
  (config) => {
    // Add timeout for better error handling
    config.timeout = 30000; // 30 seconds
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.warn('Network error - API might be unavailable');
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppWithProviders />);