import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComplaintService from './ComplaintService';
import axios from 'axios';
import './PostComments.css';

function PostComments() {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [commentUserNames, setCommentUserNames] = useState({});
  const [photoViewer, setPhotoViewer] = useState({ isOpen: false, photos: [], currentIndex: 0 });
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [userName, setUserName] = useState('');
  
  const userNid = localStorage.getItem('nirapod_identifier');

  // Fetch post details
  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      const data = await ComplaintService.getComplaintById(trackingId);
      setPost(data);
      
      // Fetch comment user names
      let commentObj = {};
      try {
        commentObj = data.comment ? JSON.parse(data.comment) : {};
      } catch { commentObj = {}; }
      fetchCommentUserNames(commentObj);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch post details. Please try again later.');
      setLoading(false);
    }
  };

  // Fetch user names for all NIDs or emails in comments
  const fetchCommentUserNames = async (commentObj) => {
    const keys = Object.keys(commentObj || {});
    const newNames = {};
    
    for (const key of keys) {
      if (!commentUserNames[key]) {
        try {
          let res;
          if (key.includes('@')) {
            // It's an email
            res = await axios.get(`/api/user/by-identifier?value=${key}`);
          } else {
            // It's an NID
            res = await axios.get(`/api/user/by-identifier?value=${key}`);
          }
          newNames[key] = res.data.name;
        } catch {
          newNames[key] = key; // fallback to identifier if name not found
        }
      }
    }
    
    setCommentUserNames(prev => ({ ...prev, ...newNames }));
  };

  const handleAddComment = async () => {
    if (!userNid || !commentInput.trim()) return;
    
    try {
      // First get the latest version of the complaint
      const complaintResponse = await axios.get(`/api/complaint/${trackingId}`);
      const complaint = complaintResponse.data;
      
      // Parse existing comments
      let commentObj = {};
      try {
        commentObj = complaint.comment ? JSON.parse(complaint.comment) : {};
      } catch (e) {
        commentObj = {};
      }
      
      // Add new comment
      commentObj[userNid] = commentInput;
      
      // Update complaint with new comment
      await axios.put(`/api/complaint/update/${trackingId}`, {
        ...complaint,
        comment: JSON.stringify(commentObj)
      });

      // Update local state
      setPost(prev => ({ ...prev, comment: JSON.stringify(commentObj) }));

      // Clear input
      setCommentInput('');

      // Fetch updated user names
      fetchCommentUserNames(commentObj);

    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    }
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

  // Fetch user name using NID
  useEffect(() => {
    if (post && post.nid) {
      axios.get(`/api/user/by-identifier?value=${post.nid}`)
        .then(res => setUserName(res.data.name))
        .catch(() => setUserName(''));
    }
  }, [post]);

  if (loading) return <div className="post-comments-loading">Loading...</div>;
  if (error) return <div className="post-comments-error">{error}</div>;
  if (!post) return <div className="post-comments-not-found">Post not found</div>;

  // Filter out empty, null, undefined, or whitespace-only photo entries
  const photoArr = post.photos ? post.photos.split(',')
    .map(p => p.trim())
    .filter(p => p && p !== 'null' && p !== 'undefined' && p.length > 0) : [];

  // Parse comments
  let commentObj = {};
  try {
    commentObj = post.comment ? JSON.parse(post.comment) : {};
  } catch { commentObj = {}; }
  const commentKeys = Object.keys(commentObj);

  return (
    <div className="post-comments-container">
      <div className="post-comments-card">
        {/* Header with back button */}
        <div className="post-comments-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h2>Post Details & Comments</h2>
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
                    src={post.userProfileImage.startsWith('http') ? post.userProfileImage : `http://localhost:8080/uploads/${post.userProfileImage.replace('/uploads/', '')}`} 
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
                      const name = userName || post.userName || post.complainBy || 'Anonymous';
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
                    const name = userName || post.userName || post.complainBy || 'Anonymous';
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
                <h4 className="social-author-name">{userName || post.complainBy || post.userName || 'Anonymous'}</h4>
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
          
          {/* Post Media */}
          {photoArr.length > 0 && (
            <div className="social-post-media">
              <div className="social-photos-carousel">
                <div className="social-photo-container">
                  <img 
                    src={photoArr[currentPhotoIndex].startsWith('http') ? 
                          photoArr[currentPhotoIndex] : 
                          `http://localhost:8080/uploads/${photoArr[currentPhotoIndex].replace('/uploads/', '')}`} 
                    alt={`Post Photo ${currentPhotoIndex + 1}`} 
                    className="social-post-image"
                    onClick={() => handleOpenPhotoViewer(photoArr, currentPhotoIndex)}
                    onError={(e) => {
                      const currentPhoto = photoArr[currentPhotoIndex];
                      if (!currentPhoto.startsWith('http')) {
                        const altSrc = `http://localhost:8080/${currentPhoto.replace('/uploads/', '')}`;
                        if (e.target.src !== altSrc) {
                          e.target.src = altSrc;
                        }
                      }
                    }}
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

        {/* Comments Section */}
        <div className="comments-section">
          <div className="comments-header">
            <h3>Comments ({commentKeys.length})</h3>
          </div>
          
          <div className="comments-list">
            {commentKeys.length === 0 ? (
              <div className="no-comments">No comments yet. Be the first to comment!</div>
            ) : (
              commentKeys.map(key => (
                <div key={key} className="comment-item">
                  <div 
                    className="comment-avatar"
                    style={{
                      background: (() => {
                        const name = commentUserNames[key] || key;
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
                      const name = commentUserNames[key] || key;
                      const initials = name.split(' ')
                        .map(word => word.charAt(0))
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                      return initials || key.slice(0, 2).toUpperCase();
                    })()}
                  </div>
                  <div className="comment-content">
                    <div className="comment-author">{commentUserNames[key] || key}</div>
                    <div className="comment-text">{commentObj[key]}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Section */}
          {userNid && (
            <div className="add-comment-section">
              <div className="comment-input-container">
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Write a comment..."
                  className="comment-input"
                  rows={3}
                />
                <button 
                  onClick={handleAddComment}
                  className="comment-submit-btn"
                  disabled={!commentInput.trim()}
                >
                  Post Comment
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

export default PostComments;
