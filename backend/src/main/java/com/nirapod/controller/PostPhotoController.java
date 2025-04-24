package com.nirapod.controller;

import com.nirapod.model.PostPhoto;
import com.nirapod.repository.PostPhotoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/photos")
public class PostPhotoController {
    @Autowired
    private PostPhotoRepository postPhotoRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @GetMapping("/post/{postId}")
    public List<PostPhoto> getPhotosByPost(@PathVariable Long postId) {
        return postPhotoRepository.findByPostId(postId);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadPhoto(@RequestParam("postId") Long postId,
                                         @RequestParam("userId") Long userId,
                                         @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file uploaded");
        }
        try {
            String filename = System.currentTimeMillis() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
            Path dirPath = Paths.get(uploadDir);
            if (!Files.exists(dirPath)) Files.createDirectories(dirPath);
            Path filePath = dirPath.resolve(filename);
            file.transferTo(filePath);
            PostPhoto photo = PostPhoto.builder()
                    .postId(postId)
                    .userId(userId)
                    .filePath("/uploads/" + filename)
                    .uploadedAt(LocalDateTime.now())
                    .build();
            postPhotoRepository.save(photo);
            return ResponseEntity.ok(photo);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("File upload failed");
        }
    }
}