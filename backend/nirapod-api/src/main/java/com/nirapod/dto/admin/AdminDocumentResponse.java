package com.nirapod.dto.admin;

import com.nirapod.model.UserDocument;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminDocumentResponse(
    UUID id,
    String type,
    String documentNumber,
    String filePublicId,
    boolean verified,
    OffsetDateTime createdAt
) {
    public static AdminDocumentResponse from(UserDocument d) {
        return new AdminDocumentResponse(
            d.getId(),
            d.getType(),
            d.getDocumentNumber(),
            d.getFilePublicId(),
            d.isVerified(),
            d.getCreatedAt()
        );
    }
}
