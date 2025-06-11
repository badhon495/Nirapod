package com.nirapod.controller;

import com.nirapod.model.CreateComplain;
import com.nirapod.repository.CreateComplainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/complain")
public class CreateComplainController {
    @Autowired
    private CreateComplainRepository createComplainRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @PostMapping
    public ResponseEntity<?> submitComplain(
            @RequestParam("nid") String nid,
            @RequestParam("urgency") String urgency,
            @RequestParam("complainTo") String complainTo,
            @RequestParam("district") String district,
            @RequestParam("area") String area,
            @RequestParam("tag") String tags,
            @RequestParam("details") String details,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos,
            @RequestParam("postOnTimeline") String postOnTimeline,
            @RequestParam("location") String location
    ) throws IOException {
        List<String> photoPaths = new ArrayList<>();
        if (photos != null) {
            Path dirPath = Paths.get(uploadDir);
            if (!Files.exists(dirPath)) Files.createDirectories(dirPath);
            for (MultipartFile file : photos) {
                if (!file.isEmpty()) {
                    String filename = System.currentTimeMillis() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
                    Path filePath = dirPath.resolve(filename);
                    file.transferTo(filePath);
                    photoPaths.add("/uploads/" + filename);
                }
            }
        }
        CreateComplain complain = CreateComplain.builder()
                .nid(nid)
                .urgency(urgency)
                .complainTo(complainTo)
                .district(district)
                .area(area)
                .tags(tags)
                .details(details)
                .photos(String.join(",", photoPaths))
                .postOnTimeline("1".equals(postOnTimeline))
                .location(location)
                .status(0)
                .follow(nid)
                .comment("")
                .build();
        CreateComplain saved = createComplainRepository.save(complain);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{trackingId}")
    public ResponseEntity<?> getComplainByTrackingId(@PathVariable Long trackingId, @RequestParam("nid") String userNid) {
        return createComplainRepository.findById(trackingId)
                .filter(complain -> complain.getNid().trim().equals(userNid.trim()))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body(CreateComplain.builder()
                        .details("Complain not found for this Tracking ID.")
                        .build()));
    }
}
