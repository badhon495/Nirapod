package com.nirapod.controller;

import com.nirapod.model.User;
import com.nirapod.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/by-identifier")
    public ResponseEntity<?> getUserByIdentifier(@RequestParam("value") String value) {
        Optional<User> userOpt = userRepository.findByNid(value);
        if (!userOpt.isPresent()) {
            userOpt = userRepository.findByPhone(value);
        }
        if (!userOpt.isPresent()) {
            userOpt = userRepository.findByEmail(value);
        }
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        User user = userOpt.get();
        Map<String, String> result = new HashMap<>();
        result.put("nid", user.getNid());
        result.put("phone", user.getPhone());
        result.put("email", user.getEmail());
        result.put("name", user.getName());
        return ResponseEntity.ok(result);
    }
}
