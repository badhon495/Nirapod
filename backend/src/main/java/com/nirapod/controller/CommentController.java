package com.nirapod.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/comments")
public class CommentController {
    @GetMapping("/post/{postId}")
    public List<Map<String, Object>> getCommentsByPost(@PathVariable Long postId) {
        // Dummy comments
        List<Map<String, Object>> comments = new ArrayList<>();
        Map<String, Object> comment = new HashMap<>();
        comment.put("id", 1L);
        comment.put("postId", postId);
        comment.put("userId", 1L);
        comment.put("content", "Sample comment");
        comments.add(comment);
        return comments;
    }

    @PostMapping
    public Map<String, Object> addComment(@RequestBody Map<String, Object> payload) {
        // Dummy add comment
        return Map.of("success", true);
    }
}
