import React from 'react';
import './Contact.css';

function Contact() {
  return (
    <div className="contact-bg">
      <h2 className="contact-page-title">📞 Contact Information</h2>
      <div className="contact-centered">
        <div className="contact-form-box">
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
      <footer className="login-footer">
        <a href="/login" className="footer-link">Login</a>
        <a href="/faq" className="footer-link">FAQ</a>
        <a href="/ReachOut" className="footer-link">Reach out</a>
        <a href="/contact" className="footer-link">Contact</a>
        
      </footer>
    </div>
  );
}

export default Contact;
