package com.nirapod.controller;

import com.nirapod.model.User;
import com.nirapod.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

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

    @PostMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> payload) {
        String identifier = payload.get("identifier");
        Optional<User> userOpt = userRepository.findByNidOrPhone(identifier, identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(identifier);
        }
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        User user = userOpt.get();
        if (payload.containsKey("email") && payload.get("email") != null && !payload.get("email").isBlank()) {
            user.setEmail(payload.get("email"));
        }
        if (payload.containsKey("presentAddress") && payload.get("presentAddress") != null && !payload.get("presentAddress").isBlank()) {
            user.setPresentAddress(payload.get("presentAddress"));
        }
        if (payload.containsKey("permanentAddress") && payload.get("permanentAddress") != null && !payload.get("permanentAddress").isBlank()) {
            user.setPermanentAddress(payload.get("permanentAddress"));
        }
        if (payload.containsKey("utilityBillCustomerId") && payload.get("utilityBillCustomerId") != null && !payload.get("utilityBillCustomerId").isBlank()) {
            user.setUtilityBillCustomerId(payload.get("utilityBillCustomerId"));
        }
        if (payload.containsKey("newPassword") && payload.get("newPassword") != null && !payload.get("newPassword").isBlank()) {
            user.setPassword(passwordEncoder.encode(payload.get("newPassword"))); // Encrypt the new password
        }
        userRepository.save(user);
        return ResponseEntity.ok("Profile updated successfully");
    }
}
