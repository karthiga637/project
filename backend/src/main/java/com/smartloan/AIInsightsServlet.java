package com.smartloan;

import java.io.*;
import java.util.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/ai-insights")
public class AIInsightsServlet extends HttpServlet {

    private final LoanDAO dao = new LoanDAO();

    private void cors(HttpServletResponse res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res);
        dao.markOverdueEMIs();
        List<Map<String, Object>> riskData = dao.getRiskAssessment();
        res.getWriter().write(listToJson(riskData));
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
