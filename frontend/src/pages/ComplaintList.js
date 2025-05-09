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
            <div style={{ padding: '12px 0 0 0', display: 'flex', justifyContent: 'flex-start', marginLeft: 438 }}>
                {/* Position changed here Faishal */}
                <div style={{ background: '#232b36', borderRadius: 18, padding: 12, marginBottom: 12, display: 'flex', gap: 18, alignItems: 'center', position: 'relative', left:'-420px'  }}>
                    <button
                        ref={filterBtnRef}
                        style={{ borderRadius: 8, padding: '8px 32px', fontSize: 16, border: 'none', background: '#e5e7eb', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => setFilterOpen(o => !o)}
                    >
                        Filter
                    </button>
                    {filterOpen && (
                        <div ref={filterDropdownRef} style={{ position: 'absolute', top: 48, left: 0, background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px #0003', padding: 32, zIndex: 10, minWidth: 380, maxWidth: 480, width: 100, boxSizing: 'border-box', overflow: 'hidden', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 500 }}>Tags:</label>
                                <input
                                    type="text"
                                    name="tags"
                                    value={filters.tags}
                                    onChange={handleFilterChange}
                                    placeholder="Filter by tags"
                                    style={{ borderRadius: 8, padding: '10px 18px', fontSize: 16, border: '1px solid #ddd', width: '100%', marginTop: 4, boxSizing: 'border-box', overflow: 'hidden' }}
                                />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 500 }}>Urgency:</label>
                                <select
                                    name="urgency"
                                    value={filters.urgency}
                                    onChange={handleFilterChange}
                                    style={{ borderRadius: 8, padding: '10px 18px', fontSize: 16, border: '1px solid #ddd', width: '100%', marginTop: 4, boxSizing: 'border-box', overflow: 'hidden' }}
                                >
                                    <option value="">All</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 500 }}>Sort By:</label>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    style={{ borderRadius: 8, padding: '10px 18px', fontSize: 16, border: '1px solid #ddd', width: '100%', marginTop: 4, boxSizing: 'border-box', overflow: 'hidden' }}
                                >
                                    <option value="">All</option>
                                    <option value="Solved">Solved</option>
                                    <option value="Unsolved">Unsolved</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button
                                    type="button"
                                    style={{ borderRadius: 8, padding: '10px 32px', fontSize: 16, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                                    onClick={() => setFilterOpen(false)}
                                >
                                    Apply
                                </button>
                                <button
                                    type="button"
                                    style={{ borderRadius: 10, padding: '10px 32px', fontSize: 16, border: 'none', background: '#eee', fontWeight: 600, cursor: 'pointer' }}
                                    onClick={() => { setFilters({ tags: '', urgency: '', status: '' }); setFilterOpen(false); }}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <input
                type="text"
                className="search-box"
                placeholder="Search by Tracking ID"
                value={searchTerm}
                onChange={handleSearch}
            />
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