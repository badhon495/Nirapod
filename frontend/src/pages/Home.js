import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
    <div className="home-container">
      <h2>Timeline</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
        <input name="tag" placeholder="Tag" value={form.tag} onChange={handleChange} />
        <button type="submit">Post</button>
      </form>
      <div style={{ marginBottom: 16 }}>
        <input name="location" placeholder="Filter by location" value={filters.location} onChange={handleFilterChange} />
        <input name="tag" placeholder="Filter by tag" value={filters.tag} onChange={handleFilterChange} />
        <select name="time" value={filters.time} onChange={handleFilterChange}>
          <option value="">All Time</option>
          <option value={1000 * 60 * 60 * 24}>Last 24 hours</option>
          <option value={1000 * 60 * 60 * 24 * 7}>Last 7 days</option>
          <option value={1000 * 60 * 60 * 24 * 30}>Last 30 days</option>
        </select>
      </div>
      <div className="timeline">
        {filteredPosts.map(post => (
          <div key={post.id} className="post-card">
            <h3>{post.title}</h3>
            <p>{post.description}</p>
            <div><b>Location:</b> {post.location} <b>Tag:</b> {post.tag}</div>
            <div><small>{post.createdAt}</small></div>
            {followed.includes(post.id) ? (
              <button onClick={() => handleUnfollow(post.id)} style={{ color: 'green' }}>Following</button>
            ) : (
              <button onClick={() => handleFollow(post.id)}>Follow</button>
            )}
            <button onClick={() => handleOpenComments(post.id)}>Comment</button>
            {openComments[post.id] && (
              <div className="comments-section">
                <button onClick={() => handleOpenComments(post.id)}>×</button>
                <div>
                  {(comments[post.id] || []).map(c => (
                    <div key={c.id} className="comment-item">
                      <b>User {c.userId}:</b> {c.content}
                    </div>
                  ))}
                </div>
                <input
                  value={commentInputs[post.id] || ''}
                  onChange={e => handleCommentInput(post.id, e.target.value)}
                  placeholder="Add a comment"
                />
                <button onClick={() => handleAddComment(post.id)}>Add</button>
              </div>
            )}
            <button onClick={() => handleOpenUpdates(post.id)}>Update</button>
            {openUpdates[post.id] && (
              <div className="updates-section">
                <button onClick={() => handleOpenUpdates(post.id)}>×</button>
                <div>
                  {(updates[post.id] || []).map(u => (
                    <div key={u.id} className="update-item">
                      <b>User {u.userId}:</b> {u.updateText}
                    </div>
                  ))}
                </div>
                <input
                  value={updateInputs[post.id] || ''}
                  onChange={e => handleUpdateInput(post.id, e.target.value)}
                  placeholder="Add an update"
                />
                <button onClick={() => handleAddUpdate(post.id)}>Add</button>
              </div>
            )}
            <button onClick={() => handleOpenPhotos(post.id)}>Photos</button>
            {openPhotos[post.id] && (
              <div className="photos-section">
                <button onClick={() => handleOpenPhotos(post.id)}>×</button>
                <div>
                  {(photos[post.id] || []).map(photo => (
                    <img key={photo.id} src={photo.filePath} alt="Post" style={{ maxWidth: 120, margin: 4 }} />
                  ))}
                </div>
                <input type="file" onChange={e => handlePhotoFile(post.id, e.target.files[0])} />
                <button onClick={() => handleUploadPhoto(post.id)}>Upload</button>
              </div>
            )}
            <button onClick={() => handleOpenReport(post.id)}>Report</button>
            {openReport[post.id] && (
              <div className="report-popup">
                <button onClick={() => handleOpenReport(post.id)}>×</button>
                <div><b>Report Post</b></div>
                <textarea
                  placeholder="Reason for reporting"
                  value={reportReasons[post.id] || ''}
                  onChange={e => handleReportReason(post.id, e.target.value)}
                  rows={3}
                />
                <div style={{ color: 'red', fontSize: 12, margin: '8px 0' }}>
                  False reporting may result in account suspension or legal action.
                </div>
                <button onClick={() => handleSubmitReport(post.id)}>Submit Report</button>
                {reportMsg[post.id] && <div>{reportMsg[post.id]}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
