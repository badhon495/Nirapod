import React, { useState } from 'react';
import './ReachOut.css';

function ReachOut() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', details: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/complain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (response.ok) {
        setMessage('✅ Your message has been submitted successfully. We will get back to you shortly!');
        setForm({ name: '', phone: '', email: '', details: '' });
        setIsSubmitted(true);
        
        // Reset success state after animation
        setTimeout(() => setIsSubmitted(false), 3000);
      } else {
        setMessage('❌ Failed to submit message. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('❌ Network error. Please check your connection and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="reachout-container">
      <h2 className="reachout-page-title">📞 Reach Out to Us</h2>
      
      <div className="reachout-centered">
        <div className={`reachout-form-box ${isSubmitted ? 'success-animation' : ''}`}>

          <form onSubmit={handleSubmit} className="reachout-form">
            <div className="input-group">
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input 
                  name="name" 
                  placeholder="Enter your full name" 
                  value={form.name}
                  onChange={handleChange} 
                  required 
                  minLength={2}
                  className="form-input"
                />
                <div className="input-focus-line"></div>
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <span className="input-icon">📱</span>
                <input 
                  name="phone" 
                  placeholder="Enter your phone number" 
                  value={form.phone} 
                  onChange={handleChange}
                  required 
                  pattern="[0-9+\-\s\(\)]+"
                  title="Please enter a valid phone number"
                  className="form-input"
                />
                <div className="input-focus-line"></div>
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input 
                  name="email" 
                  type="email"
                  placeholder="Enter your email address" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                />
                <div className="input-focus-line"></div>
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper textarea-wrapper">
                <span className="input-icon textarea-icon">💭</span>
                <textarea 
                  name="details" 
                  placeholder="Tell us how we can help you. Feel free to include any questions, feedback, or suggestions you might have." 
                  value={form.details} 
                  onChange={handleChange} 
                  required 
                  rows={5}
                  minLength={10}
                  className="form-input form-textarea"
                />
                <div className="input-focus-line"></div>
              </div>
            </div>

            <button 
              className={`reachout-btn ${loading ? 'loading' : ''} ${isSubmitted ? 'success' : ''}`} 
              type="submit" 
              disabled={loading}
            >
              <span className="btn-text">
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Sending...
                  </>
                ) : isSubmitted ? (
                  <>
                    Sent!
                  </>
                ) : (
                  <>
                    Send Message
                  </>
                )}
              </span>
              <div className="btn-ripple"></div>
            </button>
          </form>
          
          {message && (
            <div className={`reachout-message ${message.includes('❌') ? 'error' : 'success'}`}>
              <div className="message-icon">
                {message.includes('❌') ? '⚠️' : '🎉'}
              </div>
              <span className="message-text">{message}</span>
            </div>
          )}
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

export default ReachOut;
