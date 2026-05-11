package com.nirapod.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nirapod.dto.notification.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Publishes notifications to a Redis channel so every app instance
 * can fan-out to its locally-connected WebSocket sessions.
 *
 * Flow: NotificationService.sendTo() → pushToUser() → Redis PUBLISH
 *       → RedisMessageListenerContainer → onMessage() → STOMP /user/queue/notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketService implements MessageListener {

    public static final String REDIS_CHANNEL = "notifications:ws";

    private final SimpMessagingTemplate messagingTemplate;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    /** Called by NotificationService — publishes event to Redis so all instances receive it. */
    public void pushToUser(UUID userId, NotificationResponse notification) {
        try {
            String payload = objectMapper.writeValueAsString(
                    new Envelope(userId.toString(), notification));
            redisTemplate.convertAndSend(REDIS_CHANNEL, payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize notification for Redis publish: {}", e.getMessage());
        }
    }

    /** Redis subscriber callback — runs on every app instance that receives the message. */
    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            Envelope envelope = objectMapper.readValue(message.getBody(), Envelope.class);
            messagingTemplate.convertAndSendToUser(
                    envelope.userId(),
                    "/queue/notifications",
                    envelope.notification()
            );
        } catch (Exception e) {
            log.debug("WS push failed during Redis fan-out: {}", e.getMessage());
        }
    }

    public record Envelope(String userId, NotificationResponse notification) {}
}
