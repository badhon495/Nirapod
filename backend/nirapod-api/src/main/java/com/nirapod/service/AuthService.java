package com.nirapod.service;

import com.nirapod.dto.auth.*;
import com.nirapod.exception.ApiException;
import com.nirapod.model.User;
import com.nirapod.model.UserRole;
import com.nirapod.model.UserStatus;
import com.nirapod.repository.UserRepository;
import com.nirapod.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${app.jwt.refresh-token-expiry-ms:604800000}")
    private long refreshTokenExpiryMs;

    @Transactional
    public void signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.getEmail()))
            throw ApiException.conflict("Email already registered");
        if (userRepository.existsByNid(req.getNid()))
            throw ApiException.conflict("NID already registered");
        if (userRepository.existsByPhone(req.getPhone()))
            throw ApiException.conflict("Phone number already registered");

        User user = User.builder()
                .nid(req.getNid())
                .email(req.getEmail())
                .phone(req.getPhone())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .name(req.getName())
                .role(UserRole.CITIZEN)
                .status(UserStatus.PENDING)
                .presentAddress(req.getPresentAddress())
                .permanentAddress(req.getPermanentAddress())
                .build();
        userRepository.save(user);

        String otp = otpService.generateAndStore(req.getEmail());
        emailService.sendOtp(req.getEmail(), otp);
        auditService.log(null, "USER_SIGNUP", "USER", user.getId(), null, null, null);
    }

    public void sendOtp(String email) {
        if (!userRepository.existsByEmail(email))
            throw ApiException.notFound("No account found with this email");
        if (otpService.hasActiveOtp(email))
            throw ApiException.badRequest("An OTP was already sent. Please wait before requesting another.");
        String otp = otpService.generateAndStore(email);
        emailService.sendOtp(email, otp);
    }

    @Transactional
    public void verifyOtp(OtpVerifyRequest req) {
        if (!otpService.verify(req.getEmail(), req.getOtp()))
            throw ApiException.unauthorized("Invalid or expired OTP");

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (user.getStatus() == UserStatus.PENDING) {
            user.setStatus(UserStatus.ACTIVE);
            userRepository.save(user);
        }
        auditService.log(user, "OTP_VERIFIED", "USER", user.getId(), null, null, null);
    }

    public TokenResponse login(LoginRequest req, HttpServletResponse response) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash()))
            throw ApiException.unauthorized("Invalid email or password");

        if (user.getStatus() == UserStatus.PENDING)
            throw ApiException.forbidden("Please verify your email before logging in");
        if (user.getStatus() == UserStatus.SUSPENDED)
            throw ApiException.forbidden("Your account has been suspended");

        return issueTokens(user, response);
    }

    public TokenResponse refresh(String refreshToken, HttpServletResponse response) {
        String userId = refreshTokenService.consume(refreshToken);
        if (userId == null)
            throw ApiException.unauthorized("Invalid or expired refresh token");

        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> ApiException.unauthorized("User not found"));

        return issueTokens(user, response);
    }

    public void logout(String refreshToken, String accessToken, HttpServletResponse response) {
        if (refreshToken != null) refreshTokenService.revoke(refreshToken);
        if (accessToken != null) {
            try {
                jwtService.blacklistToken(accessToken);
            } catch (Exception ignored) {}
        }
        clearRefreshCookie(response);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest req) {
        if (!otpService.verify(req.getEmail(), req.getOtp()))
            throw ApiException.unauthorized("Invalid or expired OTP");

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> ApiException.notFound("User not found"));

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        auditService.log(user, "PASSWORD_RESET", "USER", user.getId(), null, null, null);
    }

    public void sendForgotPasswordOtp(String email) {
        if (!userRepository.existsByEmail(email))
            throw ApiException.notFound("No account found with this email");
        String otp = otpService.generateAndStore(email);
        emailService.sendPasswordResetOtp(email, otp);
    }

    private TokenResponse issueTokens(User user, HttpServletResponse response) {
        String accessToken = jwtService.generateAccessToken(
                user.getId().toString(), user.getRole().name());
        String refreshToken = refreshTokenService.issue(user.getId().toString());
        setRefreshCookie(response, refreshToken);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(900)
                .userId(user.getId().toString())
                .role(user.getRole().name())
                .name(user.getName())
                .build();
    }

    private void setRefreshCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("refresh_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge((int) (refreshTokenExpiryMs / 1000));
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refresh_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
