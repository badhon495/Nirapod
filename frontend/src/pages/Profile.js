import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Profile.css';

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
    }).catch(err => {
      console.error('Error loading user data:', err);
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

  if (!user) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">Profile Settings</h1>
        <p className="profile-subtitle">Manage your personal information and security settings</p>
      </div>
      
      <form onSubmit={handleProfileUpdate} className="profile-form">
        <div className="profile-photo-section">
          <div className="profile-photo-container">
            {user.userPhoto && user.userPhoto !== 'null' && user.userPhoto !== '' ? (
              <img
                src={user.userPhoto.startsWith('/uploads/') ? `http://localhost:8080/${user.userPhoto.replace('/uploads/', '')}` : `http://localhost:8080/${user.userPhoto}`}
                alt="Profile"
                className="profile-photo"
              />
            ) : (
              <div 
                className="social-avatar-fallback profile-photo-placeholder"
                style={{
                  background: (() => {
                    const name = user.name || 'User';
                    const colors = [
                      'linear-gradient(135deg, #667eea, #764ba2)',
                      'linear-gradient(135deg, #f093fb, #f5576c)',
                      'linear-gradient(135deg, #4facfe, #00f2fe)',
                      'linear-gradient(135deg, #a8edea, #fed6e3)',
                      'linear-gradient(135deg, #ffecd2, #fcb69f)',
                      'linear-gradient(135deg, #667eea, #764ba2)',
                      'linear-gradient(135deg, #ff9a9e, #fecfef)',
                      'linear-gradient(135deg, #a18cd1, #fbc2eb)',
                      'linear-gradient(135deg, #fad0c4, #ffd1ff)',
                      'linear-gradient(135deg, #84fab0, #8fd3f4)'
                    ];
                    let hash = 0;
                    for (let i = 0; i < name.length; i++) {
                      hash = name.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    return colors[Math.abs(hash) % colors.length];
                  })()
                }}
              >
                {(() => {
                  const name = user.name || 'User';
                  const initials = name.split(' ')
                    .map(word => word.charAt(0))
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  return initials || 'U';
                })()}
              </div>
            )}
          </div>
          <input type="file" name="photo" id="photo" style={{ display: 'none' }} onChange={handleChange} accept="image/*" />
          <button type="button" onClick={() => document.getElementById('photo').click()} className="profile-photo-upload-btn">
            Choose Photo
          </button>
        </div>

        <div className="profile-form-row">
          <span className="profile-form-label">Name:</span>
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} className="profile-form-input" required />
        </div>
        
        <div className="profile-form-row">
          <span className="profile-form-label">Phone:</span>
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="profile-form-input" />
        </div>
        
        <div className="profile-form-row">
          <span className="profile-form-label">Email:</span>
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="profile-form-input" />
        </div>
        
        <div className="profile-form-row">
          <span className="profile-form-label">NID:</span>
          <input name="nid" placeholder="NID" value={user.nid || ''} readOnly className="profile-form-input" />
        </div>
        
        <div className="profile-form-row">
          <span className="profile-form-label">Present Address:</span>
          <input name="presentAddress" placeholder="Present Address" value={form.presentAddress} onChange={handleChange} className="profile-form-input" />
        </div>
        
        <div className="profile-form-row">
          <span className="profile-form-label">Permanent Address:</span>
          <input name="permanentAddress" placeholder="Permanent Address" value={form.permanentAddress} onChange={handleChange} className="profile-form-input" />
        </div>
        
        <div className="profile-form-row">
          <span className="profile-form-label">Utility Bill Customer ID:</span>
          <input name="utilityBillCustomerId" placeholder="Utility Bill Customer ID" value={form.utilityBillCustomerId} onChange={handleChange} className="profile-form-input" />
        </div>
        
        <div className="profile-form-row">
          <span className="profile-form-label">Utility Bill Photo:</span>
          <input type="file" name="utilityBillPhoto" onChange={handleChange} className="profile-form-input" />
        </div>
        
        <div className="profile-form-row">
          <span className="profile-form-label">Passport:</span>
          <input name="passport" placeholder="Passport" value={form.passport} onChange={handleChange} className="profile-form-input" />
        </div>
        
        <div className="profile-form-row">
          <span className="profile-form-label">Passport Image:</span>
          <input type="file" name="passportImg" onChange={handleChange} className="profile-form-input" />
        </div>
        
        <div className="profile-form-row">
          <span className="profile-form-label">Driving License:</span>
          <input name="drivingLicense" placeholder="Driving License" value={form.drivingLicense} onChange={handleChange} className="profile-form-input" />
        </div>
        
        <div className="profile-form-row">
          <span className="profile-form-label">Driving License Image:</span>
          <input type="file" name="drivingLicenseImg" onChange={handleChange} className="profile-form-input" />
        </div>
        
        <button type="submit" className="profile-update-btn">Update Profile</button>
        {message && <div className={`profile-message ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}
      </form>
      
      <form onSubmit={handleChangePassword} className="password-change-form">
        <h3 className="password-change-title">Change Password</h3>
        <input name="oldPassword" type="password" placeholder="Old Password" value={pwForm.oldPassword} onChange={handlePwChange} className="password-input" required />
        <input name="newPassword" type="password" placeholder="New Password" value={pwForm.newPassword} onChange={handlePwChange} className="password-input" required />
        <input name="confirmPassword" type="password" placeholder="Confirm New Password" value={pwForm.confirmPassword} onChange={handlePwChange} className="password-input" required />
        <button type="submit" className="password-change-btn">Change Password</button>
        {pwMsg && <div className={`profile-message ${pwMsg.includes('success') ? 'success' : 'error'}`}>{pwMsg}</div>}
      </form>
    </div>
  );
}

export default Profile;
