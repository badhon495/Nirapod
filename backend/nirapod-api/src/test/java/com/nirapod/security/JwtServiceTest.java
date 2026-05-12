package com.nirapod.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;

    private JwtService jwtService;

    // 32-byte base64 secret for tests
    private static final String TEST_SECRET =
            Base64.getEncoder().encodeToString("test-secret-at-least-32-bytes!!".getBytes());

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(redisTemplate);
        ReflectionTestUtils.setField(jwtService, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiryMs", 900_000L);
    }

    @Test
    void generateAccessToken_containsSubjectAndRole() {
        String userId = UUID.randomUUID().toString();
        String token = jwtService.generateAccessToken(userId, "CITIZEN");

        assertThat(jwtService.extractSubject(token)).isEqualTo(userId);
        Claims claims = jwtService.extractAllClaims(token);
        assertThat(claims.get("role", String.class)).isEqualTo("CITIZEN");
    }

    @Test
    void generateAccessToken_hasJti() {
        String token = jwtService.generateAccessToken(UUID.randomUUID().toString(), "CITIZEN");
        assertThat(jwtService.extractJti(token)).isNotBlank();
    }

    @Test
    void isTokenValid_validToken_returnsTrue() {
        String token = jwtService.generateAccessToken(UUID.randomUUID().toString(), "POLICE");
        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_tamperedToken_returnsFalse() {
        String token = jwtService.generateAccessToken(UUID.randomUUID().toString(), "CITIZEN");
        String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "invalidsig";
        assertThat(jwtService.isTokenValid(tampered)).isFalse();
    }

    @Test
    void isTokenValid_emptyString_returnsFalse() {
        assertThat(jwtService.isTokenValid("")).isFalse();
    }

    @Test
    void getExpiryMs_freshToken_positive() {
        String token = jwtService.generateAccessToken(UUID.randomUUID().toString(), "ADMIN");
        assertThat(jwtService.getExpiryMs(token)).isPositive();
    }

    @Test
    void blacklistToken_writesToRedis() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        String token = jwtService.generateAccessToken(UUID.randomUUID().toString(), "CITIZEN");
        jwtService.blacklistToken(token);
        verify(valueOps).set(anyString(), eq("1"), any());
    }
}
