package com.nirapod.dto;

public class ComplaintResponse {
    private Integer trackingId;
    private String userName;
    private String urgency;
    private String complainTo;
    private String district;
    private String area;
    private String tags;
    private String details;
    private String photos;
    private Boolean postOnTimeline;
    private String location;
    private String updateNote;
    private Integer status;
    private String follow;
    private String comment;
    private java.time.LocalDateTime time;
    private String report;

    public ComplaintResponse() {}

    public ComplaintResponse(Integer trackingId, String userName, String urgency, String complainTo, String district, String area, String tags, String details, String photos, Boolean postOnTimeline, String location, String updateNote, Integer status, String follow, String comment) {
        this.trackingId = trackingId;
        this.userName = userName;
        this.urgency = urgency;
        this.complainTo = complainTo;
        this.district = district;
        this.area = area;
        this.tags = tags;
        this.details = details;
        this.photos = photos;
        this.postOnTimeline = postOnTimeline;
        this.location = location;
        this.updateNote = updateNote;
        this.status = status;
        this.follow = follow;
        this.comment = comment;
    }

    public ComplaintResponse(Integer trackingId, String userName, String urgency, String complainTo, String district, String area, String tags, String details, String photos, Boolean postOnTimeline, String location, String updateNote, Integer status, String follow, String comment, java.time.LocalDateTime time) {
        this.trackingId = trackingId;
        this.userName = userName;
        this.urgency = urgency;
        this.complainTo = complainTo;
        this.district = district;
        this.area = area;
        this.tags = tags;
        this.details = details;
        this.photos = photos;
        this.postOnTimeline = postOnTimeline;
        this.location = location;
        this.updateNote = updateNote;
        this.status = status;
        this.follow = follow;
        this.comment = comment;
        this.time = time;
    }

    public ComplaintResponse(Integer trackingId, String userName, String urgency, String complainTo, String district, String area, String tags, String details, String photos, Boolean postOnTimeline, String location, String updateNote, Integer status, String follow, String comment, java.time.LocalDateTime time, String report) {
        this.trackingId = trackingId;
        this.userName = userName;
        this.urgency = urgency;
        this.complainTo = complainTo;
        this.district = district;
        this.area = area;
        this.tags = tags;
        this.details = details;
        this.photos = photos;
        this.postOnTimeline = postOnTimeline;
        this.location = location;
        this.updateNote = updateNote;
        this.status = status;
        this.follow = follow;
        this.comment = comment;
        this.time = time;
        this.report = report;
    }

    // Getters and setters for all fields
    public Integer getTrackingId() { return trackingId; }
    public void setTrackingId(Integer trackingId) { this.trackingId = trackingId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }
    public String getComplainTo() { return complainTo; }
    public void setComplainTo(String complainTo) { this.complainTo = complainTo; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getPhotos() { return photos; }
    public void setPhotos(String photos) { this.photos = photos; }
    public Boolean getPostOnTimeline() { return postOnTimeline; }
    public void setPostOnTimeline(Boolean postOnTimeline) { this.postOnTimeline = postOnTimeline; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getUpdateNote() { return updateNote; }
    public void setUpdateNote(String updateNote) { this.updateNote = updateNote; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public String getFollow() { return follow; }
    public void setFollow(String follow) { this.follow = follow; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public java.time.LocalDateTime getTime() { return time; }
    public void setTime(java.time.LocalDateTime time) { this.time = time; }
    public String getReport() { return report; }
    public void setReport(String report) { this.report = report; }
    public String getStatusText() {
        if (status == null) return "Unsolved";
        switch (status) {
            case 2: return "Solved";
            case 1: return "In Progress";
            default: return "Unsolved";
        }
    }
}
