package com.nirapod.dto.complaint;

import jakarta.validation.constraints.NotBlank;

public record AddPhotoRequest(
    @NotBlank String filePublicId,
    boolean isEvidence
) {}
