package com.nirapod.repository;

import com.nirapod.model.PostReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostReportRepository extends JpaRepository<PostReport, Long> {
    List<PostReport> findByPostId(Long postId);
}