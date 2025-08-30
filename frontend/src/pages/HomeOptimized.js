import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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

// Memoized components for better performance
const PostCard = React.memo(({ 
  post, 
  userNid, 
  followed, 
  commentUserNames, 
  currentPhotoIndex,
  onOpenComment,
  onOpenPhotos,
  onOpenReport,
  onFollow,
  onUnfollow,
  onPhotoNavigation,
  onOpenPhotoViewer 
}) => {
  const isFollowed = followed.includes(post.trackingId);
  const photos = post.uploadPhotos ? post.uploadPhotos.split(',').filter(p => p.trim()) : [];
  const currentIndex = currentPhotoIndex[post.trackingId] || 0;

  return (
    <div className="post-card gpu-accelerated fade-in-up" data-tracking-id={post.trackingId}>
      {/* Post content implementation */}
      <div className="post-header">
        <h3 className="post-title">{post.details}</h3>
        <span className={`urgency-badge urgency-${post.urgency?.toLowerCase()}`}>
          {post.urgency}
        </span>
      </div>
      
      <div className="post-meta">
        <span className="post-location">{post.area}, {post.district}</span>
        <span className="post-time">{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>

      {photos.length > 0 && (
        <div className="post-photos">
          {photos.length > 1 && (
            <div className="photo-navigation">
              <button 
                onClick={() => onPhotoNavigation(post.trackingId, 'prev')}
                className="nav-btn prev-btn"
                disabled={currentIndex === 0}
              >
                &#8249;
              </button>
              <span className="photo-counter">{currentIndex + 1} / {photos.length}</span>
              <button 
                onClick={() => onPhotoNavigation(post.trackingId, 'next')}
                className="nav-btn next-btn"
                disabled={currentIndex === photos.length - 1}
              >
                &#8250;
              </button>
            </div>
          )}
          <img 
            src={photos[currentIndex]} 
            alt="Post content"
            className="post-image hover-scale"
            onClick={() => onOpenPhotoViewer(photos, currentIndex)}
            loading="lazy"
          />
        </div>
      )}

      <div className="post-actions">
        <button 
          onClick={() => onOpenComment(post.trackingId)} 
          className="action-btn comment-btn hover-lift"
        >
          💬 Comment
        </button>
        
        {userNid && (
          <button 
            onClick={() => isFollowed ? onUnfollow(post.trackingId) : onFollow(post.trackingId)}
            className={`action-btn follow-btn ${isFollowed ? 'following' : ''} hover-lift`}
          >
            {isFollowed ? '✓ Following' : '👁 Follow'}
          </button>
        )}
        
        <button 
          onClick={() => onOpenPhotos(post.trackingId)} 
          className="action-btn photo-btn hover-lift"
        >
          📷 Add Photo
        </button>
        
        <button 
          onClick={() => onOpenReport(post.trackingId)} 
          className="action-btn report-btn hover-lift"
        >
          🚨 Report
        </button>
      </div>
    </div>
  );
});

const FilterPanel = React.memo(({ 
  filters, 
  onFilterChange, 
  onApplyFilters, 
  onClearFilters,
  isOpen,
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="filter-panel gpu-accelerated fade-in" onClick={onClose}>
      <div className="filter-content scale-in" onClick={(e) => e.stopPropagation()}>
        <h3>Filter Posts</h3>
        
        <div className="filter-group">
          <label>Area</label>
          <input
            type="text"
            value={filters.area}
            onChange={(e) => onFilterChange('area', e.target.value)}
            placeholder="Enter area..."
          />
        </div>

        <div className="filter-group">
          <label>Urgency</label>
          <select
            value={filters.urgency}
            onChange={(e) => onFilterChange('urgency', e.target.value)}
          >
            {urgencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>District</label>
          <input
            type="text"
            value={filters.district}
            onChange={(e) => onFilterChange('district', e.target.value)}
            placeholder="Enter district..."
          />
        </div>

        <div className="filter-actions">
          <button onClick={onApplyFilters} className="btn btn-primary">
            Apply Filters
          </button>
          <button onClick={onClearFilters} className="btn btn-secondary">
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
});

function Home() {
  // State management with optimized initial values
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({ 
    area: '', 
    urgency: '', 
    district: '', 
    tags: '', 
    fromDate: '', 
    toDate: '' 
  });
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

  // Refs
  const observer = useRef();
  const userNid = localStorage.getItem('nirapod_identifier');
  const filterBtnRef = useRef(null);
  const filterPanelRef = useRef(null);
  const location = useLocation();

  // Memoized values for performance
  const hasUserAuth = useMemo(() => !!userNid, [userNid]);

  // Optimized fetch posts function with debouncing
  const fetchPosts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    
    try {
      const res = await ComplaintService.getAllComplaints();
      let filtered = res.filter(p => p.postOnTimeline === true);
      
      // Apply filters efficiently
      if (filters.area) filtered = filtered.filter(p => 
        (p.area || '').toLowerCase().includes(filters.area.toLowerCase())
      );
      if (filters.urgency) filtered = filtered.filter(p => 
        (p.urgency || '').toLowerCase() === filters.urgency.toLowerCase()
      );
      if (filters.district) filtered = filtered.filter(p => 
        (p.district || '').toLowerCase().includes(filters.district.toLowerCase())
      );
      if (filters.tags) filtered = filtered.filter(p => 
        (p.tags || '').toLowerCase().includes(filters.tags.toLowerCase())
      );

      // Date filtering
      if (filters.fromDate) {
        const fromDate = new Date(filters.fromDate);
        filtered = filtered.filter(p => new Date(p.createdAt) >= fromDate);
      }
      if (filters.toDate) {
        const toDate = new Date(filters.toDate);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(p => new Date(p.createdAt) <= toDate);
      }

      // Sort by date (newest first)
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Pagination
      const pageSize = 10;
      const start = reset ? 0 : page * pageSize;
      const paginatedPosts = filtered.slice(start, start + pageSize);

      if (reset) {
        setPosts(paginatedPosts);
        setPage(1);
      } else {
        setPosts(prev => [...prev, ...paginatedPosts]);
        setPage(prev => prev + 1);
      }

      setHasMore(start + pageSize < filtered.length);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page, loading]);

  // Optimized follow/unfollow functions
  const handleFollow = useCallback(async (trackingId) => {
    if (!hasUserAuth) return;
    
    try {
      await axios.post('/api/follows', { userId: userNid, postId: trackingId });
      setFollowed(prev => [...prev, trackingId]);
    } catch (error) {
      console.error('Follow error:', error);
    }
  }, [hasUserAuth, userNid]);

  const handleUnfollow = useCallback(async (trackingId) => {
    if (!hasUserAuth) return;
    
    try {
      await axios.delete(`/api/follows/${userNid}/${trackingId}`);
      setFollowed(prev => prev.filter(id => id !== trackingId));
    } catch (error) {
      console.error('Unfollow error:', error);
    }
  }, [hasUserAuth, userNid]);

  // Photo navigation handlers
  const handlePhotoNavigation = useCallback((trackingId, direction) => {
    setCurrentPhotoIndex(prev => {
      const post = posts.find(p => p.trackingId === trackingId);
      if (!post?.uploadPhotos) return prev;
      
      const photos = post.uploadPhotos.split(',').filter(p => p.trim());
      const currentIndex = prev[trackingId] || 0;
      
      let newIndex;
      if (direction === 'next') {
        newIndex = Math.min(currentIndex + 1, photos.length - 1);
      } else {
        newIndex = Math.max(currentIndex - 1, 0);
      }
      
      return { ...prev, [trackingId]: newIndex };
    });
  }, [posts]);

  // Filter handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setPage(0);
    fetchPosts(true);
    setFilterPanelOpen(false);
  }, [fetchPosts]);

  const handleClearFilters = useCallback(() => {
    setFilters({ area: '', urgency: '', district: '', tags: '', fromDate: '', toDate: '' });
    setPage(0);
    fetchPosts(true);
    setFilterPanelOpen(false);
  }, [fetchPosts]);

  // Infinite scroll observer
  const lastPostRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchPosts();
      }
    }, { threshold: 0.1 });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchPosts]);

  // Effects
  useEffect(() => {
    fetchPosts(true);
  }, []);

  useEffect(() => {
    if (hasUserAuth) {
      const fetchFollowed = async () => {
        try {
          const res = await axios.get(`/api/follows/user/${userNid}`);
          setFollowed(res.data.map(f => f.postId));
        } catch (error) {
          console.error('Error fetching followed posts:', error);
        }
      };
      fetchFollowed();
    }
  }, [hasUserAuth, userNid]);

  // Memoized render function for posts
  const renderPosts = useMemo(() => {
    return posts.map((post, index) => {
      const isLast = index === posts.length - 1;
      
      return (
        <div 
          key={post.trackingId} 
          ref={isLast ? lastPostRef : null}
          className="stagger-item"
          style={{ animationDelay: `${(index % 10) * 0.05}s` }}
        >
          <PostCard
            post={post}
            userNid={userNid}
            followed={followed}
            commentUserNames={commentUserNames}
            currentPhotoIndex={currentPhotoIndex}
            onOpenComment={setOpenComment}
            onOpenPhotos={setOpenPhotos}
            onOpenReport={setOpenReport}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            onPhotoNavigation={handlePhotoNavigation}
            onOpenPhotoViewer={(photos, index) => 
              setPhotoViewer({ isOpen: true, photos, currentIndex: index })
            }
          />
        </div>
      );
    });
  }, [posts, userNid, followed, commentUserNames, currentPhotoIndex, handleFollow, handleUnfollow, handlePhotoNavigation, lastPostRef]);

  return (
    <div className="home-container optimized-container">
      <div className="home-header gpu-accelerated fade-in">
        <h1 className="optimized-text">Community Feed</h1>
        <button 
          ref={filterBtnRef}
          onClick={() => setFilterPanelOpen(true)}
          className="filter-btn hover-lift"
        >
          🔍 Filter Posts
        </button>
      </div>

      <div className="posts-container">
        {renderPosts}
        
        {loading && (
          <div className="loading-container">
            <div className="optimized-spinner"></div>
            <span className="loading-text">Loading more posts...</span>
          </div>
        )}
        
        {!hasMore && !loading && posts.length === 0 && (
          <div className="empty-state fade-in">
            <div className="empty-icon">📝</div>
            <h3>No posts found</h3>
            <p>Try adjusting your filters or check back later for new posts.</p>
          </div>
        )}
      </div>

      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
      />

      {/* Other modals and components */}
      {photoViewer.isOpen && (
        <div className="photo-viewer-modal gpu-accelerated fade-in">
          {/* Photo viewer implementation */}
        </div>
      )}
    </div>
  );
}

export default React.memo(Home);
