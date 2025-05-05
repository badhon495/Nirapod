package com.nirapod.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import com.nirapod.repository.ComplaintRepository;
import com.nirapod.model.Complaint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/follows")
public class FollowController {
    @Autowired
    private ComplaintRepository complaintRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Integer>> getFollowsByUser(@PathVariable String userId) {
        List<Integer> followedIds = new ArrayList<>();
        List<Complaint> complaints = complaintRepository.findAll();
        
        for (Complaint complaint : complaints) {
            if (complaint.getFollow() != null && !complaint.getFollow().isEmpty()) {
                List<String> followers = Arrays.asList(complaint.getFollow().split(","));
                if (followers.contains(userId.trim())) {
                    followedIds.add(complaint.getTrackingId());
                }
            }
        }
        return ResponseEntity.ok(followedIds);
    }

    @PostMapping("/follow")
    public ResponseEntity<?> follow(@RequestParam Integer postId, @RequestParam String userId) {
        Optional<Complaint> complaintOpt = complaintRepository.findById(postId);
        if (complaintOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Complaint not found"));
        }

        Complaint complaint = complaintOpt.get();
        Set<String> followers = new HashSet<>();
        
        if (complaint.getFollow() != null && !complaint.getFollow().isEmpty()) {
            followers.addAll(Arrays.asList(complaint.getFollow().split(",")));
        }

        followers.add(userId.trim());
        complaint.setFollow(String.join(",", followers));
        complaintRepository.save(complaint);
        
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/unfollow")
    public ResponseEntity<?> unfollow(@RequestParam Integer postId, @RequestParam String userId) {
        Optional<Complaint> complaintOpt = complaintRepository.findById(postId);
        if (complaintOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Complaint not found"));
        }

        Complaint complaint = complaintOpt.get();
        if (complaint.getFollow() == null || complaint.getFollow().isEmpty()) {
            return ResponseEntity.ok(Map.of("success", true));
        }

        Set<String> followers = new HashSet<>(Arrays.asList(complaint.getFollow().split(",")));
        followers.remove(userId.trim());
        complaint.setFollow(String.join(",", followers));
        complaintRepository.save(complaint);
        
        return ResponseEntity.ok(Map.of("success", true));
    }
}
