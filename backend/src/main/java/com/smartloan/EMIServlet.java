package com.smartloan;

import java.io.*;
import java.util.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/emi")
public class EMIServlet extends HttpServlet {

    private final LoanDAO dao = new LoanDAO();

    private void cors(HttpServletResponse res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
    }

    // GET /emi              → all EMI records
    // GET /emi?loanId=X     → EMI schedule for loan
    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res);
        dao.markOverdueEMIs();
        String loanId = req.getParameter("loanId");
        List<Map<String, Object>> data = (loanId != null)
            ? dao.getEMISchedule(Integer.parseInt(loanId))
            : dao.getAllEMIs();
        res.getWriter().write(listToJson(data));
    }

    // POST /emi  body: {"emiId": 5}  → mark EMI as paid
    protected void doPost(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res);
        String json = readBody(req);
        try {
            int emiId = Integer.parseInt(json.split("\"emiId\":")[1].split("[,}]")[0].trim());
            boolean ok = dao.payEMI(emiId);
            res.getWriter().write(ok ? "{\"status\":\"success\",\"message\":\"EMI paid successfully\"}" : "{\"status\":\"failed\"}");
        } catch (Exception e) {
            res.setStatus(500);
            res.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
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
