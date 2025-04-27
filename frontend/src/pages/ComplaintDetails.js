// src/components/ComplaintDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComplaintService from './ComplaintService';
import UpdateComplaint from './UpdateComplaint';
import './ComplaintDetails.css';
import axios from 'axios';

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const data = await ComplaintService.getComplaintById(id);
      setComplaint(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch complaint details. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (complaint && complaint.nid) {
      axios.get(`/api/user/by-identifier?value=${complaint.nid}`)
        .then(res => setUserName(res.data.name))
        .catch(() => setUserName(''));
    }
  }, [complaint]);

  const handleUpdateSuccess = (updatedComplaint) => {
    setComplaint(updatedComplaint);
    alert('Complaint updated successfully!');
  };

  const handleBackToList = () => {
    navigate('/complains');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!complaint) return <div className="not-found">Complaint not found</div>;

  return (
    <div className="complaint-details-container">
      <div className="complaint-detail-card">
        {/* Centered user photo at the top */}
        {complaint.userPhoto && (() => {
          let photo = complaint.userPhoto;
          if (photo.startsWith('/uploads/')) photo = photo.replace('/uploads/', '');
          const backendUrl = 'http://localhost:8080';
          const src = `${backendUrl}/${photo}`;
          return (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <img src={src} alt="User" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', background: '#eee' }} />
            </div>
          );
        })()}
        {/* Name as a normal detail row */}
        <div className="detail-row">
          <span className="detail-label">Name :</span>
          <span className="detail-value">{userName}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Tracking ID :</span>
          <span className="detail-value">{complaint.trackingId}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">NID :</span>
          <span className="detail-value">{complaint.nid}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Tags :</span>
          <span className="detail-value">{complaint.tags}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Urgency :</span>
          <span className="detail-value">{complaint.urgency}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">District :</span>
          <span className="detail-value">{complaint.district}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Area :</span>
          <span className="detail-value">{complaint.area}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Location :</span>
          <span className="detail-value">{complaint.location}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Timestamp :</span>
          <span className="detail-value">{(() => {
            if (!complaint.time) return 'N/A';
            let iso = complaint.time;
            if (typeof iso === 'string' && iso.includes('.')) iso = iso.split('.')[0];
            if (typeof iso === 'string' && !iso.endsWith('Z')) iso = iso + 'Z';
            const d = new Date(iso);
            return isNaN(d) ? complaint.time : d.toLocaleString();
          })()}</span>
        </div>
        <div className="detail-row detail-multiline">
          <span className="detail-label">Details :</span>
          <div className="detail-value detail-text-area">{complaint.details}</div>
        </div>
        <div className="detail-row">
          <span className="detail-label">Photos :</span>
          <span className="detail-value">
            {complaint.photos && complaint.photos.split(',').map((photo, idx) => {
              let trimmed = photo.trim();
              // Do not include /uploads in the image URL
              if (trimmed.startsWith('/uploads/')) {
                trimmed = trimmed.replace('/uploads/', '');
              }
              const backendUrl = "http://localhost:8080";
              const src = `${backendUrl}/${trimmed}`;
              return (
                <img
                  key={idx}
                  src={src}
                  alt={`complaint-photo-${idx}`}
                  style={{ maxWidth: 180, maxHeight: 180, marginRight: 8, borderRadius: 8, border: '1px solid #ccc' }}
                />
              );
            })}
          </span>
        </div>
        {/* Current Status */}
        <div className="detail-row">
          <span className="detail-label">Current Status :</span>
          <span className={`detail-value status-badge ${complaint.status === 'Solved' ? 'status-solved' : complaint.status === 'In Progress' ? 'status-inprogress' : 'status-unsolved'}`}>
            {complaint.status || 'Unsolved'}
          </span>
        </div>
        {/* Update Notes (if any) */}
        {complaint.updateNote && (
          <div className="detail-row detail-multiline">
            <span className="detail-label">Latest Update :</span>
            <div className="detail-value detail-text-area">{complaint.updateNote}</div>
          </div>
        )}
        {/* Update Component */}
        <UpdateComplaint 
          complaint={complaint} 
          onUpdateSuccess={handleUpdateSuccess} 
        />
      </div>
      <button className="back-button" onClick={handleBackToList}>
        Back to Complaints
      </button>
    </div>
  );
}

export default ComplaintDetails;