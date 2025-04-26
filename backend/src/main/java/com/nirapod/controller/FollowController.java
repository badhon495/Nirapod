package com.nirapod.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/follows")
public class FollowController {
    @GetMapping("/user/{userId}")
    public List<Map<String, Object>> getFollowsByUser(@PathVariable String userId) {
        // Dummy data for followed posts
        List<Map<String, Object>> follows = new ArrayList<>();
        Map<String, Object> follow = new HashMap<>();
        follow.put("postId", 1L);
        follows.add(follow);
        return follows;
    }

    @PostMapping("/follow")
    public Map<String, Object> follow(@RequestParam Long postId, @RequestParam Long userId) {
        // Dummy follow logic
        return Map.of("success", true);
    }

    @PostMapping("/unfollow")
    public Map<String, Object> unfollow(@RequestParam Long postId, @RequestParam Long userId) {
        // Dummy unfollow logic
        return Map.of("success", true);
    }
}
