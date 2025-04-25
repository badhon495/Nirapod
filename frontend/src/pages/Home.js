import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Home.css';

function Home() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', location: '', tag: '' });
  const [openComments, setOpenComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [openUpdates, setOpenUpdates] = useState({});
  const [updates, setUpdates] = useState({});
  const [updateInputs, setUpdateInputs] = useState({});
  const [openPhotos, setOpenPhotos] = useState({});
  const [photos, setPhotos] = useState({});
  const [photoFiles, setPhotoFiles] = useState({});
  const [openReport, setOpenReport] = useState({});
  const [reportReasons, setReportReasons] = useState({});
  const [reportMsg, setReportMsg] = useState({});
  const [followed, setFollowed] = useState([]);
  const [filters, setFilters] = useState({ location: '', tag: '', time: '' });

  useEffect(() => {
    fetchPosts();
    fetchFollowed();
  }, []);

  const fetchPosts = async () => {
    const res = await axios.get('/api/posts');
    setPosts(res.data);
  };

  const fetchFollowed = async () => {
    const res = await axios.get('/api/follows/user/1'); // TODO: Replace 1 with actual userId
    setFollowed(res.data.map(f => f.postId));
  };

  const fetchComments = async (postId) => {
    const res = await axios.get(`/api/comments/post/${postId}`);
    setComments(c => ({ ...c, [postId]: res.data }));
  };

  const fetchUpdates = async (postId) => {
    const res = await axios.get(`/api/updates/post/${postId}`);
    setUpdates(u => ({ ...u, [postId]: res.data }));
  };

  const fetchPhotos = async (postId) => {
    const res = await axios.get(`/api/photos/post/${postId}`);
    setPhotos(p => ({ ...p, [postId]: res.data }));
  };

  const handleOpenComments = (postId) => {
    setOpenComments(o => ({ ...o, [postId]: !o[postId] }));
    if (!comments[postId]) fetchComments(postId);
  };

  const handleOpenUpdates = (postId) => {
    setOpenUpdates(o => ({ ...o, [postId]: !o[postId] }));
    if (!updates[postId]) fetchUpdates(postId);
  };

  const handleOpenPhotos = (postId) => {
    setOpenPhotos(o => ({ ...o, [postId]: !o[postId] }));
    if (!photos[postId]) fetchPhotos(postId);
  };

  const handleOpenReport = (postId) => {
    setOpenReport(o => ({ ...o, [postId]: !o[postId] }));
    setReportMsg(m => ({ ...m, [postId]: '' }));
  };

  const handleCommentInput = (postId, value) => {
    setCommentInputs(i => ({ ...i, [postId]: value }));
  };

  const handleUpdateInput = (postId, value) => {
    setUpdateInputs(i => ({ ...i, [postId]: value }));
  };

  const handlePhotoFile = (postId, file) => {
    setPhotoFiles(f => ({ ...f, [postId]: file }));
  };

  const handleReportReason = (postId, value) => {
    setReportReasons(r => ({ ...r, [postId]: value }));
  };

  const handleAddComment = async (postId) => {
    await axios.post('/api/comments', {
      postId,
      userId: 1, // TODO: Replace with actual userId
      content: commentInputs[postId] || ''
    });
    setCommentInputs(i => ({ ...i, [postId]: '' }));
    fetchComments(postId);
  };

  const handleAddUpdate = async (postId) => {
    await axios.post('/api/updates', {
      postId,
      userId: 1, // TODO: Replace with actual userId
      updateText: updateInputs[postId] || ''
    });
    setUpdateInputs(i => ({ ...i, [postId]: '' }));
    fetchUpdates(postId);
  };

  const handleUploadPhoto = async (postId) => {
    const formData = new FormData();
    formData.append('postId', postId);
    formData.append('userId', 1); // TODO: Replace with actual userId
    formData.append('file', photoFiles[postId]);
    await axios.post('/api/photos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    setPhotoFiles(f => ({ ...f, [postId]: null }));
    fetchPhotos(postId);
  };

  const handleSubmitReport = async (postId) => {
    try {
      await axios.post('/api/reports', {
        postId,
        userId: 1, // TODO: Replace with actual userId
        reason: reportReasons[postId] || ''
      });
      setReportMsg(m => ({ ...m, [postId]: 'Report submitted.' }));
      setTimeout(() => setOpenReport(o => ({ ...o, [postId]: false })), 1200);
    } catch {
      setReportMsg(m => ({ ...m, [postId]: 'Failed to submit report.' }));
    }
  };

  const handleFollow = async (postId) => {
    await axios.post('/api/follows/follow', null, { params: { postId, userId: 1 } });
    fetchFollowed();
  };

  const handleUnfollow = async (postId) => {
    await axios.post('/api/follows/unfollow', null, { params: { postId, userId: 1 } });
    fetchFollowed();
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    await axios.post('/api/posts', { ...form, userId: 1 }); // TODO: Replace with actual userId
    setForm({ title: '', description: '', location: '', tag: '' });
    fetchPosts();
  };

  const handleFilterChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });

  const filteredPosts = posts.filter(post => {
    const matchLocation = !filters.location || (post.location && post.location.toLowerCase().includes(filters.location.toLowerCase()));
    const matchTag = !filters.tag || (post.tag && post.tag.toLowerCase().includes(filters.tag.toLowerCase()));
    const matchTime = !filters.time || (post.createdAt && new Date(post.createdAt) >= new Date(Date.now() - parseInt(filters.time)));
    return matchLocation && matchTag && matchTime;
  });

  return (
    <div className="home-bg">
      <div className="home-navbar-spacer" />
      <div className="timeline">
        {filteredPosts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-info-box">
              <div className="post-location"><b>From:</b> {post.location}</div>
              <div className="post-context"><b>Context:</b> {post.description}</div>
              <div className="post-update"><b>Update:</b> fire service working on this issue [Mdpur Fire service - 03:48pm]</div>
              <div className="post-meta">
                <span className="post-time">Time: 16-Oct-2026 03:33pm</span>
                <span className="post-by"><b>By:</b> Badhon</span>
              </div>
            </div>
            <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80" alt="Post" className="post-image" />
            <div className="post-actions">
              <button className="post-action-btn">Follow</button>
              <button className="post-action-btn">Comment</button>
              <button className="post-action-btn">Update</button>
              <button className="post-action-btn">Photos</button>
              <button className="post-action-btn">Report</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
