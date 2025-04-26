// src/components/UpdateComplaint.js
import React, { useState } from 'react';
import ComplaintService from './ComplaintService';
import './UpdateComplaint.css';

const UpdateComplaint = ({ complaint, onUpdateSuccess }) => {
    const [updateNote, setUpdateNote] = useState(complaint.updateNote || '');
    const [status, setStatus] = useState(() => {
        if (complaint.status === 'Solved') return 2;
        if (complaint.status === 'In Progress') return 1;
        return 0; // default to 'Unsolved'
    });
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);

    const handleUpdate = async () => {
        if (!updateNote.trim()) {
            setError('Please write an update note before updating');
            return;
        }

        try {
            setUpdating(true);
            setError(null);

            const updatedComplaint = {
                ...complaint,
                status,
                updateNote
            };

            const result = await ComplaintService.updateComplaint(
                complaint.trackingId,
                updatedComplaint
            );
            setUpdating(false);

            if (onUpdateSuccess) {
                onUpdateSuccess(result);
            }
        } catch (err) {
            setUpdating(false);
            setError('Failed to update complaint. Please try again.');
        }
    };

    return (
        <div className="update-complaint-container">
            <h3>Update Complaint Status</h3>
            {error && <div className="update-error">{error}</div>}
            <div className="update-form">
                <div className="form-group">
                    <label htmlFor="status">Status:</label>
                    <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(Number(e.target.value))}
                        className="status-select"
                    >
                        <option value={0}>Unsolved</option>
                        <option value={1}>In Progress</option>
                        <option value={2}>Solved</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="updateNote">Update Note:</label>
                    <textarea
                        id="updateNote"
                        value={updateNote}
                        onChange={(e) => setUpdateNote(e.target.value)}
                        placeholder="Write your update here..."
                        className="update-textarea"
                    />
                </div>
                <button
                    className="update-submit-button"
                    onClick={handleUpdate}
                    disabled={updating}
                >
                    {updating ? 'Updating...' : 'Update Status'}
                </button>
            </div>
        </div>
    );
};

export default UpdateComplaint;
