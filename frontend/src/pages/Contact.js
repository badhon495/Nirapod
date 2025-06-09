import React from 'react';
import './Contact.css';
import logo from '../image/logo.png';

function Contact() {
  return (
    <div className="contact-bg">
      <div className="contact-split">
        <div className="contact-left">
          <img src={logo} alt="Logo" className="contact-logo-img" />
          <div className="contact-logo">Nirapod</div>
          <div className="contact-tagline">Get in Touch</div>
        </div>
        <div className="contact-right">
          <div className="contact-form-box">
            <h2>Contact Information</h2>
            <div className="contact-info">
              <div className="contact-info-item">
                <b>Email:</b> support@nirapod.com
              </div>
              <div className="contact-info-item">
                <b>Phone:</b> +880 1700-000000
              </div>
              <div className="contact-info-item">
                <b>Address:</b> 123 Nirapod Avenue, Dhaka, Bangladesh
              </div>
              <div className="contact-info-item">
                <b>Facebook:</b> <a href="https://facebook.com/nirapodbd" target="_blank" rel="noopener noreferrer">facebook.com/nirapodbd</a>
              </div>
              <div className="contact-info-item">
                <b>Twitter:</b> <a href="https://twitter.com/nirapodbd" target="_blank" rel="noopener noreferrer">@nirapodbd</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="contact-footer">
        <a href="/login" className="footer-link">Login</a>
        <a href="/faq" className="footer-link">FAQ</a>
        <a href="/ReachOut" className="footer-link">Reach out</a>
      </footer>
    </div>
  );
}

export default Contact;
