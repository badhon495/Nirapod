package com.nirapod.dto.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TokenResponse {
    private String accessToken;
    private String tokenType;
    private long expiresIn;
    private String userId;
    private String role;
    private String name;
}
