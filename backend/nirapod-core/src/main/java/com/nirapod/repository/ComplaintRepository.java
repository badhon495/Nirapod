package com.nirapod.repository;

import com.nirapod.model.Complaint;
import com.nirapod.model.ComplaintCategory;
import com.nirapod.model.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

import java.util.Optional;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {

    @Query("SELECT c FROM Complaint c JOIN FETCH c.user WHERE c.id = :id")
    Optional<Complaint> findByIdWithUser(@Param("id") UUID id);

    @Query("SELECT c FROM Complaint c JOIN FETCH c.user WHERE c.trackingId = :trackingId AND c.isPublic = true")
    Optional<Complaint> findByTrackingIdPublic(@Param("trackingId") Long trackingId);

    @Query(value = "SELECT c FROM Complaint c JOIN FETCH c.user WHERE c.isPublic = true ORDER BY c.createdAt DESC",
           countQuery = "SELECT COUNT(c) FROM Complaint c WHERE c.isPublic = true")
    Page<Complaint> findAllPublic(Pageable pageable);

    @Query(value = "SELECT c FROM Complaint c JOIN FETCH c.user WHERE c.isPublic = true AND c.category = :category ORDER BY c.createdAt DESC",
           countQuery = "SELECT COUNT(c) FROM Complaint c WHERE c.isPublic = true AND c.category = :category")
    Page<Complaint> findAllPublicByCategory(@Param("category") ComplaintCategory category, Pageable pageable);

    @Query(value = "SELECT c FROM Complaint c JOIN FETCH c.user WHERE c.isPublic = true AND c.status = :status ORDER BY c.createdAt DESC",
           countQuery = "SELECT COUNT(c) FROM Complaint c WHERE c.isPublic = true AND c.status = :status")
    Page<Complaint> findAllPublicByStatus(@Param("status") ComplaintStatus status, Pageable pageable);

    @Query(value = "SELECT c FROM Complaint c JOIN FETCH c.user WHERE c.isPublic = true AND c.category = :category AND c.status = :status ORDER BY c.createdAt DESC",
           countQuery = "SELECT COUNT(c) FROM Complaint c WHERE c.isPublic = true AND c.category = :category AND c.status = :status")
    Page<Complaint> findAllPublicByCategoryAndStatus(@Param("category") ComplaintCategory category,
                                                      @Param("status") ComplaintStatus status, Pageable pageable);

    @Query(value = "SELECT c FROM Complaint c JOIN FETCH c.user WHERE c.isPublic = true AND c.district = :district ORDER BY c.createdAt DESC",
           countQuery = "SELECT COUNT(c) FROM Complaint c WHERE c.isPublic = true AND c.district = :district")
    Page<Complaint> findAllPublicByDistrict(@Param("district") String district, Pageable pageable);

    @Query(value = "SELECT c FROM Complaint c JOIN FETCH c.user WHERE c.user.id = :userId ORDER BY c.createdAt DESC",
           countQuery = "SELECT COUNT(c) FROM Complaint c WHERE c.user.id = :userId")
    Page<Complaint> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    // For authority: all complaints in their category regardless of public flag
    @Query(value = "SELECT c FROM Complaint c JOIN FETCH c.user WHERE c.category = :category ORDER BY c.createdAt DESC",
           countQuery = "SELECT COUNT(c) FROM Complaint c WHERE c.category = :category")
    Page<Complaint> findAllByCategory(@Param("category") ComplaintCategory category, Pageable pageable);

    @Query(value = "SELECT c FROM Complaint c JOIN FETCH c.user WHERE c.category = :category AND c.status = :status ORDER BY c.createdAt DESC",
           countQuery = "SELECT COUNT(c) FROM Complaint c WHERE c.category = :category AND c.status = :status")
    Page<Complaint> findAllByCategoryAndStatus(@Param("category") ComplaintCategory category,
                                               @Param("status") ComplaintStatus status, Pageable pageable);

    long countByStatus(ComplaintStatus status);
    long countByCategory(ComplaintCategory category);

    @Query("SELECT c.category, COUNT(c) FROM Complaint c GROUP BY c.category")
    List<Object[]> countGroupByCategory();

    @Query("SELECT c.district, COUNT(c) FROM Complaint c GROUP BY c.district ORDER BY COUNT(c) DESC")
    List<Object[]> countGroupByDistrict();

    @Query("SELECT c.district, c.category, COUNT(c) FROM Complaint c WHERE c.createdAt >= :from AND c.createdAt <= :to GROUP BY c.district, c.category")
    List<Object[]> analyticsGroupByDistrictAndCategory(@Param("from") java.time.OffsetDateTime from,
                                                        @Param("to") java.time.OffsetDateTime to);
}
