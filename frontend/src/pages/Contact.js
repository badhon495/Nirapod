import React from 'react';
import './Login.css';
import logo from '../image/logo.png';

function Contact() {
  return (
    <div className="login-bg">
      <div className="login-split">
        <div className="login-left">
          <img src={logo} alt="Logo" className="login-logo-img" />
          <div className="login-logo">Nirapod</div>
          <div className="login-tagline">Contact Us</div>
        </div>
        <div className="login-right">
          <div className="login-form-box">
            <h2>Contact Information</h2>
            <div style={{ color: '#fff', textAlign: 'left' }}>
              <b>Email:</b> support@nirapod.com<br />
              <b>Phone:</b> +880 1700-000000<br />
              <b>Address:</b> 123 Nirapod Avenue, Dhaka, Bangladesh<br />
              <b>Facebook:</b> <a href="https://facebook.com/nirapodbd" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>facebook.com/nirapodbd</a><br />
              <b>Twitter:</b> <a href="https://twitter.com/nirapodbd" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>@nirapodbd</a><br />
            </div>
          </div>
        </div>
      </div>
      <footer className="login-footer">
        <a href="/login" className="footer-link">Login</a>
        <a href="/faq" className="footer-link">FAQ</a>
        <a href="/ReachOut" className="footer-link">Reach out</a>
      </footer>
    </div>
  );
}

export default Contact;
