import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Signup.css';
import logo from '../image/logo.png';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import googleIcon from '../image/google-icon.png';
import useGoogleSDK from '../hooks/useGoogleSDK';

const initialForm = {
  name: '', phoneNumber: '', email: '', password: '', confirmPassword: '',
  otp: '', userType: 'NORMAL', nid: '', presentAddress: '', permanentAddress: '',
  drivingLicence: '', passport: '', affiliation: '', identificationNumber: '', registrationNumber: '',
  nidFile: null, drivingLicenceFile: null, passportFile: null, utilityBillFile: null, photoFile: null, affiliationDocFile: null,
  utilityBillCustomerId: ''
};

const fileInputLabels = {
  nidFile: 'NID File',
  drivingLicenceFile: 'Driving Licence',
  passportFile: 'Passport',
  utilityBillFile: 'Utility Bill',
  photoFile: 'Your Photo',
  affiliationDocFile: 'Affiliation Doc'
};

function Signup() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const { isReady: googleSDKReady } = useGoogleSDK();

  const [userTypeOpen, setUserTypeOpen] = useState(false);
  const [affiliationOpen, setAffiliationOpen] = useState(false);
  const userTypeRef = useRef(null);
  const affiliationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userTypeRef.current && !userTypeRef.current.contains(event.target)) {
        setUserTypeOpen(false);
      }
      if (affiliationRef.current && !affiliationRef.current.contains(event.target)) {
        setAffiliationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUserTypeSelect = (value) => {
    setForm(f => ({ ...f, userType: value }));
    setUserTypeOpen(false);
  };

  const handleAffiliationSelect = (value) => {
    setForm(f => ({ ...f, affiliation: value }));
    setAffiliationOpen(false);
  };

  // Google Signup handler
  const handleGoogleSignup = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;
      const res = await axios.post('/api/auth/google-signup', { idToken });
      if (res.data && res.data.user) {
        setForm(f => ({
          ...f,
          name: res.data.user.name || '',
          email: res.data.user.email || '',
        }));
        setMessage('Google account detected. Please fill in the remaining details.');
        setStep(3); // Go directly to password step
        setIsGoogleSignup(true);
      } else {
        setMessage('Google signup failed.');
      }
    } catch (err) {
      setMessage('Google signup failed or user already exists.');
    }
  };

  // Handle Google button error
  const handleGoogleError = () => {
    setMessage('Google signup failed');
  };

  // Custom Google Signup Button Click Handler
  const handleCustomGoogleSignup = () => {
    // This will be implemented if the GoogleLogin component fails
    setMessage('Google signup is temporarily unavailable. Please use email signup.');
  };

  const handleChange = e => {
    const { name, value, files } = e.target;

    if (e.target.type === 'file') {
      const file = files[0];
      if (!file) {
        setForm(f => ({ ...f, [name]: null }));
        return;
      }

      // --- Validation Logic ---
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      const maxSize = 2 * 1024 * 1024; // 2MB
      const label = fileInputLabels[name] || 'The file';

      if (!allowedTypes.includes(file.type)) {
        setMessage(`${label} has an invalid file type. Please select an image or PDF.`);
        e.target.value = null; // Clear the invalid file selection
        return;
      }

      if (file.size > maxSize) {
        setMessage(`${label} is too large. Maximum size is 2MB.`);
        e.target.value = null; // Clear the invalid file selection
        return;
      }
      // --- End Validation Logic ---
    }

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
      if (isGoogleSignup) {
        setStep(3); // Skip directly to password step for Google signup
        return;
      }
      try {
        await axios.post('/api/auth/send-otp', {
          email: form.email,
        });
        setStep(2);
      } catch (err) {
        setMessage('Failed to send OTP. Please check your email address and try again.');
      }
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (form.password !== form.confirmPassword) {
        setMessage('Passwords do not match');
        return;
      }
      if (!form.password || !form.confirmPassword) {
        setMessage('Password is required');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      // Validate privileged user requirements before proceeding to file upload
      if (form.userType === 'PRIVILEGED') {
        if (!form.affiliation) {
          setMessage('Please select an affiliation for privileged users');
          return;
        }
        
        // Check identification number for police, fire, city corp
        if ((form.affiliation === 'Police Dept' || form.affiliation === 'Fire Dept' || form.affiliation === 'City Corp') 
            && (!form.identificationNumber || form.identificationNumber.trim() === '')) {
          setMessage('Identification number is required for ' + form.affiliation);
          return;
        }
        
        // Check registration number for animal shelter
        if (form.affiliation === 'Animal Shelter' && (!form.registrationNumber || form.registrationNumber.trim() === '')) {
          setMessage('Registration number is required for Animal Shelter');
          return;
        }
      }
      
      setStep(5);
    } else if (step === 5) {
      // Additional validation for file uploads for privileged users
      if (form.userType === 'PRIVILEGED' && (!form.affiliationDocFile)) {
        setMessage('Affiliation document is required for privileged users');
        return;
      }
      
      // Debug: Log form state before processing
      console.log('=== FRONTEND SIGNUP DEBUG ===');
      console.log('Form userType:', form.userType);
      console.log('Form affiliation:', form.affiliation);
      console.log('Form identificationNumber:', form.identificationNumber);
      console.log('Form registrationNumber:', form.registrationNumber);
      console.log('Form affiliationDocFile:', form.affiliationDocFile);

      const formData = new FormData();

      // Append all text and number values from the form state
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phoneNumber', form.phoneNumber);
      formData.append('password', form.password);
      formData.append('nid', form.nid);
      formData.append('presentAddress', form.presentAddress);
      formData.append('permanentAddress', form.permanentAddress);
      formData.append('drivingLicence', form.drivingLicence);
      formData.append('passport', form.passport);
      formData.append('utilityBillCustomerId', form.utilityBillCustomerId);

      // Handle category mapping
      let categories = 'normal';
      if (form.userType === 'PRIVILEGED') {
        if (form.affiliation === 'Police Dept') categories = 'police';
        else if (form.affiliation === 'Fire Dept') categories = 'fire';
        else if (form.affiliation === 'Animal Shelter') categories = 'animal';
        else if (form.affiliation === 'City Corp') categories = 'city';
        formData.append('affiliation', form.affiliation);
        formData.append('identificationNumber', form.identificationNumber);
        formData.append('registrationNumber', form.registrationNumber);
      }
      
      console.log('Final categories being sent:', categories);
      formData.append('categories', categories);

      // Append files with correct backend keys
      if (form.nidFile) formData.append('nidPhoto', form.nidFile);
      if (form.drivingLicenceFile) formData.append('drivingLicencePhoto', form.drivingLicenceFile);
      if (form.passportFile) formData.append('passportPhoto', form.passportFile);
      if (form.utilityBillFile) formData.append('utilityBillPhoto', form.utilityBillFile);
      if (form.photoFile) formData.append('userPhoto', form.photoFile);
      if (form.affiliationDocFile) formData.append('affiliationDoc', form.affiliationDocFile);

      try {
        await axios.post('/api/auth/signup', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setStep(6);
      } catch (err) {
        let errorMessage = 'Signup failed. Please try again.';
        if (err.response && err.response.data) {
          // If the backend sends a specific error message, use it
          errorMessage = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
        }
        setMessage(errorMessage);
      }
    }
  };

  const handlePrevious = (e) => {
    e.preventDefault();
    if (step > 1 && step < 6) setStep(step - 1);
  };

  return (
    <div className="signup-bg">
      <div className="signup-split">
        <div className="signup-left">
          <img src={logo} alt="Nirapod Logo" className="signup-logo-img" />
          <div className="signup-logo">Nirapod</div>
          <div className="signup-tagline">Your Safety, Our Priority</div>
        </div>
        <div className="signup-right">
          <div className="signup-form-box">
            <h2>Sign Up</h2>
            {step === 1 && (
              <>
                {/* Elegant Google Sign-Up Button with Placeholder */}
                <div className={`google-auth-wrapper ${googleSDKReady ? 'loaded' : 'loading'}`}>
                  <div className="google-button-placeholder">
                    <div className="google-placeholder-icon"></div>
                    <span>Sign up with Google</span>
                  </div>
                  <div className="google-button-real">
                    {googleSDKReady && (
                      <GoogleLogin
                        onSuccess={handleGoogleSignup}
                        onError={handleGoogleError}
                        text="signup_with"
                        theme="outline"
                        size="large"
                        shape="rectangular"
                        width="100%"
                        logo_alignment="center"
                        useOneTap={false}
                      />
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="signup-divider">
                  <span>OR</span>
                </div>

                {/* Manual Signup Form */}
                <form onSubmit={handleNext}>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="input-wrapper">
                    <span className="input-icon">✉️</span>
                    <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} required />
                  </div>
                  <button className="signup-btn" type="submit">Sign up with Email</button>
                </form>
              </>
            )}
            {step === 2 && !isGoogleSignup && (
              <form onSubmit={handleNext}>
                <div className="input-wrapper">
                  <span className="input-icon">#️⃣</span>
                  <input name="otp" placeholder="OTP" value={form.otp} onChange={handleChange} required />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button type="button" className="signup-btn" onClick={handlePrevious}>Previous</button>
                  <button className="signup-btn" type="submit">Next</button>
                </div>
                <div className="resend-code-wrapper">
                  <a href="#" onClick={(e) => {e.preventDefault(); setMessage('Resend not implemented')}} className="signup-link-btn resend-btn">Resend Code</a>
                </div>
              </form>
            )}
            {step === 2 && isGoogleSignup && (
              <div style={{marginBottom: 16}}>
                <div>OTP step skipped for Google signup.</div>
                <button className="signup-btn" onClick={handleNext}>Next</button>
              </div>
            )}
            {step === 3 && (
              <form onSubmit={handleNext}>
                <div className="input-wrapper">
                  <span className="input-icon">📞</span>
                  <input 
                    name="phoneNumber" 
                    placeholder="Phone Number (10-15 digits)" 
                    value={form.phoneNumber} 
                    onChange={handleChange} 
                    pattern="[0-9]{10,15}"
                    title="Phone number must be between 10 and 15 digits"
                    required 
                  />
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
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
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
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
                <div className="generate-password-wrapper">
                  <button type="button" className="signup-password-generator-btn" onClick={generatePassword}>Generate Password</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button type="button" className="signup-btn" onClick={handlePrevious}>Previous</button>
                  <button className="signup-btn" type="submit">Next</button>
                </div>
              </form>
            )}
            {step === 4 && (
              <form onSubmit={handleNext}>
                <div className="input-wrapper">
                  <span className="input-icon">🆔</span>
                  <input 
                    name="nid" 
                    placeholder="NID (10-17 characters)" 
                    value={form.nid} 
                    onChange={handleChange} 
                    minLength="10"
                    maxLength="17"
                    pattern="[0-9A-Za-z]{10,17}"
                    title="NID must be between 10 and 17 characters"
                    required 
                  />
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">🏠</span>
                  <input name="presentAddress" placeholder="Present Address" value={form.presentAddress} onChange={handleChange} required />
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">🏡</span>
                  <input name="permanentAddress" placeholder="Permanent Address" value={form.permanentAddress} onChange={handleChange} required />
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">🚗</span>
                  <input name="drivingLicence" placeholder="Driving Licence (optional)" value={form.drivingLicence} onChange={handleChange} />
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">✈️</span>
                  <input name="passport" placeholder="Passport (optional)" value={form.passport} onChange={handleChange} />
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">💡</span>
                  <input name="utilityBillCustomerId" placeholder="Utility Bill Customer ID" value={form.utilityBillCustomerId} onChange={handleChange} required />
                </div>
                <div className="input-wrapper custom-select-wrapper" ref={userTypeRef}>
                  <span className="input-icon">👥</span>
                  <div className="custom-select-value" onClick={() => setUserTypeOpen(!userTypeOpen)}>
                    {form.userType === 'NORMAL' ? 'Normal User' : 'Privileged User'}
                    <span className={`select-arrow ${userTypeOpen ? 'open' : ''}`}></span>
                  </div>
                  {userTypeOpen && (
                    <ul className="custom-select-options">
                      <li onClick={() => handleUserTypeSelect('NORMAL')}>Normal User</li>
                      <li onClick={() => handleUserTypeSelect('PRIVILEGED')}>Privileged User</li>
                    </ul>
                  )}
                </div>
                {form.userType === 'PRIVILEGED' && (
                  <>
                    <div className="input-wrapper custom-select-wrapper" ref={affiliationRef}>
                      <span className="input-icon">🏢</span>
                      <div className="custom-select-value" onClick={() => setAffiliationOpen(!affiliationOpen)}>
                        {form.affiliation || 'Select Affiliation'}
                        <span className={`select-arrow ${affiliationOpen ? 'open' : ''}`}></span>
                      </div>
                      {affiliationOpen && (
                        <ul className="custom-select-options">
                          <li onClick={() => handleAffiliationSelect('Police Dept')}>Police Dept</li>
                          <li onClick={() => handleAffiliationSelect('Fire Dept')}>Fire Dept</li>
                          <li onClick={() => handleAffiliationSelect('City Corp')}>City Corp</li>
                          <li onClick={() => handleAffiliationSelect('Animal Shelter')}>Animal Shelter</li>
                        </ul>
                      )}
                    </div>
                    {(form.affiliation === 'Police Dept' || form.affiliation === 'Fire Dept' || form.affiliation === 'City Corp') && (
                      <div className="input-wrapper">
                        <span className="input-icon">#️⃣</span>
                        <input name="identificationNumber" placeholder="Identification Number" value={form.identificationNumber} onChange={handleChange} required />
                      </div>
                    )}
                    {form.affiliation === 'Animal Shelter' && (
                      <div className="input-wrapper">
                        <span className="input-icon">#️⃣</span>
                        <input name="registrationNumber" placeholder="Registration Number" value={form.registrationNumber} onChange={handleChange} required />
                      </div>
                    )}
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button type="button" className="signup-btn" onClick={handlePrevious}>Previous</button>
                  <button className="signup-btn" type="submit">Next</button>
                </div>
              </form>
            )}
            {step === 5 && (
              <form onSubmit={handleNext}>
                <label htmlFor="nidFile" className="file-input-wrapper">
                  <span className="file-input-label">NID File</span>
                  <span className="file-name-display">{form.nidFile ? form.nidFile.name : 'No file selected'}</span>
                </label>
                <input id="nidFile" type="file" name="nidFile" className="hidden-file-input" onChange={handleChange} required />

                <label htmlFor="drivingLicenceFile" className="file-input-wrapper">
                  <span className="file-input-label">Driving Licence</span>
                  <span className="file-name-display">{form.drivingLicenceFile ? form.drivingLicenceFile.name : 'No file selected'}</span>
                </label>
                <input id="drivingLicenceFile" type="file" name="drivingLicenceFile" className="hidden-file-input" onChange={handleChange} />

                <label htmlFor="passportFile" className="file-input-wrapper">
                  <span className="file-input-label">Passport</span>
                  <span className="file-name-display">{form.passportFile ? form.passportFile.name : 'No file selected'}</span>
                </label>
                <input id="passportFile" type="file" name="passportFile" className="hidden-file-input" onChange={handleChange} />

                <label htmlFor="utilityBillFile" className="file-input-wrapper">
                  <span className="file-input-label">Utility Bill</span>
                  <span className="file-name-display">{form.utilityBillFile ? form.utilityBillFile.name : 'No file selected'}</span>
                </label>
                <input id="utilityBillFile" type="file" name="utilityBillFile" className="hidden-file-input" onChange={handleChange} required />

                <label htmlFor="photoFile" className="file-input-wrapper">
                  <span className="file-input-label">Your Photo</span>
                  <span className="file-name-display">{form.photoFile ? form.photoFile.name : 'No file selected'}</span>
                </label>
                <input id="photoFile" type="file" name="photoFile" className="hidden-file-input" onChange={handleChange} required />

                {form.userType === 'PRIVILEGED' && (
                  <>
                    <label htmlFor="affiliationDocFile" className="file-input-wrapper">
                      <span className="file-input-label">Affiliation Doc</span>
                      <span className="file-name-display">{form.affiliationDocFile ? form.affiliationDocFile.name : 'No file selected'}</span>
                    </label>
                    <input id="affiliationDocFile" type="file" name="affiliationDocFile" className="hidden-file-input" onChange={handleChange} required />
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: '1rem' }}>
                  <button type="button" className="signup-btn" onClick={handlePrevious}>Previous</button>
                  <button className="signup-btn" type="submit">Next</button>
                </div>
              </form>
            )}
            {step === 6 && (
              <div>
                <h3>Your signup is complete. Check your registered email for updates.</h3>
                <button className="signup-btn" onClick={() => window.location.href = '/login'}>Done</button>
              </div>
            )}
            {message && <div className="signup-error">{message}</div>}
            <div className="signup-links">
              <div className="signup-divider">
                <span>Already have an account?</span>
              </div>
              <a href="/login" className="signup-link-btn login-btn-link">
                Sign in here
              </a>
            </div>
          </div>
        </div>
      </div>
      <footer className="login-footer">
        <a href="/faq" className="footer-link">FAQ</a>
        <a href="/ReachOut" className="footer-link">Reach out</a>
        <a href="/contact" className="footer-link">Contact</a>
      </footer>
    </div>
  );
}

export default Signup;
