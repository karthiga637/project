package com.smartloan;

import java.io.*;
import java.util.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/google-auth-deprecated")
public class GoogleAuthServlet extends HttpServlet {

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
            String email = json.split("\"email\":\"")[1].split("\"")[0];
            String name = json.split("\"name\":\"")[1].split("\"")[0];

            CustomerDAO dao = new CustomerDAO();
            Map<String, Object> customer = dao.getCustomerByEmail(email);

            // If user doesn't exist, automatically register them!
            if (customer == null) {
                String[] nameParts = name.split(" ", 2);
                String firstName = nameParts[0];
                String lastName = nameParts.length > 1 ? nameParts[1] : "";
                
                // Register with a dummy password (they will only login via Google)
                dao.register(firstName, lastName, email, "0000000000", "GOOGLE_AUTH", "Customer");
                customer = dao.getCustomerByEmail(email);
            }

            String role = (String) customer.get("role");
            int id = (Integer) customer.get("id");
            String mobile = (String) customer.get("mobile");

            response.getWriter().write("{\"status\":\"success\",\"role\":\"" + role + "\",\"name\":\"" + name + "\",\"email\":\"" + email + "\",\"id\":" + id + ",\"mobile\":\"" + mobile + "\"}");
            
        } catch (Exception e) {
            response.setStatus(500);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Server error\"}");
        }
    }

    protected void doOptions(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setStatus(200);
    }
}
