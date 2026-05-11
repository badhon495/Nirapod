package com.nirapod.repository;

import com.nirapod.model.ComplaintPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ComplaintPhotoRepository extends JpaRepository<ComplaintPhoto, UUID> {
    List<ComplaintPhoto> findByComplaintIdOrderByCreatedAtAsc(UUID complaintId);
    void deleteByComplaintIdAndId(UUID complaintId, UUID photoId);
}
