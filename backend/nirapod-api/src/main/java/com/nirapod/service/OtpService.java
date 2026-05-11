package com.nirapod.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final StringRedisTemplate redisTemplate;

    private static final String OTP_PREFIX = "otp:";
    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generateAndStore(String email) {
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        redisTemplate.opsForValue().set(OTP_PREFIX + email, otp, OTP_TTL);
        return otp;
    }

    public boolean verify(String email, String otp) {
        String key = OTP_PREFIX + email;
        String stored = redisTemplate.opsForValue().get(key);
        if (stored != null && stored.equals(otp)) {
            redisTemplate.delete(key);
            return true;
        }
        return false;
    }

    public boolean hasActiveOtp(String email) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(OTP_PREFIX + email));
    }
}
