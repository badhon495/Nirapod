import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ComplaintService from './ComplaintService';
import axios from 'axios';
import './Home.css';

const urgencyOptions = [
  { label: 'All', value: '' },
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
];

function Home() {
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({ area: '', urgency: '', district: '', tags: '', fromDate: '', toDate: '' });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [openComment, setOpenComment] = useState(null);
  const [currentCommentPost, setCurrentCommentPost] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [commentUserNames, setCommentUserNames] = useState({});
  const [openPhotos, setOpenPhotos] = useState(null);
  const [currentPhotoPost, setCurrentPhotoPost] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [openReport, setOpenReport] = useState(null);
  const [followed, setFollowed] = useState([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [photoViewer, setPhotoViewer] = useState({ isOpen: false, photos: [], currentIndex: 0 });
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState({});
  const observer = useRef();
  const userNid = localStorage.getItem('nirapod_identifier');
  const filterBtnRef = useRef(null);
  const filterPanelRef = useRef(null);
  const location = useLocation();

  // Fetch posts with filters and pagination
  const fetchPosts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await ComplaintService.getAllComplaints();
      // Only show posts where postOnTimeline is true
      let filtered = res.filter(p => p.postOnTimeline === true);
      
      // Apply filters
      if (filters.area) filtered = filtered.filter(p => (p.area || '').toLowerCase().includes(filters.area.toLowerCase()));
      if (filters.urgency) filtered = filtered.filter(p => (p.urgency || '').toLowerCase() === filters.urgency.toLowerCase());
      if (filters.district) filtered = filtered.filter(p => (p.district || '').toLowerCase().includes(filters.district.toLowerCase()));
      if (filters.tags) filtered = filtered.filter(p => (p.tags || '').toLowerCase().includes(filters.tags.toLowerCase()));
      if (filters.fromDate) filtered = filtered.filter(p => p.time && new Date(p.time) >= new Date(filters.fromDate));
      if (filters.toDate) filtered = filtered.filter(p => p.time && new Date(p.time) <= new Date(filters.toDate + 'T23:59:59'));
      
      // Pagination (simulate infinite scroll)
      const pageSize = 5;
      const start = reset ? 0 : page * pageSize;
      const end = start + pageSize;
      const nextPosts = filtered.slice(start, end);
      setPosts(prev => reset ? nextPosts : [...prev, ...nextPosts]);
      setHasMore(end < filtered.length);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [filters, page, loading]);

  // Fetch followed posts for this user
  const fetchFollowed = async () => {
    if (!userNid) return;
    try {
      const res = await axios.get(`/api/follows/user/${userNid}`);
      setFollowed(res.data.map(f => f.postId));
    } catch {}
  };

  useEffect(() => {
    setPage(0);
    fetchPosts(true);
    // eslint-disable-next-line
  }, [filters]);

  useEffect(() => {
    if (page > 0) fetchPosts();
    // eslint-disable-next-line
  }, [page]);

  useEffect(() => {
    fetchFollowed();
    // eslint-disable-next-line
  }, []);

  // Handle filter panel click outside
  useEffect(() => {
    if (!filterPanelOpen) return;
    function handleClickOutside(event) {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(event.target)
      ) {
        setFilterPanelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterPanelOpen]);

  useEffect(() => {
    if (openComment || openPhotos || openReport || photoViewer.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [openComment, openPhotos, openReport, photoViewer.isOpen]);

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

  useEffect(() => {
    // Handle navigation from notifications
    if (location.state?.openPost) {
      const postId = location.state.openPost;
      handleOpenComment(postId);
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Infinite scroll observer
  const lastPostRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch user names for all NIDs or emails in comments
  const fetchCommentUserNames = async (commentObj) => {
    const keys = Object.keys(commentObj || {});
    const newNames = {};
    await Promise.all(keys.map(async key => {
      if (!commentUserNames[key]) {
        try {
          // Try as NID first
          let res = await axios.get(`/api/user/by-identifier?value=${key}`);
          if (res.data && res.data.name) {
            newNames[key] = res.data.name;
          } else {
            // Fallback: try as email
            res = await axios.get(`/api/user/search`, { params: { email: key } });
            if (res.data && res.data.length > 0 && res.data[0].name) {
              newNames[key] = res.data[0].name;
            } else {
              newNames[key] = key;
            }
          }
        } catch {
          newNames[key] = key;
        }
      }
    }));
    setCommentUserNames(prev => ({ ...prev, ...newNames }));
  };

  // Button handlers
  const handleFollow = async (trackingId) => {
    if (!userNid) return;
    try {
      await axios.post('/api/follows/follow', null, { params: { postId: trackingId, userId: userNid } });
      setFollowed(prev => [...prev, trackingId]);
    } catch (e) {
      // Optionally show error
    }
  };

  const handleUnfollow = async (trackingId) => {
    if (!userNid) return;
    try {
      await axios.post('/api/follows/unfollow', null, { params: { postId: trackingId, userId: userNid } });
      setFollowed(prev => prev.filter(id => id !== trackingId));
    } catch (e) {
      // Optionally show error
    }
  };

  const handleOpenComment = async (trackingId) => {
    // Find the current post
    const currentPost = posts.find(p => p.trackingId === trackingId);
    setCurrentCommentPost(currentPost);
    setOpenComment(trackingId);
    setCommentInput('');
    // Fetch latest post from backend for up-to-date comments
    try {
      const res = await axios.get(`/api/complaint/${trackingId}`);
      let commentObj = {};
      try {
        commentObj = res.data.comment ? JSON.parse(res.data.comment) : {};
      } catch { commentObj = {}; }
      fetchCommentUserNames(commentObj);
      // Update the post in the posts state so the popup shows the latest comments
      setPosts(prevPosts => prevPosts.map(p => p.trackingId === trackingId ? { ...p, comment: res.data.comment } : p));
      // Also update the current comment post
      setCurrentCommentPost(prev => prev ? { ...prev, comment: res.data.comment } : null);
    } catch {
      // fallback to local state if fetch fails
      const complaint = posts.find(p => p.trackingId === trackingId);
      let commentObj = {};
      try {
        commentObj = complaint.comment ? JSON.parse(complaint.comment) : {};
      } catch { commentObj = {}; }
      fetchCommentUserNames(commentObj);
    }
  };

  const handleAddComment = async (trackingId) => {
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
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.trackingId === trackingId 
            ? { ...p, comment: JSON.stringify(commentObj) }
            : p
        )
      );

      // Clear input and close comment box
      setCommentInput('');
      setOpenComment(null);
      setCurrentCommentPost(null);

    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleOpenPhotos = (trackingId) => {
    // Find the current post
    const currentPost = posts.find(p => p.trackingId === trackingId);
    setCurrentPhotoPost(currentPost);
    setOpenPhotos(trackingId);
    setPhotoFiles([]);
  };

  const handleUploadPhotos = async (trackingId) => {
    if (!userNid || photoFiles.length === 0) return;
    const formData = new FormData();
    formData.append('trackingId', trackingId);
    formData.append('nid', userNid);
    photoFiles.forEach(f => formData.append('photos', f));
    await axios.post('/api/complaint/upload-photos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    // Fetch the latest post data and update the photos in state
    try {
      const res = await axios.get(`/api/complaint/${trackingId}`);
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.trackingId === trackingId ? { ...p, photos: res.data.photos } : p
        )
      );
    } catch {
      // Optionally handle error
    }
    setOpenPhotos(null);
    setCurrentPhotoPost(null);
  };

  const handleOpenReport = (trackingId) => {
    setOpenReport(trackingId);
  };

  const handleReport = async (trackingId) => {
    if (!userNid) return;
    const complaint = posts.find(p => p.trackingId === trackingId);
    let reportArr = [];
    try {
      reportArr = complaint.report ? complaint.report.split(',') : [];
    } catch { reportArr = []; }
    if (!reportArr.includes(userNid)) reportArr.push(userNid);
    // Only send the report field for update
    await axios.put(`/api/complaint/update/${trackingId}`, { report: reportArr.join(',') });
    setOpenReport(null);
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

  // Photo carousel navigation for posts
  const handleNextPostPhoto = (postId, photoCount) => {
    setCurrentPhotoIndex(prev => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % photoCount
    }));
  };

  const handlePrevPostPhoto = (postId, photoCount) => {
    setCurrentPhotoIndex(prev => ({
      ...prev,
      [postId]: prev[postId] === 0 || prev[postId] === undefined ? photoCount - 1 : prev[postId] - 1
    }));
  };

  // Filter handlers
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleClearFilters = () => {
    setFilters({ area: '', urgency: '', district: '', tags: '', fromDate: '', toDate: '' });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Main Content */}
        <div className="main-content">
          {/* Filter Section */}
          <div className="filter-section">
            <div className="filter-container">
              <button
                ref={filterBtnRef}
                className={`modern-filter-btn ${filterPanelOpen ? 'active' : ''}`}
                onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              >
                <div className="filter-btn-content">
                  <span className="filter-icon">🎯</span>
                  <span className="filter-text">Filter Posts</span>
                  {getActiveFilterCount() > 0 && (
                    <span className="filter-badge">{getActiveFilterCount()}</span>
                  )}
                  <span className={`filter-chevron ${filterPanelOpen ? 'rotated' : ''}`}>▼</span>
                </div>
              </button>
              
              {/* Modern Filter Panel */}
              {filterPanelOpen && (
                <div ref={filterPanelRef} className="modern-filter-panel">
                  <div className="filter-panel-header">
                    <h3 className="filter-panel-title">Filter Posts</h3>
                    <button 
                      className="filter-panel-close"
                      onClick={() => setFilterPanelOpen(false)}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="filter-panel-content">
                    <div className="filter-grid">
                      <div className="filter-item">
                        <label className="filter-label">
                          <span className="filter-label-icon">📍</span>
                          Area
                        </label>
                        <input 
                          name="area" 
                          placeholder="Enter area..." 
                          value={filters.area} 
                          onChange={handleFilterChange} 
                          className="modern-filter-input"
                        />
                      </div>
                      
                      <div className="filter-item">
                        <label className="filter-label">
                          <span className="filter-label-icon">⚡</span>
                          Urgency
                        </label>
                        <select 
                          name="urgency" 
                          value={filters.urgency} 
                          onChange={handleFilterChange} 
                          className="modern-filter-select"
                        >
                          <option value="">All Urgency Levels</option>
                          <option value="High">🔴 High Priority</option>
                          <option value="Medium">🟡 Medium Priority</option>
                          <option value="Low">🟢 Low Priority</option>
                        </select>
                      </div>
                      
                      <div className="filter-item">
                        <label className="filter-label">
                          <span className="filter-label-icon">🏘️</span>
                          District
                        </label>
                        <input 
                          name="district" 
                          placeholder="Enter district..." 
                          value={filters.district} 
                          onChange={handleFilterChange} 
                          className="modern-filter-input"
                        />
                      </div>
                      
                      <div className="filter-item">
                        <label className="filter-label">
                          <span className="filter-label-icon">#️⃣</span>
                          Tags
                        </label>
                        <input 
                          name="tags" 
                          placeholder="Enter tags..." 
                          value={filters.tags} 
                          onChange={handleFilterChange} 
                          className="modern-filter-input"
                        />
                      </div>
                      
                      <div className="filter-item">
                        <label className="filter-label">
                          <span className="filter-label-icon">📅</span>
                          From Date
                        </label>
                        <input 
                          name="fromDate" 
                          type="date" 
                          value={filters.fromDate} 
                          onChange={handleFilterChange} 
                          className="modern-filter-input"
                        />
                      </div>
                      
                      <div className="filter-item">
                        <label className="filter-label">
                          <span className="filter-label-icon">📅</span>
                          To Date
                        </label>
                        <input 
                          name="toDate" 
                          type="date" 
                          value={filters.toDate} 
                          onChange={handleFilterChange} 
                          className="modern-filter-input"
                        />
                      </div>
                    </div>
                    
                    <div className="filter-panel-actions">
                      <button 
                        className="filter-action-btn secondary"
                        onClick={handleClearFilters}
                      >
                        <span className="btn-icon">🗑️</span>
                        Clear All
                      </button>
                      <button 
                        className="filter-action-btn primary"
                        onClick={() => setFilterPanelOpen(false)}
                      >
                        <span className="btn-icon">✨</span>
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Posts Timeline */}
          <div className="timeline">
            {posts.map((post, idx) => {
              const isLast = idx === posts.length - 1;
              const photoArr = post.photos ? post.photos.split(',').map(p => p.trim()).filter(Boolean) : [];
              return (
                <div key={post.trackingId} className="social-post-card" ref={isLast ? lastPostRef : null}>
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
                            src={`http://localhost:8080/uploads/${post.userProfileImage.replace('/uploads/', '')}`} 
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
                              const name = post.userName || post.complainBy || 'Anonymous';
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
                            const name = post.userName || post.complainBy || 'Anonymous';
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
                        <h4 className="social-author-name">{post.complainBy || post.userName || 'Anonymous'}</h4>
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
                            src={`http://localhost:8080/uploads/${photoArr[currentPhotoIndex[post.trackingId] || 0].replace('/uploads/', '')}`} 
                            alt={`Post Photo ${(currentPhotoIndex[post.trackingId] || 0) + 1}`} 
                            className="social-post-image"
                            onClick={() => handleOpenPhotoViewer(photoArr, currentPhotoIndex[post.trackingId] || 0)}
                            onError={(e) => {
                              const altSrc = `http://localhost:8080/${photoArr[currentPhotoIndex[post.trackingId] || 0].replace('/uploads/', '')}`;
                              if (e.target.src !== altSrc) {
                                e.target.src = altSrc;
                              }
                            }}
                          />
                          
                          {photoArr.length > 1 && (
                            <>
                              <button 
                                className="photo-carousel-nav photo-carousel-prev"
                                onClick={() => handlePrevPostPhoto(post.trackingId, photoArr.length)}
                              >
                                ‹
                              </button>
                              <button 
                                className="photo-carousel-nav photo-carousel-next"
                                onClick={() => handleNextPostPhoto(post.trackingId, photoArr.length)}
                              >
                                ›
                              </button>
                              
                              <div className="photo-carousel-counter">
                                {(currentPhotoIndex[post.trackingId] || 0) + 1} / {photoArr.length}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Post Actions */}
                  <div className="social-post-actions">
                    <div className="post-actions-row">
                      {followed.includes(post.trackingId) ? (
                        <button className="post-action-btn post-action-following" onClick={() => handleUnfollow(post.trackingId)}>
                          <span className="btn-icon">👁️</span>
                          Following
                        </button>
                      ) : (
                        <button className="post-action-btn" onClick={() => handleFollow(post.trackingId)}>
                          <span className="btn-icon">👁️</span>
                          Follow
                        </button>
                      )}
                      <button className="post-action-btn" onClick={() => handleOpenComment(post.trackingId)}>
                        <span className="btn-icon">💬</span>
                        Comment
                      </button>
                      <button className="post-action-btn" onClick={() => handleOpenPhotos(post.trackingId)}>
                        <span className="btn-icon">📷</span>
                        Photos
                      </button>
                      <button className="post-action-btn" onClick={() => handleOpenReport(post.trackingId)}>
                        <span className="btn-icon">⚠️</span>
                        Report
                      </button>
                    </div>
                  </div>
                  
                  {/* Report Modal */}
                  {openReport === post.trackingId && (
                    <div className="modal-overlay">
                      <div className="modal-content report-modal">
                        <div className="modal-header">
                          <h3>Report Post</h3>
                          <button className="modal-close" onClick={() => setOpenReport(null)}>×</button>
                        </div>
                        <div className="report-content">
                          <div className="report-warning">⚠️</div>
                          <p className="report-message">
                            Are you sure you want to report this post? This action will notify the moderators for review.
                          </p>
                        </div>
                        <div className="report-actions">
                          <button onClick={() => handleReport(post.trackingId)} className="btn btn-danger">
                            Report Post
                          </button>
                          <button onClick={() => setOpenReport(null)} className="btn btn-secondary">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  

                </div>
              );
            })}
            
            {loading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <span className="loading-text">Loading more posts...</span>
              </div>
            )}
            
            {!hasMore && !loading && posts.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No posts found</h3>
                <p>Try adjusting your filters or check back later for new posts.</p>
              </div>
            )}
          </div>
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
          </div>
        </div>
      )}

      {/* Comment Viewer Modal */}
      {openComment && currentCommentPost && (
        <div className="comment-viewer-overlay" onClick={() => { setOpenComment(null); setCurrentCommentPost(null); }}>
          <div className="comment-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="comment-viewer-close" onClick={() => { setOpenComment(null); setCurrentCommentPost(null); }}>
              ×
            </button>
            <div className="comment-viewer-header">
              <h3>Comments</h3>
            </div>
            <div className="comment-section">
              {(() => {
                let commentObj = {};
                try {
                  commentObj = currentCommentPost.comment ? JSON.parse(currentCommentPost.comment) : {};
                } catch { commentObj = {}; }
                const keys = Object.keys(commentObj);
                if (keys.length === 0) return <div className="no-comments">No comments yet. Be the first to comment!</div>;
                return keys.map(key => (
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
                        return initials || 'AN';
                      })()}
                    </div>
                    <div className="comment-content">
                      <div className="comment-author">{commentUserNames[key] || key}</div>
                      <div className="comment-text">{commentObj[key]}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="comment-input-section">
              <textarea 
                value={commentInput} 
                onChange={e => setCommentInput(e.target.value)} 
                className="comment-textarea" 
                placeholder="Write your comment..." 
              />
              <div className="comment-actions">
                <button onClick={() => handleAddComment(currentCommentPost.trackingId)} className="btn btn-primary">
                  Submit Comment
                </button>
                <button onClick={() => { setOpenComment(null); setCurrentCommentPost(null); }} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      {openPhotos && currentPhotoPost && (
        <div className="photo-gallery-overlay" onClick={() => { setOpenPhotos(null); setCurrentPhotoPost(null); }}>
          <div className="photo-gallery-content" onClick={(e) => e.stopPropagation()}>
            <button className="photo-gallery-close" onClick={() => { setOpenPhotos(null); setCurrentPhotoPost(null); }}>
              ×
            </button>
            <div className="photo-gallery-header">
              <h3>Photos</h3>
            </div>
            <div className="photo-gallery-main">
              {(() => {
                const photoArr = currentPhotoPost.photos ? currentPhotoPost.photos.split(',').map(p => p.trim()).filter(Boolean) : [];
                return photoArr.map((p, i) => (
                  <img 
                    key={i} 
                    src={`http://localhost:8080/uploads/${p.replace('/uploads/', '')}`} 
                    alt={`Photo ${i + 1}`} 
                    className="gallery-image"
                    onClick={() => handleOpenPhotoViewer(photoArr, i)}
                    onError={(e) => {
                      // Try alternative URL format if the first one fails
                      const altSrc = `http://localhost:8080/${p.replace('/uploads/', '')}`;
                      if (e.target.src !== altSrc) {
                        e.target.src = altSrc;
                      }
                    }}
                  />
                ));
              })()}
            </div>
            <div className="photo-upload-section">
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={e => setPhotoFiles(Array.from(e.target.files))} 
                className="file-input"
              />
              <div className="photo-actions">
                <button onClick={() => handleUploadPhotos(currentPhotoPost.trackingId)} className="btn btn-primary">
                  Upload Photos
                </button>
                <button onClick={() => { setOpenPhotos(null); setCurrentPhotoPost(null); }} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;