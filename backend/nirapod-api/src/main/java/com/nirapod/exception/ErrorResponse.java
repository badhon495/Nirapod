package com.nirapod.exception;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class ErrorResponse {
    private String code;
    private String message;
    private OffsetDateTime timestamp;
}
