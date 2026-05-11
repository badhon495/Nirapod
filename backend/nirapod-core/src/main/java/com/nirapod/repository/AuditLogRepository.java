package com.nirapod.repository;

import com.nirapod.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByUserId(UUID userId, Pageable pageable);
    Page<AuditLog> findByAction(String action, Pageable pageable);
    Page<AuditLog> findByUserIdAndAction(UUID userId, String action, Pageable pageable);

    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.user ORDER BY a.createdAt DESC")
    Page<AuditLog> findAllWithUser(Pageable pageable);

    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.user WHERE a.user.id = :userId ORDER BY a.createdAt DESC")
    Page<AuditLog> findByUserIdWithUser(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.user WHERE a.action = :action ORDER BY a.createdAt DESC")
    Page<AuditLog> findByActionWithUser(@Param("action") String action, Pageable pageable);

    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.user WHERE a.user.id = :userId AND a.action = :action ORDER BY a.createdAt DESC")
    Page<AuditLog> findByUserIdAndActionWithUser(@Param("userId") UUID userId, @Param("action") String action, Pageable pageable);
}
