package com.nirapod.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nirapod.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, String> { // Changed Long to String
    Optional<User> findByPhone(String phone);
    Optional<User> findByEmail(String email);
    Optional<User> findByNidOrPhone(String nid, String phone);
    Optional<User> findByNid(String nid);
}
