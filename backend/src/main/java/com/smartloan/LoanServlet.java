package com.smartloan;

import java.io.*;
import java.util.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/loans")
public class LoanServlet extends HttpServlet {

    private final LoanDAO dao = new LoanDAO();

    private void cors(HttpServletResponse res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
    }

    // GET /loans               → all loans
    // GET /loans?customerId=X  → loans for customer
    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res);
        dao.markOverdueEMIs();
        String customerId = req.getParameter("customerId");
        List<Map<String, Object>> loans = (customerId != null)
            ? dao.getLoansByCustomerId(Integer.parseInt(customerId))
            : dao.getAllLoans();
        res.getWriter().write(listToJson(loans));
    }

    // POST /loans → add new loan
    protected void doPost(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res);
        String json = readBody(req);
        try {
            int    custId  = (int) num(json, "customerId");
            String lt      = str(json, "loanType");
            double amount  = num(json, "loanAmount");
            double rate    = num(json, "interestRate");
            int    tenure  = (int) num(json, "tenureMonths");
            String start   = str(json, "startDate");

            boolean ok = dao.addLoan(custId, lt, amount, rate, tenure, start);
            res.getWriter().write(ok ? "{\"status\":\"success\"}" : "{\"status\":\"failed\"}");
        } catch (Exception e) {
            res.setStatus(500);
            res.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    // PUT /loans?action=updateStatus
    protected void doPut(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res);
        String action = req.getParameter("action");
        if ("updateStatus".equals(action)) {
            String json = readBody(req);
            try {
                int loanId = (int) num(json, "loanId");
                String status = str(json, "status");
                boolean ok = dao.updateLoanStatus(loanId, status);
                res.getWriter().write(ok ? "{\"status\":\"success\"}" : "{\"status\":\"failed\"}");
            } catch (Exception e) {
                res.setStatus(500);
                res.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
            }
        } else {
            res.setStatus(400);
            res.getWriter().write("{\"status\":\"failed\",\"message\":\"Invalid action\"}");
        }
    }

    protected void doOptions(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res); res.setStatus(200);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private String readBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = req.getReader()) { String l; while ((l=br.readLine())!=null) sb.append(l); }
        return sb.toString();
    }

    private String str(String json, String key) {
        try { return json.split("\"" + key + "\":\"")[1].split("\"")[0]; } catch (Exception e) { return ""; }
    }

    private double num(String json, String key) {
        try { return Double.parseDouble(json.split("\"" + key + "\":")[1].split("[,}]")[0].trim()); }
        catch (Exception e) { return 0; }
    }

    private String mapToJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        map.forEach((k, v) -> sb.append("\"").append(k).append("\":").append(v instanceof String ? "\"" + v + "\"" : v).append(","));
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
