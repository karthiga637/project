package com.smartloan;

import java.io.*;
import java.util.Map;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {

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
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> data = mapper.readValue(json, java.util.Map.class);

            String email = (String) data.get("email");
            String password = (String) data.get("password");
            String otp = data.containsKey("otp") ? (String) data.get("otp") : "";

            CustomerDAO dao = new CustomerDAO();
            Map<String, Object> checkCust = dao.getCustomerByEmail(email);
            String checkRole = checkCust != null ? (String) checkCust.get("role") : "Customer";

            if (!"Admin".equals(checkRole) && !"BankManager".equals(checkRole)) {
                // OTP check removed
                boolean ok = dao.login(email, password);

                if (ok) {
                    Map<String, Object> cust = dao.getCustomerByEmail(email);
                    String role = cust != null ? (String) cust.get("role") : "Customer";
                    String name = buildDisplayName(cust, email);
                    int id = cust != null ? (Integer) cust.get("id") : 0;
                    
                    // Set session
                    HttpSession session = request.getSession(true);
                    session.setAttribute("role", role);
                    session.setAttribute("id", id);
                    
                    String bankIdJson = "";
                    if ("BankManager".equals(role)) {
                        Integer bankId = dao.getBankIdForCustomer(id);
                        if (bankId != null) {
                            session.setAttribute("bank_id", bankId);
                            bankIdJson = ",\"bank_id\":" + bankId;
                        }
                    }

                    String addressStr = cust != null && cust.get("address") != null ? ((String) cust.get("address")).replace("\"", "\\\"") : "";
                    String branchStr = cust != null && cust.get("branch_name") != null ? ((String) cust.get("branch_name")).replace("\"", "\\\"") : "";
                    String extraJson = ",\"address\":\"" + addressStr + "\",\"branch_name\":\"" + branchStr + "\"";

                    response.getWriter().write(
                        "{\"status\":\"success\",\"role\":\"" + role + "\",\"name\":\"" + name
                        + "\",\"email\":\"" + email + "\",\"id\":" + id + bankIdJson + extraJson + "}");
                } else {
                    response.getWriter().write("{\"status\":\"failed\"}");
                }
            } else {
                boolean ok = dao.login(email, password);
                if (ok) {
                    Map<String, Object> cust = dao.getCustomerByEmail(email);
                    String role = cust != null ? (String) cust.get("role") : "Admin";
                    String name = buildDisplayName(cust, email);
                    int id = cust != null ? (Integer) cust.get("id") : 0;
                    
                    // Set session
                    HttpSession session = request.getSession(true);
                    session.setAttribute("role", role);
                    session.setAttribute("id", id);
                    
                    String bankIdJson = "";
                    if ("BankManager".equals(role)) {
                        Integer bankId = dao.getBankIdForCustomer(id);
                        if (bankId != null) {
                            session.setAttribute("bank_id", bankId);
                            bankIdJson = ",\"bank_id\":" + bankId;
                        }
                    }

                    String addressStr = cust != null && cust.get("address") != null ? ((String) cust.get("address")).replace("\"", "\\\"") : "";
                    String branchStr = cust != null && cust.get("branch_name") != null ? ((String) cust.get("branch_name")).replace("\"", "\\\"") : "";
                    String extraJson = ",\"address\":\"" + addressStr + "\",\"branch_name\":\"" + branchStr + "\"";

                    response.getWriter().write(
                            "{\"status\":\"success\",\"role\":\"" + role + "\",\"name\":\"" + name
                            + "\",\"email\":\"" + email + "\",\"id\":" + id + bankIdJson + extraJson + "}");
                }
                else {
                    response.getWriter().write("{\"status\":\"failed\"}");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    protected void doOptions(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    private String buildDisplayName(Map<String, Object> cust, String email) {
        if (cust == null) {
            return email != null ? email.split("@")[0] : "";
        }
        String fn = cust.get("firstName") != null ? ((String) cust.get("firstName")).replace("null", "").trim() : "";
        String ln = cust.get("lastName") != null ? ((String) cust.get("lastName")).replace("null", "").trim() : "";
        String fullName = (fn + " " + ln).trim();
        if (fullName.isEmpty() || fullName.equalsIgnoreCase("null") || fullName.equalsIgnoreCase("null null")) {
            if (email != null && email.toLowerCase().contains("priya")) return "Priya S";
            if (email != null && email.toLowerCase().contains("hari")) return "Hari R";
            if (email != null && email.toLowerCase().contains("suresh")) return "Suresh S";
            return email != null ? email.split("@")[0] : "";
        }
        return fullName;
    }
}
