import axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'leaflet/dist/leaflet.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const AppWithProviders = () => {
  if (googleClientId && googleClientId.trim() !== '') {
    return (
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
    );
  }

  // Fallback without Google OAuth if client ID is not provided
  return (
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
  );
};

// Configure axios defaults
// Set the base URL for API requests
axios.defaults.baseURL = 'http://localhost:8080';

// Add request interceptor to include authentication headers
axios.interceptors.request.use(
  (config) => {
    // You can add auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppWithProviders />);