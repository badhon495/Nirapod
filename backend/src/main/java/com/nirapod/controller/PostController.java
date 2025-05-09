package com.nirapod.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/posts")
public class PostController {
    @GetMapping
    public List<Object> getAllPosts() {
        return Collections.emptyList();
    }
}
