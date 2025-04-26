// src/components/ComplaintList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ComplaintService from './ComplaintService';
import './ComplaintList.css';

const ComplaintList = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await ComplaintService.getAllComplaints();
            setComplaints(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch complaints. Please try again later.');
            setLoading(false);
        }
    };

    const handleDetailsClick = (id) => {
        navigate(`/complaint/${id}`);
    };

    const getStatusClassName = (status) => {
        if (status === 'Solved') return 'status-solved';
        if (status === 'In Progress') return 'status-inprogress';
        return 'status-unsolved';
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="complaint-list-container">
            {complaints.map((complaint) => {
                console.log('Complaint object:', complaint); // Debug: check structure
                // Ensure we use the correct time from backend
                const displayTime = (() => {
                    if (!complaint.time) return 'N/A';
                    // If time is already a valid ISO string, parse it
                    if (typeof complaint.time === 'string' && complaint.time.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                        let iso = complaint.time;
                        if (iso.includes('.')) iso = iso.split('.')[0];
                        if (!iso.endsWith('Z')) iso = iso + 'Z';
                        const d = new Date(iso);
                        return isNaN(d) ? complaint.time : d.toLocaleString();
                    }
                    // Otherwise, just show the raw value
                    return complaint.time;
                })();
                return (
                    <div key={complaint.trackingId} className="complaint-card">
                        <div className="complaint-header">
                            <div className="complaint-id">
                                <span className="label">Tracking ID : </span>
                                <span className="value">{complaint.trackingId}</span>
                            </div>
                            <div className={`complaint-status ${getStatusClassName(complaint.status)}`}>
                                {complaint.status || 'Unsolved'}
                            </div>
                        </div>

                        <div className="complaint-info">
                            <div>
                                <span className="label">Name : </span>
                                <span className="value">{complaint.userName}</span>
                            </div>
                            <div>
                                <span className="label">Complained Time : </span>
                                <span className="value">{displayTime}</span>
                            </div>
                            <div>
                                <span className="label">Tag : </span>
                                <span className="value">{complaint.tags}</span>
                            </div>
                            <div>
                                <span className="label">Urgency : </span>
                                <span className="value">{complaint.urgency}</span>
                            </div>
                        </div>
                        <div style={{ flex: 1 }} />
                        <button
                            className="details-button"
                            onClick={() => handleDetailsClick(complaint.trackingId)}
                        >
                            Details
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ComplaintList;