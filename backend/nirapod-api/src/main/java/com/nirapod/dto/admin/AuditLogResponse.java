package com.nirapod.dto.admin;

import com.nirapod.model.AuditLog;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuditLogResponse(
    UUID id,
    UUID userId,
    String userName,
    String action,
    String entityType,
    UUID entityId,
    String ipAddress,
    String details,
    OffsetDateTime createdAt
) {
    public static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(
            log.getId(),
            log.getUser() != null ? log.getUser().getId() : null,
            log.getUser() != null ? log.getUser().getName() : null,
            log.getAction(),
            log.getEntityType(),
            log.getEntityId(),
            log.getIpAddress(),
            log.getDetails(),
            log.getCreatedAt()
        );
    }
}
