package com.nirapod.controller;

import com.nirapod.model.User;
import com.nirapod.repository.UserRepository;
import com.nirapod.repository.NotificationRepository;
import com.nirapod.model.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/department/{affiliation}")
    public List<User> getUsersByAffiliation(@PathVariable String affiliation) {
        return userRepository.findAll().stream()
                .filter(u -> affiliation.equalsIgnoreCase(u.getAffiliation()))
                .toList();
    }

    @GetMapping("/search")
    public List<User> searchUsers(@RequestParam(required = false) String nid,
                                 @RequestParam(required = false) String drivingLicence,
                                 @RequestParam(required = false) String passport) {
        return userRepository.findAll().stream()
                .filter(u -> (nid == null || (u.getNid() != null && u.getNid().equalsIgnoreCase(nid)))
                        && (drivingLicence == null || (u.getDrivingLicence() != null && u.getDrivingLicence().equalsIgnoreCase(drivingLicence)))
                        && (passport == null || (u.getPassport() != null && u.getPassport().equalsIgnoreCase(passport))))
                .toList();
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User updated) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setName(updated.getName());
                    user.setEmail(updated.getEmail());
                    user.setPhoneNumber(updated.getPhoneNumber());
                    user.setPresentAddress(updated.getPresentAddress());
                    user.setPermanentAddress(updated.getPermanentAddress());
                    userRepository.save(user);
                    return ResponseEntity.ok(user);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<User> approveUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setStatus("APPROVED");
                    userRepository.save(user);
                    Notification notification = Notification.builder()
                            .userId(user.getId())
                            .message("Your account has been approved.")
                            .read(false)
                            .createdAt(java.time.LocalDateTime.now())
                            .build();
                    notificationRepository.save(notification);
                    return ResponseEntity.ok(user);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<User> rejectUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setStatus("REJECTED");
                    userRepository.save(user);
                    Notification notification = Notification.builder()
                            .userId(user.getId())
                            .message("Your account has been rejected.")
                            .read(false)
                            .createdAt(java.time.LocalDateTime.now())
                            .build();
                    notificationRepository.save(notification);
                    return ResponseEntity.ok(user);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}