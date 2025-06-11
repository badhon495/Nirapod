package com.nirapod.service;

import com.nirapod.model.User;
import com.nirapod.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public Optional<User> findByPhoneNumber(String phone) {
        // Hardcoded admin login
        if (phone != null && (phone.equals("admin@gmail.com") || phone.equals("admin"))) {
            User admin = User.builder()
                .nid("admin")
                .categories("admin")
                .email("admin@gmail.com")
                .password(passwordEncoder.encode("admin123"))
                .name("Admin")
                .phone("admin")
                .presentAddress("N/A")
                .permanentAddress("N/A")
                .build();
            return Optional.of(admin);
        }
        return userRepository.findByPhone(phone);
    }

    public Optional<User> findByEmail(String email) {
        // Hardcoded admin login
        if (email != null && email.equals("admin@gmail.com")) {
            User admin = User.builder()
                .nid("admin")
                .categories("admin")
                .email("admin@gmail.com")
                .password(passwordEncoder.encode("admin123"))
                .name("Admin")
                .phone("admin")
                .presentAddress("N/A")
                .permanentAddress("N/A")
                .build();
            return Optional.of(admin);
        }
        return userRepository.findByEmail(email);
    }

    public User registerUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public boolean checkPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    public void updateUserPassword(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
    }
}
