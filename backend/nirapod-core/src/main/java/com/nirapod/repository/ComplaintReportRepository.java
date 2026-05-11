package com.nirapod.repository;

import com.nirapod.model.ComplaintReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ComplaintReportRepository extends JpaRepository<ComplaintReport, UUID> {

    boolean existsByComplaintIdAndReporterId(UUID complaintId, UUID reporterId);

    @Query("SELECT r FROM ComplaintReport r JOIN FETCH r.complaint JOIN FETCH r.reporter ORDER BY r.createdAt DESC")
    Page<ComplaintReport> findAllWithDetails(Pageable pageable);

    long countByComplaintId(UUID complaintId);
}
