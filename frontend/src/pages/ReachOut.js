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
      await fetch('/api/complain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setMessage('Your complaint has been submitted. Thank you!');
      setForm({ name: '', phone: '', email: '', details: '' });
    } catch {
      setMessage('Failed to submit complaint. Please try again.');
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
            <h2>Submit a Complaint</h2>
            <form onSubmit={handleSubmit}>
              <input name="name" placeholder="Your Name" value={form.name} onChange={handleChange} required />
              <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
              <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
              <textarea name="details" placeholder="Details about your complaint" value={form.details} onChange={handleChange} required rows={4} />
              <button className="complain-btn" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
            </form>
            {message && <div className="complain-error">{message}</div>}
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