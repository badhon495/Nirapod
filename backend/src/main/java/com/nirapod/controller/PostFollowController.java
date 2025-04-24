package com.nirapod.controller;

import com.nirapod.model.PostFollow;
import com.nirapod.repository.PostFollowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/follows")
public class PostFollowController {
    @Autowired
    private PostFollowRepository postFollowRepository;

    @PostMapping("/follow")
    public ResponseEntity<?> followPost(@RequestParam Long postId, @RequestParam Long userId) {
        Optional<PostFollow> existing = postFollowRepository.findByPostIdAndUserId(postId, userId);
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body("Already following");
        }
        PostFollow follow = PostFollow.builder()
                .postId(postId)
                .userId(userId)
                .followedAt(LocalDateTime.now())
                .build();
        postFollowRepository.save(follow);
        return ResponseEntity.ok(follow);
    }

    @PostMapping("/unfollow")
    public ResponseEntity<?> unfollowPost(@RequestParam Long postId, @RequestParam Long userId) {
        Optional<PostFollow> existing = postFollowRepository.findByPostIdAndUserId(postId, userId);
        if (existing.isPresent()) {
            postFollowRepository.delete(existing.get());
            return ResponseEntity.ok("Unfollowed");
        }
        return ResponseEntity.badRequest().body("Not following");
    }

    @GetMapping("/user/{userId}")
    public List<PostFollow> getFollowedPosts(@PathVariable Long userId) {
        return postFollowRepository.findByUserId(userId);
    }
}