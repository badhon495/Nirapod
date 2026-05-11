package com.nirapod.dto.notification;

import com.nirapod.model.Notification;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    String type,
    String title,
    String message,
    UUID complaintId,
    boolean read,
    OffsetDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
            n.getId(),
            n.getType(),
            n.getTitle(),
            n.getMessage(),
            n.getComplaint() != null ? n.getComplaint().getId() : null,
            n.isRead(),
            n.getCreatedAt()
        );
    }
}
