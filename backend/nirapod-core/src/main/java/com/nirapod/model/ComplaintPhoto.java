package com.nirapod.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "complaint_photos")
public class ComplaintPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @Column(name = "file_public_id", nullable = false, columnDefinition = "TEXT")
    private String filePublicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Column(name = "is_evidence", nullable = false)
    private boolean isEvidence = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public UUID getId() { return id; }
    public Complaint getComplaint() { return complaint; }
    public void setComplaint(Complaint complaint) { this.complaint = complaint; }
    public String getFilePublicId() { return filePublicId; }
    public void setFilePublicId(String filePublicId) { this.filePublicId = filePublicId; }
    public User getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; }
    public boolean isEvidence() { return isEvidence; }
    public void setEvidence(boolean evidence) { isEvidence = evidence; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
