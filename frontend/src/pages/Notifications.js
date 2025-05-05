import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userNid = localStorage.getItem('nirapod_identifier');

  useEffect(() => {
    if (!userNid) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [userNid, navigate]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`/api/notifications/user/${userNid}`);
      setNotifications(res.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      // Update the notification in the local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? {...n, read: true} : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    // Check if notification is about a comment
    const isCommentNotification = notification.message.toLowerCase().includes('comment');
    // Navigate with appropriate parameters
    navigate(`/complaint/${notification.complaintId}?openComments=true${isCommentNotification ? '&commentOnly=true' : ''}`);
  };

  if (loading) {
    return <div className="notifications-loading">Loading...</div>;
  }

  return (
    <div className="notifications-container">
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <div className="notifications-empty">No notifications</div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-content">
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </div>
              {!notification.read && (
                <div className="notification-badge">New</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
