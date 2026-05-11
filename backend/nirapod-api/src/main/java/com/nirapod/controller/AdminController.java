package com.nirapod.controller;

import com.nirapod.dto.admin.*;
import com.nirapod.model.UserRole;
import com.nirapod.model.UserStatus;
import com.nirapod.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    @Operation(summary = "List all users with optional role/status filter")
    public ResponseEntity<Page<AdminUserResponse>> listUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.listUsers(role, status, pageable));
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Get user detail with documents")
    public ResponseEntity<AdminUserResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminService.getUser(userId));
    }

    @PutMapping("/users/{userId}/approve")
    @Operation(summary = "Approve a pending user")
    public ResponseEntity<AdminUserResponse> approveUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest req) {
        UUID adminId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(adminService.approveUser(userId, adminId, req.getRemoteAddr()));
    }

    @PutMapping("/users/{userId}/suspend")
    @Operation(summary = "Suspend a user")
    public ResponseEntity<AdminUserResponse> suspendUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest req) {
        UUID adminId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(adminService.suspendUser(userId, adminId, req.getRemoteAddr()));
    }

    @PostMapping("/users/authority")
    @Operation(summary = "Create an authority user (POLICE, FIRE, CITY, ANIMAL)")
    public ResponseEntity<AdminUserResponse> createAuthorityUser(
            @Valid @RequestBody CreateAuthorityRequest request,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest req) {
        UUID adminId = UUID.fromString(principal.getUsername());
        return ResponseEntity.status(201).body(adminService.createAuthorityUser(request, adminId, req.getRemoteAddr()));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get platform-wide complaint and user statistics")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get complaint counts grouped by district and category for a date range")
    public ResponseEntity<List<AnalyticsDataPoint>> getAnalytics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        return ResponseEntity.ok(adminService.getAnalytics(from, to));
    }

    @GetMapping("/audit")
    @Operation(summary = "Paginated audit log with optional userId/action filter")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLog(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getAuditLog(userId, action, pageable));
    }

    @GetMapping("/investigate/nid/{nid}")
    @Operation(summary = "Look up user by NID")
    public ResponseEntity<AdminUserResponse> investigateByNid(@PathVariable String nid) {
        return ResponseEntity.ok(adminService.investigateByNid(nid));
    }

    @GetMapping("/investigate/document/{documentNumber}")
    @Operation(summary = "Look up user by document number (passport, DL, etc.)")
    public ResponseEntity<AdminUserResponse> investigateByDocument(@PathVariable String documentNumber) {
        return ResponseEntity.ok(adminService.investigateByDocumentNumber(documentNumber));
    }

    @GetMapping("/reports")
    @Operation(summary = "List complaint reports")
    public ResponseEntity<org.springframework.data.domain.Page<com.nirapod.dto.social.ReportResponse>> listReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.listReports(pageable));
    }

    @DeleteMapping("/reports/{reportId}")
    @Operation(summary = "Dismiss (delete) a complaint report")
    public ResponseEntity<Void> dismissReport(
            @PathVariable UUID reportId,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest req) {
        UUID adminId = UUID.fromString(principal.getUsername());
        adminService.dismissReport(reportId, adminId, req.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
