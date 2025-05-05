// src/components/ComplaintDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ComplaintService from './ComplaintService';
import UpdateComplaint from './UpdateComplaint';
import './ComplaintDetails.css';
import axios from 'axios';

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [commentUserNames, setCommentUserNames] = useState({});
  const [commentInput, setCommentInput] = useState('');
  const [openComment, setOpenComment] = useState(false);
  const [commentOnly, setCommentOnly] = useState(false);
  const userNid = localStorage.getItem('nirapod_identifier');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isCommentOnly = params.get('commentOnly') === 'true';
    setCommentOnly(isCommentOnly);
  }, [location]);

  const fetchCommentUserNames = async (commentObj) => {
    const keys = Object.keys(commentObj || {});
    const newNames = {};
    await Promise.all(keys.map(async key => {
      if (!commentUserNames[key]) {
        try {
          let res = await axios.get(`/api/user/by-identifier?value=${key}`);
          if (res.data && res.data.name) {
            newNames[key] = res.data.name;
          }
        } catch {
          newNames[key] = key;
        }
      }
    }));
    setCommentUserNames(prev => ({ ...prev, ...newNames }));
  };

  const handleAddComment = async () => {
    if (!userNid || !commentInput.trim()) return;
    
    try {
      let commentObj = {};
      try {
        commentObj = complaint.comment ? JSON.parse(complaint.comment) : {};
      } catch { commentObj = {}; }
      
      // Add new comment
      commentObj[userNid] = commentInput;

      // Update complaint with new comment
      const updatedComplaint = await ComplaintService.updateComplaint(id, {
        ...complaint,
        comment: JSON.stringify(commentObj)
      });

      setComplaint(updatedComplaint);
      setCommentInput('');
      
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleUpdateSuccess = (updatedComplaint) => {
    setComplaint(updatedComplaint);
  };

  const handleBackToList = () => {
    navigate('/complains');
  };

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const data = await ComplaintService.getComplaintById(id);
      setComplaint(data);
      if (data.comment) {
        const commentObj = parseJsonSafely(data.comment);
        fetchCommentUserNames(commentObj);
      }
    } catch (err) {
      setError('Failed to fetch complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!complaint) return <div className="not-found">Complaint not found</div>;

  if (commentOnly) {
    return (
      <div className="complaint-details-container comment-only-view">
        <div className="complaint-detail-card">
          <div className="complaint-header">
            <h3>{complaint.tags || 'No tag'}</h3>
          </div>
          
          <div className="comment-section">
            <div className="comments-list">
              {(() => {
                let commentObj = {};
                try {
                  commentObj = complaint.comment ? JSON.parse(complaint.comment) : {};
                } catch { commentObj = {}; }
                
                if (Object.keys(commentObj).length === 0) {
                  return <div className="no-comments">No comments yet</div>;
                }

                return Object.entries(commentObj).map(([key, comment]) => (
                  <div key={key} className="comment-item">
                    <strong>{commentUserNames[key] || key}:</strong> {comment}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        {/* Comment Section */}
        {openComment ? (
          <div className="comment-section">
            <h3>Comments</h3>
            <div className="comments-list">
              {(() => {
                let commentObj = {};
                try {
                  commentObj = complaint.comment ? JSON.parse(complaint.comment) : {};
                } catch { commentObj = {}; }
                return Object.entries(commentObj).map(([key, comment]) => (
                  <div key={key} className="comment-item">
                    <strong>{key}:</strong> {comment}
                  </div>
                ));
              })()}
            </div>
            <div className="comment-input-area">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write your comment..."
                className="comment-textarea"
              />
              <div className="comment-actions">
                <button onClick={handleAddComment} className="comment-submit">Submit</button>
                <button onClick={() => setOpenComment(false)} className="comment-cancel">Close</button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setOpenComment(true)} className="open-comments-btn">
            Show Comments
          </button>
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