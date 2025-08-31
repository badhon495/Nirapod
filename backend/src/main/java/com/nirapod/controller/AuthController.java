package com.nirapod.controller;

import com.nirapod.model.User;
import com.nirapod.service.AuthService;
import com.nirapod.service.OtpService;
import com.nirapod.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;

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
    @Autowired
    private CloudinaryService cloudinaryService;

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
            @RequestParam(value = "passportPhoto", required = false) MultipartFile passportPhoto,
            @RequestParam(value = "drivingLicense", required = false) String drivingLicense,
            @RequestParam(value = "drivingLicence", required = false) String drivingLicence,
            @RequestParam(value = "drivingLicenseImg", required = false) MultipartFile drivingLicenseImg,
            @RequestParam(value = "drivingLicencePhoto", required = false) MultipartFile drivingLicencePhoto,
            @RequestParam("utilityBillCustomerId") String utilityBillCustomerId,
            @RequestParam("utilityBillPhoto") MultipartFile utilityBillPhoto,
            @RequestParam("userPhoto") MultipartFile userPhoto,
            @RequestParam("nidPhoto") MultipartFile nidPhoto,
            @RequestParam(value = "privUserId", required = false) String privUserId,
            @RequestParam(value = "privUserIdPhoto", required = false) MultipartFile privUserIdPhoto,
            @RequestParam(value = "affiliation", required = false) String affiliation,
            @RequestParam(value = "identificationNumber", required = false) String identificationNumber,
            @RequestParam(value = "registrationNumber", required = false) String registrationNumber,
            @RequestParam(value = "affiliationDoc", required = false) MultipartFile affiliationDoc
    ) {
        // Validate NID length - typically 10-17 characters depending on country
        if (nid == null || nid.trim().length() < 10 || nid.trim().length() > 17) {
            return ResponseEntity.badRequest().body("NID must be between 10 and 17 characters");
        }
        
        // Validate phone number - must be 10-15 digits to accommodate international formats
        if (phoneNumber == null || !phoneNumber.matches("\\d{10,15}")) {
            return ResponseEntity.badRequest().body("Phone number must be between 10 and 15 digits");
        }
        
        // Trim NID to ensure no extra spaces
        nid = nid.trim();
        
        if (authService.findByPhoneNumber(phoneNumber).isPresent() ||
            authService.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("User already exists");
        }
        try {
            // Debug logging to see what we're receiving
            System.out.println("=== SIGNUP DEBUG INFO ===");
            System.out.println("Received categories: " + categories);
            System.out.println("Received affiliation: " + affiliation);
            System.out.println("Received identificationNumber: " + identificationNumber);
            System.out.println("Received registrationNumber: " + registrationNumber);
            System.out.println("AffiliationDoc provided: " + (affiliationDoc != null && !affiliationDoc.isEmpty()));
            
            // Only accept new format for categories
            String mappedCategory = "normal";
            if (categories != null) {
                String cat = categories.trim().toLowerCase();
                if (cat.equals("police") || cat.equals("fire") || cat.equals("animal") || cat.equals("city") || cat.equals("normal") || cat.equals("admin")) {
                    mappedCategory = cat;
                }
            }
            
            System.out.println("Final mapped category: " + mappedCategory);

            // Additional validation for privileged users
            if (!"normal".equals(mappedCategory) && affiliation != null && !affiliation.isEmpty()) {
                // For police, fire, and city corp - identification number is required
                if (("police".equals(mappedCategory) || "fire".equals(mappedCategory) || "city".equals(mappedCategory)) 
                    && (identificationNumber == null || identificationNumber.trim().isEmpty())) {
                    return ResponseEntity.badRequest().body("Identification number is required for " + affiliation);
                }
                
                // For animal shelter - registration number is required
                if ("animal".equals(mappedCategory) && (registrationNumber == null || registrationNumber.trim().isEmpty())) {
                    return ResponseEntity.badRequest().body("Registration number is required for animal shelter");
                }
                
                // Affiliation document is required for all privileged users
                if (affiliationDoc == null || affiliationDoc.isEmpty()) {
                    return ResponseEntity.badRequest().body("Affiliation document is required for privileged users");
                }
            }

            // Upload files to Cloudinary
            String passportImgUrl = null;
            String drivingLicenseImgUrl = null;
            String utilityBillPhotoUrl = null;
            String userPhotoUrl = null;
            String nidPhotoUrl = null;
            String privUserIdPhotoUrl = null;
            String affiliationDocUrl = null;
            
            try {
                // Handle passport image - support both parameter names
                MultipartFile passportImgFile = passportImg != null && !passportImg.isEmpty() ? passportImg : passportPhoto;
                passportImgUrl = passportImgFile != null && !passportImgFile.isEmpty() ? 
                    cloudinaryService.uploadImage(passportImgFile, "nirapod/user-documents") : null;
                
                // Handle driving license image - support both parameter names
                MultipartFile drivingLicenseImgFile = drivingLicenseImg != null && !drivingLicenseImg.isEmpty() ? 
                    drivingLicenseImg : drivingLicencePhoto;
                drivingLicenseImgUrl = drivingLicenseImgFile != null && !drivingLicenseImgFile.isEmpty() ? 
                    cloudinaryService.uploadImage(drivingLicenseImgFile, "nirapod/user-documents") : null;
                
                // Handle other required uploads
                utilityBillPhotoUrl = cloudinaryService.uploadImage(utilityBillPhoto, "nirapod/user-documents");
                userPhotoUrl = cloudinaryService.uploadImage(userPhoto, "nirapod/user-photos");
                nidPhotoUrl = cloudinaryService.uploadImage(nidPhoto, "nirapod/user-documents");
                
                // Handle optional uploads
                privUserIdPhotoUrl = privUserIdPhoto != null && !privUserIdPhoto.isEmpty() ? 
                    cloudinaryService.uploadImage(privUserIdPhoto, "nirapod/user-documents") : null;
                affiliationDocUrl = affiliationDoc != null && !affiliationDoc.isEmpty() ? 
                    cloudinaryService.uploadImage(affiliationDoc, "nirapod/user-documents") : null;
            } catch (IOException e) {
                System.err.println("Cloudinary upload failed: " + e.getMessage());
                return ResponseEntity.status(500).body("Failed to upload images to cloud storage: " + e.getMessage());
            }
            
            // Handle driving license string - support both parameter names
            String finalDrivingLicense = drivingLicense != null && !drivingLicense.isEmpty() ? drivingLicense : drivingLicence;
                
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
                    .passportImg(passportImgUrl)
                    .drivingLicense(finalDrivingLicense)
                    .drivingLicenseImg(drivingLicenseImgUrl)
                    .utilityBillCustomerId(utilityBillCustomerId)
                    .utilityBillPhoto(utilityBillPhotoUrl)
                    .userPhoto(userPhotoUrl)
                    .nidPhoto(nidPhotoUrl)
                    .privUserId(privUserId)
                    .privUserIdPhoto(privUserIdPhotoUrl)
                    .affiliation(affiliation)
                    .identificationNumber(identificationNumber)
                    .registrationNumber(registrationNumber)
                    .affiliationDoc(affiliationDocUrl)
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
        } catch (Exception e) {
            System.err.println("Signup error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Signup failed: " + e.getMessage());
        }
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
