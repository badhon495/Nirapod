package com.nirapod.service;

import com.nirapod.model.AuditLog;
import com.nirapod.model.User;
import com.nirapod.repository.AuditLogRepository;
import com.nirapod.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Async
    public void log(User user, String action, String entityType, UUID entityId,
                    String ipAddress, String userAgent, String details) {
        try {
            AuditLog entry = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .details(details)
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Audit log write failed for action={}: {}", action, e.getMessage());
        }
    }

    @Async
    public void log(UUID userId, String action, String entityType, UUID entityId,
                    String ipAddress, String userAgent, String details) {
        try {
            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
            log(user, action, entityType, entityId, ipAddress, userAgent, details);
        } catch (Exception e) {
            log.error("Audit log write failed for action={}: {}", action, e.getMessage());
        }
    }
}
