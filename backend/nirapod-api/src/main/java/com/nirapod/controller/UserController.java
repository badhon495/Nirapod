package com.nirapod.controller;

import com.nirapod.dto.user.ChangePasswordRequest;
import com.nirapod.dto.user.UpdateProfileRequest;
import com.nirapod.dto.user.UserProfileResponse;
import com.nirapod.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users")
@PreAuthorize("isAuthenticated()")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user's profile")
    public ResponseEntity<UserProfileResponse> getMyProfile(
            @AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get any user's profile (admin or self)")
    @PreAuthorize("hasRole('ADMIN') or #userId.toString() == principal.username")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user's profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest req,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest httpReq) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(userService.updateProfile(userId, req, httpReq.getRemoteAddr()));
    }

    @PutMapping("/me/password")
    @Operation(summary = "Change current user's password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest req,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest httpReq) {
        UUID userId = UUID.fromString(principal.getUsername());
        userService.changePassword(userId, req, httpReq.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
