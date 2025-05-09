package com.nirapod.repository;

import com.nirapod.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    long countByUserIdAndReadFalse(String userId);
}