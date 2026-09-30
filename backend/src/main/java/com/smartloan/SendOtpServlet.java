package com.smartloan;

import java.io.*;
import java.util.Random;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/send-otp")
public class SendOtpServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        setCORS(response);

        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = request.getReader()) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }

        try {

            // Extract email and optional type
            String email = "";
            String type = "register";
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.Map<String, Object> data = mapper.readValue(sb.toString(), java.util.Map.class);
                email = (String) data.get("email");
                if (data.containsKey("type")) {
                    type = (String) data.get("type");
                }
            } catch(Exception e) {
                // Fallback for string split if jackson fails
                email = sb.toString().split("\"email\":\"")[1].split("\"")[0];
                if (sb.toString().contains("\"type\":\"")) {
                    type = sb.toString().split("\"type\":\"")[1].split("\"")[0];
                }
            }

            CustomerDAO dao = new CustomerDAO();
            boolean exists = dao.getCustomerByEmail(email) != null;
            
            if ("register".equals(type)) {
                if (!exists) {
                    response.setStatus(403);
                    response.getWriter().write("{\"status\":\"failed\",\"message\":\"You are not registered by a Bank Manager. Please contact your nearest branch to create an account.\"}");
                    return;
                }
            } else if ("forgot".equals(type) && !exists) {
                response.setStatus(404);
                response.getWriter().write("{\"status\":\"failed\",\"message\":\"Email not found\"}");
                return;
            }

            
            // Generate a 4-digit OTP
            String otpCode = String.format("%04d", new Random().nextInt(10000));
            
            // Save it in memory
            OtpStore.saveOtp(email, otpCode);
            
            // Send the email
            boolean sent = EmailService.sendOTP(email, otpCode);
            
            if (sent) {
                response.getWriter().write("{\"status\":\"success\",\"message\":\"OTP sent to " + email + "\"}");
            } else {
                response.setStatus(500);
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Email credentials not configured or failed to send.\"}");
            }

        } catch (Exception e) {
            response.setStatus(500);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid request format.\"}");
        }
    }

    protected void doOptions(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        setCORS(res);
        res.setStatus(200);
    }
    
    private void setCORS(HttpServletResponse res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
}
