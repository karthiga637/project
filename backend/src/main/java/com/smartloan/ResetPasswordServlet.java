package com.smartloan;

import java.io.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/reset-password")
public class ResetPasswordServlet extends HttpServlet {

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
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> data = mapper.readValue(sb.toString(), java.util.Map.class);
            
            String email = (String) data.get("email");
            String otp = (String) data.get("otp");
            String newPassword = (String) data.get("newPassword");

            if (!OtpStore.verifyOtp(email, otp)) {
                response.setStatus(401);
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid or expired OTP\"}");
                return;
            }

            CustomerDAO dao = new CustomerDAO();
            boolean updated = dao.updatePassword(email, newPassword);
            
            if (updated) {
                response.getWriter().write("{\"status\":\"success\",\"message\":\"Password updated successfully\"}");
            } else {
                response.setStatus(500);
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Failed to update password\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
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
