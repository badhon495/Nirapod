import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const [commentInput, setCommentInput] = useState('');
  const [commentUserNames, setCommentUserNames] = useState({});
  const [openPhotos, setOpenPhotos] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [openReport, setOpenReport] = useState(null);
  const [followed, setFollowed] = useState([]);
  const [sortOpen, setSortOpen] = useState(false);
  const observer = useRef();
  const userNid = localStorage.getItem('nirapod_identifier');
  const filterBtnRef = useRef(null);
  const filterDropdownRef = useRef(null);

  // Fetch posts with filters and pagination
  const fetchPosts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await ComplaintService.getAllComplaints();
      let filtered = res;
      if (filters.area) filtered = filtered.filter(p => (p.area || '').toLowerCase().includes(filters.area.toLowerCase()));
      if (filters.urgency) filtered = filtered.filter(p => (p.urgency || '').toLowerCase() === filters.urgency.toLowerCase());
      if (filters.district) filtered = filtered.filter(p => (p.district || '').toLowerCase().includes(filters.district.toLowerCase()));
      if (filters.tags) filtered = filtered.filter(p => (p.tags || '').toLowerCase().includes(filters.tags.toLowerCase()));
      // Date range filter
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

  useEffect(() => {
    if (!sortOpen) return;
    function handleClickOutside(event) {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(event.target)
      ) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortOpen]);

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
      setFollowed(prev => [...prev, trackingId]); // Optimistically update
    } catch (e) {
      // Optionally show error
    }
  };
  const handleUnfollow = async (trackingId) => {
    if (!userNid) return;
    try {
      await axios.post('/api/follows/unfollow', null, { params: { postId: trackingId, userId: userNid } });
      setFollowed(prev => prev.filter(id => id !== trackingId)); // Optimistically update
    } catch (e) {
      // Optionally show error
    }
  };
  const handleOpenComment = async (trackingId) => {
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
    const complaint = posts.find(p => p.trackingId === trackingId);
    let commentObj = {};
    try {
      commentObj = complaint.comment ? JSON.parse(complaint.comment) : {};
    } catch { commentObj = {}; }
    // Always use NID as key
    commentObj[userNid] = commentInput;
    let status = complaint.status;
    if (typeof status === 'string') {
      if (status === 'Solved') status = 2;
      else if (status === 'In Progress') status = 1;
      else status = 0;
    }
    await axios.put(`/api/complaint/update/${trackingId}`, {
      ...complaint,
      comment: JSON.stringify(commentObj),
      status
    });
    setOpenComment(null);
  };
  const handleOpenPhotos = (trackingId) => {
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
    await axios.put(`/api/complaint/update/${trackingId}`, { ...complaint, report: reportArr.join(',') });
    setOpenReport(null);
  };

  // Filter bar handlers
  const handleFilterChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });

  return (
    <div className="home-bg">
      <div style={{ padding: '12px 0 0 0', display: 'flex', justifyContent: 'flex-start', marginLeft: 438 }}>
        <div style={{ background: '#232b36', borderRadius: 18, padding: 12, marginBottom: 12, display: 'flex', gap: 18, alignItems: 'center', position: 'relative' }}>
          <button
            ref={filterBtnRef}
            style={{ borderRadius: 8, padding: '8px 32px', fontSize: 16, border: 'none', background: '#e5e7eb', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setSortOpen(o => !o)}
          >
            Filter
          </button>
          {sortOpen && (
            <div ref={filterDropdownRef} style={{ position: 'absolute', top: 48, left: 0, background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px #0003', padding: 32, zIndex: 10, minWidth: 380, maxWidth: 480, width: 100, boxSizing: 'border-box', overflow: 'hidden', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500 }}>Area:</label>
                <input name="area" placeholder="Area" value={filters.area} onChange={handleFilterChange} style={{ borderRadius: 8, padding: '10px 18px', fontSize: 16, border: '1px solid #ddd', width: '100%', marginTop: 4, boxSizing: 'border-box', overflow: 'hidden' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500 }}>Urgency:</label>
                <select name="urgency" value={filters.urgency} onChange={handleFilterChange} style={{ borderRadius: 8, padding: '10px 18px', fontSize: 16, border: '1px solid #ddd', width: '100%', marginTop: 4, boxSizing: 'border-box', overflow: 'hidden' }}>
                  {urgencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500 }}>District:</label>
                <input name="district" placeholder="District" value={filters.district} onChange={handleFilterChange} style={{ borderRadius: 8, padding: '10px 18px', fontSize: 16, border: '1px solid #ddd', width: '100%', marginTop: 4, boxSizing: 'border-box', overflow: 'hidden' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500 }}>Tags:</label>
                <input name="tags" placeholder="Tags" value={filters.tags} onChange={handleFilterChange} style={{ borderRadius: 8, padding: '10px 18px', fontSize: 16, border: '1px solid #ddd', width: '100%', marginTop: 4, boxSizing: 'border-box', overflow: 'hidden' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500 }}>From Date:</label>
                <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} style={{ borderRadius: 8, padding: '10px 18px', fontSize: 16, border: '1px solid #ddd', width: '100%', marginTop: 4, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500 }}>To Date:</label>
                <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} style={{ borderRadius: 8, padding: '10px 18px', fontSize: 16, border: '1px solid #ddd', width: '100%', marginTop: 4, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" style={{ borderRadius: 8, padding: '10px 32px', fontSize: 16, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }} onClick={() => setSortOpen(false)}>Apply</button>
                <button type="button" style={{ borderRadius: 8, padding: '10px 32px', fontSize: 16, border: 'none', background: '#eee', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setFilters({ area: '', urgency: '', district: '', tags: '', fromDate: '', toDate: '' }); setSortOpen(false); }}>Reset</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="timeline" style={{ paddingTop: 8 }}>
        {posts.map((post, idx) => {
          const isLast = idx === posts.length - 1;
          const photoArr = post.photos ? post.photos.split(',').map(p => p.trim()).filter(Boolean) : [];
          return (
            <div key={post.trackingId} className="post-card" ref={isLast ? lastPostRef : null}>
              <div className="post-info-box">
                <div className="post-location"><b>From:</b> {post.area || post.location || 'N/A'}</div>
                <div className="post-context"><b>Context:</b> {post.details}</div>
                <div className="post-update"><b>Update:</b> {post.updateNote || 'No update yet.'}</div>
                <div className="post-progress-row" style={{marginTop:8}}>
                  <span style={{fontWeight:600}}>Progress: </span>
                  <span className={`progress-badge ${post.status === 'Solved' ? 'progress-solved' : post.status === 'In Progress' ? 'progress-inprogress' : 'progress-unsolved'}`}>{post.status || 'Unsolved'}</span>
                </div>
                <div className="post-meta">
                  <span className="post-time"><b>Time:</b> {post.time ? new Date(post.time).toLocaleString() : 'N/A'}</span>
                  <span className="post-by"><b>By:</b> {post.complainBy || post.userName || 'N/A'}</span>
                  <span className="post-to"><b>To:</b> {post.subject || post.complainTo || 'N/A'}</span>
                </div>
              </div>
              {photoArr.length > 0 && (
                <img src={`http://localhost:8080/${photoArr[0].replace('/uploads/', '')}`} alt="Post" className="post-image" />
              )}
              <div className="post-actions">
                {followed.includes(post.trackingId) ? (
                  <button className="post-action-btn" onClick={() => handleUnfollow(post.trackingId)}>Unfollow</button>
                ) : (
                  <button className="post-action-btn" onClick={() => handleFollow(post.trackingId)}>Follow</button>
                )}
                <button className="post-action-btn" onClick={() => handleOpenComment(post.trackingId)}>Comment</button>
                <button className="post-action-btn" onClick={() => handleOpenPhotos(post.trackingId)}>Photos</button>
                <button className="post-action-btn" onClick={() => handleOpenReport(post.trackingId)}>Report</button>
              </div>
              {/* Comment Popup */}
              {openComment === post.trackingId && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, maxWidth: 420 }}>
                    <h3>Comments</h3>
                    <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 16 }}>
                      {(() => {
                        let commentObj = {};
                        try {
                          commentObj = post.comment ? JSON.parse(post.comment) : {};
                        } catch { commentObj = {}; }
                        const keys = Object.keys(commentObj);
                        if (keys.length === 0) return <div style={{ color: '#888', marginBottom: 8 }}>No comments yet.</div>;
                        return keys.map(key => (
                          <div key={key} style={{ marginBottom: 10, background: '#f5f6fa', borderRadius: 8, padding: '8px 12px' }}>
                            <b>{commentUserNames[key] || key}:</b> <span style={{ color: '#333' }}>{commentObj[key]}</span>
                          </div>
                        ));
                      })()}
                    </div>
                    <textarea value={commentInput} onChange={e => setCommentInput(e.target.value)} style={{ width: '100%', minHeight: 80, borderRadius: 8, padding: 8 }} placeholder="Write your comment..." />
                    <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                      <button onClick={() => handleAddComment(post.trackingId)} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600 }}>Submit</button>
                      <button onClick={() => setOpenComment(null)} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '8px 24px' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              {/* Photos Popup */}
              {openPhotos === post.trackingId && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320 }}>
                    <h3>Photos</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {photoArr.map((p, i) => (
                        <img key={i} src={`http://localhost:8080/${p.replace('/uploads/', '')}`} alt="photo" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }} />
                      ))}
                    </div>
                    <input type="file" multiple onChange={e => setPhotoFiles(Array.from(e.target.files))} />
                    <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                      <button onClick={() => handleUploadPhotos(post.trackingId)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600 }}>Upload</button>
                      <button onClick={() => setOpenPhotos(null)} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '8px 24px' }}>Close</button>
                    </div>
                  </div>
                </div>
              )}
              {/* Report Popup */}
              {openReport === post.trackingId && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320 }}>
                    <h3>Report</h3>
                    <div style={{ marginBottom: 12 }}>Are you sure you want to report this post?</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => handleReport(post.trackingId)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600 }}>Report</button>
                      <button onClick={() => setOpenReport(null)} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '8px 24px' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {loading && <div style={{ color: '#fff', margin: 24 }}>Loading...</div>}
        {!hasMore && !loading && posts.length === 0 && <div style={{ color: '#fff', margin: 24 }}>No posts found.</div>}
      </div>
    </div>
  );
}

export default Home;
