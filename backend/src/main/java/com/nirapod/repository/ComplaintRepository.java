package com.nirapod.repository;

import com.nirapod.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Integer> {
    List<Complaint> findByComplainToIgnoreCase(String complainTo);
}