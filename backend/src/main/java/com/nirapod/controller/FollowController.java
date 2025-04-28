package com.nirapod.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import com.nirapod.repository.ComplaintRepository;
import com.nirapod.model.Complaint;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/follows")
public class FollowController {
    @Autowired
    private ComplaintRepository complaintRepository;

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
    public Map<String, Object> follow(@RequestParam Long postId, @RequestParam String userId) {
        Optional<Complaint> complaintOpt = complaintRepository.findById(postId.intValue());
        if (complaintOpt.isEmpty()) {
            return Map.of("success", false, "error", "Complaint not found");
        }
        Complaint complaint = complaintOpt.get();
        String follow = complaint.getFollow();
        Set<String> nids = new HashSet<>();
        if (follow != null && !follow.isBlank()) {
            nids.addAll(Arrays.asList(follow.split(",")));
        }
        if (!nids.contains(userId)) {
            nids.add(userId);
            complaint.setFollow(String.join(",", nids));
            complaintRepository.save(complaint);
        }
        return Map.of("success", true);
    }

    @PostMapping("/unfollow")
    public Map<String, Object> unfollow(@RequestParam Long postId, @RequestParam String userId) {
        Optional<Complaint> complaintOpt = complaintRepository.findById(postId.intValue());
        if (complaintOpt.isEmpty()) {
            return Map.of("success", false, "error", "Complaint not found");
        }
        Complaint complaint = complaintOpt.get();
        String follow = complaint.getFollow();
        Set<String> nids = new HashSet<>();
        if (follow != null && !follow.isBlank()) {
            nids.addAll(Arrays.asList(follow.split(",")));
        }
        if (nids.contains(userId)) {
            nids.remove(userId);
            complaint.setFollow(String.join(",", nids));
            complaintRepository.save(complaint);
        }
        return Map.of("success", true);
    }
}
