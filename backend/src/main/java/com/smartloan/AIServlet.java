package com.smartloan;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/api/ai")
public class AIServlet extends HttpServlet {

    private void cors(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) {
        cors(response);
        response.setStatus(200);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        cors(res);
        res.setContentType("application/json");

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        String json = sb.toString();

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> data = mapper.readValue(json, java.util.Map.class);
            String type = (String) data.get("type");

            List<String> command = new ArrayList<>();
            // Using python executable path if not in env, but typically 'python' is fine. 
            // We use the absolute path for safety.
            String basePath = "C:\\loan managementproject\\ai_models\\";
            command.add("python");

            if ("early_closure".equals(type)) {
                command.add(basePath + "ai_early_closure.py");
                command.add(data.get("outstanding_balance").toString());
                command.add(data.get("emi").toString());
                command.add(data.get("extra_payment").toString());
            } else if ("emi_reminder".equals(type)) {
                command.add(basePath + "ai_emi_reminder.py");
                command.add(data.get("missed_payments").toString());
                command.add(data.get("days_overdue").toString());
                command.add(data.get("income").toString());
            } else if ("loan_eligibility".equals(type)) {
                command.add(basePath + "ai_loan_eligibility.py");
                command.add(data.get("credit_score").toString());
                command.add(data.get("income").toString());
                command.add(data.get("existing_debt").toString());
            } else if ("loan_recommendation".equals(type)) {
                command.add(basePath + "ai_loan_recommendation.py");
                command.add(data.get("age").toString());
                command.add(data.get("income").toString());
                command.add(data.get("loan_purpose").toString());
            } else {
                res.setStatus(400);
                res.getWriter().write("{\"error\":\"Unknown AI task type\"}");
                return;
            }

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.environment().put("PYTHONPATH", "C:\\Users\\gopim\\AppData\\Roaming\\Python\\Python312\\site-packages");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            BufferedReader stdInput = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String s;
            while ((s = stdInput.readLine()) != null) {
                output.append(s);
            }
            process.waitFor();

            res.getWriter().write(output.toString());

        } catch (Exception e) {
            e.printStackTrace();
            res.setStatus(500);
            res.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
