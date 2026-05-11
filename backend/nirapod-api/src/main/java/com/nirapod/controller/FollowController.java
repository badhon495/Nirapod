package com.nirapod.controller;

import com.nirapod.dto.social.FollowStatusResponse;
import com.nirapod.service.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/complaints/{complaintId}/follow")
@RequiredArgsConstructor
@Tag(name = "Follows")
public class FollowController {

    private final FollowService followService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get follow status and follower count for a complaint")
    public ResponseEntity<FollowStatusResponse> getStatus(
            @PathVariable UUID complaintId,
            @AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(followService.getStatus(complaintId, userId));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Follow a complaint")
    public ResponseEntity<FollowStatusResponse> follow(
            @PathVariable UUID complaintId,
            @AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(followService.follow(complaintId, userId));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Unfollow a complaint")
    public ResponseEntity<FollowStatusResponse> unfollow(
            @PathVariable UUID complaintId,
            @AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(followService.unfollow(complaintId, userId));
    }
}
