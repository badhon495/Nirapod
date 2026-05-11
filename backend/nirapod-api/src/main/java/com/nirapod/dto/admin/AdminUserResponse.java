package com.nirapod.dto.admin;

import com.nirapod.model.User;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record AdminUserResponse(
    UUID id,
    String nid,
    String name,
    String email,
    String phone,
    String role,
    String status,
    String presentAddress,
    String permanentAddress,
    OffsetDateTime createdAt,
    List<AdminDocumentResponse> documents
) {
    public static AdminUserResponse from(User u) {
        return new AdminUserResponse(
            u.getId(),
            u.getNid(),
            u.getName(),
            u.getEmail(),
            u.getPhone(),
            u.getRole().name(),
            u.getStatus().name(),
            u.getPresentAddress(),
            u.getPermanentAddress(),
            u.getCreatedAt(),
            u.getDocuments().stream().map(AdminDocumentResponse::from).toList()
        );
    }
}
