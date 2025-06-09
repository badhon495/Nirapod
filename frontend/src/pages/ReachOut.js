import React, { useState } from 'react';
import './ReachOut.css';
import logo from '../image/logo.png';

function Complain() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', details: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
        setMessage('✅ Your complaint has been submitted successfully. Thank you!');
        setForm({ name: '', phone: '', email: '', details: '' });
      } else {
        setMessage('❌ Failed to submit complaint. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('❌ Network error. Please check your connection and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="complain-bg">
      <div className="complain-split">
        <div className="complain-left">
          <img src={logo} alt="Logo" className="complain-logo-img" />
          <div className="complain-logo">Nirapod</div>
          <div className="complain-tagline">Complain</div>
        </div>
        <div className="complain-right">
          <div className="complain-form-box">
            <h2>📝 Submit a Complaint</h2>
            <form onSubmit={handleSubmit}>
              <input 
                name="name" 
                placeholder="Enter your full name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                minLength={2}
              />
              <input 
                name="phone" 
                placeholder="Enter your phone number" 
                value={form.phone} 
                onChange={handleChange} 
                required 
                pattern="[0-9+\-\s\(\)]+"
                title="Please enter a valid phone number"
              />
              <input 
                name="email" 
                type="email"
                placeholder="Enter your email address" 
                value={form.email} 
                onChange={handleChange} 
                required 
              />
              <textarea 
                name="details" 
                placeholder="Describe your complaint in detail. Include relevant information like date, time, location, and any other important details." 
                value={form.details} 
                onChange={handleChange} 
                required 
                rows={5}
                minLength={10}
              />
              <button className="complain-btn" type="submit" disabled={loading}>
                {loading ? '📤 Submitting...' : '🚀 Submit Complaint'}
              </button>
            </form>
            {message && (
              <div className={`complain-error ${message.includes('❌') ? 'error' : ''}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="complain-footer">
        <a href="/login" className="complain-footer-link">Login</a>
        <a href="/faq" className="complain-footer-link">FAQ</a>
        <a href="/contact" className="complain-footer-link">Contact</a>
      </footer>
    </div>
  );
}

export default Complain;