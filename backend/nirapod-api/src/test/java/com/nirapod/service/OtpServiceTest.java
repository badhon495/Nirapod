package com.nirapod.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;

    private OtpService otpService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        otpService = new OtpService(redisTemplate);
    }

    @Test
    void generateAndStore_returnsSixDigit() {
        String otp = otpService.generateAndStore("user@example.com");
        assertThat(otp).matches("\\d{6}");
    }

    @Test
    void generateAndStore_writesToRedisWithFiveMinuteTtl() {
        ArgumentCaptor<Duration> ttlCaptor = ArgumentCaptor.forClass(Duration.class);
        otpService.generateAndStore("user@example.com");
        verify(valueOps).set(eq("otp:user@example.com"), anyString(), ttlCaptor.capture());
        assertThat(ttlCaptor.getValue()).isEqualTo(Duration.ofMinutes(5));
    }

    @Test
    void verify_correctOtp_returnsTrueAndDeletes() {
        when(valueOps.get("otp:user@example.com")).thenReturn("123456");
        boolean result = otpService.verify("user@example.com", "123456");
        assertThat(result).isTrue();
        verify(redisTemplate).delete("otp:user@example.com");
    }

    @Test
    void verify_wrongOtp_returnsFalse() {
        when(valueOps.get("otp:user@example.com")).thenReturn("123456");
        boolean result = otpService.verify("user@example.com", "999999");
        assertThat(result).isFalse();
        verify(redisTemplate, never()).delete(anyString());
    }

    @Test
    void verify_noStoredOtp_returnsFalse() {
        when(valueOps.get("otp:user@example.com")).thenReturn(null);
        assertThat(otpService.verify("user@example.com", "123456")).isFalse();
    }

    @Test
    void hasActiveOtp_existsInRedis_returnsTrue() {
        when(redisTemplate.hasKey("otp:user@example.com")).thenReturn(true);
        assertThat(otpService.hasActiveOtp("user@example.com")).isTrue();
    }

    @Test
    void hasActiveOtp_missingKey_returnsFalse() {
        when(redisTemplate.hasKey("otp:user@example.com")).thenReturn(null);
        assertThat(otpService.hasActiveOtp("user@example.com")).isFalse();
    }
}
