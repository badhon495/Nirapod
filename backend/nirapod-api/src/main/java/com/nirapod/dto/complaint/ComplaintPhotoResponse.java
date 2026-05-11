package com.nirapod.dto.complaint;

import com.nirapod.model.ComplaintPhoto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ComplaintPhotoResponse(
    UUID id,
    String filePublicId,
    String uploadedByName,
    boolean isEvidence,
    OffsetDateTime createdAt
) {
    public static ComplaintPhotoResponse from(ComplaintPhoto photo) {
        return new ComplaintPhotoResponse(
            photo.getId(),
            photo.getFilePublicId(),
            photo.getUploadedBy().getName(),
            photo.isEvidence(),
            photo.getCreatedAt()
        );
    }
}
