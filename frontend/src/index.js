import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </GoogleOAuthProvider>
);