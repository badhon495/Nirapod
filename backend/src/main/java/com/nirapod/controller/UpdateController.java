package com.nirapod.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/updates")
public class UpdateController {
    @GetMapping("/post/{postId}")
    public List<Map<String, Object>> getUpdatesByPost(@PathVariable Long postId) {
        List<Map<String, Object>> updates = new ArrayList<>();
        Map<String, Object> update = new HashMap<>();
        update.put("id", 1L);
        update.put("postId", postId);
        update.put("userId", 1L);
        update.put("updateText", "Sample update");
        updates.add(update);
        return updates;
    }

    @PostMapping
    public Map<String, Object> addUpdate(@RequestBody Map<String, Object> payload) {
        return Map.of("success", true);
    }
}
