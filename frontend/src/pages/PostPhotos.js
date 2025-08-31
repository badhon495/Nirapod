import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComplaintService from './ComplaintService';
import axios from 'axios';
import './PostPhotos.css';
import { getImageUrl, processPhotosForViewer } from '../utils/urlHelper';

function PostPhotos() {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoViewer, setPhotoViewer] = useState({ isOpen: false, photos: [], currentIndex: 0 });
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const userNid = localStorage.getItem('nirapod_identifier');

  // Fetch post details
  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      const data = await ComplaintService.getComplaintById(trackingId);
      setPost(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch post details. Please try again later.');
      setLoading(false);
    }
  };

  // Fetch user name by NID
  useEffect(() => {
    if (post && post.nid) {
      axios.get(`/api/user/by-identifier?value=${post.nid}`)
        .then(res => setUserName(res.data.name))
        .catch(() => setUserName(''));
    }
  }, [post]);

  const handleUploadPhotos = async () => {
    if (!userNid || photoFiles.length === 0) return;
    
    try {
      const formData = new FormData();
      formData.append('trackingId', trackingId);
      formData.append('nid', userNid);
      photoFiles.forEach(f => formData.append('photos', f));
      
      await axios.post('/api/complaint/upload-photos', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      // Fetch the latest upload photos and update in state
      try {
        const res = await axios.get(`/api/complaint/${trackingId}/upload-photos`);
        setPost(prev => ({ ...prev, uploadPhotos: res.data.uploadPhotos.join(',') }));
      } catch {
        // Optionally handle error
      }
      
      // Clear the file input
      setPhotoFiles([]);
      
    } catch (err) {
      console.error('Error uploading photos:', err);
      alert('Failed to upload photos. Please try again.');
    }
  };

  // Photo viewer handlers
  const handleOpenPhotoViewer = (photos, index = 0) => {
    const processedPhotos = processPhotosForViewer(photos);
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

  const handleNextPostPhoto = () => {
    const photoArr = post.photos ? post.photos.split(',')
      .map(p => p.trim())
      .filter(p => p && p !== 'null' && p !== 'undefined' && p.length > 0) : [];
    
    setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % photoArr.length);
  };

  const handlePrevPostPhoto = () => {
    const photoArr = post.photos ? post.photos.split(',')
      .map(p => p.trim())
      .filter(p => p && p !== 'null' && p !== 'undefined' && p.length > 0) : [];
    
    setCurrentPhotoIndex((prevIndex) => 
      prevIndex === 0 ? photoArr.length - 1 : prevIndex - 1
    );
  };

  // Handle keyboard navigation for photo viewer
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

  // Handle photo viewer body overflow
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

  useEffect(() => {
    fetchPostDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingId]);

  if (loading) return <div className="post-photos-loading">Loading...</div>;
  if (error) return <div className="post-photos-error">{error}</div>;
  if (!post) return <div className="post-photos-not-found">Post not found</div>;

  // Filter out empty, null, undefined, or whitespace-only photo entries
  const photoArr = post.photos ? post.photos.split(',')
    .map(p => p.trim())
    .filter(p => p && p !== 'null' && p !== 'undefined' && p.length > 0) : [];

  // Get user uploaded photos
  const uploadPhotoArr = post.uploadPhotos ? post.uploadPhotos.split(',')
    .map(p => p.trim())
    .filter(p => p && p !== 'null' && p !== 'undefined' && p.length > 0) : [];

  return (
    <div className="post-photos-container">
      <div className="post-photos-card">
        {/* Header with back button */}
        <div className="post-photos-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h2>Post Details & Photos</h2>
        </div>

        {/* Post Details Section */}
        <div className="post-details-section">
          {/* Post Tags */}
          <div className="social-post-tags">
            <span className="social-tag social-tag-subject">
              {post.subject || post.complainTo || 'General'}
            </span>
            <span className={`social-tag social-tag-priority priority-${(post.urgency || 'medium').toLowerCase()}`}>
              {post.urgency || 'Medium'} Priority
            </span>
            <span className={`social-tag social-tag-status status-${(post.status || 'Unsolved').toLowerCase().replace(' ', '-')}`}>
              {post.status || 'Unsolved'}
            </span>
          </div>
          
          {/* Post Header */}
          <div className="social-post-header">
            <div className="social-author-section">
              <div className="social-avatar">
                {post.userProfileImage && post.userProfileImage !== 'null' && post.userProfileImage !== '' ? (
                  <img 
                    src={getImageUrl(post.userProfileImage)} 
                    alt="Profile" 
                    className="social-avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="social-avatar-fallback" 
                  style={{ 
                    display: (post.userProfileImage && post.userProfileImage !== 'null' && post.userProfileImage !== '') ? 'none' : 'flex',
                    background: (() => {
                      const name = userName || post.complainBy || 'Anonymous';
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
                    const name = userName || post.complainBy || 'Anonymous';
                    const initials = name.split(' ')
                      .map(word => word.charAt(0))
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    return initials || 'AN';
                  })()}
                </div>
              </div>
              <div className="social-author-info">
                <h4 className="social-author-name">{userName || post.complainBy || 'Anonymous'}</h4>
                <div className="social-post-meta">
                  <span className="social-post-time">{post.time ? new Date(post.time).toLocaleString() : 'N/A'}</span>
                  <span className="social-post-separator">•</span>
                  <span className="social-post-location">
                    <span className="location-icon">📍</span>
                    {post.area || post.location || 'Location not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Post Content */}
          <div className="social-post-content">
            <div className="social-post-text">
              {post.details}
            </div>
            
            {post.updateNote && (
              <div className="social-post-update">
                <div className="update-indicator">📢</div>
                <div className="update-content">
                  <span className="update-label">Latest Update</span>
                  <span className="update-text">{post.updateNote}</span>
                </div>
              </div>
            )}
            
            {post.tags && (
              <div className="social-post-hashtags">
                {post.tags.split(',').map((tag, index) => (
                  <span key={index} className="hashtag">#{tag.trim()}</span>
                ))}
              </div>
            )}
          </div>
          
          {/* Original Post Media */}
          {photoArr.length > 0 && (
            <div className="social-post-media">
              <h4 className="media-section-title">Original Post Photos</h4>
              <div className="social-photos-carousel">
                <div className="social-photo-container">
                  <img 
                    src={getImageUrl(photoArr[currentPhotoIndex])} 
                    alt={`Post Photo ${currentPhotoIndex + 1}`} 
                    className="social-post-image"
                    onClick={() => handleOpenPhotoViewer(photoArr, currentPhotoIndex)}
                  />
                  
                  {photoArr.length > 1 && (
                    <>
                      <button 
                        className="photo-carousel-nav photo-carousel-prev"
                        onClick={handlePrevPostPhoto}
                      >
                        ‹
                      </button>
                      <button 
                        className="photo-carousel-nav photo-carousel-next"
                        onClick={handleNextPostPhoto}
                      >
                        ›
                      </button>
                      
                      <div className="photo-carousel-counter">
                        {currentPhotoIndex + 1} / {photoArr.length}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Uploaded Photos Section */}
        <div className="photos-section">
          <div className="photos-header">
            <h3>User Uploaded Photos ({uploadPhotoArr.length})</h3>
          </div>
          
          <div className="photos-gallery">
            {uploadPhotoArr.length === 0 ? (
              <div className="no-photos">No user-uploaded photos yet. Use the upload button below to add photos.</div>
            ) : (
              <div className="photos-grid">
                {uploadPhotoArr.map((photo, index) => (
                  <div key={index} className="photo-item">
                    <img
                      src={getImageUrl(photo)}
                      alt={`User upload ${index + 1}`}
                      className="gallery-photo"
                      onClick={() => handleOpenPhotoViewer(uploadPhotoArr, index)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Photos Section */}
          {userNid && (
            <div className="upload-photos-section">
              <div className="upload-input-container">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setPhotoFiles(Array.from(e.target.files))}
                  className="photo-input"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="photo-input-label">
                  Choose Photos...
                </label>
                {photoFiles.length > 0 && (
                  <div className="selected-files">
                    <span>{photoFiles.length} file(s) selected</span>
                  </div>
                )}
                <button 
                  onClick={handleUploadPhotos}
                  className="upload-submit-btn"
                  disabled={photoFiles.length === 0}
                >
                  Upload Photos
                </button>
              </div>
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

export default PostPhotos;
