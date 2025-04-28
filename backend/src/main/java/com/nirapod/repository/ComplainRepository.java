package com.nirapod.repository;

import com.nirapod.model.Complain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplainRepository extends JpaRepository<Complain, Long> {
    List<Complain> findByNid(String nid);
}
