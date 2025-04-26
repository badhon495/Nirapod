package com.nirapod.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    @PostMapping
    public Map<String, Object> submitReport(@RequestBody Map<String, Object> payload) {
        // Dummy report submission
        return Map.of("success", true);
    }
}
