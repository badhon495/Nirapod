import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreateComplain.css';

function Complain() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    nid: '',
    complainTo: '',
    urgency: '',
    tag: '',
    details: '',
    photos: [],
    postOnTimeline: false,
    district: '',
    area: '',
    location: '',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [photoError, setPhotoError] = useState('');

  const districts = [
    'Dhaka',
    'Chattogram',
    'Khulna',
    'Barisal',
    'Rajshahi',
    'Sylhet',
    'Rangpur',
    'Mymensingh',
  ];
  
  const areaData = {
    Dhaka: ['Dhanmondi','Gulshan','Mirpur','Uttara','Banani','Mohammadpur','Motijheel','Bashundhara','Tejgaon','Shahbagh','Farmgate','Paltan','Khilgaon','Badda','Rampura','Shyamoli','Malibagh','Mohakhali','Jatrabari','Savar','Keraniganj','Demra','Kamalapur','Hazaribagh','Lalbagh','Azimpur','Khilkhet','Turag','Adabor','Cantonment','Dohar','Nawabganj'],
    Chattogram: ['Pahartali', 'Panchlaish', 'Kotwali', 'Halishahar', 'Agrabad', 'Chawkbazar', 'Bakalia', 'Patenga'],
    Khulna: ['Sonadanga', 'Khalishpur', 'Daulatpur', 'Rupsha', 'Shibbari', 'Boyra'],
    Barisal: ['Band Road', 'Nathullabad', 'Rupatali', 'Kaunia', 'Sagardi', 'Chandmari'],
    Rajshahi: ['Boalia', 'Rajpara', 'Motihar', 'Shah Makhdum', 'Binodpur', 'Kazla'],
    Sylhet: ['Zindabazar', 'Amberkhana', 'Shahjalal Uposhohor', 'Kumarpara', 'Bandarbazar'],
    Rangpur: ['Jahaj Company', 'Modern Mor', 'Mahiganj', 'CO Bazar', 'Shapla Chattar'],
    Mymensingh: ['Ganginarpar', 'Town Hall', 'Charpara', 'Kachari Bazar', 'Shambhuganj'],
  };

  const areas = areaData[form.district] || [];

  useEffect(() => {
    const identifier = localStorage.getItem('nirapod_identifier');
    if (identifier) {
      axios.get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`)
        .then(res => {
          const { nid, phone, email, name } = res.data;
          setForm(f => ({ ...f, nid: nid || '', phone: phone || '', email: email || '', name: name || '' }));
        });
    }
  }, []);

  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox' || type === 'radio') {
      setForm(f => ({ ...f, [name]: checked }));
    } else if (type === 'file') {
      setForm(f => ({ ...f, photos: Array.from(files) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSuccessMsg('');
    setPhotoError('');
    if (!form.photos || form.photos.length === 0) {
      setPhotoError('Please add at least one photo.');
      return;
    }
    const formData = new FormData();
    formData.append('nid', form.nid);
    formData.append('urgency', form.urgency);
    formData.append('complainTo', form.complainTo);
    formData.append('district', form.district);
    formData.append('area', form.area);
    formData.append('tag', form.tag); // already comma separated if user enters multiple tags
    formData.append('details', form.details);
    formData.append('postOnTimeline', form.postOnTimeline ? '1' : '0');
    formData.append('location', form.location);
    if (form.photos && form.photos.length > 0) {
      for (let i = 0; i < form.photos.length; i++) {
        formData.append('photos', form.photos[i]);
      }
    }
    try {
      const res = await axios.post('/api/complain', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg(`Complain submitted! Tracking ID: ${res.data.trackingId}`);
      setForm({
        name: '', phone: '', email: '', nid: '', complainTo: '', urgency: '', tag: '', details: '', photos: [], postOnTimeline: false, district: '', area: '', location: ''
      });
    } catch (err) {
      alert('Failed to submit complain.');
    }
  };

  return (
    <div className="complain-bg">
      <form className="complain-form" onSubmit={handleSubmit}>
        <h1>Submit Complaint</h1>
        
        {successMsg && <div className="success-message">{successMsg}</div>}
        
        <div className="complain-row">
          <label>Name:</label>
          <input className="complain-input" name="name" value={form.name} readOnly />
        </div>
        
        <div className="complain-row">
          <label>Phone:</label>
          <input className="complain-input" name="phone" value={form.phone} readOnly />
        </div>
        
        <div className="complain-row">
          <label>Email:</label>
          <input className="complain-input" name="email" value={form.email} readOnly />
        </div>
        
        <div className="complain-row">
          <label>NID:</label>
          <input className="complain-input" name="nid" value={form.nid} readOnly />
        </div>
        
        <div className="complain-row">
          <label>Complain to:</label>
          <select className="complain-input" name="complainTo" value={form.complainTo} onChange={handleChange} required>
            <option value="">Select Department</option>
            <option value="police">Police</option>
            <option value="fire">Fire Service</option>
            <option value="city">City Corporation</option>
            <option value="animal">Animal Welfare</option>
          </select>
        </div>
        
        <div className="complain-row">
          <label>Urgency:</label>
          <select className="complain-input" name="urgency" value={form.urgency} onChange={handleChange} required>
            <option value="">Select Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <div className="complain-urgency-note">
            <a href="/Level" target="_blank" rel="noopener noreferrer">*See Priority Levels</a>
          </div>
        </div>
        
        <div className="complain-row">
          <label>District:</label>
          <select className="complain-input" name="district" value={form.district} onChange={handleChange} required>
            <option value="">Select District</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        
        <div className="complain-row">
          <label>Area:</label>
          <select className="complain-input" name="area" value={form.area} onChange={handleChange} required disabled={!form.district}>
            <option value="">Select Area</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        
        <div className="complain-row">
          <label>Location:</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              className="complain-input"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Enter full address or coordinates"
              required
            />
            <button
              type="button"
              className="complain-gps-btn"
              onClick={async () => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      setForm((f) => ({ ...f, location: `${latitude},${longitude}` }));
                    },
                    (error) => {
                      alert('Failed to get location. Please enable GPS.');
                    }
                  );
                } else {
                  alert('Geolocation is not supported by this browser.');
                }
              }}
            >
            Get Location
            </button>
          </div>
        </div>
        
        <div className="complain-row">
          <label>Tags:</label>
          <input 
            className="complain-input" 
            name="tag" 
            value={form.tag} 
            onChange={handleChange} 
            placeholder="e.g., Phone Theft, Hijack, Fire, Road Accident" 
          />
        </div>
        
        <div className="complain-row">
          <label>Details:</label>
          <textarea 
            className="complain-textarea" 
            name="details" 
            value={form.details} 
            onChange={handleChange} 
            placeholder="Provide detailed information about your complaint. Include time, witnesses, and any other relevant details."
            required
          />
        </div>
        
        <div className="complain-photo-row complain-row">
          <label>Evidence Photos:</label>
          <label className="complain-photo-btn">
            {form.photos && form.photos.length > 0 ? 
              `${form.photos.length} photo${form.photos.length > 1 ? 's' : ''} selected` : 
              'Add Photos'
            }
            <input type="file" name="photos" style={{ display: 'none' }} onChange={handleChange} multiple accept="image/*" />
          </label>
          <label className="complain-checkbox-label">
            <input
              type="checkbox"
              name="postOnTimeline"
              checked={form.postOnTimeline}
              onChange={handleChange}
            />
            Share on public timeline
          </label>
          {photoError && <div className="error-message">{photoError}</div>}
        </div>
        
        <div className="complain-submit-row">
          <button className="complain-submit-btn" type="submit">
            Submit Complaint
          </button>
        </div>
      </form>
    </div>
  );
}

export default Complain;
