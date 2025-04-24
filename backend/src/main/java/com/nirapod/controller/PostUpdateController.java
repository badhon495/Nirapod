package com.nirapod.controller;

import com.nirapod.model.PostUpdate;
import com.nirapod.repository.PostUpdateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/updates")
public class PostUpdateController {
    @Autowired
    private PostUpdateRepository postUpdateRepository;

    @GetMapping("/post/{postId}")
    public List<PostUpdate> getUpdatesByPost(@PathVariable Long postId) {
        return postUpdateRepository.findByPostId(postId);
    }

    @PostMapping
    public ResponseEntity<PostUpdate> addUpdate(@RequestBody PostUpdate update) {
        update.setCreatedAt(LocalDateTime.now());
        PostUpdate saved = postUpdateRepository.save(update);
        return ResponseEntity.ok(saved);
    }
}