package com.nirapod.dto.user;

import com.nirapod.model.User;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserProfileResponse(
    UUID id,
    String nid,
    String name,
    String email,
    String phone,
    String role,
    String status,
    String presentAddress,
    String permanentAddress,
    OffsetDateTime createdAt
) {
    public static UserProfileResponse from(User u) {
        return new UserProfileResponse(
            u.getId(),
            u.getNid(),
            u.getName(),
            u.getEmail(),
            u.getPhone(),
            u.getRole().name(),
            u.getStatus().name(),
            u.getPresentAddress(),
            u.getPermanentAddress(),
            u.getCreatedAt()
        );
    }
}
