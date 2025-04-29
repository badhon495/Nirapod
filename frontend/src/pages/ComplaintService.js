// src/services/ComplaintService.js
import axios from 'axios';

const API_URL = '/api';

const ComplaintService = {
    getAllComplaints: async () => {
        try {
            const userCategory = localStorage.getItem('categories');
            const response = await axios.get(`${API_URL}/complaints`, {
                headers: {
                    'X-User-Category': userCategory || ''
                }
            });
            // Transform data to match frontend expectations
            return response.data.map(complaint => ({
                ...complaint,
                trackingId: complaint.trackingId,
                complainBy: complaint.nid,
                tag: complaint.tags,
                subject: complaint.complainTo,
                details: complaint.details,
                time: complaint.time, // <-- FIXED: use complaint.time from backend
                urgency: complaint.urgency,
                status: complaint.statusText,
                updateNote: complaint.updateNote
            }));
        } catch (error) {
            console.error('Error fetching complaints:', error);
            throw error;
        }
    },
    
    getComplaintById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/complaint/${id}`);
            // Use backend fields directly
            const complaint = response.data;
            return {
                ...complaint,
                trackingId: complaint.trackingId,
                complainBy: complaint.userName, // Show user name
                nid: complaint.nid,
                tags: complaint.tags,
                urgency: complaint.urgency,
                district: complaint.district,
                area: complaint.area,
                location: complaint.location,
                time: complaint.time, // Use backend time
                details: complaint.details,
                photos: complaint.photos,
                status: complaint.statusText,
                updateNote: complaint.updateNote
            };
        } catch (error) {
            console.error(`Error fetching complaint with id ${id}:`, error);
            throw error;
        }
    },
    
    getUserComplaints: async (nid) => {
        const response = await axios.get(`/api/complaints/user/${nid}`);
        return response.data.map(complaint => ({
            ...complaint,
            trackingId: complaint.trackingId,
            complainBy: complaint.nid,
            tag: complaint.tags,
            subject: complaint.complainTo,
            details: complaint.details,
            time: complaint.time,
            urgency: complaint.urgency,
            status: complaint.statusText,
            updateNote: complaint.updateNote
        }));
    },

    updateComplaint: async (id, complaintData) => {
        try {
            // Determine whether status is a number or string
            const isStatusNumber = typeof complaintData.status === 'number';
            const isStatusString = typeof complaintData.status === 'string';
    
            const payload = {
                ...complaintData,
                status: isStatusNumber ? complaintData.status : undefined,
                statusText: isStatusString ? complaintData.status : undefined,
                updateNote: complaintData.updateNote
            };
    
            const response = await axios.put(`${API_URL}/complaint/update/${id}`, payload);
    
            // Transform response data to match frontend expectations
            const updatedComplaint = response.data;
    
            return {
                ...updatedComplaint,
                trackingId: updatedComplaint.trackingId,
                complainBy: updatedComplaint.userName, // Show user name
                nid: updatedComplaint.nid,
                tags: updatedComplaint.tags,
                urgency: updatedComplaint.urgency,
                district: updatedComplaint.district,
                area: updatedComplaint.area,
                location: updatedComplaint.location,
                time: updatedComplaint.time, // Use backend time
                details: updatedComplaint.details,
                photos: updatedComplaint.photos,
                status: updatedComplaint.statusText,
                updateNote: updatedComplaint.updateNote
            };
        } catch (error) {
            console.error(`Error updating complaint with id ${id}:`, error);
            throw error;
        }
    },
    
    
    addComplaint: async (complaintData) => {
        try {
            // Convert status string to integer if present
            let statusValue;
            if (complaintData.status) {
                switch (complaintData.status) {
                    case 'Solved': statusValue = 2; break;
                    case 'In Progress': statusValue = 1; break;
                    default: statusValue = 0; break;
                }
            } else {
                statusValue = 0; // Default to unsolved
            }
            
            // Map frontend field names to backend field names
            const backendData = {
                nid: complaintData.complainBy,
                tags: complaintData.tag,
                complainTo: complaintData.subject,
                details: complaintData.details,
                location: complaintData.time,
                urgency: complaintData.urgency,
                status: statusValue,
                updateNote: complaintData.updateNote,
                postOnTimeline: true, // Default values for required fields
                photos: "placeholder.jpg" // Default value
            };
            
            const response = await axios.post(`${API_URL}/complaint`, backendData);
            
            // Transform response data to match frontend expectations
            const savedComplaint = response.data;
            return {
                ...savedComplaint,
                trackingId: savedComplaint.trackingId,
                complainBy: savedComplaint.nid,
                tag: savedComplaint.tags,
                subject: savedComplaint.complainTo,
                details: savedComplaint.details,
                time: savedComplaint.location,
                urgency: savedComplaint.urgency,
                status: savedComplaint.statusText,
                updateNote: savedComplaint.updateNote
            };
        } catch (error) {
            console.error('Error adding complaint:', error);
            throw error;
        }
    }
};

export default ComplaintService;