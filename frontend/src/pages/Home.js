import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ComplaintService from './ComplaintService';
import axios from 'axios';
import PageLoader from '../components/PageLoader';
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
  const [initialLoading, setInitialLoading] = useState(true);
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
  const navigate = useNavigate();

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
      if (initialLoading) setInitialLoading(false);
    } catch {
      setLoading(false);
      if (initialLoading) setInitialLoading(false);
    }
  }, [filters, page, loading, initialLoading]);

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
    setInitialLoading(true);
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
    if (openReport || photoViewer.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [openReport, photoViewer.isOpen]);

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

  const handleOpenComment = (trackingId) => {
    // Navigate to the dedicated comments page
    navigate(`/post/${trackingId}/comments`);
  };

  const handleOpenPhotos = (trackingId) => {
    // Navigate to the dedicated photos page
    navigate(`/post/${trackingId}/photos`);
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
      // If the photo URL already starts with http (Cloudinary URL), use it as is
      if (photo.startsWith('http')) {
        return {
          primary: photo,
          fallback: photo
        };
      }
      // Otherwise, use localhost fallback (for old local images)
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
                  <span className="filter-icon"></span>
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
                          <span className="filter-label-icon"></span>
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
                          <span className="filter-label-icon"></span>
                          Urgency
                        </label>
                        <select 
                          name="urgency" 
                          value={filters.urgency} 
                          onChange={handleFilterChange} 
                          className="modern-filter-select"
                        >
                          <option value="">All Urgency Levels</option>
                          <option value="High">High Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="Low">Low Priority</option>
                        </select>
                      </div>
                      
                      <div className="filter-item">
                        <label className="filter-label">
                          <span className="filter-label-icon"></span>
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
                          <span className="filter-label-icon"></span>
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
                          <span className="filter-label-icon"></span>
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
                          <span className="filter-label-icon"></span>
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
                        <span className="btn-icon"></span>
                        Clear All
                      </button>
                      <button 
                        className="filter-action-btn primary"
                        onClick={() => setFilterPanelOpen(false)}
                      >
                        <span className="btn-icon"></span>
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
            {initialLoading ? (
              <PageLoader message="Loading posts..." />
            ) : (
              posts.map((post, idx) => {
              const isLast = idx === posts.length - 1;
              // Filter out empty, null, undefined, or whitespace-only photo entries
              const photoArr = post.photos ? post.photos.split(',')
                .map(p => p.trim())
                .filter(p => p && p !== 'null' && p !== 'undefined' && p.length > 0) : [];
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
                            src={photoArr[currentPhotoIndex[post.trackingId] || 0].startsWith('http') ? 
                                  photoArr[currentPhotoIndex[post.trackingId] || 0] : 
                                  `http://localhost:8080/uploads/${photoArr[currentPhotoIndex[post.trackingId] || 0].replace('/uploads/', '')}`} 
                            alt={`Post Photo ${(currentPhotoIndex[post.trackingId] || 0) + 1}`} 
                            className="social-post-image"
                            onClick={() => handleOpenPhotoViewer(photoArr, currentPhotoIndex[post.trackingId] || 0)}
                            onError={(e) => {
                              const currentPhoto = photoArr[currentPhotoIndex[post.trackingId] || 0];
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
            }))}
            
            {loading && (
              <div className="infinite-loading-container">
                <div className="infinite-loading-spinner"></div>
                <span className="infinite-loading-text">Loading more posts...</span>
              </div>
            )}
            
            {!hasMore && !loading && posts.length === 0 && (
              <div className="empty-state-container">
                <div className="empty-state-icon">📝</div>
                <h3 className="empty-state-title">No Posts Found</h3>
                <p className="empty-state-message">
                  There are currently no posts available on the timeline.
                  <br />
                  Try adjusting your filters or check back later for new posts.
                </p>
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

    </div>
  );
}

export default Home;