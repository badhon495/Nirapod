import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Profile() {
  const userId = localStorage.getItem('nirapod_identifier'); // Use NID from localStorage
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    presentAddress: '',
    permanentAddress: '',
    utilityBillCustomerId: '',
    passport: '',
    drivingLicense: '',
  });
  const [files, setFiles] = useState({
    photo: null,
    utilityBillPhoto: null,
    passportImg: null,
    drivingLicenseImg: null,
  });
  const [message, setMessage] = useState('');
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    axios.get(`/api/user/${userId}`).then(res => {
      setUser(res.data);
      setForm({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        presentAddress: res.data.presentAddress || '',
        permanentAddress: res.data.permanentAddress || '',
        utilityBillCustomerId: res.data.utilityBillCustomerId || res.data.utilityBillCustomerID || res.data.utilityBillId || '',
        passport: res.data.passport || '',
        drivingLicense: res.data.drivingLicense || '',
      });
    });
  }, [userId]);

  const handleChange = e => {
    const { name, value, files: fileInput } = e.target;
    if (fileInput) {
      setFiles(f => ({ ...f, [name]: fileInput[0] }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleProfileUpdate = async e => {
    e.preventDefault();
    setMessage('');
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    Object.entries(files).forEach(([key, value]) => { if (value) formData.append(key, value); });
    try {
      await axios.put(`/api/user/${userId}/profile`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('Profile updated successfully.');
    } catch {
      setMessage('Failed to update profile.');
    }
  };

  const handlePwChange = e => setPwForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleChangePassword = async e => {
    e.preventDefault();
    setPwMsg('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg('Passwords do not match.');
      return;
    }
    try {
      await axios.post(`/api/user/${userId}/change-password`, pwForm);
      setPwMsg('Password changed successfully.');
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setPwMsg('Failed to change password.');
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile-container" style={{ background: '#232831', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleProfileUpdate} style={{ background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: 480 }}>
        <label htmlFor="photo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12, minHeight: 130 }}>
          {user.userPhoto && user.userPhoto !== 'null' && user.userPhoto !== '' ? (
            <img
              src={user.userPhoto.startsWith('/uploads/') ? `http://localhost:8080/${user.userPhoto.replace('/uploads/', '')}` : `http://localhost:8080/${user.userPhoto}`}
              alt="Profile"
              style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, border: '2px solid #232b36' }}
            />
          ) : (
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 500, marginBottom: 12 }}>
              No Photo
            </div>
          )}
          <input type="file" name="photo" id="photo" style={{ display: 'none' }} onChange={handleChange} accept="image/*" />
          <button type="button" onClick={() => document.getElementById('photo').click()} style={{ background: '#232b36', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', marginTop: 4, cursor: 'pointer' }}>Choose Photo</button>
        </label>
        <div style={profileRowStyle}><span style={profileLabelStyle}>Name :</span><input name="name" placeholder="Name" value={form.name} onChange={handleChange} style={profileInputStyle} required /></div>
        <div style={profileRowStyle}><span style={profileLabelStyle}>Phone :</span><input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} style={profileInputStyle} /></div>
        <div style={profileRowStyle}><span style={profileLabelStyle}>Email :</span><input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={profileInputStyle} /></div>
        <div style={profileRowStyle}><span style={profileLabelStyle}>NID :</span><input name="nid" placeholder="NID" value={user.nid || ''} readOnly style={{ ...profileInputStyle, background: '#f5f6fa', color: '#232b36', fontWeight: 500 }} /></div>
        <div style={profileRowStyle}><span style={profileLabelStyle}>Present Address :</span><input name="presentAddress" placeholder="Present Address" value={form.presentAddress} onChange={handleChange} style={profileInputStyle} /></div>
        <div style={profileRowStyle}><span style={profileLabelStyle}>Permanent Address :</span><input name="permanentAddress" placeholder="Permanent Address" value={form.permanentAddress} onChange={handleChange} style={profileInputStyle} /></div>
        <div style={profileRowStyle}><span style={profileLabelStyle}>Utility Bill Customer ID :</span><input name="utilityBillCustomerId" placeholder="Utility Bill Customer ID" value={form.utilityBillCustomerId} onChange={handleChange} style={profileInputStyle} /></div>
        <div style={profileRowStyle}><span style={profileLabelStyle}>Utility Bill Photo :</span><input type="file" name="utilityBillPhoto" onChange={handleChange} style={profileInputStyle} /></div>
        <div style={profileRowStyle}><span style={profileLabelStyle}>Passport :</span><input name="passport" placeholder="Passport" value={form.passport} onChange={handleChange} style={profileInputStyle} /></div>
        <div style={profileRowStyle}><span style={profileLabelStyle}>Passport Image :</span><input type="file" name="passportImg" onChange={handleChange} style={profileInputStyle} /></div>
        <div style={profileRowStyle}><span style={profileLabelStyle}>Driving License :</span><input name="drivingLicense" placeholder="Driving License" value={form.drivingLicense} onChange={handleChange} style={profileInputStyle} /></div>
        <div style={profileRowStyle}><span style={profileLabelStyle}>Driving License Image :</span><input type="file" name="drivingLicenseImg" onChange={handleChange} style={profileInputStyle} /></div>
        <button type="submit" style={{ background: '#fff', color: '#232b36', border: 'none', borderRadius: 12, padding: '10px 38px', fontWeight: 600, fontSize: 18, marginTop: 12 }}>Update</button>
        {message && <div style={{ color: message.includes('success') ? '#22c55e' : '#ef4444', fontWeight: 500 }}>{message}</div>}
      </form>
      <form onSubmit={handleChangePassword} style={{ background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 420, marginTop: 32 }}>
        <h3 style={{ color: '#fff', marginBottom: 8 }}>Change Password</h3>
        <input name="oldPassword" type="password" placeholder="Old Password" value={pwForm.oldPassword} onChange={handlePwChange} style={inputStyle} required />
        <input name="newPassword" type="password" placeholder="New Password" value={pwForm.newPassword} onChange={handlePwChange} style={inputStyle} required />
        <input name="confirmPassword" type="password" placeholder="Confirm New Password" value={pwForm.confirmPassword} onChange={handlePwChange} style={inputStyle} required />
        <button type="submit" style={{ background: '#fff', color: '#232b36', border: 'none', borderRadius: 12, padding: '8px 32px', fontWeight: 600, fontSize: 16 }}>Change Password</button>
        {pwMsg && <div style={{ color: pwMsg.includes('success') ? '#22c55e' : '#ef4444', fontWeight: 500 }}>{pwMsg}</div>}
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  borderRadius: 12,
  padding: '10px 18px',
  fontSize: 18,
  marginBottom: 0,
  border: 'none',
  background: '#f5f6fa',
  color: '#232b36',
  fontWeight: 500,
  marginTop: 0,
};

const profileInputStyle = {
  flex: 1,
  width: '100%',
  borderRadius: 16,
  padding: '10px 18px',
  fontSize: 20,
  marginBottom: 0,
  border: 'none',
  background: '#f5f6fa',
  color: '#232b36',
  fontWeight: 500,
  marginTop: 0,
  fontFamily: 'monospace',
};

const profileRowStyle = { display: 'flex', alignItems: 'center', width: '100%', marginBottom: 12, gap: 8, justifyContent: 'center' };
const profileLabelStyle = { minWidth: 240, color: '#fff', fontFamily: 'monospace', fontSize: 15, textAlign: 'right', marginRight: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' };

export default Profile;
