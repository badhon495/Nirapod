// src/components/ComplaintList.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ComplaintService from './ComplaintService';
import './ComplaintList.css';
import axios from 'axios';

const ComplaintList = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ tags: '', urgency: '', status: '' });
    const [filterOpen, setFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredComplaints, setFilteredComplaints] = useState([]);
    const filterBtnRef = useRef(null);
    const filterDropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchComplaints();
    }, []);

    useEffect(() => {
        if (!filterOpen) return;
        function handleClickOutside(event) {
            if (
                filterDropdownRef.current &&
                !filterDropdownRef.current.contains(event.target) &&
                filterBtnRef.current &&
                !filterBtnRef.current.contains(event.target)
            ) {
                setFilterOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [filterOpen]);

    useEffect(() => {
        setFilteredComplaints(
            complaints.filter((complaint) => {
                return (
                    (!filters.tags || complaint.tags.toLowerCase().includes(filters.tags.toLowerCase())) &&
                    (!filters.urgency || complaint.urgency.toLowerCase() === filters.urgency.toLowerCase()) &&
                    (!filters.status || complaint.status.toLowerCase() === filters.status.toLowerCase()) &&
                    (!searchTerm || complaint.trackingId.toString().includes(searchTerm.trim()))
                );
            })
        );
    }, [complaints, filters, searchTerm]);

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

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="complaint-list-container">
            {/* Modern Filter Section */}
            <div className="filter-section">
                <div className="filter-container">
                    <button
                        ref={filterBtnRef}
                        className={`modern-filter-btn ${filterOpen ? 'active' : ''}`}
                        onClick={() => setFilterOpen(!filterOpen)}
                    >
                        <div className="filter-btn-content">
                            <span className="filter-icon">🎯</span>
                            <span className="filter-text">Filter Complaints</span>
                            <span className={`filter-chevron ${filterOpen ? 'rotated' : ''}`}>▼</span>
                        </div>
                    </button>
                    {filterOpen && (
                        <div ref={filterDropdownRef} className="modern-filter-panel">
                            <div className="filter-panel-header">
                                <h3 className="filter-panel-title">Filter Complaints</h3>
                                <button 
                                    className="filter-panel-close"
                                    onClick={() => setFilterOpen(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className="filter-panel-content">
                                <div className="filter-grid">
                                    <div className="filter-item">
                                        <label className="filter-label">
                                            <span className="filter-label-icon">#️⃣</span>
                                            Tags
                                        </label>
                                        <input
                                            type="text"
                                            name="tags"
                                            value={filters.tags}
                                            onChange={handleFilterChange}
                                            placeholder="Search by tags..."
                                            className="modern-filter-input"
                                        />
                                    </div>
                                    
                                    <div className="filter-item">
                                        <label className="filter-label">
                                            <span className="filter-label-icon">⚡</span>
                                            Urgency
                                        </label>
                                        <select
                                            name="urgency"
                                            value={filters.urgency}
                                            onChange={handleFilterChange}
                                            className="modern-filter-select"
                                        >
                                            <option value="">All Urgency Levels</option>
                                            <option value="High">🔴 High Priority</option>
                                            <option value="Medium">🟡 Medium Priority</option>
                                            <option value="Low">🟢 Low Priority</option>
                                        </select>
                                    </div>
                                    
                                    <div className="filter-item">
                                        <label className="filter-label">
                                            <span className="filter-label-icon">📊</span>
                                            Status
                                        </label>
                                        <select
                                            name="status"
                                            value={filters.status}
                                            onChange={handleFilterChange}
                                            className="modern-filter-select"
                                        >
                                            <option value="">All Status</option>
                                            <option value="Solved">✅ Solved</option>
                                            <option value="In Progress">🔄 In Progress</option>
                                            <option value="Unsolved">⏳ Unsolved</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="filter-panel-actions">
                                    <button 
                                        className="filter-action-btn secondary"
                                        onClick={() => setFilters({ tags: '', urgency: '', status: '' })}
                                    >
                                        <span className="btn-icon">🗑️</span>
                                        Clear All
                                    </button>
                                    <button 
                                        className="filter-action-btn primary"
                                        onClick={() => setFilterOpen(false)}
                                    >
                                        <span className="btn-icon">✨</span>
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="search-container">
                <input
                    type="text"
                    className="search-box"
                    placeholder="Search by Tracking ID"
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>
            {filteredComplaints.map((complaint) => {
                console.log('Complaint object:', complaint); // Debug: check structure
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
                                <span className="label">Tag  : </span>
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

export const UserComplaintList = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserComplaints();
    }, []);

    const fetchUserComplaints = async () => {
        try {
            setLoading(true);
            const identifier = localStorage.getItem('nirapod_identifier');
            if (!identifier) {
                setError('User not logged in.');
                setLoading(false);
                return;
            }
            const userRes = await axios.get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`);
            const nid = userRes.data.nid;
            if (!nid) {
                setError('Could not find user NID.');
                setLoading(false);
                return;
            }
            const data = await ComplaintService.getUserComplaints(nid);
            setComplaints(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch your complaints. Please try again later.');
            setLoading(false);
        }
    };

    const getStatusClassName = (status) => {
        if (status === 'Solved') return 'status-solved';
        if (status === 'In Progress') return 'status-inprogress';
        return 'status-unsolved';
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!complaints.length) return <div className="not-found">No complaints found.</div>;

    return (
        <div className="complaint-list-container">
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
                    </div>
                );
            })}
        </div>
    );
};

export default ComplaintList;