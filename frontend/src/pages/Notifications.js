import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Notifications() {
  const userId = 1; // TODO: Replace with actual logged-in user ID
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const res = await axios.get(`/api/notifications/user/${userId}`);
    setNotifications(res.data);
  };

  const markAsRead = async (id) => {
    await axios.put(`/api/notifications/${id}/read`);
    fetchNotifications();
  };

  return (
    <div className="notifications-container">
      <h2>Notifications</h2>
      {notifications.length === 0 && <div>No notifications.</div>}
      <ul>
        {notifications.map(n => (
          <li key={n.id} style={{ background: n.read ? '#eee' : '#ffd' }}>
            {n.message} <span style={{ fontSize: 12, color: '#888' }}>({new Date(n.createdAt).toLocaleString()})</span>
            {!n.read && <button onClick={() => markAsRead(n.id)} style={{ marginLeft: 8 }}>Mark as read</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Notifications;
