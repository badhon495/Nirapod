package com.nirapod.controller;

import com.nirapod.model.User;
import com.nirapod.service.AuthService;
import com.nirapod.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;
    @Autowired
    private OtpService otpService;
    @Autowired
    private JavaMailSender mailSender;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(
            @RequestParam("name") String name,
            @RequestParam("phoneNumber") String phoneNumber,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("userType") String userType,
            @RequestParam("nid") String nid,
            @RequestParam("presentAddress") String presentAddress,
            @RequestParam("permanentAddress") String permanentAddress,
            @RequestParam(value = "drivingLicence", required = false) String drivingLicence,
            @RequestParam(value = "passport", required = false) String passport,
            @RequestParam(value = "affiliation", required = false) String affiliation,
            @RequestParam(value = "identificationNumber", required = false) String identificationNumber,
            @RequestParam(value = "registrationNumber", required = false) String registrationNumber,
            @RequestParam("nidFile") MultipartFile nidFile,
            @RequestParam(value = "drivingLicenceFile", required = false) MultipartFile drivingLicenceFile,
            @RequestParam(value = "passportFile", required = false) MultipartFile passportFile,
            @RequestParam("utilityBillFile") MultipartFile utilityBillFile,
            @RequestParam("photoFile") MultipartFile photoFile,
            @RequestParam(value = "affiliationDocFile", required = false) MultipartFile affiliationDocFile
    ) {
        // Check if user exists
        if (authService.findByPhoneNumber(phoneNumber).isPresent() ||
            authService.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("User already exists");
        }
        // Save files
        try {
            Path dirPath = Paths.get(uploadDir);
            if (!Files.exists(dirPath)) Files.createDirectories(dirPath);
            String nidFilePath = saveFile(nidFile, dirPath);
            String drivingLicenceFilePath = drivingLicenceFile != null && !drivingLicenceFile.isEmpty() ? saveFile(drivingLicenceFile, dirPath) : null;
            String passportFilePath = passportFile != null && !passportFile.isEmpty() ? saveFile(passportFile, dirPath) : null;
            String utilityBillFilePath = saveFile(utilityBillFile, dirPath);
            String photoPath = saveFile(photoFile, dirPath);
            String affiliationDocPath = affiliationDocFile != null && !affiliationDocFile.isEmpty() ? saveFile(affiliationDocFile, dirPath) : null;
            // Build user
            User user = User.builder()
                    .name(name)
                    .phoneNumber(phoneNumber)
                    .email(email)
                    .password(password)
                    .userType(userType)
                    .nid(nid)
                    .presentAddress(presentAddress)
                    .permanentAddress(permanentAddress)
                    .drivingLicence(drivingLicence)
                    .passport(passport)
                    .affiliation(affiliation)
                    .identificationNumber(identificationNumber)
                    .registrationNumber(registrationNumber)
                    .status("PENDING")
                    .nidFilePath("/uploads/" + nidFilePath)
                    .drivingLicenceFilePath(drivingLicenceFilePath != null ? "/uploads/" + drivingLicenceFilePath : null)
                    .passportFilePath(passportFilePath != null ? "/uploads/" + passportFilePath : null)
                    .utilityBillFilePath("/uploads/" + utilityBillFilePath)
                    .photoPath("/uploads/" + photoPath)
                    .affiliationDocPath(affiliationDocPath != null ? "/uploads/" + affiliationDocPath : null)
                    .build();
            User saved = authService.registerUser(user);
            // Send signup completion email (not OTP)
            if (email != null && !email.isEmpty()) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject("Nirapod Signup Completed");
                message.setText("Your signup has been completed. Login to enjoy your service.");
                mailSender.send(message);
            }
            return ResponseEntity.ok(Map.of("message", "Signup completed", "userId", saved.getId()));
        } catch (IOException e) {
            return ResponseEntity.status(500).body("File upload failed: " + e.getMessage());
        }
    }

    private String saveFile(MultipartFile file, Path dirPath) throws IOException {
        String filename = System.currentTimeMillis() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
        Path filePath = dirPath.resolve(filename);
        file.transferTo(filePath);
        return filename;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String phone = payload.get("phoneNumber");
        String otp = otpService.generateOtp(phone != null ? phone : email);
        if (email != null && !email.isEmpty()) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Your Nirapod OTP Code");
            message.setText("Your OTP code is: " + otp);
            mailSender.send(message);
            return ResponseEntity.ok(Map.of("message", "OTP sent to email"));
        }
        return ResponseEntity.badRequest().body("Email is required for OTP");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String identifier = payload.get("phoneNumber"); // can be phone or email
        String password = payload.get("password");
        Optional<User> userOpt = authService.findByPhoneNumber(identifier);
        if (userOpt.isEmpty()) {
            userOpt = authService.findByEmail(identifier);
        }
        if (userOpt.isEmpty() || !authService.checkPassword(userOpt.get(), password)) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
        User user = userOpt.get();
        String otp = otpService.generateOtp(identifier); // Use the exact identifier provided by user
        // Send OTP to email if available
        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Your Nirapod OTP Code");
            message.setText("Your OTP code is: " + otp);
            mailSender.send(message);
            return ResponseEntity.ok(Map.of("message", "OTP sent to email"));
        }
        return ResponseEntity.ok(Map.of("message", "OTP sent"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String identifier = payload.get("identifier");
        String otp = payload.get("otp");
        if (otpService.validateOtp(identifier, otp)) {
            otpService.clearOtp(identifier);
            return ResponseEntity.ok(Map.of("message", "OTP verified"));
        }
        return ResponseEntity.status(401).body("Invalid OTP");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        Optional<User> userOpt = authService.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }
        User user = userOpt.get();
        try {
            // Generate new password
            String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
            StringBuilder pwd = new StringBuilder();
            for (int i = 0; i < 10; i++) {
                pwd.append(chars.charAt((int) (Math.random() * chars.length())));
            }
            String newPassword = pwd.toString();
            user.setPassword(newPassword);
            authService.updateUserPassword(user);
            // Send new password to email
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Nirapod Password Reset");
            message.setText("Your new password is: " + newPassword);
            mailSender.send(message);
            return ResponseEntity.ok(Map.of("message", "A new password has been sent to your email."));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + ex.getMessage());
        }
    }
}
