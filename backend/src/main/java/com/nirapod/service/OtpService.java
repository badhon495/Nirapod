package com.nirapod.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class OtpService {
    private final Map<String, String> otpStorage = new HashMap<>();
    private final Random random = new Random();

    private String normalizeKey(String key) {
        if (key == null) return null;
        if (key.equalsIgnoreCase("admin") || key.equalsIgnoreCase("admin@gmail.com")) {
            return "admin";
        }
        return key;
    }

    public String generateOtp(String key) {
        key = normalizeKey(key);
        String otp = String.format("%06d", random.nextInt(999999));
        otpStorage.put(key, otp);
        return otp;
    }

    public boolean validateOtp(String key, String otp) {
        key = normalizeKey(key);
        String validOtp = otpStorage.get(key);
        return validOtp != null && validOtp.equals(otp);
    }

    public void clearOtp(String key) {
        key = normalizeKey(key);
        otpStorage.remove(key);
    }
}
