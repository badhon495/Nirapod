import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/user/all');
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/user/${id}/approve`);
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`/api/user/${id}/reject`);
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  const getFilteredUsers = () => {
    if (filter === 'ALL') return users;
    return users.filter(user => user.status === filter);
  };

  const getStatusCount = (status) => {
    return users.filter(user => user.status === status).length;
  };

  const getUserInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Manage users and monitor system activity</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏳</span>
            <div className="stat-number">{getStatusCount('PENDING')}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-number">{getStatusCount('APPROVED')}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">❌</span>
            <div className="stat-number">{getStatusCount('REJECTED')}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>

        <div className="users-table-container">
          <div className="table-header">
            <h2 className="table-title">User Management</h2>
            <div className="filter-controls">
              <select 
                className="filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="ALL">All Users</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : getFilteredUsers().length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">📭</div>
              <div className="no-data-text">No users found</div>
              <div className="no-data-subtext">
                {filter === 'ALL' ? 'No users registered yet' : `No ${filter.toLowerCase()} users`}
              </div>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredUsers().map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {getUserInitials(user.name)}
                        </div>
                        <div className="user-details">
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.phoneNumber}</td>
                    <td>{user.userType}</td>
                    <td>
                      <span className={`status-badge status-${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      {user.status === 'PENDING' && (
                        <div className="action-buttons">
                          <button 
                            className="action-btn approve-btn"
                            onClick={() => handleApprove(user.id)}
                          >
                            Approve
                          </button>
                          <button 
                            className="action-btn reject-btn"
                            onClick={() => handleReject(user.id)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
