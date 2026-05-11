package com.nirapod.dto.complaint;

import com.nirapod.model.Complaint;
import com.nirapod.model.ComplaintCategory;
import com.nirapod.model.ComplaintStatus;
import com.nirapod.model.ComplaintUrgency;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

public record ComplaintSummaryResponse(
    UUID id,
    Long trackingId,
    String reporterName,
    UUID reporterId,
    ComplaintCategory category,
    ComplaintUrgency urgency,
    ComplaintStatus status,
    String title,
    String district,
    String area,
    boolean isPublic,
    Set<String> tags,
    int photoCount,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public static ComplaintSummaryResponse from(Complaint c) {
        return new ComplaintSummaryResponse(
            c.getId(),
            c.getTrackingId(),
            c.getUser().getName(),
            c.getUser().getId(),
            c.getCategory(),
            c.getUrgency(),
            c.getStatus(),
            c.getTitle(),
            c.getDistrict(),
            c.getArea(),
            c.isPublic(),
            c.getTags(),
            c.getPhotos().size(),
            c.getCreatedAt(),
            c.getUpdatedAt()
        );
    }
}
