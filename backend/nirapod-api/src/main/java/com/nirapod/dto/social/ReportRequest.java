package com.nirapod.dto.social;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReportRequest(
    @NotBlank(message = "Reason must not be blank")
    @Size(max = 100, message = "Reason must not exceed 100 characters")
    String reason
) {}
