package com.nirapod.dto.social;

import com.nirapod.model.ComplaintReport;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ReportResponse(
    UUID id,
    UUID complaintId,
    String complaintTitle,
    UUID reporterId,
    String reporterName,
    String reason,
    OffsetDateTime createdAt
) {
    public static ReportResponse from(ComplaintReport r) {
        return new ReportResponse(
            r.getId(),
            r.getComplaint().getId(),
            r.getComplaint().getTitle(),
            r.getReporter().getId(),
            r.getReporter().getName(),
            r.getReason(),
            r.getCreatedAt()
        );
    }
}
