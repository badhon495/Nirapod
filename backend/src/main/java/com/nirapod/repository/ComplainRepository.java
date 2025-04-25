package com.nirapod.repository;

import com.nirapod.model.Complain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplainRepository extends JpaRepository<Complain, Long> {
    // ... you can add custom query methods here if needed ...
}
