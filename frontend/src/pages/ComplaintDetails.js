// src/components/ComplaintDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComplaintService from './ComplaintService';
import UpdateComplaint from './UpdateComplaint';
import './ComplaintDetails.css';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet-control-geocoder';
import pinGif from '../image/pin.gif';

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [photoViewer, setPhotoViewer] = useState({ isOpen: false, photos: [], currentIndex: 0 });

  // Admin-only actions
  const isAdmin = localStorage.getItem('categories') === 'admin';

  const handleDeleteReport = async () => {
    if (!window.confirm('Are you sure you want to delete the report for this post?')) return;
    try {
      await axios.put(`/api/complaint/update/${complaint.trackingId}`, { report: '' });
      setComplaint({ ...complaint, report: '' });
      alert('Report deleted successfully.');
    } catch (err) {
      alert('Failed to delete report.');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/complaint/${complaint.trackingId}`);
      alert('Post deleted successfully.');
      navigate('/reports');
    } catch (err) {
      alert('Failed to delete post.');
    }
  };

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

  // Handle photo viewer body overflow and keyboard navigation
  useEffect(() => {
    if (photoViewer.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [photoViewer.isOpen]);

  // Keyboard navigation for photo viewer
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!photoViewer.isOpen) return;
      
      if (e.key === 'Escape') {
        handleClosePhotoViewer();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [photoViewer.isOpen]);

  const handleUpdateSuccess = (updatedComplaint) => {
    setComplaint(updatedComplaint);
    alert('Complaint updated successfully!');
  };

  const handleBackToList = () => {
    navigate('/complains');
  };

  // Photo viewer handlers
  const handleOpenPhotoViewer = (photos, index = 0) => {
    const processedPhotos = photos.map(photo => {
      const cleanPhoto = photo.replace('/uploads/', '');
      return {
        primary: `http://localhost:8080/uploads/${cleanPhoto}`,
        fallback: `http://localhost:8080/${cleanPhoto}`
      };
    });
    setPhotoViewer({ isOpen: true, photos: processedPhotos, currentIndex: index });
  };

  const handleClosePhotoViewer = () => {
    setPhotoViewer({ isOpen: false, photos: [], currentIndex: 0 });
  };

  const handleNextPhoto = () => {
    setPhotoViewer(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.photos.length
    }));
  };

  const handlePrevPhoto = () => {
    setPhotoViewer(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.photos.length - 1 : prev.currentIndex - 1
    }));
  };

  useEffect(() => {
    const location = complaint?.location;
    if (!location) return;

    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found. Ensure the DOM element is rendered before initializing the map.');
      return;
    }

    const [latitude, longitude] = location.split(',').map(coord => parseFloat(coord.trim()));

    if (!isNaN(latitude) && !isNaN(longitude)) {
      const map = L.map('map').setView([latitude, longitude], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const customIcon = L.icon({
        iconUrl: pinGif, // Use the custom pin.gif
        iconSize: [50, 50], // Size of the icon
        iconAnchor: [25, 50], // Anchor point of the icon
        popupAnchor: [0, -50] // Position of the popup relative to the icon
      });

      L.marker([latitude, longitude], { icon: customIcon }).addTo(map)
        .bindPopup('The problem was reported here').openPopup();
    } else {
      console.error('Invalid location data format. Map will not load.');
    }
  }, [complaint?.location]);

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
            <div className="user-photo-container">
              <img src={src} alt="User" className="user-photo" />
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
          <span className="detail-label">Location : </span>
          <span className="detail-value">{complaint.location}</span>
        </div>        <div className="detail-row">
          <span className="detail-label">Map :</span>
          <div className="detail-value">
            <div className="map-container">
              {(() => {
                const location = complaint.location;
                if (!location) return <div>Location not found in the map</div>;

                const [latitude, longitude] = location.split(',').map(coord => parseFloat(coord.trim()));

                if (!isNaN(latitude) && !isNaN(longitude)) {
                  return (
                    <div id="map"></div>
                  );
                } else {
                  return <div>Please Use GPS Coordinates to load the map correctly !</div>;
                }
              })()}
            </div>
          </div>
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
          <div className="detail-value">
            <div className="photos-container">
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
                    className="complaint-photo"
                    onClick={() => {
                      const photoArray = complaint.photos.split(',').map(p => p.trim());
                      handleOpenPhotoViewer(photoArray, idx);
                    }}
                  />
                );
              })}
            </div>
          </div>
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
        {/* Update Component and Admin Delete Buttons */}
        <div className="update-complaint-container">
          <UpdateComplaint 
            complaint={complaint} 
            onUpdateSuccess={handleUpdateSuccess} 
          />
          {isAdmin && (
            <div className="admin-actions">
              <button className="admin-btn delete-report-btn" onClick={handleDeleteReport}>
                Delete Report
              </button>
              <button className="admin-btn delete-post-btn" onClick={handleDeletePost}>
                Delete Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {photoViewer.isOpen && (
        <div className="photo-viewer-overlay" onClick={handleClosePhotoViewer}>
          <div className="photo-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="photo-viewer-close" onClick={handleClosePhotoViewer}>
              ×
            </button>
            
            {photoViewer.photos.length > 1 && (
              <button className="photo-nav photo-nav-prev" onClick={handlePrevPhoto}>
                ‹
              </button>
            )}
            
            <div className="photo-viewer-main">
              <img 
                src={photoViewer.photos[photoViewer.currentIndex]?.primary} 
                alt={`Photo ${photoViewer.currentIndex + 1}`}
                className="photo-viewer-image"
                onError={(e) => {
                  const fallbackSrc = photoViewer.photos[photoViewer.currentIndex]?.fallback;
                  if (fallbackSrc && e.target.src !== fallbackSrc) {
                    e.target.src = fallbackSrc;
                  }
                }}
              />
            </div>
            
            {photoViewer.photos.length > 1 && (
              <button className="photo-nav photo-nav-next" onClick={handleNextPhoto}>
                ›
              </button>
            )}
            
            {photoViewer.photos.length > 1 && (
              <div className="photo-viewer-counter">
                {photoViewer.currentIndex + 1} / {photoViewer.photos.length}
              </div>
            )}
            
            {photoViewer.photos.length > 1 && (
              <div className="photo-viewer-thumbnails">
                {photoViewer.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo.primary}
                    alt={`Thumbnail ${index + 1}`}
                    className={`photo-thumbnail ${index === photoViewer.currentIndex ? 'active' : ''}`}
                    onClick={() => setPhotoViewer(prev => ({ ...prev, currentIndex: index }))}
                    onError={(e) => {
                      if (e.target.src !== photo.fallback) {
                        e.target.src = photo.fallback;
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplaintDetails;