import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Profile() {
  const userId = 1; // TODO: Replace with actual logged-in user ID
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', presentAddress: '', permanentAddress: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get(`/api/user/${userId}`).then(res => {
      setUser(res.data);
      setForm({
        name: res.data.name || '',
        email: res.data.email || '',
        phoneNumber: res.data.phoneNumber || '',
        presentAddress: res.data.presentAddress || '',
        permanentAddress: res.data.permanentAddress || ''
      });
    });
  }, [userId]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.put(`/api/user/${userId}`, form);
      setMessage('Profile updated successfully.');
    } catch {
      setMessage('Failed to update profile.');
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="phoneNumber" placeholder="Phone Number" value={form.phoneNumber} onChange={handleChange} required />
        <input name="presentAddress" placeholder="Present Address" value={form.presentAddress} onChange={handleChange} />
        <input name="permanentAddress" placeholder="Permanent Address" value={form.permanentAddress} onChange={handleChange} />
        <button type="submit">Update Profile</button>
      </form>
      {message && <div>{message}</div>}
    </div>
  );
}

export default Profile;
