package com.nirapod.repository;

import com.nirapod.model.ComplaintFollow;
import com.nirapod.model.ComplaintFollow.ComplaintFollowId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ComplaintFollowRepository extends JpaRepository<ComplaintFollow, ComplaintFollowId> {

    boolean existsByUserIdAndComplaintId(UUID userId, UUID complaintId);

    void deleteByUserIdAndComplaintId(UUID userId, UUID complaintId);

    @Query("SELECT cf.complaint.id FROM ComplaintFollow cf WHERE cf.user.id = :userId")
    List<UUID> findFollowedComplaintIdsByUserId(@Param("userId") UUID userId);

    long countByComplaintId(UUID complaintId);
}
