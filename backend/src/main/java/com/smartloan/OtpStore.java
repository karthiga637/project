package com.smartloan;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

public class OtpStore {
    // Maps email -> OTP code
    private static final Map<String, String> otpMap = new ConcurrentHashMap<>();

    public static void saveOtp(String email, String otp) {
        otpMap.put(email.toLowerCase(), otp);
    }

    public static boolean verifyOtp(String email, String otp) {
        String storedOtp = otpMap.get(email.toLowerCase());
        if (storedOtp != null && storedOtp.equals(otp)) {
            // Remove after successful verification to prevent reuse
            otpMap.remove(email.toLowerCase());
            return true;
        }
        return false;
    }
}
