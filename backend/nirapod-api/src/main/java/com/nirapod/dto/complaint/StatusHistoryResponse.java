package com.nirapod.dto.complaint;

import com.nirapod.model.ComplaintStatus;
import com.nirapod.model.ComplaintStatusHistory;

import java.time.OffsetDateTime;
import java.util.UUID;

public record StatusHistoryResponse(
    UUID id,
    ComplaintStatus oldStatus,
    ComplaintStatus newStatus,
    String changedByName,
    String note,
    OffsetDateTime createdAt
) {
    public static StatusHistoryResponse from(ComplaintStatusHistory h) {
        return new StatusHistoryResponse(
            h.getId(),
            h.getOldStatus(),
            h.getNewStatus(),
            h.getChangedBy().getName(),
            h.getNote(),
            h.getCreatedAt()
        );
    }
}
