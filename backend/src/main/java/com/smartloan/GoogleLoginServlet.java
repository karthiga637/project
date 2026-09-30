package com.smartloan;

import java.io.*;
import java.util.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebServlet("/google-login")
public class GoogleLoginServlet extends HttpServlet {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        setCORS(response);

        try {
            Map<String, Object> body = mapper.readValue(request.getReader(), Map.class);
            String email = (String) body.get("email");
            String name = (String) body.get("name");

            if (email == null || email.trim().isEmpty()) {
                response.setStatus(400);
                response.getWriter().write("{\"status\":\"failed\",\"message\":\"Email is required\"}");
                return;
            }

            CustomerDAO dao = new CustomerDAO();
            Map<String, Object> customer = dao.getCustomerByEmail(email);

            if (customer == null) {
                // Reject unknown Google email: Not pre-approved by Bank Manager
                response.setStatus(403);
                response.getWriter().write("{\"status\":\"failed\",\"message\":\"Not a customer! Please contact your bank manager to register your email first.\"}");
                return;
            }

            // Customer exists (Pre-approved by Bank Manager) -> Allow Login
            String role = (String) customer.get("role");
            if (role == null || role.isEmpty()) role = "Customer";
            String fullName = customer.get("firstName") != null ? customer.get("firstName") + " " + customer.get("lastName") : name;

            Map<String, Object> res = new HashMap<>();
            res.put("status", "success");
            res.put("email", customer.get("email"));
            res.put("name", fullName);
            res.put("role", role);
            res.put("id", customer.get("id"));
            res.put("mobile", customer.get("mobile"));
            if (customer.containsKey("bank_id")) {
                res.put("bank_id", customer.get("bank_id"));
            }

            response.getWriter().write(mapper.writeValueAsString(res));

        } catch (Exception e) {
            response.setStatus(500);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Server error: " + e.getMessage() + "\"}");
        }
    }

    @Override
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
