package com.nirapod.service;

import com.nirapod.dto.auth.LoginRequest;
import com.nirapod.dto.auth.OtpVerifyRequest;
import com.nirapod.dto.auth.SignupRequest;
import com.nirapod.dto.auth.TokenResponse;
import com.nirapod.exception.ApiException;
import com.nirapod.model.User;
import com.nirapod.model.UserRole;
import com.nirapod.model.UserStatus;
import com.nirapod.repository.UserRepository;
import com.nirapod.security.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private OtpService otpService;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private EmailService emailService;
    @Mock private AuditService auditService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository, passwordEncoder, jwtService,
                otpService, refreshTokenService, emailService, auditService);
        org.springframework.test.util.ReflectionTestUtils.setField(
                authService, "refreshTokenExpiryMs", 604_800_000L);
    }

    // --- signup ---

    @Test
    void signup_newUser_savesUserAndSendsOtp() {
        SignupRequest req = buildSignupRequest("test@example.com", "01712345678", "1234567890");
        when(userRepository.existsByEmail(req.getEmail())).thenReturn(false);
        when(userRepository.existsByNid(req.getNid())).thenReturn(false);
        when(userRepository.existsByPhone(req.getPhone())).thenReturn(false);
        when(passwordEncoder.encode(req.getPassword())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(otpService.generateAndStore(req.getEmail())).thenReturn("123456");

        authService.signup(req);

        verify(userRepository).save(any(User.class));
        verify(emailService).sendOtp(eq(req.getEmail()), eq("123456"));
    }

    @Test
    void signup_duplicateEmail_throwsConflict() {
        SignupRequest req = buildSignupRequest("dup@example.com", "01712345679", "1234567891");
        when(userRepository.existsByEmail(req.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.signup(req))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Email");
    }

    @Test
    void signup_duplicateNid_throwsConflict() {
        SignupRequest req = buildSignupRequest("new@example.com", "01712345679", "1234567891");
        when(userRepository.existsByEmail(req.getEmail())).thenReturn(false);
        when(userRepository.existsByNid(req.getNid())).thenReturn(true);

        assertThatThrownBy(() -> authService.signup(req))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("NID");
    }

    @Test
    void signup_savedUser_hasPendingStatusAndCitizenRole() {
        SignupRequest req = buildSignupRequest("new@example.com", "01712345679", "1234567891");
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByNid(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(otpService.generateAndStore(anyString())).thenReturn("000000");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        authService.signup(req);

        User saved = userCaptor.getValue();
        assertThat(saved.getStatus()).isEqualTo(UserStatus.PENDING);
        assertThat(saved.getRole()).isEqualTo(UserRole.CITIZEN);
    }

    // --- verifyOtp ---

    @Test
    void verifyOtp_validOtp_activatesUser() {
        User user = buildUser(UserStatus.PENDING);
        OtpVerifyRequest req = new OtpVerifyRequest();
        req.setEmail("user@example.com");
        req.setOtp("123456");

        when(otpService.verify(req.getEmail(), req.getOtp())).thenReturn(true);
        when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.verifyOtp(req);

        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    void verifyOtp_invalidOtp_throwsUnauthorized() {
        OtpVerifyRequest req = new OtpVerifyRequest();
        req.setEmail("user@example.com");
        req.setOtp("000000");
        when(otpService.verify(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.verifyOtp(req))
                .isInstanceOf(ApiException.class);
    }

    // --- login ---

    @Test
    void login_validCredentials_returnsTokenResponse() {
        User user = buildUser(UserStatus.ACTIVE);
        LoginRequest req = new LoginRequest();
        req.setEmail("user@example.com");
        req.setPassword("password");
        HttpServletResponse response = mock(HttpServletResponse.class);

        when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(req.getPassword(), user.getPasswordHash())).thenReturn(true);
        when(jwtService.generateAccessToken(any(), any())).thenReturn("access-token");
        when(refreshTokenService.create(any())).thenReturn("refresh-token");

        TokenResponse result = authService.login(req, response);

        assertThat(result.getAccessToken()).isEqualTo("access-token");
    }

    @Test
    void login_wrongPassword_throwsUnauthorized() {
        User user = buildUser(UserStatus.ACTIVE);
        LoginRequest req = new LoginRequest();
        req.setEmail("user@example.com");
        req.setPassword("wrong");
        HttpServletResponse response = mock(HttpServletResponse.class);

        when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req, response))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void login_pendingUser_throwsForbidden() {
        User user = buildUser(UserStatus.PENDING);
        LoginRequest req = new LoginRequest();
        req.setEmail("user@example.com");
        req.setPassword("password");
        HttpServletResponse response = mock(HttpServletResponse.class);

        when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.login(req, response))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void login_suspendedUser_throwsForbidden() {
        User user = buildUser(UserStatus.SUSPENDED);
        LoginRequest req = new LoginRequest();
        req.setEmail("user@example.com");
        req.setPassword("password");
        HttpServletResponse response = mock(HttpServletResponse.class);

        when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.login(req, response))
                .isInstanceOf(ApiException.class);
    }

    // --- helpers ---

    private SignupRequest buildSignupRequest(String email, String phone, String nid) {
        SignupRequest req = new SignupRequest();
        req.setEmail(email);
        req.setPhone(phone);
        req.setNid(nid);
        req.setPassword("password123");
        req.setName("Test User");
        req.setPresentAddress("Dhaka");
        req.setPermanentAddress("Dhaka");
        return req;
    }

    private User buildUser(UserStatus status) {
        return User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .nid("1234567890")
                .phone("01712345678")
                .passwordHash("hashed")
                .name("Test")
                .role(UserRole.CITIZEN)
                .status(status)
                .presentAddress("Dhaka")
                .permanentAddress("Dhaka")
                .build();
    }
}
