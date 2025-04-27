package com.nirapod.repository;

import com.nirapod.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);
    Optional<User> findByEmail(String email);
    Optional<User> findByNidOrPhone(String nid, String phone);
    Optional<User> findByNid(String nid);
    Optional<User> findByDrivingLicense(String drivingLicense);
    Optional<User> findByPassport(String passport);
}
