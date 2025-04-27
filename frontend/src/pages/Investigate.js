import React, { useState } from 'react';
import axios from 'axios';

const searchOptions = [
  { label: 'NID', value: 'nid', placeholder: 'Enter NID' },
  { label: 'Driving License', value: 'drivingLicence', placeholder: 'Enter Driving License' },
  { label: 'Passport', value: 'passport', placeholder: 'Enter Passport' },
];

function Investigate() {
  const [searchBy, setSearchBy] = useState('nid');
  const [searchValue, setSearchValue] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setUser(null);
    if (!searchValue) return;
    setLoading(true);
    try {
      const params = {};
      params[searchBy] = searchValue;
      const res = await axios.get('/api/user/search', { params });
      setUser(res.data);
    } catch (err) {
      setError('User not found.');
    }
    setLoading(false);
  };

  const selectedOption = searchOptions.find(opt => opt.value === searchBy);

  return (
    <div style={{ background: '#181e26', minHeight: '100vh', padding: 0, fontFamily: 'Fira Mono, monospace' }}>
      <div style={{ paddingTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ color: '#fff', fontSize: 22, letterSpacing: 1, marginRight: 18 }}>Looking for :</span>
          <select
            value={searchBy}
            onChange={e => { setSearchBy(e.target.value); setSearchValue(''); }}
            style={{ fontSize: 20, borderRadius: 12, border: 'none', padding: '8px 32px', textAlign: 'center', background: '#f5f6fa' }}
          >
            {searchOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
          <input
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder={selectedOption.placeholder}
            style={{ fontSize: 20, borderRadius: 12, border: 'none', padding: '8px 32px', textAlign: 'center', background: '#f5f6fa', marginBottom: 8 }}
          />
          <button type="submit" style={{ marginLeft: 16, padding: '8px 24px', borderRadius: 12, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 600, fontSize: 18, cursor: 'pointer' }} disabled={loading}>{loading ? 'Loading...' : 'Search'}</button>
        </form>
        {error && <div style={{ color: '#ff6b6b', marginBottom: 18 }}>{error}</div>}
        {user && (
          <div style={{ background: '#232b36', borderRadius: 18, color: '#fff', padding: 32, minWidth: 340, maxWidth: 540, fontSize: 18, boxShadow: '0 4px 24px #0003', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {/* Centered user photo at the top */}
            {(() => {
              let photo = user.userPhoto || '';
              if (photo.startsWith('/uploads/')) photo = photo.replace('/uploads/', '');
              const backendUrl = 'http://localhost:8080';
              const src = photo ? `${backendUrl}/${photo}` : '';
              return src ? (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: 18 }}>
                  <img src={src} alt="User" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', background: '#eee', margin: '0 auto' }} />
                </div>
              ) : null;
            })()}
            {/* Name as a normal detail row, left-aligned */}
            <div style={{ marginBottom: 8 }}><b>Name :</b> <span style={{ background: '#000', borderRadius: 8, padding: '2px 16px', marginLeft: 8 }}>{user.name}</span></div>
            <div style={{ marginBottom: 8 }}><b>Address :</b> <span style={{ background: '#000', borderRadius: 8, padding: '2px 16px', marginLeft: 8 }}>{user.presentAddress}</span></div>
            <div style={{ marginBottom: 8 }}><b>Phone :</b> <span style={{ background: '#000', borderRadius: 8, padding: '2px 16px', marginLeft: 8 }}>{user.phone}</span></div>
            <div style={{ marginBottom: 8 }}><b>NID :</b> <span style={{ background: '#000', borderRadius: 8, padding: '2px 16px', marginLeft: 8 }}>{user.nid}</span></div>
            {user.passport && <div style={{ marginBottom: 8 }}><b>Passport :</b> <span style={{ background: '#000', borderRadius: 8, padding: '2px 16px', marginLeft: 8 }}>{user.passport}</span></div>}
            {user.drivingLicence && <div style={{ marginBottom: 8 }}><b>Driving License :</b> <span style={{ background: '#000', borderRadius: 8, padding: '2px 16px', marginLeft: 8 }}>{user.drivingLicence}</span></div>}
            <div style={{ marginBottom: 8 }}><b>E-mail :</b> <span style={{ background: '#000', borderRadius: 8, padding: '2px 16px', marginLeft: 8 }}>{user.email}</span></div>
            <div style={{ marginBottom: 8 }}><b>Permanent Address :</b> <span style={{ background: '#000', borderRadius: 8, padding: '2px 16px', marginLeft: 8 }}>{user.permanentAddress}</span></div>
            <div style={{ marginBottom: 8 }}><b>Utility Bill ID :</b> <span style={{ background: '#000', borderRadius: 8, padding: '2px 16px', marginLeft: 8 }}>{user.utilityBillId}</span></div>
            <div style={{ marginBottom: 8 }}><b>Utility Bill Photo :</b> {(() => {
              let photo = user.utilityBillPhoto || '';
              if (photo.startsWith('/uploads/')) photo = photo.replace('/uploads/', '');
              const backendUrl = 'http://localhost:8080';
              const src = photo ? `${backendUrl}/${photo}` : '';
              return src ? (
                <a href={src} target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', textDecoration: 'underline' }}>View</a>
              ) : (
                <span style={{ color: '#aaa' }}>N/A</span>
              );
            })()}
            </div>
            <div style={{ marginBottom: 8 }}><b>NID Photo :</b> {(() => {
              let photo = user.nidPhoto || '';
              if (photo.startsWith('/uploads/')) photo = photo.replace('/uploads/', '');
              const backendUrl = 'http://localhost:8080';
              const src = photo ? `${backendUrl}/${photo}` : '';
              return src ? (
                <a href={src} target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', textDecoration: 'underline' }}>View</a>
              ) : (
                <span style={{ color: '#aaa' }}>N/A</span>
              );
            })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Investigate;
