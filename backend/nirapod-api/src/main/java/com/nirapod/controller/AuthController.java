package com.nirapod.controller;

import com.nirapod.dto.auth.*;
import com.nirapod.service.AuthService;
import com.nirapod.service.GoogleAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register new citizen account; triggers OTP email")
    public ResponseEntity<Map<String, String>> signup(@Valid @RequestBody SignupRequest req) {
        authService.signup(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Registration successful. Check your email for the verification code."));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate with email + password; issues access token + refresh cookie")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req,
                                               HttpServletResponse response) {
        return ResponseEntity.ok(authService.login(req, response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange refresh token cookie for new token pair")
    public ResponseEntity<TokenResponse> refresh(HttpServletRequest request,
                                                  HttpServletResponse response) {
        String refreshToken = extractCookie(request, "refresh_token");
        return ResponseEntity.ok(authService.refresh(refreshToken, response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke refresh token + blacklist access token")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request,
                                                       HttpServletResponse response) {
        String refreshToken = extractCookie(request, "refresh_token");
        String authHeader = request.getHeader("Authorization");
        String accessToken = authHeader != null && authHeader.startsWith("Bearer ")
                ? authHeader.substring(7) : null;
        authService.logout(refreshToken, accessToken, response);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/send-otp")
    @Operation(summary = "Send OTP to email for verification")
    public ResponseEntity<Map<String, String>> sendOtp(@Valid @RequestBody OtpRequest req) {
        authService.sendOtp(req.getEmail());
        return ResponseEntity.ok(Map.of("message", "OTP sent to " + req.getEmail()));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP and activate account")
    public ResponseEntity<Map<String, String>> verifyOtp(@Valid @RequestBody OtpVerifyRequest req) {
        authService.verifyOtp(req);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    @PostMapping("/forgot-password/send-otp")
    @Operation(summary = "Send password reset OTP")
    public ResponseEntity<Map<String, String>> forgotPasswordOtp(@Valid @RequestBody OtpRequest req) {
        authService.sendForgotPasswordOtp(req.getEmail());
        return ResponseEntity.ok(Map.of("message", "Password reset code sent to " + req.getEmail()));
    }

    @PostMapping("/forgot-password/reset")
    @Operation(summary = "Reset password using OTP")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @PostMapping("/google")
    @Operation(summary = "Authenticate with Google ID token")
    public ResponseEntity<TokenResponse> googleAuth(@Valid @RequestBody GoogleAuthRequest req,
                                                     HttpServletResponse response) {
        return ResponseEntity.ok(googleAuthService.authenticateWithGoogle(req.getIdToken(), response));
    }

    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
