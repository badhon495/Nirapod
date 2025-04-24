package com.nirapod.controller;

import com.nirapod.dto.ComplainRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/complain")
public class ComplainController {
    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @PostMapping
    public ResponseEntity<?> submitComplain(@Valid @RequestBody ComplainRequest request) {
        System.out.println("[ComplainController] Received complaint: " + request);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo("badhon495@gmail.com");
        message.setSubject("New Complaint Received");
        message.setText(
                "Name: " + request.getName() + "\n" +
                "Phone: " + request.getPhone() + "\n" +
                "Email: " + request.getEmail() + "\n" +
                "Details: " + request.getDetails()
        );
        try {
            return ResponseEntity.ok().body("Complaint submitted successfully");
        } catch (Exception ex) {
            System.out.println("[ComplainController] Failed to send email: " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(500).body("Failed to send complaint email. Please try again later.");
        }
    }
}
