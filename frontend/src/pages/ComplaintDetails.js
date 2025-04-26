// src/components/ComplaintDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComplaintService from './ComplaintService';
import UpdateComplaint from './UpdateComplaint';
import './ComplaintDetails.css';

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <div className="detail-row">
          <span className="detail-label">Tracking ID :</span>
          <span className="detail-value">{complaint.trackingId}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Complain By :</span>
          <span className="detail-value">{complaint.complainBy}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Complain Tag :</span>
          <span className="detail-value">{complaint.tag}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Complain Subject :</span>
          <span className="detail-value">{complaint.subject}</span>
        </div>
        
        <div className="detail-row detail-multiline">
          <span className="detail-label">Complain Details :</span>
          <div className="detail-value detail-text-area">{complaint.details}</div>
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