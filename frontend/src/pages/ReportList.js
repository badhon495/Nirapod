import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ComplaintList.css';

const ReportList = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reporterNamesMap, setReporterNamesMap] = useState({});
    const [filters, setFilters] = useState({ tags: '', urgency: '', status: '' });
    const [filterOpen, setFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredReports, setFilteredReports] = useState([]);
    const filterBtnRef = useRef(null);
    const filterDropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchReports();
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
        setFilteredReports(
            reports.filter((report) => {
                return (
                    (!filters.tags || (report.tags || '').toLowerCase().includes(filters.tags.toLowerCase())) &&
                    (!filters.urgency || (report.urgency || '').toLowerCase() === filters.urgency.toLowerCase()) &&
                    (!filters.status || (report.status || '').toLowerCase() === filters.status.toLowerCase()) &&
                    (!searchTerm || report.trackingId.toString().includes(searchTerm.trim()))
                );
            })
        );
    }, [reports, filters, searchTerm]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/complaints/reported');
            setReports(res.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch reported posts.');
            setLoading(false);
        }
    };

    // Helper to fetch names for a list of NIDs
    const fetchReporterNames = async (nids) => {
        const names = [];
        for (const nid of nids) {
            try {
                const res = await axios.get(`/api/user/by-identifier?value=${nid}`);
                names.push(res.data.name || nid);
            } catch {
                names.push(nid);
            }
        }
        return names;
    };

    useEffect(() => {
        // For each report, fetch reporter names if not already fetched
        const fetchAllNames = async () => {
            const map = {};
            for (const report of reports) {
                const reporters = (report.report || '').split(',').map(r => r.trim()).filter(Boolean);
                if (reporters.length > 0) {
                    map[report.trackingId] = await fetchReporterNames(reporters);
                }
            }
            setReporterNamesMap(map);
        };
        if (reports.length > 0) fetchAllNames();
    }, [reports]);

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
    if (!filteredReports.length) return <div className="not-found">No reported posts found.</div>;

    return (
        <div className="complaint-list-container">
            <div style={{ padding: '12px 0 0 0', display: 'flex', justifyContent: 'flex-start', marginLeft: 438 }}>
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
            {filteredReports.map((report) => {
                const reporters = (report.report || '').split(',').map(r => r.trim()).filter(Boolean);
                const reporterNames = reporterNamesMap[report.trackingId] || reporters;
                return (
                    <div key={report.trackingId} className="complaint-card">
                        <div className="complaint-header">
                            <div className="complaint-id">
                                <span className="label">Tracking ID : </span>
                                <span className="value">{report.trackingId}</span>
                            </div>
                            <div className={`complaint-status ${getStatusClassName(report.status)}`}>
                                {report.status || 'Unsolved'}
                            </div>
                        </div>
                        <div className="complaint-info">
                            <div>
                                <span className="label">Name : </span>
                                <span className="value">{report.userName}</span>
                            </div>
                            <div>
                                <span className="label">Tag : </span>
                                <span className="value">{report.tags}</span>
                            </div>
                            <div>
                                <span className="label">Urgency : </span>
                                <span className="value">{report.urgency}</span>
                            </div>
                            <div>
                                <span className="label">Reported By : </span>
                                <span className="value">{reporterNames.join(', ')}</span>
                            </div>
                        </div>
                        <button className="details-button" onClick={() => handleDetailsClick(report.trackingId)}>
                            Details
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ReportList;
