package com.nirapod.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@RestController
@RequestMapping("/api/photos")
public class PhotoController {
    @GetMapping("/post/{postId}")
    public List<Map<String, Object>> getPhotosByPost(@PathVariable Long postId) {
        List<Map<String, Object>> photos = new ArrayList<>();
        Map<String, Object> photo = new HashMap<>();
        photo.put("id", 1L);
        photo.put("postId", postId);
        photo.put("url", "/uploads/sample.jpg");
        photos.add(photo);
        return photos;
    }

    @PostMapping("/upload")
    public Map<String, Object> uploadPhoto(@RequestParam Long postId, @RequestParam Long userId, @RequestParam MultipartFile file) {
        // Dummy upload
        return Map.of("success", true, "url", "/uploads/sample.jpg");
    }
}
