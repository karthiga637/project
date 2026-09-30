package com.smartloan;

import java.io.*;
import java.util.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/predict-approval")
public class LoanApprovalServlet extends HttpServlet {

    protected void doPost(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");

        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = req.getReader()) { String l; while ((l=br.readLine())!=null) sb.append(l); }
        String json = sb.toString();

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> data = mapper.readValue(json, Map.class);

            int customerId = Integer.parseInt(data.get("customerId").toString());
            double loanAmount = Double.parseDouble(data.get("loanAmount").toString());
            int tenure = Integer.parseInt(data.get("tenure").toString());
            int creditScore = Integer.parseInt(data.get("creditScore").toString());

            // Fetch customer details from DA
            CustomerDAO dao = new CustomerDAO();
            Map<String, Object> customer = dao.getCustomerById(customerId);

            if (customer == null) {
                res.getWriter().write("{\"status\":\"failed\",\"message\":\"Customer not found\"}");
                return;
            }

            double income = (Double) customer.getOrDefault("monthly_income", 0.0);
            String dob = (String) customer.getOrDefault("dob", "2000-01-01");
            int age = calculateAge(dob);

            // Run ML Predictor
            Map<String, Object> prediction = LoanPredictorService.predict(income, loanAmount, tenure, creditScore, age);

            prediction.put("status", "success");

            res.getWriter().write(mapper.writeValueAsString(prediction));
        } catch (Exception e) {
            e.printStackTrace();
            res.setStatus(500);
            res.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    protected void doOptions(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setStatus(200);
    }

    private int calculateAge(String dobStr) {
        try {
            int year = Integer.parseInt(dobStr.split("-")[0]);
            return java.time.Year.now().getValue() - year;
        } catch (Exception e) {
            return 30; // Default
        }
    }
}
