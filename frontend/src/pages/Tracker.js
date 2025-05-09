import React, { useState } from 'react';
import axios from 'axios';

function Tracker() {
  const [trackingId, setTrackingId] = useState('');
  const [complain, setComplain] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setComplain(null);
    if (!trackingId) return;
    setLoading(true);
    try {
      // 1. Get identifier from localStorage
      const identifier = localStorage.getItem('nirapod_identifier');
      if (!identifier) {
        setError('You must be logged in.');
        setLoading(false);
        return;
      }
      // 2. Fetch user info to get NID
      const userRes = await axios.get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`);
      const userNid = userRes.data.nid;
      // 3. Fetch complain by trackingId and NID
      const res = await axios.get(`/api/complain/${trackingId}?nid=${encodeURIComponent(userNid)}`);
      setComplain(res.data);
    } catch (err) {
      setError('Complain not found for this Tracking ID.');
    }
    setLoading(false);
  };

  return (
    <div style={{ background: '#232831', minHeight: '100vh', padding: '0', fontFamily: 'Fira Mono, monospace' }}>
      <div style={{ paddingTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: 22, marginBottom: 18, letterSpacing: 1 }}>Tracking ID :</div>
        <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
          <input
            value={trackingId}
            onChange={e => setTrackingId(e.target.value)}
            placeholder="Enter Tracking ID"
            style={{ fontSize: 20, borderRadius: 12, border: 'none', padding: '8px 32px', textAlign: 'center', background: '#f5f6fa' }}
          />
          <button type="submit" style={{ marginLeft: 16, padding: '8px 24px', borderRadius: 12, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 600, fontSize: 18, cursor: 'pointer' }} disabled={loading}>{loading ? 'Loading...' : 'Track'}</button>
        </form>
        {error && <div style={{ color: '#ff6b6b', marginBottom: 18 }}>{error}</div>}
        {complain && (
          <div style={{ background: '#232b36', borderRadius: 18, color: '#fff', padding: 32, minWidth: 340, maxWidth: 540, fontSize: 18, boxShadow: '0 4px 24px #0003' }}>
            <div><b>Complain ID:</b> {complain.trackingId}</div>
            <div><b>Complain By:</b> {complain.nid}</div>
            <div><b>Complain To:</b> {complain.complainTo}</div>
            <div><b>Complain Tag:</b> {complain.tags}</div>
            <div><b>Complain Subject:</b> {complain.details && complain.details.split('\n')[0]}</div>
            <div style={{ margin: '12px 0' }}><b>Complain Details:</b><br />{complain.details}</div>
            <div style={{ marginTop: 18 }}><b>Update:</b> {complain.update || 'No update yet.'}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tracker;
