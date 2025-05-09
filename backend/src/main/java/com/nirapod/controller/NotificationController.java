package com.nirapod.controller;

import com.nirapod.model.Notification;
import com.nirapod.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {
    private final Logger logger = LoggerFactory.getLogger(NotificationController.class);
    
    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable String userId) {
        logger.info("Fetching notifications for user: {}", userId);
        try {
            List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
            logger.info("Found {} notifications for user {}", notifications.size(), userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            logger.error("Error fetching notifications for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        logger.info("Creating notification: {}", notification);
        try {
            // Validate required fields
            if (notification.getUserId() == null || notification.getUserId().trim().isEmpty()) {
                logger.error("Invalid notification - missing userId");
                return ResponseEntity.badRequest().build();
            }
            if (notification.getMessage() == null || notification.getMessage().trim().isEmpty()) {
                logger.error("Invalid notification - missing message");
                return ResponseEntity.badRequest().build();
            }

            // Set default values if not provided
            if (notification.getCreatedAt() == null) {
                notification.setCreatedAt(LocalDateTime.now());
            }

            // Save notification
            Notification saved = notificationRepository.save(notification);
            logger.info("Successfully created notification: {}", saved);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("Error creating notification: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable String userId) {
        logger.info("Getting unread count for user: {}", userId);
        try {
            long count = notificationRepository.countByUserIdAndReadFalse(userId);
            logger.info("User {} has {} unread notifications", userId, count);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            logger.error("Error getting unread count for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        logger.info("Marking notification {} as read", id);
        try {
            return notificationRepository.findById(id)
                .map(notification -> {
                    notification.setRead(true);
                    notificationRepository.save(notification);
                    logger.info("Successfully marked notification {} as read", id);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> {
                    logger.warn("Notification {} not found", id);
                    return ResponseEntity.notFound().build();
                });
        } catch (Exception e) {
            logger.error("Error marking notification {} as read: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}