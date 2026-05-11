package com.nirapod.repository;

import com.nirapod.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.complaint.id = :complaintId ORDER BY c.createdAt ASC")
    Page<Comment> findByComplaintId(@Param("complaintId") UUID complaintId, Pageable pageable);

    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.id = :id")
    Optional<Comment> findByIdWithUser(@Param("id") UUID id);

    long countByComplaintId(UUID complaintId);
}
