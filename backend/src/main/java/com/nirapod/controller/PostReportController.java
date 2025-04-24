package com.nirapod.controller;

import com.nirapod.model.PostReport;
import com.nirapod.repository.PostReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class PostReportController {
    @Autowired
    private PostReportRepository postReportRepository;

    @GetMapping("/post/{postId}")
    public List<PostReport> getReportsByPost(@PathVariable Long postId) {
        return postReportRepository.findByPostId(postId);
    }

    @PostMapping
    public ResponseEntity<PostReport> reportPost(@RequestBody PostReport report) {
        report.setReportedAt(LocalDateTime.now());
        PostReport saved = postReportRepository.save(report);
        return ResponseEntity.ok(saved);
    }
}