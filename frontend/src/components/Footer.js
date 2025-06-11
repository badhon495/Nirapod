import React from 'react';

const Footer = ({ className = "login-footer" }) => {
  return (
    <footer className={className}>
      <a href="/faq" className="footer-link">FAQ</a>
      <a href="/ReachOut" className="footer-link">Reach out</a>
      <a href="/contact" className="footer-link">Contact</a>
    </footer>
  );
};

export default Footer;
