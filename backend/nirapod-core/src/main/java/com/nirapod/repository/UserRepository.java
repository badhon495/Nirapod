package com.nirapod.repository;

import com.nirapod.model.User;
import com.nirapod.model.UserRole;
import com.nirapod.model.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByNid(String nid);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByNid(String nid);
    boolean existsByPhone(String phone);

    Page<User> findByRole(UserRole role, Pageable pageable);
    Page<User> findByStatus(UserStatus status, Pageable pageable);
    Page<User> findByRoleAndStatus(UserRole role, UserStatus status, Pageable pageable);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.documents WHERE u.nid = :nid")
    Optional<User> findByNidWithDocuments(@Param("nid") String nid);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.documents d WHERE d.documentNumber = :docNumber")
    Optional<User> findByDocumentNumber(@Param("docNumber") String docNumber);

    long countByStatus(UserStatus status);
    long countByRole(UserRole role);
}
