import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ComplaintList.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem('nirapod_identifier');
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!userId) {
      setError('Please log in to view notifications');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching notifications for user:', userId);
      const res = await axios.get(`/api/notifications/user/${userId}`);
      console.log('Notifications response:', res.data);
      
      if (!Array.isArray(res.data)) {
        console.error('Expected array of notifications but got:', res.data);
        setError('Invalid response format from server');
        setLoading(false);
        return;
      }

      // Sort notifications by createdAt in descending order (newest first)
      const sortedNotifications = res.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setNotifications(sortedNotifications);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch notifications:', err.response?.data || err.message);
      setError('Failed to fetch notifications. Please try again later.');
      setLoading(false);
    }
  };

  const handleClick = async (notification) => {
    if (!userId) {
      navigate('/login');
      return;
    }

    try {
      if (!notification.read) {
        await axios.put(`/api/notifications/${notification.id}/read`);
        setNotifications(prevNotifications => 
          prevNotifications.map(n => 
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      }

      if (notification.relatedPostId) {
        // First verify that the user is still authenticated
        try {
          await axios.get(`/api/user/by-identifier?value=${userId}`);
          // User is authenticated, proceed with navigation
          navigate('/home', { 
            state: { 
              openPost: notification.relatedPostId,
              fromNotification: true 
            }
          });
        } catch (authErr) {
          // Authentication failed, redirect to login
          localStorage.removeItem('nirapod_identifier');
          navigate('/login');
        }
      }
    } catch (err) {
      console.error('Error handling notification:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationStyle = (notification) => {
    let className = 'notification-item';
    if (!notification.read) className += ' notification-unread';
    return className;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    }
    
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours < 1) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      }
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString();
  };

  if (loading) return (
    <div className="notifications-wrapper">
      <h2 className="page-title">Notifications</h2>
      <div className="loading">Loading notifications...</div>
    </div>
  );

  if (error) return (
    <div className="notifications-wrapper">
      <h2 className="page-title">Notifications</h2>
      <div className="error">{error}</div>
    </div>
  );

  return (
    <div className="notifications-wrapper">
      <h2 className="page-title">Notifications</h2>
      {notifications.length === 0 ? (
        <div className="empty-state">
          No notifications yet
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={getNotificationStyle(notification)}
              onClick={() => handleClick(notification)}
            >
              <div className="notification-content">
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">{formatTime(notification.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
