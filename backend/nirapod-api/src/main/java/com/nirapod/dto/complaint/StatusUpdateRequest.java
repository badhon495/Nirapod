package com.nirapod.dto.complaint;

import com.nirapod.model.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StatusUpdateRequest(

    @NotNull(message = "Status is required")
    ComplaintStatus status,

    @Size(max = 2000)
    String note
) {}
