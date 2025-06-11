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

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
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

    @Value("${google.client.id}")
    private String googleClientId;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(
            @RequestParam("name") String name,
            @RequestParam("phoneNumber") String phoneNumber,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("categories") String categories,
            @RequestParam("nid") String nid,
            @RequestParam("presentAddress") String presentAddress,
            @RequestParam("permanentAddress") String permanentAddress,
            @RequestParam(value = "passport", required = false) String passport,
            @RequestParam(value = "passportImg", required = false) MultipartFile passportImg,
            @RequestParam(value = "drivingLicense", required = false) String drivingLicense,
            @RequestParam(value = "drivingLicenseImg", required = false) MultipartFile drivingLicenseImg,
            @RequestParam("utilityBillCustomerId") String utilityBillCustomerId,
            @RequestParam("utilityBillPhoto") MultipartFile utilityBillPhoto,
            @RequestParam("userPhoto") MultipartFile userPhoto,
            @RequestParam("nidPhoto") MultipartFile nidPhoto,
            @RequestParam(value = "privUserId", required = false) String privUserId,
            @RequestParam(value = "privUserIdPhoto", required = false) MultipartFile privUserIdPhoto
    ) {
        if (authService.findByPhoneNumber(phoneNumber).isPresent() ||
            authService.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("User already exists");
        }
        try {
            // Only accept new format for categories
            String mappedCategory = "normal";
            if (categories != null) {
                String cat = categories.trim().toLowerCase();
                if (cat.equals("police") || cat.equals("fire") || cat.equals("animal") || cat.equals("city") || cat.equals("normal") || cat.equals("admin")) {
                    mappedCategory = cat;
                }
            }

            Path dirPath = Paths.get(uploadDir);
            if (!Files.exists(dirPath)) Files.createDirectories(dirPath);
            String passportImgPath = passportImg != null && !passportImg.isEmpty() ? saveFile(passportImg, dirPath) : null;
            String drivingLicenseImgPath = drivingLicenseImg != null && !drivingLicenseImg.isEmpty() ? saveFile(drivingLicenseImg, dirPath) : null;
            String utilityBillPhotoPath = saveFile(utilityBillPhoto, dirPath);
            String userPhotoPath = saveFile(userPhoto, dirPath);
            String nidPhotoPath = saveFile(nidPhoto, dirPath);
            String privUserIdPhotoPath = privUserIdPhoto != null && !privUserIdPhoto.isEmpty() ? saveFile(privUserIdPhoto, dirPath) : null;
            User user = User.builder()
                    .nid(nid)
                    .categories(mappedCategory)
                    .email(email)
                    .password(password)
                    .name(name)
                    .phone(phoneNumber)
                    .presentAddress(presentAddress)
                    .permanentAddress(permanentAddress)
                    .passport(passport)
                    .passportImg(passportImgPath != null ? "/uploads/" + passportImgPath : null)
                    .drivingLicense(drivingLicense)
                    .drivingLicenseImg(drivingLicenseImgPath != null ? "/uploads/" + drivingLicenseImgPath : null)
                    .utilityBillCustomerId(utilityBillCustomerId)
                    .utilityBillPhoto("/uploads/" + utilityBillPhotoPath)
                    .userPhoto("/uploads/" + userPhotoPath)
                    .nidPhoto("/uploads/" + nidPhotoPath)
                    .privUserId(privUserId)
                    .privUserIdPhoto(privUserIdPhotoPath != null ? "/uploads/" + privUserIdPhotoPath : null)
                    .build();
            User saved = authService.registerUser(user);
            if (email != null && !email.isEmpty()) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject("Nirapod Signup Completed");
                message.setText("Your signup has been completed. Login to enjoy your service.");
                mailSender.send(message);
            }
            return ResponseEntity.ok(Map.of("message", "Signup completed", "userId", saved.getNid()));
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
        // If admin, skip OTP and log in directly
        if (user.getEmail().equalsIgnoreCase("admin@gmail.com") && user.getCategories().equalsIgnoreCase("admin")) {
            return ResponseEntity.ok(Map.of(
                "message", "Admin login successful",
                "categories", user.getCategories(),
                "admin", true
            ));
        }
        String otp = otpService.generateOtp(identifier); // Use the exact identifier provided by user
        // Send OTP to email if available
        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Your Nirapod OTP Code");
            message.setText("Your OTP code is: " + otp);
            mailSender.send(message);
            return ResponseEntity.ok(Map.of(
                "message", "OTP sent to email",
                "categories", user.getCategories()
            ));
        }
        return ResponseEntity.ok(Map.of(
            "message", "OTP sent",
            "categories", user.getCategories()
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String identifier = payload.get("identifier");
        // If admin, skip OTP verification and always succeed
        if ("admin".equalsIgnoreCase(identifier) || "admin@gmail.com".equalsIgnoreCase(identifier)) {
            return ResponseEntity.ok(Map.of("message", "OTP verified (admin bypass)"));
        }
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

    @PostMapping("/google-signup")
    public ResponseEntity<?> googleSignup(@RequestBody Map<String, String> payload) {
        String idTokenString = payload.get("idToken");
        if (idTokenString == null) {
            return ResponseEntity.badRequest().body("Missing Google ID token");
        }
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JacksonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                GoogleIdToken.Payload googlePayload = idToken.getPayload();
                String email = googlePayload.getEmail();
                String name = (String) googlePayload.get("name");
                // Only check if user exists, do not create user here
                if (authService.findByEmail(email).isPresent()) {
                    return ResponseEntity.badRequest().body("User already exists");
                }
                // Return name and email to frontend for pre-filling
                return ResponseEntity.ok(Map.of(
                        "message", "Google token valid",
                        "user", Map.of("name", name, "email", email)
                ));
            } else {
                return ResponseEntity.status(401).body("Invalid Google ID token");
            }
        } catch (GeneralSecurityException | IOException e) {
            return ResponseEntity.status(500).body("Google token verification failed: " + e.getMessage());
        }
    }

    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> payload) {
        String idTokenString = payload.get("idToken");
        if (idTokenString == null) {
            return ResponseEntity.badRequest().body("Missing Google ID token");
        }
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JacksonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                GoogleIdToken.Payload googlePayload = idToken.getPayload();
                String email = googlePayload.getEmail();
                Optional<User> userOpt = authService.findByEmail(email);
                if (userOpt.isPresent()) {
                    return ResponseEntity.ok(Map.of(
                            "message", "Google login successful",
                            "user", userOpt.get()
                    ));
                } else {
                    return ResponseEntity.status(404).body("User not found");
                }
            } else {
                return ResponseEntity.status(401).body("Invalid Google ID token");
            }
        } catch (GeneralSecurityException | IOException e) {
            return ResponseEntity.status(500).body("Google token verification failed: " + e.getMessage());
        }
    }
}
