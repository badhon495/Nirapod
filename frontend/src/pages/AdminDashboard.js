import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    axios.get('/api/user/all').then(res => setUsers(res.data));
  };

  const handleApprove = async (id) => {
    await axios.put(`/api/user/${id}/approve`);
    fetchUsers();
  };

  const handleReject = async (id) => {
    await axios.put(`/api/user/${id}/reject`);
    fetchUsers();
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard - User List</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>User Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phoneNumber}</td>
              <td>{u.userType}</td>
              <td>{u.status}</td>
              <td>
                {u.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleApprove(u.id)}>Approve</button>
                    <button onClick={() => handleReject(u.id)} style={{ marginLeft: 8 }}>Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
