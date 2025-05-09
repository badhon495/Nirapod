package com.nirapod.repository;

import com.nirapod.model.CreateComplain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CreateComplainRepository extends JpaRepository<CreateComplain, Long> {
    // ... you can add custom query methods here if needed ...
}
