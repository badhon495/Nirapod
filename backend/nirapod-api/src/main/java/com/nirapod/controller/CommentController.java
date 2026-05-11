package com.nirapod.controller;

import com.nirapod.dto.comment.CommentCreateRequest;
import com.nirapod.dto.comment.CommentResponse;
import com.nirapod.model.UserRole;
import com.nirapod.service.CommentService;
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
@RequestMapping("/api/v1/complaints/{complaintId}/comments")
@RequiredArgsConstructor
@Tag(name = "Comments")
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    @Operation(summary = "Get paginated comments for a complaint")
    public ResponseEntity<Page<CommentResponse>> getComments(
            @PathVariable UUID complaintId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(commentService.getComments(complaintId, pageable));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Add a comment to a complaint")
    public ResponseEntity<CommentResponse> create(
            @PathVariable UUID complaintId,
            @Valid @RequestBody CommentCreateRequest req,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest httpReq) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(commentService.create(complaintId, userId, req, httpReq.getRemoteAddr()));
    }

    @PutMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Edit own comment")
    public ResponseEntity<CommentResponse> update(
            @PathVariable UUID complaintId,
            @PathVariable UUID commentId,
            @Valid @RequestBody CommentCreateRequest req,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest httpReq) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(commentService.update(commentId, userId, req, httpReq.getRemoteAddr()));
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete own comment (or admin)")
    public ResponseEntity<Void> delete(
            @PathVariable UUID complaintId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest httpReq) {
        UUID userId = UUID.fromString(principal.getUsername());
        UserRole role = extractRole(principal);
        commentService.delete(commentId, userId, role, httpReq.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }

    private UserRole extractRole(UserDetails principal) {
        return principal.getAuthorities().stream()
            .findFirst()
            .map(a -> UserRole.valueOf(a.getAuthority().replace("ROLE_", "")))
            .orElse(UserRole.CITIZEN);
    }
}
