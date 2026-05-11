package com.nirapod.dto.complaint;

import com.nirapod.model.Complaint;
import com.nirapod.model.ComplaintCategory;
import com.nirapod.model.ComplaintStatus;
import com.nirapod.model.ComplaintUrgency;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record ComplaintDetailResponse(
    UUID id,
    Long trackingId,
    String reporterName,
    UUID reporterId,
    ComplaintCategory category,
    ComplaintUrgency urgency,
    ComplaintStatus status,
    String title,
    String details,
    String district,
    String area,
    BigDecimal locationLat,
    BigDecimal locationLng,
    String locationText,
    boolean isPublic,
    String authorityNote,
    Set<String> tags,
    List<ComplaintPhotoResponse> photos,
    List<StatusHistoryResponse> statusHistory,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    OffsetDateTime resolvedAt
) {
    public static ComplaintDetailResponse from(Complaint c) {
        return new ComplaintDetailResponse(
            c.getId(),
            c.getTrackingId(),
            c.getUser().getName(),
            c.getUser().getId(),
            c.getCategory(),
            c.getUrgency(),
            c.getStatus(),
            c.getTitle(),
            c.getDetails(),
            c.getDistrict(),
            c.getArea(),
            c.getLocationLat(),
            c.getLocationLng(),
            c.getLocationText(),
            c.isPublic(),
            c.getAuthorityNote(),
            c.getTags(),
            c.getPhotos().stream().map(ComplaintPhotoResponse::from).toList(),
            c.getStatusHistory().stream().map(StatusHistoryResponse::from).toList(),
            c.getCreatedAt(),
            c.getUpdatedAt(),
            c.getResolvedAt()
        );
    }
}
