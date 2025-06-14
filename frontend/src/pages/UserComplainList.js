import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ComplaintService from './ComplaintService';
import './ComplaintList.css';

const UserComplainList = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const nid = localStorage.getItem('nirapod_identifier');

    useEffect(() => {
        fetchUserComplaints();
        // eslint-disable-next-line
    }, []);

    const fetchUserComplaints = async () => {
        try {
            setLoading(true);
            const data = await ComplaintService.getUserComplaints(nid);
            setComplaints(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch your complaints. Please try again later.');
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
            <div className="complaints-wrapper">
                <div className="complaints-header">
                    <h1 className="complaints-title">My Complaints</h1>
                    <p className="complaints-subtitle">Track and manage your submitted complaints</p>
                </div>

                {complaints.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <div className="empty-title">No Complaints Found</div>
                        <div className="empty-message">
                            You have not submitted any complaints yet.<br/>
                            Submit your first complaint to get started.
                        </div>
                    </div>
                ) : (
                    <div className="complaints-grid">
                        {complaints.map((complaint) => {
                            const displayTime = (() => {
                                if (!complaint.time) return 'N/A';
                                if (typeof complaint.time === 'string' && complaint.time.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                                    let iso = complaint.time;
                                    if (iso.includes('.')) iso = iso.split('.')[0];
                                    if (!iso.endsWith('Z')) iso = iso + 'Z';
                                    const d = new Date(iso);
                                    return isNaN(d) ? complaint.time : d.toLocaleString();
                                }
                                return complaint.time;
                            })();

                            return (
                                <div key={complaint.trackingId} className="complaint-card">
                                    <div className="complaint-header">
                                        <div className="complaint-id">
                                            <span className="label">Tracking ID</span>
                                            <span className="value">{complaint.trackingId}</span>
                                        </div>
                                        <div className={`complaint-status ${getStatusClassName(complaint.status)}`}>
                                            {complaint.status || 'Unsolved'}
                                        </div>
                                    </div>
                                    <div className="complaint-info">
                                        <div>
                                            <span className="label">Name</span>
                                            <span className="value">{complaint.userName}</span>
                                        </div>
                                        <div>
                                            <span className="label">Submitted</span>
                                            <span className="value">{displayTime}</span>
                                        </div>
                                        <div>
                                            <span className="label">Tag</span>
                                            <span className="value">{complaint.tags}</span>
                                        </div>
                                        <div>
                                            <span className="label">Urgency</span>
                                            <span className="value">{complaint.urgency}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="details-button"
                                        onClick={() => handleDetailsClick(complaint.trackingId)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserComplainList;
