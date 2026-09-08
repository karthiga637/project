package com.smartloan;

import java.io.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/register")
public class RegisterServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");

        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = request.getReader()) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }

        String json = sb.toString();
        try {
            String firstName = extractStr(json, "firstName");
            String lastName  = extractStr(json, "lastName");
            String email     = extractStr(json, "email");
            String mobile    = extractStr(json, "mobile");
            String password  = extractStr(json, "password");
            String role      = extractStr(json, "role");
            if (role == null || role.isEmpty()) role = "Customer";

            CustomerDAO dao = new CustomerDAO();
            boolean ok = dao.register(firstName, lastName, email, mobile, password, role);

            if (ok) {
                response.getWriter().write("{\"status\":\"success\",\"message\":\"Registration successful\"}");
            } else {
                response.setStatus(409);
                response.getWriter().write("{\"status\":\"failed\",\"message\":\"Email already registered\"}");
            }
        } catch (Exception e) {
            response.setStatus(500);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    protected void doOptions(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setStatus(200);
    }

    private String extractStr(String json, String key) {
        try {
            return json.split("\"" + key + "\":\"")[1].split("\"")[0];
        } catch (Exception e) { return ""; }
    }
}
