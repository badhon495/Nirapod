import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './complain.css';
import './UpdateProfile.css';
import './UserComplaints.css';

// Reverting back to UserComplaints for displaying complaints
function UserComplaints() {
  const [complaints, setComplaints] = useState({
    Police: [],
    'Fire Service': [],
    'Animal Welfare': [],
    'City Corporation': []
  });

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const identifier = localStorage.getItem('nirapod_identifier');
        if (!identifier) {
          alert('User not logged in.');
          return;
        }
        const res = await axios.get(`/api/complain/user/${encodeURIComponent(identifier)}`);
        const groupedComplaints = {
          Police: [],
          'Fire Service': [],
          'Animal Welfare': [],
          'City Corporation': []
        };
        res.data.forEach(complaint => {
          groupedComplaints[complaint.complainTo]?.push({
            trackingId: complaint.trackingId,
            details: complaint.details,
            status: complaint.status
          });
        });
        setComplaints(groupedComplaints);
      } catch (err) {
        alert('Failed to fetch complaints.');
      }
    };
    fetchComplaints();
  }, []);

  return (
    <div className="complain-bg">
      <div className="complain-form">
        {Object.entries(complaints).map(([category, list]) => (
          <div key={category} className="complain-category">
            <h2 style={{ color: '#fff', textAlign: 'center' }}>{category} Complaints</h2>
            {list.length === 0 ? (
              <p style={{ color: '#bcbcbc', textAlign: 'center' }}>No complaints found.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {list.map(complaint => (
                  <li key={complaint.trackingId} className="complain-item">
                    <div className="complain-row">
                      <b>Tracking ID:</b> {complaint.trackingId}
                    </div>
                    <div className="complain-row">
                      <b>Details:</b> {complaint.details}
                    </div>
                    <div className="complain-row">
                      <b>Status:</b> {complaint.status === 0 ? 'Unsolved' : complaint.status === 1 ? 'In Progress' : 'Solved'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserComplaints;