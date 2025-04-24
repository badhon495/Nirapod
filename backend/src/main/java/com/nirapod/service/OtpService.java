package com.nirapod.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class OtpService {
    private final Map<String, String> otpStorage = new HashMap<>();
    private final Random random = new Random();

    public String generateOtp(String key) {
        String otp = String.format("%06d", random.nextInt(999999));
        otpStorage.put(key, otp);
        return otp;
    }

    public boolean validateOtp(String key, String otp) {
        String validOtp = otpStorage.get(key);
        return validOtp != null && validOtp.equals(otp);
    }

    public void clearOtp(String key) {
        otpStorage.remove(key);
    }
}
