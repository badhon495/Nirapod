import React, { useState } from 'react';
import axios from 'axios';
import './Signup.css';
import logo from '../image/logo.png';

const initialForm = {
  name: '', phoneNumber: '', email: '', password: '', confirmPassword: '',
  otp: '', userType: 'NORMAL', nid: '', presentAddress: '', permanentAddress: '',
  drivingLicence: '', passport: '', affiliation: '', identificationNumber: '', registrationNumber: '',
  nidFile: null, drivingLicenceFile: null, passportFile: null, utilityBillFile: null, photoFile: null, affiliationDocFile: null,
  utilityBillCustomerId: ''
};

function Signup() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({ ...f, [name]: files ? files[0] : value }));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(f => ({ ...f, password: pwd, confirmPassword: pwd }));
  };

  const handleNext = async e => {
    e.preventDefault();
    setMessage('');
    if (step === 1) {
      if (form.password !== form.confirmPassword) {
        setMessage('Passwords do not match');
        return;
      }
      try {
        await axios.post('/api/auth/send-otp', {
          email: form.email,
          phoneNumber: form.phoneNumber
        });
        setStep(2);
      } catch (err) {
        setMessage('Failed to send OTP. Please check your email address and try again.');
      }
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      // Prepare FormData for all fields and files
      const formData = new FormData();
      // Map userType/affiliation to backend categories
      let categories = 'normal';
      if (form.userType === 'PRIVILEGED') {
        if (form.affiliation === 'Police Dept') categories = 'police';
        else if (form.affiliation === 'Fire Dept') categories = 'fire';
        else if (form.affiliation === 'Animal Shelter') categories = 'animal';
        else if (form.affiliation === 'City Corp') categories = 'city';
      }
      formData.append('categories', categories);
      formData.append('phoneNumber', form.phoneNumber); // Changed from 'phone' to 'phoneNumber'
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'utilityBillFile') {
            formData.append('utilityBillPhoto', value);
          } else if (key === 'photoFile') {
            formData.append('userPhoto', value);
          } else if (key === 'nidFile') {
            formData.append('nidPhoto', value);
          } else if (key === 'userType' || key === 'affiliation' || key === 'phoneNumber') {
            // skip, already handled or mapped
          } else if (value instanceof File || (typeof value === 'string' && value !== '') || typeof value === 'number') {
            formData.append(key, value);
          }
        }
      });
      try {
        await axios.post('/api/auth/signup', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          maxContentLength: 20 * 1024 * 1024, // 20MB
          maxBodyLength: 20 * 1024 * 1024 // 20MB
        });
        setStep(5);
      } catch (err) {
        if (err.response && err.response.data) {
          setMessage(typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data));
        } else {
          setMessage('Signup failed');
        }
      }
    }
  };

  const handlePrevious = (e) => {
    e.preventDefault();
    if (step > 1 && step < 5) setStep(step - 1);
  };

  return (
    <div className="signup-bg">
      <div className="signup-split">
        <div className="signup-left">
          <img src={logo} alt="Nirapod Logo" className="signup-logo-img" />
          <div className="signup-logo">Nirapod</div>
          <div className="signup-tagline">Account for Your Digital Rights</div>
        </div>
        <div className="signup-right">
          <div className="signup-form-box">
            <h2>Sign Up</h2>
            {step === 1 && (
              <form onSubmit={handleNext}>
                <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
                <input name="phoneNumber" placeholder="Phone Number" value={form.phoneNumber} onChange={handleChange} required />
                <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                <div className="signup-password-input-wrapper">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="signup-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                <div className="signup-password-input-wrapper">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="signup-eye-btn"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? '🙈' : '👁'}
                  </button>
                </div>
                <button type="button" className="signup-password-generator-btn" onClick={generatePassword}>Generate Password</button>
                <button className="signup-btn" type="submit">Next</button>
              </form>
            )}
            {step === 2 && (
              <form onSubmit={handleNext}>
                <input name="otp" placeholder="OTP" value={form.otp} onChange={handleChange} required />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button type="button" className="signup-btn" onClick={handlePrevious}>Previous</button>
                  <button className="signup-btn" type="submit">Next</button>
                </div>
                <button type="button" className="signup-link-btn" onClick={() => setMessage('Resend not implemented')}>Resend Code</button>
              </form>
            )}
            {step === 3 && (
              <form onSubmit={handleNext}>
                <input name="nid" placeholder="NID" value={form.nid} onChange={handleChange} required />
                <input name="presentAddress" placeholder="Present Address" value={form.presentAddress} onChange={handleChange} required />
                <input name="permanentAddress" placeholder="Permanent Address" value={form.permanentAddress} onChange={handleChange} required />
                <input name="drivingLicence" placeholder="Driving Licence (optional)" value={form.drivingLicence} onChange={handleChange} />
                <input name="passport" placeholder="Passport (optional)" value={form.passport} onChange={handleChange} />
                <input name="utilityBillCustomerId" placeholder="Utility Bill Customer ID" value={form.utilityBillCustomerId} onChange={handleChange} required />
                <select name="userType" value={form.userType} onChange={handleChange} required>
                  <option value="NORMAL">Normal User</option>
                  <option value="PRIVILEGED">Privileged User</option>
                </select>
                {form.userType === 'PRIVILEGED' && (
                  <>
                    <select name="affiliation" value={form.affiliation} onChange={handleChange} required>
                      <option value="">Select Affiliation</option>
                      <option value="Police Dept">Police Dept</option>
                      <option value="Fire Dept">Fire Dept</option>
                      <option value="City Corp">City Corp</option>
                      <option value="Animal Shelter">Animal Shelter</option>
                    </select>
                    {(form.affiliation === 'Police Dept' || form.affiliation === 'Fire Dept' || form.affiliation === 'City Corp') && (
                      <input name="identificationNumber" placeholder="Identification Number" value={form.identificationNumber} onChange={handleChange} required />
                    )}
                    {form.affiliation === 'Animal Shelter' && (
                      <input name="registrationNumber" placeholder="Registration Number" value={form.registrationNumber} onChange={handleChange} required />
                    )}
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button type="button" className="signup-btn" onClick={handlePrevious}>Previous</button>
                  <button className="signup-btn" type="submit">Next</button>
                </div>
              </form>
            )}
            {step === 4 && (
              <form onSubmit={handleNext}>
                <label>NID File: <input type="file" name="nidFile" onChange={handleChange} required /></label>
                <label>Driving Licence File: <input type="file" name="drivingLicenceFile" onChange={handleChange} /></label>
                <label>Passport File: <input type="file" name="passportFile" onChange={handleChange} /></label>
                <label>Utility Bill File: <input type="file" name="utilityBillFile" onChange={handleChange} required /></label>
                <label>Photo (webcam): <input type="file" name="photoFile" onChange={handleChange} required /></label>
                {form.userType === 'PRIVILEGED' && (
                  <label>Affiliation Doc: <input type="file" name="affiliationDocFile" onChange={handleChange} required /></label>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button type="button" className="signup-btn" onClick={handlePrevious}>Previous</button>
                  <button className="signup-btn" type="submit">Next</button>
                </div>
              </form>
            )}
            {step === 5 && (
              <div>
                <h3>Your signup is complete. Account approval takes 1-48 hours. Check your registered email for updates.</h3>
                <button className="signup-btn" onClick={() => window.location.href = '/login'}>Done</button>
              </div>
            )}
            {message && <div className="signup-error">{message}</div>}
            <div className="signup-links">
              <a href="/login" className="signup-link">Already has an account?</a>
            </div>
          </div>
        </div>
      </div>
      <footer className="signup-footer">
        <a href="/faq" className="footer-link">FAQ</a>
        <a href="/ReachOut" className="footer-link">Reach out</a>
        <a href="/contact" className="footer-link">Contact</a>
      </footer>
    </div>
  );
}

export default Signup;
