package com.nirapod.service;

import com.nirapod.dto.user.ChangePasswordRequest;
import com.nirapod.dto.user.UpdateProfileRequest;
import com.nirapod.dto.user.UserProfileResponse;
import com.nirapod.exception.ApiException;
import com.nirapod.model.User;
import com.nirapod.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));
        return UserProfileResponse.from(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest req, String ipAddress) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        if (!user.getPhone().equals(req.phone())
                && userRepository.existsByPhone(req.phone())) {
            throw ApiException.conflict("Phone number already in use");
        }

        user.setName(req.name());
        user.setPhone(req.phone());
        user.setPresentAddress(req.presentAddress());
        user.setPermanentAddress(req.permanentAddress());

        auditService.log(userId, "PROFILE_UPDATED", "USER", userId, ipAddress, null, null);
        return UserProfileResponse.from(userRepository.save(user));
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest req, String ipAddress) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        if (user.getPasswordHash() == null) {
            throw ApiException.badRequest("OAuth-only accounts cannot use password change");
        }

        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        auditService.log(userId, "PASSWORD_CHANGED", "USER", userId, ipAddress, null, null);
    }
}
