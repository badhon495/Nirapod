package com.nirapod.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/follows")
public class FollowController {
    @GetMapping("/user/{userId}")
    public List<Object> getFollowsByUser(@PathVariable String userId) {
        return Collections.emptyList();
    }
}
