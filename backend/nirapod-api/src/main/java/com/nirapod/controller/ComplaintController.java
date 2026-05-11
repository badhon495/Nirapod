package com.nirapod.controller;

import com.nirapod.dto.complaint.*;
import com.nirapod.model.ComplaintCategory;
import com.nirapod.model.ComplaintStatus;
import com.nirapod.model.UserRole;
import com.nirapod.service.ComplaintService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CITIZEN', 'POLICE', 'FIRE', 'CITY', 'ANIMAL', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Submit a new complaint")
    public ResponseEntity<ComplaintDetailResponse> create(
            @Valid @RequestBody ComplaintCreateRequest req,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest httpReq) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(complaintService.create(userId, req, httpReq.getRemoteAddr()));
    }

    @GetMapping
    @Operation(summary = "Get public complaint feed (paginated, filterable)")
    public ResponseEntity<Page<ComplaintSummaryResponse>> getFeed(
            @RequestParam(required = false) ComplaintCategory category,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) String district,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserDetails principal) {

        // Authority users get their full (non-public) category feed
        if (principal != null) {
            UserRole role = extractRole(principal);
            ComplaintCategory authorityCategory = roleToCategory(role);
            if (authorityCategory != null) {
                ComplaintStatus filterStatus = status;
                return ResponseEntity.ok(complaintService.getAuthorityFeed(authorityCategory, filterStatus, pageable));
            }
        }

        return ResponseEntity.ok(complaintService.getFeed(category, status, district, pageable));
    }

    @GetMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get complaint detail by ID")
    public ResponseEntity<ComplaintDetailResponse> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        UUID requesterId = principal != null ? UUID.fromString(principal.getUsername()) : null;
        UserRole role = principal != null ? extractRole(principal) : UserRole.CITIZEN;
        return ResponseEntity.ok(complaintService.getById(id, requesterId, role));
    }

    @GetMapping("/track/{trackingId}")
    @Operation(summary = "Track complaint by tracking ID (public, no auth required)")
    public ResponseEntity<ComplaintDetailResponse> trackByTrackingId(@PathVariable Long trackingId) {
        return ResponseEntity.ok(complaintService.getByTrackingId(trackingId));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CITIZEN', 'POLICE', 'FIRE', 'CITY', 'ANIMAL', 'ADMIN') and (#userId.toString() == principal.username or hasRole('ADMIN'))")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get complaints submitted by a specific user")
    public ResponseEntity<Page<ComplaintSummaryResponse>> getByUser(
            @PathVariable UUID userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(complaintService.getByUser(userId, pageable));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current user's complaints")
    public ResponseEntity<Page<ComplaintSummaryResponse>> getMy(
            @AuthenticationPrincipal UserDetails principal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(complaintService.getByUser(userId, pageable));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('POLICE', 'FIRE', 'CITY', 'ANIMAL', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update complaint status (authority/admin only)")
    public ResponseEntity<ComplaintDetailResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody StatusUpdateRequest req,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest httpReq) {
        UUID updaterId = UUID.fromString(principal.getUsername());
        UserRole role = extractRole(principal);
        return ResponseEntity.ok(complaintService.updateStatus(id, updaterId, role, req, httpReq.getRemoteAddr()));
    }

    @PutMapping("/{id}/note")
    @PreAuthorize("hasAnyRole('POLICE', 'FIRE', 'CITY', 'ANIMAL', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update authority note on complaint")
    public ResponseEntity<ComplaintDetailResponse> updateNote(
            @PathVariable UUID id,
            @Valid @RequestBody AuthorityNoteRequest req,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest httpReq) {
        UUID updaterId = UUID.fromString(principal.getUsername());
        UserRole role = extractRole(principal);
        return ResponseEntity.ok(complaintService.updateNote(id, updaterId, role, req, httpReq.getRemoteAddr()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a complaint (own unsolved complaints or admin)")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest httpReq) {
        UUID deleterId = UUID.fromString(principal.getUsername());
        UserRole role = extractRole(principal);
        complaintService.delete(id, deleterId, role, httpReq.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/photos")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Add a photo to a complaint (evidence flag for authority uploads)")
    public ResponseEntity<ComplaintPhotoResponse> addPhoto(
            @PathVariable UUID id,
            @Valid @RequestBody AddPhotoRequest req,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest httpReq) {
        UUID userId = UUID.fromString(principal.getUsername());
        UserRole role = extractRole(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(complaintService.addPhoto(id, userId, role, req.filePublicId(), req.isEvidence(), httpReq.getRemoteAddr()));
    }

    private UserRole extractRole(UserDetails principal) {
        return principal.getAuthorities().stream()
            .findFirst()
            .map(a -> {
                String authority = a.getAuthority().replace("ROLE_", "");
                return UserRole.valueOf(authority);
            })
            .orElse(UserRole.CITIZEN);
    }

    private ComplaintCategory roleToCategory(UserRole role) {
        return switch (role) {
            case POLICE -> ComplaintCategory.POLICE;
            case FIRE   -> ComplaintCategory.FIRE;
            case CITY   -> ComplaintCategory.CITY;
            case ANIMAL -> ComplaintCategory.ANIMAL;
            default     -> null;
        };
    }
}
