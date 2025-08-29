package com.nirapod.controller;

import com.nirapod.model.CreateComplain;
import com.nirapod.repository.CreateComplainRepository;
import com.nirapod.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/complain")
public class CreateComplainController {
    @Autowired
    private CreateComplainRepository createComplainRepository;
    
    @Autowired
    private CloudinaryService cloudinaryService;

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
    ) {
        try {
            List<String> photoUrls = new ArrayList<>();
            if (photos != null) {
                for (MultipartFile file : photos) {
                    if (!file.isEmpty()) {
                        try {
                            String photoUrl = cloudinaryService.uploadImage(file, "nirapod/complaint-photos");
                            photoUrls.add(photoUrl);
                        } catch (IOException e) {
                            System.err.println("Failed to upload image: " + e.getMessage());
                            // Continue with other photos, don't fail the entire submission
                        }
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
                    .photos(String.join(",", photoUrls))
                    .postOnTimeline("1".equals(postOnTimeline))
                    .location(location)
                    .status(0)
                    .follow(nid)
                    .comment("")
                    .build();
            CreateComplain saved = createComplainRepository.save(complain);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.err.println("Error submitting complaint: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to submit complaint: " + e.getMessage());
        }
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
