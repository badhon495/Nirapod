package com.nirapod.controller;

import com.nirapod.dto.social.ReportRequest;
import com.nirapod.dto.social.ReportResponse;
import com.nirapod.service.ReportService;
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
@RequiredArgsConstructor
@Tag(name = "Reports")
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/api/v1/complaints/{complaintId}/report")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Report a complaint as inappropriate")
    public ResponseEntity<Void> report(
            @PathVariable UUID complaintId,
            @Valid @RequestBody ReportRequest req,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest httpReq) {
        UUID reporterId = UUID.fromString(principal.getUsername());
        reportService.report(complaintId, reporterId, req, httpReq.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/api/v1/admin/reports")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List all complaint reports (admin only)")
    public ResponseEntity<Page<ReportResponse>> getAllReports(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(reportService.getAllReports(pageable));
    }

    @DeleteMapping("/api/v1/admin/reports/{reportId}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Dismiss a report (admin only)")
    public ResponseEntity<Void> dismissReport(
            @PathVariable UUID reportId,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest httpReq) {
        UUID adminId = UUID.fromString(principal.getUsername());
        reportService.deleteReport(reportId, httpReq.getRemoteAddr(), adminId);
        return ResponseEntity.noContent().build();
    }
}
