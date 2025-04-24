package com.nirapod.controller;

import com.nirapod.model.Comment;
import com.nirapod.model.Notification;
import com.nirapod.repository.CommentRepository;
import com.nirapod.repository.NotificationRepository;
import com.nirapod.repository.PostRepository;
import com.nirapod.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {
    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/post/{postId}")
    public List<Comment> getCommentsByPost(@PathVariable Long postId) {
        return commentRepository.findByPostId(postId);
    }

    @PostMapping
    public ResponseEntity<Comment> addComment(@RequestBody Comment comment) {
        comment.setCreatedAt(LocalDateTime.now());
        Comment saved = commentRepository.save(comment);
        // Notify post owner
        postRepository.findById(comment.getPostId()).ifPresent(post -> {
            if (!post.getUserId().equals(comment.getUserId())) { // Don't notify if commenting on own post
                userRepository.findById(post.getUserId()).ifPresent(owner -> {
                    Notification notification = Notification.builder()
                            .userId(owner.getId())
                            .message("Your post received a new comment.")
                            .read(false)
                            .createdAt(LocalDateTime.now())
                            .build();
                    notificationRepository.save(notification);
                });
            }
        });
        return ResponseEntity.ok(saved);
    }
}