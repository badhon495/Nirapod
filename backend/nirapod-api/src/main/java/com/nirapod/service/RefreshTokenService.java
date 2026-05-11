package com.nirapod.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final StringRedisTemplate redisTemplate;

    @Value("${app.jwt.refresh-token-expiry-ms:604800000}")
    private long refreshTokenExpiryMs;

    private static final String REFRESH_PREFIX = "refresh:";

    public String issue(String userId) {
        String token = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(
                REFRESH_PREFIX + token,
                userId,
                Duration.ofMillis(refreshTokenExpiryMs)
        );
        return token;
    }

    public String consume(String token) {
        String key = REFRESH_PREFIX + token;
        String userId = redisTemplate.opsForValue().get(key);
        if (userId != null) {
            redisTemplate.delete(key);
        }
        return userId;
    }

    public void revoke(String token) {
        redisTemplate.delete(REFRESH_PREFIX + token);
    }
}
