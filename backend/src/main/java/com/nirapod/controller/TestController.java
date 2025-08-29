package com.nirapod.controller;

import com.nirapod.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private CloudinaryService cloudinaryService;

    @GetMapping("/cloudinary")
    public ResponseEntity<?> testCloudinaryConnection() {
        try {
            // Test Cloudinary connection by getting cloudinary info
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Cloudinary connection is working",
                "cloudName", cloudinaryService.getCloudName()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Cloudinary connection failed: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/cloudinary")
    public ResponseEntity<?> testCloudinaryUpload(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = cloudinaryService.uploadImage(file, "nirapod/test");
            return ResponseEntity.ok(Map.of(
                "success", true, 
                "message", "Image uploaded successfully",
                "url", imageUrl
            ));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Failed to upload image: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        return ResponseEntity.ok(Map.of(
            "status", "Backend is running",
            "cloudinary", "Configured"
        ));
    }
}
