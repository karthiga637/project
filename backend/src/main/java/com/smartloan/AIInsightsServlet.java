package com.smartloan;

import java.io.*;
import java.util.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/ai-insights")
public class AIInsightsServlet extends HttpServlet {

    private final LoanDAO dao = new LoanDAO();
    private final AIInsightsService aiService = new AIInsightsService();

    private void cors(HttpServletResponse res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res);
        String action = req.getParameter("action");
        if ("recommend".equalsIgnoreCase(action)) {
            double income = 0;
            try {
                income = Double.parseDouble(req.getParameter("income"));
            } catch (Exception ignored) {}
            String occ = req.getParameter("occupation");
            String goal = req.getParameter("goal");
            Map<String, Object> rec = aiService.recommendLoan(income, occ, goal);
            res.getWriter().write(mapToJson(rec));
            return;
        }

        if ("eligibility".equalsIgnoreCase(action)) {
            double income = 0;
            double amount = 0;
            int tenure = 24;
            double rate = 10.5;
            try {
                if (req.getParameter("income") != null) income = Double.parseDouble(req.getParameter("income"));
                if (req.getParameter("loanAmount") != null) amount = Double.parseDouble(req.getParameter("loanAmount"));
                if (req.getParameter("tenure") != null) tenure = Integer.parseInt(req.getParameter("tenure"));
                if (req.getParameter("rate") != null) rate = Double.parseDouble(req.getParameter("rate"));
            } catch (Exception ignored) {}
            Map<String, Object> elig = aiService.predictEligibility(income, amount, tenure, rate);
            res.getWriter().write(mapToJson(elig));
            return;
        }

        if ("urgency".equalsIgnoreCase(action)) {
            int days = 0;
            try {
                days = Integer.parseInt(req.getParameter("daysOverdue"));
            } catch (Exception ignored) {}
            Map<String, Object> urg = aiService.getEMIUrgency(days);
            res.getWriter().write(mapToJson(urg));
            return;
        }

        dao.markOverdueEMIs();
        List<Map<String, Object>> riskData = dao.getRiskAssessment();
        res.getWriter().write(listToJson(riskData));
    }

    protected void doPost(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        doGet(req, res);
    }

    protected void doOptions(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res); res.setStatus(200);
    }

    private String mapToJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        map.forEach((k, v) -> {
            sb.append("\"").append(k).append("\":");
            if (v == null) sb.append("null");
            else if (v instanceof String) sb.append("\"").append(v.toString().replace("\"","'")).append("\"");
            else sb.append(v);
            sb.append(",");
        });
        if (sb.length() > 1) sb.setLength(sb.length() - 1);
        return sb.append("}").toString();
    }

    private String listToJson(List<Map<String, Object>> list) {
        StringBuilder sb = new StringBuilder("[");
        for (Map<String, Object> m : list) sb.append(mapToJson(m)).append(",");
        if (sb.length() > 1) sb.setLength(sb.length() - 1);
        return sb.append("]").toString();
    }
}
