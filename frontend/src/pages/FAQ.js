import React from 'react';
import './Login.css';
import logo from '../image/logo.png';

function FAQ() {
  return (
    <div className="login-bg">
      <div className="login-split">
        <div className="login-left">
          <img src={logo} alt="Logo" className="login-logo-img" />
          <div className="login-logo">Nirapod</div>
          <div className="login-tagline">Frequently Asked Questions</div>
        </div>
        <div className="login-right">
          <div className="login-form-box">
            <h2>FAQ</h2>
            <div style={{ color: '#fff', textAlign: 'left' }}>
              <b>1. How can I recover my password?</b>
              <div style={{ marginBottom: 16 }}>
                Click on the "Forgotten password?" link on the login page, enter your email, and you will receive a new password in your email inbox.
              </div>
              <b>2. I did not receive the OTP. What should I do?</b>
              <div style={{ marginBottom: 16 }}>
                Please check your spam/junk folder. If you still do not receive the OTP, ensure your email is correct and try again.
              </div>
              <b>3. What file types can I upload for NID, Driving Licence, etc.?</b>
              <div style={{ marginBottom: 16 }}>
                You can upload JPG, PNG, or PDF files. Each file should not exceed the maximum allowed size (see error message if exceeded).
              </div>
              <b>4. How do I sign up as a privileged user?</b>
              <div style={{ marginBottom: 16 }}>
                Select "Privileged User" during signup and provide the required affiliation and documents.
              </div>
              <b>5. How long does account approval take?</b>
              <div style={{ marginBottom: 16 }}>
                Account approval may take 1-48 hours. You will be notified by email once your account is approved or rejected.
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="login-footer">
      <a href="/login" className="footer-link">Login</a>
        <a href="/ReachOut" className="footer-link">Reach out</a>
        <a href="/contact" className="footer-link">Contact</a>
      </footer>
    </div>
  );
}

export default FAQ;
