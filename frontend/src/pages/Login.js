import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import logo from '../image/logo.png';
import googleIcon from '../image/google-icon.png';
import { useAuth } from '../contexts/AuthContext';
import useGoogleSDK from '../hooks/useGoogleSDK';

function Login() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ phoneNumber: '', password: '', otp: '', forgotEmail: '' });
  const [message, setMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isReady: googleSDKReady } = useGoogleSDK();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.post('/api/auth/login', {
        phoneNumber: form.phoneNumber,
        password: form.password
      });
      
      // If admin, log in directly and redirect
      if (response.data.admin) {
        await login('admin', { nid: 'admin', categories: 'admin' });
        navigate('/admin');
        return;
      }
      
      setIdentifier(form.phoneNumber); // Save identifier for OTP step
      setStep(2);
    } catch (err) {
      setMessage('Invalid credentials');
    }
  };

  const handleOtp = async e => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('/api/auth/verify-otp', {
        identifier: identifier,
        otp: form.otp
      });
      
      // Fetch user data and login
      const res = await axios.get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`);
      if (res.data && res.data.nid) {
        await login(res.data.nid, res.data);
        
        // Create security notification with correct structure
        await axios.post('/api/notifications', {
          userId: res.data.nid,
          message: `New login detected from ${navigator.platform} at ${new Date().toLocaleString()}`,
          read: false
        });

        // Navigate based on user role
        const userRole = res.data.categories;
        if (userRole === 'admin') {
          navigate('/admin');
        } else if (['police', 'fire', 'city', 'animal'].includes(userRole)) {
          navigate('/complains');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      setMessage('Invalid OTP');
    }
  };

  const handleForgotPassword = async e => {
    e.preventDefault();
    setMessage('');
    setForgotLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email: form.forgotEmail });
      setMessage('A new password has been sent to your email.');
      setStep(1);
    } catch (err) {
      setMessage('Failed to reset password. Please check your email.');
    }
    setForgotLoading(false);
  };

  // Google Login handler
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;
      const res = await axios.post('/api/auth/google-login', { idToken });
      if (res.data && res.data.user && res.data.user.nid) {
        await login(res.data.user.nid, res.data.user);

        // Create security notification for Google login with correct structure
        await axios.post('/api/notifications', {
          userId: res.data.user.nid,
          message: `New login via Google detected from ${navigator.platform} at ${new Date().toLocaleString()}`,
          read: false
        });

        // Navigate based on user role
        const userRole = res.data.user.categories;
        if (userRole === 'admin') {
          navigate('/admin');
        } else if (['police', 'fire', 'city', 'animal'].includes(userRole)) {
          navigate('/complains');
        } else {
          navigate('/home');
        }
      } else {
        setMessage('User not found. Please sign up first.');
      }
    } catch (err) {
      setMessage('Google login failed or user not found.');
    }
  };

  // Handle Google button error
  const handleGoogleError = () => {
    setMessage('Google login failed');
  };

  // Custom Google Login Button Click Handler
  const handleCustomGoogleLogin = () => {
    // This will be implemented if the GoogleLogin component fails
    setMessage('Google login is temporarily unavailable. Please use email/phone login.');
  };

  return (
    <div className="login-bg">
      <div className="login-split">
        <div className="login-left">
          <img src={logo} alt="Nirapod Logo" className="login-logo-img" />
          <div className="login-logo">Nirapod</div>
          <div className="login-tagline">Your Safety, Our Priority</div>
        </div>
        <div className="login-right">
          <div className="login-form-box">
            <h2>Login</h2>
            {step === 1 && (
              <form onSubmit={handleLogin}>
                <input name="phoneNumber" placeholder="Phone number or Email" value={form.phoneNumber} onChange={handleChange} required />
                <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
                <button className="login-btn" type="submit">Login</button>
              </form>
            )}
            {step === 1 && (
              <div className="google-btn-wrapper">
                <div className="google-separator">
                  or
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '50px' }}>
                  {googleSDKReady && (
                    <GoogleLogin
                      onSuccess={handleGoogleLogin}
                      onError={handleGoogleError}
                      text="continue_with"
                      theme="outline"
                      size="large"
                      useOneTap={false}
                    />
                  )}
                </div>
              </div>
            )}
            {step === 2 && (
              <form onSubmit={handleOtp}>
                <input name="otp" placeholder="Enter OTP" value={form.otp} onChange={handleChange} required />
                <button className="login-btn" type="submit">Verify OTP</button>
              </form>
            )}
            {step === 3 && (
              <form onSubmit={handleForgotPassword}>
                <input name="forgotEmail" placeholder="Enter your email address" value={form.forgotEmail} onChange={handleChange} required />
                <button className="login-btn" type="submit" disabled={forgotLoading}>{forgotLoading ? 'Sending...' : 'Send new password'}</button>
              </form>
            )}
            {message && <div className="login-error">{message}</div>}
            <div className="login-links">
              {step !== 3 ? (
                <>
                  <button type="button" className="login-link-btn forgot-password-btn" onClick={e => { e.preventDefault(); setStep(3); setMessage(''); }}>
                    Forgotten password?
                  </button>
                  <div className="login-divider">
                    <span>or</span>
                  </div>
                  <a href="/signup" className="login-link-btn create-account-btn">
                    Create an account
                  </a>
                </>
              ) : (
                <button type="button" className="login-link-btn back-to-login-btn" onClick={e => { e.preventDefault(); setStep(1); setMessage(''); }}>
                  Remembered password?
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <footer className="login-footer">
        <a href="/faq" className="footer-link">FAQ</a>
        <a href="/ReachOut" className="footer-link">Reach out</a>
        <a href="/contact" className="footer-link">Contact</a>
      </footer>
    </div>
  );
}

export default Login;
