import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import logo from '../image/logo.png';

function Login() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ phoneNumber: '', password: '', otp: '', forgotEmail: '' });
  const [message, setMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.post('/api/auth/login', {
        phoneNumber: form.phoneNumber,
        password: form.password
      });
      if (response.data.categories) {
        localStorage.setItem('categories', response.data.categories);
      }
      setIdentifier(form.phoneNumber); // Save identifier for OTP step
      // Do NOT set nirapod_identifier here, only after OTP verification
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
      // Fetch NID and store it
      const res = await axios.get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`);
      if (res.data && res.data.nid) {
        localStorage.setItem('nirapod_identifier', res.data.nid);
      }
      window.location.href = '/home';
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
                  <a href="#" className="login-link" onClick={e => { e.preventDefault(); setStep(3); setMessage(''); }}>Forgotten password?</a>
                  <a href="/signup" className="login-link">Create an account</a>
                </>
              ) : (
                <a href="#" className="login-link" onClick={e => { e.preventDefault(); setStep(1); setMessage(''); }}>Remembered password?</a>
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
