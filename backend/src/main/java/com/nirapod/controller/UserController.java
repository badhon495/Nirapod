package com.nirapod.controller;

import com.nirapod.model.User;
import com.nirapod.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

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

    @GetMapping("/search")
    public ResponseEntity<?> searchUser(
            @RequestParam(required = false) String nid,
            @RequestParam(required = false) String drivingLicence,
            @RequestParam(required = false) String passport) {
        Optional<User> userOpt = Optional.empty();
        if (nid != null && !nid.isEmpty()) {
            userOpt = userRepository.findByNid(nid);
        } else if (drivingLicence != null && !drivingLicence.isEmpty()) {
            userOpt = userRepository.findByDrivingLicense(drivingLicence);
        } else if (passport != null && !passport.isEmpty()) {
            userOpt = userRepository.findByPassport(passport);
        }
        if (userOpt.isPresent()) {
            User u = userOpt.get();
            Map<String, Object> result = new HashMap<>();
            result.put("name", u.getName());
            result.put("nid", u.getNid());
            result.put("passport", u.getPassport());
            result.put("drivingLicence", u.getDrivingLicense());
            result.put("presentAddress", u.getPresentAddress());
            result.put("permanentAddress", u.getPermanentAddress());
            result.put("email", u.getEmail());
            result.put("phone", u.getPhone());
            result.put("utilityBillId", u.getUtilityBillCustomerID());
            result.put("utilityBillPhoto", u.getUtilityBillPhoto());
            result.put("userPhoto", u.getUserPhoto());
            result.put("nidPhoto", u.getNidPhoto());
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @GetMapping("/{nid}")
    public ResponseEntity<?> getUserByNid(@PathVariable String nid) {
        Optional<User> userOpt = userRepository.findByNid(nid);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body("User not found");
        return ResponseEntity.ok(userOpt.get());
    }

    @PutMapping("/{nid}/profile")
    public ResponseEntity<?> updateProfile(
            @PathVariable String nid,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String presentAddress,
            @RequestParam(required = false) String permanentAddress,
            @RequestParam(required = false) String utilityBillCustomerId,
            @RequestParam(required = false) String passport,
            @RequestParam(required = false) String drivingLicense,
            @RequestParam(required = false) MultipartFile photo,
            @RequestParam(required = false) MultipartFile utilityBillPhoto,
            @RequestParam(required = false) MultipartFile passportImg,
            @RequestParam(required = false) MultipartFile drivingLicenseImg
    ) throws IOException {
        Optional<User> userOpt = userRepository.findByNid(nid);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body("User not found");
        User user = userOpt.get();
        if (name != null) user.setName(name);
        if (email != null) user.setEmail(email);
        if (phone != null) user.setPhone(phone);
        if (presentAddress != null) user.setPresentAddress(presentAddress);
        if (permanentAddress != null) user.setPermanentAddress(permanentAddress);
        if (utilityBillCustomerId != null) user.setUtilityBillCustomerId(utilityBillCustomerId);
        if (passport != null) user.setPassport(passport);
        if (drivingLicense != null) user.setDrivingLicense(drivingLicense);
        // Save files if present
        Path dirPath = Paths.get(uploadDir);
        if (!Files.exists(dirPath)) Files.createDirectories(dirPath);
        if (photo != null && !photo.isEmpty()) {
            String filename = System.currentTimeMillis() + "_photo_" + photo.getOriginalFilename();
            Path filePath = dirPath.resolve(filename);
            photo.transferTo(filePath);
            user.setUserPhoto("/uploads/" + filename);
        }
        if (utilityBillPhoto != null && !utilityBillPhoto.isEmpty()) {
            String filename = System.currentTimeMillis() + "_utilitybill_" + utilityBillPhoto.getOriginalFilename();
            Path filePath = dirPath.resolve(filename);
            utilityBillPhoto.transferTo(filePath);
            user.setUtilityBillPhoto("/uploads/" + filename);
        }
        if (passportImg != null && !passportImg.isEmpty()) {
            String filename = System.currentTimeMillis() + "_passport_" + passportImg.getOriginalFilename();
            Path filePath = dirPath.resolve(filename);
            passportImg.transferTo(filePath);
            user.setPassportImg("/uploads/" + filename);
        }
        if (drivingLicenseImg != null && !drivingLicenseImg.isEmpty()) {
            String filename = System.currentTimeMillis() + "_dl_" + drivingLicenseImg.getOriginalFilename();
            Path filePath = dirPath.resolve(filename);
            drivingLicenseImg.transferTo(filePath);
            user.setDrivingLicenseImg("/uploads/" + filename);
        }
        userRepository.save(user);
        return ResponseEntity.ok("Profile updated successfully");
    }

    @PostMapping("/{nid}/change-password")
    public ResponseEntity<?> changePassword(
            @PathVariable String nid,
            @RequestBody Map<String, String> pwForm
    ) {
        Optional<User> userOpt = userRepository.findByNid(nid);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body("User not found");
        User user = userOpt.get();
        String oldPassword = pwForm.get("oldPassword");
        String newPassword = pwForm.get("newPassword");
        if (oldPassword == null || newPassword == null) return ResponseEntity.badRequest().body("Missing password fields");
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        if (!encoder.matches(oldPassword, user.getPassword())) return ResponseEntity.status(403).body("Old password incorrect");
        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok("Password changed successfully");
    }
}
