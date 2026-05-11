package com.nirapod.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tracking_id", unique = true, nullable = false, insertable = false, updatable = false)
    private Long trackingId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ComplaintUrgency urgency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintStatus status = ComplaintStatus.UNSOLVED;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(nullable = false, length = 100)
    private String area;

    @Column(name = "location_lat", precision = 10, scale = 8)
    private BigDecimal locationLat;

    @Column(name = "location_lng", precision = 11, scale = 8)
    private BigDecimal locationLng;

    @Column(name = "location_text", columnDefinition = "TEXT")
    private String locationText;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = true;

    @Column(name = "authority_note", columnDefinition = "TEXT")
    private String authorityNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ComplaintPhoto> photos = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "complaint_tags", joinColumns = @JoinColumn(name = "complaint_id"))
    @Column(name = "tag", length = 100)
    private Set<String> tags = new HashSet<>();

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<ComplaintStatusHistory> statusHistory = new ArrayList<>();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public Long getTrackingId() { return trackingId; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public ComplaintCategory getCategory() { return category; }
    public void setCategory(ComplaintCategory category) { this.category = category; }
    public ComplaintUrgency getUrgency() { return urgency; }
    public void setUrgency(ComplaintUrgency urgency) { this.urgency = urgency; }
    public ComplaintStatus getStatus() { return status; }
    public void setStatus(ComplaintStatus status) { this.status = status; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    public BigDecimal getLocationLat() { return locationLat; }
    public void setLocationLat(BigDecimal locationLat) { this.locationLat = locationLat; }
    public BigDecimal getLocationLng() { return locationLng; }
    public void setLocationLng(BigDecimal locationLng) { this.locationLng = locationLng; }
    public String getLocationText() { return locationText; }
    public void setLocationText(String locationText) { this.locationText = locationText; }
    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }
    public String getAuthorityNote() { return authorityNote; }
    public void setAuthorityNote(String authorityNote) { this.authorityNote = authorityNote; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public OffsetDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(OffsetDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public List<ComplaintPhoto> getPhotos() { return photos; }
    public Set<String> getTags() { return tags; }
    public List<ComplaintStatusHistory> getStatusHistory() { return statusHistory; }
}
