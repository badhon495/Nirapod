// Updated Model class
package com.nirapod.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import java.time.LocalDateTime;

@Entity
@Table(name = "usr_complain")
public class Complaint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tracking_ID")
    private Integer trackingId;

    @Column(name = "NID",columnDefinition = "bpchar(10)")
    private String nid;

    @Column(name = "Urgency")
    private String urgency;

    @Column(name = "Complain_to")
    private String complainTo;

    @Column(name = "District")
    private String district;

    @Column(name = "Area")
    private String area;

    @Column(name = "Tags")
    private String tags;

    @Column(name = "Details")
    private String details;

    @Column(name = "Photos")
    private String photos;

    @Column(name = "Post_on_timeline")
    private boolean postOnTimeline;

    @Column(name = "Location")
    private String location;

    @Column(name = "Update")
    private String updateNote;

    @Column(name = "status")
    private Integer status;

    @Column(name = "Time")
    private LocalDateTime time;

    private String follow;
    private String comment;
    private String report;

    public Complaint() {}

    public Integer getTrackingId() { return trackingId; }
    public void setTrackingId(Integer trackingId) { this.trackingId = trackingId; }

    public String getNid() { return nid; }
    public void setNid(String nid) { this.nid = nid; }

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

    public boolean isPostOnTimeline() { return postOnTimeline; }
    public void setPostOnTimeline(boolean postOnTimeline) { this.postOnTimeline = postOnTimeline; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getUpdateNote() { return updateNote; }
    public void setUpdateNote(String updateNote) { this.updateNote = updateNote; }

    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }

    public LocalDateTime getTime() { return time; }
    public void setTime(LocalDateTime time) { this.time = time; }

    public String getFollow() {
        return follow;
    }
    public void setFollow(String follow) {
        this.follow = follow;
    }
    public String getComment() {
        return comment;
    }
    public void setComment(String comment) {
        this.comment = comment;
    }
    public String getReport() {
        return report;
    }
    public void setReport(String report) {
        this.report = report;
    }

    public String getStatusText() {
        switch (status) {
            case 0: return "Unsolved";
            case 1: return "In Progress";
            case 2: return "Solved";
            default: return "Unsolved";
        }
    }

    public void setStatusText(String statusText) {
        switch (statusText) {
            case "Solved": this.status = 2; break;
            case "In Progress": this.status = 1; break;
            default: this.status = 0; break;
        }
    }
}