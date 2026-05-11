package com.nirapod.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    // In-process bucket cache — sufficient for single-instance dev/hobby; swap to
    // Bucket4j Redis proxy backend for multi-instance production.
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private static final Map<String, Bandwidth> PATH_LIMITS = Map.of(
            "/api/v1/auth/login",                  Bandwidth.builder().capacity(5).refillIntervally(5, Duration.ofMinutes(15)).build(),
            "/api/v1/auth/signup",                 Bandwidth.builder().capacity(10).refillIntervally(10, Duration.ofHours(1)).build(),
            "/api/v1/auth/send-otp",               Bandwidth.builder().capacity(5).refillIntervally(5, Duration.ofHours(1)).build(),
            "/api/v1/auth/forgot-password/send-otp", Bandwidth.builder().capacity(3).refillIntervally(3, Duration.ofHours(1)).build()
    );

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getServletPath();
        Bandwidth limit = PATH_LIMITS.get(path);

        if (limit != null) {
            String ip = resolveClientIp(request);
            String key = ip + ":" + path;
            Bucket bucket = buckets.computeIfAbsent(key, k -> Bucket.builder().addLimit(limit).build());

            if (!bucket.tryConsume(1)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"code\":\"RATE_LIMIT_EXCEEDED\",\"message\":\"Too many requests. Please try again later.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
